"""Supabase client wrapper for persistence operations."""

from __future__ import annotations

from typing import Any, cast

from structlog import get_logger
from supabase import AsyncClient, acreate_client

from app.config import get_settings

logger = get_logger(__name__)


class SupabaseService:
    """Thin async wrapper around the Supabase async client."""

    def __init__(self) -> None:
        self._client: AsyncClient | None = None

    async def _ensure_client(self) -> AsyncClient:
        if self._client is None:
            settings = get_settings()
            self._client = await acreate_client(settings.supabase_url, settings.supabase_key)
            logger.info("supabase_client_initialised")
        return self._client

    # -- generic helpers -------------------------------------------------

    async def insert(self, table: str, data: dict[str, Any]) -> list[dict[str, Any]]:
        client = await self._ensure_client()
        result = await client.table(table).insert(data).execute()
        return cast(list[dict[str, Any]], result.data or [])

    async def select_one(self, table: str, column: str, value: str) -> dict[str, Any] | None:
        client = await self._ensure_client()
        result = await client.table(table).select("*").eq(column, value).single().execute()
        return cast(dict[str, Any] | None, result.data)

    async def select_many(
        self,
        table: str,
        *,
        filters: dict[str, Any] | None = None,
        order_by: str | None = None,
        ascending: bool = True,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        client = await self._ensure_client()
        query = client.table(table).select("*")
        if filters:
            for col, val in filters.items():
                query = query.eq(col, val)
        if order_by:
            query = query.order(order_by, desc=not ascending)
        if limit:
            query = query.limit(limit)
        result = await query.execute()
        return cast(list[dict[str, Any]], result.data or [])

    async def update(
        self,
        table: str,
        data: dict[str, Any],
        *,
        match: dict[str, Any],
    ) -> list[dict[str, Any]]:
        client = await self._ensure_client()
        query = client.table(table).update(data)
        for col, val in match.items():
            query = query.eq(col, val)
        result = await query.execute()
        return cast(list[dict[str, Any]], result.data or [])

    async def delete(self, table: str, *, match: dict[str, Any]) -> list[dict[str, Any]]:
        client = await self._ensure_client()
        query = client.table(table).delete()
        for col, val in match.items():
            query = query.eq(col, val)
        result = await query.execute()
        return cast(list[dict[str, Any]], result.data or [])

    # -- typed helpers ---------------------------------------------------

    async def get_supervisor(self, supervisor_id: str) -> dict[str, Any] | None:
        return await self.select_one("supervisors", "id", supervisor_id)

    async def get_run(self, run_id: str) -> dict[str, Any] | None:
        return await self.select_one("workflow_runs", "id", run_id)

    async def list_runs(self, *, status: str | None = None) -> list[dict[str, Any]]:
        filters: dict[str, Any] = {}
        if status:
            filters["status"] = status
        return await self.select_many(
            "workflow_runs", filters=filters or None, order_by="created_at"
        )

    async def list_timeline(self, run_id: str) -> list[dict[str, Any]]:
        return await self.select_many(
            "timeline_events",
            filters={"run_id": run_id},
            order_by="created_at",
        )

    async def list_instructions(self, run_id: str) -> list[dict[str, Any]]:
        return await self.select_many(
            "run_instructions",
            filters={"run_id": run_id},
            order_by="created_at",
        )

    async def list_actions(self, run_id: str) -> list[dict[str, Any]]:
        return await self.select_many(
            "agent_actions",
            filters={"run_id": run_id},
            order_by="created_at",
        )


# Module-level singleton for convenience in activities and routes.
supabase_client = SupabaseService()
