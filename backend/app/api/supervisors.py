"""Supervisor template CRUD endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from structlog import get_logger

from app.models.schemas import SupervisorCreate, SupervisorResponse
from app.services.supabase_service import supabase_client

logger = get_logger(__name__)
router = APIRouter()


@router.post("", response_model=SupervisorResponse, status_code=status.HTTP_201_CREATED)
async def create_supervisor(payload: SupervisorCreate) -> SupervisorResponse:
    """Create a new supervisor template."""
    data = payload.model_dump(by_alias=True, mode="json")
    rows = await supabase_client.insert("supervisors", data)
    if not rows:
        raise HTTPException(status_code=500, detail="Failed to create supervisor in database")
    return SupervisorResponse.model_validate(rows[0])


@router.get("", response_model=list[SupervisorResponse])
async def list_supervisors() -> list[SupervisorResponse]:
    """List all supervisor templates."""
    try:
        rows = await supabase_client.select_many("supervisors", order_by="created_at")
        results: list[SupervisorResponse] = []
        for row in rows:
            try:
                results.append(SupervisorResponse.model_validate(row))
            except Exception as val_exc:
                logger.warning("supervisor_row_validation_failed", row_id=row.get("id"), error=str(val_exc))
        return results
    except Exception as exc:
        logger.error("list_supervisors_failed", error=str(exc))
        return []


@router.get("/{supervisor_id}", response_model=SupervisorResponse)
async def get_supervisor(supervisor_id: UUID) -> SupervisorResponse:
    """Get a single supervisor template by id."""
    row = await supabase_client.get_supervisor(str(supervisor_id))
    if not row:
        raise HTTPException(status_code=404, detail="Supervisor not found")
    return SupervisorResponse.model_validate(row)
