"""Event-related endpoints (event generator / simulator convenience routes)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.services.supabase_service import supabase_client
from app.services.temporal_service import temporal_service

router = APIRouter()


# Predefined event templates the UI can offer as quick-inject buttons.
EVENT_TEMPLATES: dict[str, dict[str, object]] = {
    "order_created": {"order_status": "created"},
    "payment_confirmed": {"amount": 0, "currency": "USD"},
    "payment_failed": {"reason": "card_declined"},
    "shipment_created": {"carrier": "mock-carrier", "tracking_id": "TRK-000"},
    "shipment_delayed": {"delay_hours": 24},
    "delivered": {"signed_by": "customer"},
    "refund_requested": {"amount": 0, "reason": "customer_request"},
    "customer_message_received": {"message": "", "channel": "email"},
    "no_update_for_n_hours": {"hours": 12},
}


@router.get("/templates", response_model=dict[str, dict[str, object]])
async def list_event_templates() -> dict[str, dict[str, object]]:
    """Return predefined event templates for the UI event injector."""
    return EVENT_TEMPLATES


@router.post("/runs/{run_id}/inject", status_code=status.HTTP_202_ACCEPTED)
async def inject_templated_event(
    run_id: UUID, event_type: str, event_data: dict[str, object] | None = None
) -> dict[str, str]:
    """Convenience endpoint: inject an event using a named template.

    ``event_data`` overrides template defaults when provided.
    """
    run = await supabase_client.get_run(str(run_id))
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run["status"] not in ("running", "paused"):
        raise HTTPException(status_code=409, detail="Run is not active")

    template = EVENT_TEMPLATES.get(event_type, {})
    merged = {**template, **(event_data or {})}

    await temporal_service.signal_workflow(
        workflow_id=run["temporal_workflow_id"],
        signal_name="incoming_event",
        arg={
            "event_type": event_type,
            "event_data": merged,
            "timestamp": run["created_at"],
        },
    )
    return {"status": "event_sent", "event_type": event_type}


__all__ = ["EVENT_TEMPLATES", "router"]
