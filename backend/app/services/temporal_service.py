"""Temporal client wrapper for starting and signalling workflows."""

from __future__ import annotations

import asyncio
from typing import Any

from structlog import get_logger
from temporalio.client import Client, WorkflowHandle

from app.config import get_settings

logger = get_logger(__name__)


class TemporalService:
    """Thin async wrapper around the Temporal client."""

    def __init__(self) -> None:
        self._client: Client | None = None

    async def _ensure_client(self) -> Client:
        if self._client is None:
            settings = get_settings()
            for attempt in range(1, 15):
                try:
                    self._client = await Client.connect(settings.temporal_host)
                    logger.info(
                        "temporal_client_connected",
                        host=settings.temporal_host,
                        namespace=settings.temporal_namespace,
                    )
                    break
                except Exception as exc:
                    if attempt == 14:
                        raise exc
                    logger.warning("temporal_service_connect_retry", attempt=attempt, error=str(exc))
                    await asyncio.sleep(2)
        assert self._client is not None
        return self._client

    async def start_order_workflow(
        self,
        *,
        workflow_id: str,
        run_id: str,
        order_id: str,
        supervisor_config: dict[str, Any],
    ) -> str:
        """Start the OrderSupervisorWorkflow for an order.

        Returns the workflow's run_id from Temporal.
        """
        from app.temporal.workflows import OrderSupervisorWorkflow

        client = await self._ensure_client()
        settings = get_settings()

        handle = await client.start_workflow(
            OrderSupervisorWorkflow.run,
            {
                "run_id": run_id,
                "order_id": order_id,
                "supervisor_config": supervisor_config,
            },
            id=workflow_id,
            task_queue=settings.temporal_task_queue,
        )
        logger.info("workflow_started", workflow_id=workflow_id, run_id=run_id)
        return handle.first_execution_run_id or handle.run_id or ""

    async def signal_workflow(
        self,
        *,
        workflow_id: str,
        signal_name: str,
        arg: Any,
    ) -> None:
        """Send a signal to a running workflow by id."""
        client = await self._ensure_client()
        handle: WorkflowHandle[Any, Any] = client.get_workflow_handle(workflow_id)
        await handle.signal(signal_name, arg)
        logger.info(
            "workflow_signalled",
            workflow_id=workflow_id,
            signal=signal_name,
        )

    async def terminate_workflow(
        self,
        *,
        workflow_id: str,
        reason: str = "manual",
    ) -> None:
        """Terminate a running workflow."""
        client = await self._ensure_client()
        handle: WorkflowHandle[Any, Any] = client.get_workflow_handle(workflow_id)
        await handle.terminate(reason=reason)
        logger.info("workflow_terminated", workflow_id=workflow_id, reason=reason)


# Module-level singleton for use in routes and activities.
temporal_service = TemporalService()
