"""Workflow run management endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from structlog import get_logger

from app.models.schemas import (
    AgentActionResponse,
    EventCreate,
    InstructionCreate,
    InstructionResponse,
    MemoryResponse,
    RunCreate,
    RunResponse,
    TimelineEntry,
)
from app.services.supabase_service import supabase_client
from app.services.temporal_service import temporal_service

router = APIRouter()
logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Runs
# ---------------------------------------------------------------------------


@router.post("", response_model=RunResponse, status_code=status.HTTP_201_CREATED)
async def create_run(payload: RunCreate) -> RunResponse:
    """Start a new supervisor workflow run for an order."""
    supervisor = await supabase_client.get_supervisor(str(payload.supervisor_id))
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor not found")

    workflow_id = f"order-{payload.order_id}-{payload.supervisor_id}"

    run_rows = await supabase_client.insert(
        "workflow_runs",
        {
            "supervisor_id": str(payload.supervisor_id),
            "order_id": payload.order_id,
            "temporal_workflow_id": workflow_id,
            "status": "running",
            "current_state": {},
        },
    )
    if not run_rows:
        raise HTTPException(status_code=500, detail="Failed to create run")
    run_record = run_rows[0]

    # Start the Temporal workflow (fire-and-forget; idempotent on workflow_id).
    try:
        await temporal_service.start_order_workflow(
            workflow_id=workflow_id,
            run_id=str(run_record["id"]),
            order_id=payload.order_id,
            supervisor_config=supervisor,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("workflow_start_failed", workflow_id=workflow_id, error=str(exc))
        # Mark the run as terminated so the UI reflects the failure.
        await supabase_client.update(
            "workflow_runs",
            {"status": "terminated"},
            match={"id": str(run_record["id"])},
        )
        raise HTTPException(status_code=502, detail=f"Failed to start workflow: {exc}") from exc

    return RunResponse.model_validate(run_record)


@router.get("", response_model=list[RunResponse])
async def list_runs(status_filter: str | None = None) -> list[RunResponse]:
    """List runs, optionally filtered by status."""
    try:
        rows = await supabase_client.list_runs(status=status_filter)
        results: list[RunResponse] = []
        for row in rows:
            try:
                results.append(RunResponse.model_validate(row))
            except Exception as val_exc:
                logger.warning("run_row_validation_failed", run_id=row.get("id"), error=str(val_exc))
        return results
    except Exception as exc:
        logger.error("list_runs_failed", error=str(exc))
        return []


@router.get("/{run_id}", response_model=RunResponse)
async def get_run(run_id: UUID) -> RunResponse:
    """Get a single run by id."""
    row = await supabase_client.get_run(str(run_id))
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    return RunResponse.model_validate(row)


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------


@router.post("/{run_id}/events", status_code=status.HTTP_202_ACCEPTED)
async def inject_event(run_id: UUID, payload: EventCreate) -> dict[str, str]:
    """Inject an event into a running workflow via a Temporal signal."""
    run = await supabase_client.get_run(str(run_id))
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run["status"] not in ("running", "paused"):
        raise HTTPException(status_code=409, detail="Run is not active")

    await temporal_service.signal_workflow(
        workflow_id=run["temporal_workflow_id"],
        signal_name="incoming_event",
        arg={
            "event_type": payload.event_type,
            "event_data": payload.event_data,
            "timestamp": run["created_at"],
        },
    )
    return {"status": "event_sent"}


# ---------------------------------------------------------------------------
# Instructions
# ---------------------------------------------------------------------------


@router.post(
    "/{run_id}/instructions",
    response_model=InstructionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_instruction(run_id: UUID, payload: InstructionCreate) -> InstructionResponse:
    """Add a run-specific instruction to a live workflow."""
    run = await supabase_client.get_run(str(run_id))
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run["status"] not in ("running", "paused"):
        raise HTTPException(status_code=409, detail="Run is not active")

    rows = await supabase_client.insert(
        "run_instructions",
        {"run_id": str(run_id), "instruction": payload.instruction},
    )
    if not rows:
        raise HTTPException(status_code=500, detail="Failed to store instruction")

    await temporal_service.signal_workflow(
        workflow_id=run["temporal_workflow_id"],
        signal_name="add_instruction",
        arg=payload.instruction,
    )
    return InstructionResponse.model_validate(rows[0])


@router.get("/{run_id}/instructions", response_model=list[InstructionResponse])
async def list_instructions(run_id: UUID) -> list[InstructionResponse]:
    """Get run-specific instructions added to a workflow."""
    rows = await supabase_client.list_instructions(str(run_id))
    return [InstructionResponse.model_validate(row) for row in rows]


@router.get("/{run_id}/actions", response_model=list[AgentActionResponse])
async def list_actions(run_id: UUID) -> list[AgentActionResponse]:
    """Get agent tool execution actions for a run."""
    rows = await supabase_client.list_actions(str(run_id))
    return [AgentActionResponse.model_validate(row) for row in rows]


# ---------------------------------------------------------------------------
# Timeline & memory
# ---------------------------------------------------------------------------


@router.get("/{run_id}/timeline", response_model=list[TimelineEntry])
async def get_timeline(run_id: UUID) -> list[TimelineEntry]:
    """Get the timeline of events and actions for a run."""
    rows = await supabase_client.list_timeline(str(run_id))
    return [TimelineEntry.model_validate(row) for row in rows]


@router.get("/{run_id}/memory", response_model=MemoryResponse)
async def get_memory(run_id: UUID) -> MemoryResponse:
    """Get the compact memory snapshot for a run."""
    run = await supabase_client.get_run(str(run_id))
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    recent = await supabase_client.list_timeline(str(run_id))
    return MemoryResponse(
        run_id=run_id,
        compact_summary=run.get("memory_summary"),
        recent_events=[TimelineEntry.model_validate(r) for r in recent[-10:]],
        sleep_state=run.get("status", "unknown"),
        next_wake_up=run.get("next_wake_up_at"),
    )


# ---------------------------------------------------------------------------
# Lifecycle control
# ---------------------------------------------------------------------------


@router.post("/{run_id}/interrupt", status_code=status.HTTP_202_ACCEPTED)
async def interrupt_run(run_id: UUID) -> dict[str, str]:
    """Pause a running workflow (sent as a terminate signal for the POC)."""
    run = await supabase_client.get_run(str(run_id))
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    await supabase_client.update("workflow_runs", {"status": "paused"}, match={"id": str(run_id)})
    return {"status": "paused"}


@router.post("/{run_id}/resume", status_code=status.HTTP_202_ACCEPTED)
async def resume_run(run_id: UUID) -> dict[str, str]:
    """Resume a paused workflow."""
    run = await supabase_client.get_run(str(run_id))
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    await supabase_client.update("workflow_runs", {"status": "running"}, match={"id": str(run_id)})
    return {"status": "resumed"}


@router.post("/{run_id}/terminate", status_code=status.HTTP_202_ACCEPTED)
async def terminate_run(run_id: UUID, reason: str = "manual") -> dict[str, str]:
    """Terminate a running workflow via Temporal and update status."""
    run = await supabase_client.get_run(str(run_id))
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    try:
        await temporal_service.signal_workflow(
            workflow_id=run["temporal_workflow_id"],
            signal_name="terminate",
            arg=reason,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("terminate_signal_failed", run_id=str(run_id), error=str(exc))

    await supabase_client.update(
        "workflow_runs",
        {"status": "terminated"},
        match={"id": str(run_id)},
    )
    return {"status": "terminated"}
