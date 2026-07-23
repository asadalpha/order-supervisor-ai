"""Supervisor template CRUD endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import SupervisorCreate, SupervisorResponse
from app.services.supabase_service import supabase_client

router = APIRouter()


@router.post("", response_model=SupervisorResponse, status_code=status.HTTP_201_CREATED)
async def create_supervisor(payload: SupervisorCreate) -> SupervisorResponse:
    """Create a new supervisor template."""
    rows = await supabase_client.insert(
        "supervisors", payload.model_dump(by_alias=True, mode="json")
    )
    if not rows:
        raise HTTPException(status_code=500, detail="Failed to create supervisor")
    return SupervisorResponse.model_validate(rows[0])


@router.get("", response_model=list[SupervisorResponse])
async def list_supervisors() -> list[SupervisorResponse]:
    """List all supervisor templates."""
    rows = await supabase_client.select_many("supervisors", order_by="created_at")
    return [SupervisorResponse.model_validate(row) for row in rows]


@router.get("/{supervisor_id}", response_model=SupervisorResponse)
async def get_supervisor(supervisor_id: UUID) -> SupervisorResponse:
    """Get a single supervisor template by id."""
    row = await supabase_client.get_supervisor(str(supervisor_id))
    if not row:
        raise HTTPException(status_code=404, detail="Supervisor not found")
    return SupervisorResponse.model_validate(row)
