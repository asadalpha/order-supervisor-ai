"""Comprehensive unit & integration test suite for all Order Supervisor API endpoints."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# Standard mock data fixtures
MOCK_SUPERVISOR_ID = str(uuid4())
MOCK_RUN_ID = str(uuid4())
NOW_ISO = datetime.now(UTC).isoformat()

MOCK_SUPERVISOR_ROW = {
    "id": MOCK_SUPERVISOR_ID,
    "name": "Test Order Supervisor",
    "base_instruction": "You are a test order supervisor.",
    "available_tools": [
        "send_customer_message",
        "create_internal_note",
        "escalate_issue",
        "mark_for_review",
        "schedule_wake_up",
        "close_workflow",
    ],
    "default_wake_up_behavior": None,
    "model_config": {"model": "openrouter/free"},
    "wake_up_guidance": "Wake on delay",
    "created_at": NOW_ISO,
    "updated_at": NOW_ISO,
}

MOCK_RUN_ROW = {
    "id": MOCK_RUN_ID,
    "supervisor_id": MOCK_SUPERVISOR_ID,
    "order_id": "ORD-12345",
    "temporal_workflow_id": f"order-ORD-12345-{MOCK_SUPERVISOR_ID}",
    "status": "running",
    "current_state": {"event_count": 1, "action_count": 0},
    "memory_summary": "Order initialized.",
    "next_wake_up_at": NOW_ISO,
    "created_at": NOW_ISO,
    "completed_at": None,
    "final_output": None,
}

MOCK_TIMELINE_ROW = {
    "id": str(uuid4()),
    "run_id": MOCK_RUN_ID,
    "event_type": "order_created",
    "event_data": {"order_status": "created"},
    "action_taken": None,
    "created_at": NOW_ISO,
}

MOCK_INSTRUCTION_ROW = {
    "id": str(uuid4()),
    "run_id": MOCK_RUN_ID,
    "instruction": "Prioritize speed over cost.",
    "created_at": NOW_ISO,
}


# ---------------------------------------------------------------------------
# 1. Health & Meta endpoints
# ---------------------------------------------------------------------------


def test_health_check() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_list_event_templates() -> None:
    response = client.get("/api/events/templates")
    assert response.status_code == 200
    data = response.json()
    assert "order_created" in data
    assert "payment_failed" in data
    assert "shipment_delayed" in data


# ---------------------------------------------------------------------------
# 2. Supervisor CRUD Endpoints
# ---------------------------------------------------------------------------


@patch("app.api.supervisors.supabase_client.insert", new_callable=AsyncMock)
def test_create_supervisor_success(mock_insert: AsyncMock) -> None:
    mock_insert.return_value = [MOCK_SUPERVISOR_ROW]
    payload = {
        "name": "Test Order Supervisor",
        "base_instruction": "You are a test order supervisor.",
        "available_tools": ["send_customer_message"],
        "wake_up_guidance": "Wake on delay",
        "model_config": {"model": "openrouter/free"},
    }
    response = client.post("/api/supervisors", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == MOCK_SUPERVISOR_ID
    assert data["name"] == "Test Order Supervisor"
    assert data["model_config"] == {"model": "openrouter/free"}
    mock_insert.assert_called_once()


@patch("app.api.supervisors.supabase_client.select_many", new_callable=AsyncMock)
def test_list_supervisors(mock_select: AsyncMock) -> None:
    mock_select.return_value = [MOCK_SUPERVISOR_ROW]
    response = client.get("/api/supervisors")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == MOCK_SUPERVISOR_ID


@patch("app.api.supervisors.supabase_client.get_supervisor", new_callable=AsyncMock)
def test_get_supervisor_found(mock_get: AsyncMock) -> None:
    mock_get.return_value = MOCK_SUPERVISOR_ROW
    response = client.get(f"/api/supervisors/{MOCK_SUPERVISOR_ID}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == MOCK_SUPERVISOR_ID


@patch("app.api.supervisors.supabase_client.get_supervisor", new_callable=AsyncMock)
def test_get_supervisor_not_found(mock_get: AsyncMock) -> None:
    mock_get.return_value = None
    response = client.get(f"/api/supervisors/{uuid4()}")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# 3. Workflow Run Endpoints
# ---------------------------------------------------------------------------


@patch("app.api.runs.temporal_service.start_order_workflow", new_callable=AsyncMock)
@patch("app.api.runs.supabase_client.insert", new_callable=AsyncMock)
@patch("app.api.runs.supabase_client.get_supervisor", new_callable=AsyncMock)
def test_create_run_success(
    mock_get_sup: AsyncMock, mock_insert: AsyncMock, mock_start_wf: AsyncMock
) -> None:
    mock_get_sup.return_value = MOCK_SUPERVISOR_ROW
    mock_insert.return_value = [MOCK_RUN_ROW]
    mock_start_wf.return_value = "workflow-run-id-123"

    payload = {"supervisor_id": MOCK_SUPERVISOR_ID, "order_id": "ORD-12345"}
    response = client.post("/api/runs", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == MOCK_RUN_ID
    assert data["order_id"] == "ORD-12345"
    assert data["status"] == "running"


@patch("app.api.runs.supabase_client.get_supervisor", new_callable=AsyncMock)
def test_create_run_supervisor_not_found(mock_get_sup: AsyncMock) -> None:
    mock_get_sup.return_value = None
    payload = {"supervisor_id": str(uuid4()), "order_id": "ORD-999"}
    response = client.post("/api/runs", json=payload)
    assert response.status_code == 404


@patch("app.api.runs.supabase_client.list_runs", new_callable=AsyncMock)
def test_list_runs(mock_list: AsyncMock) -> None:
    mock_list.return_value = [MOCK_RUN_ROW]
    response = client.get("/api/runs?status_filter=running")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == MOCK_RUN_ID


@patch("app.api.runs.supabase_client.get_run", new_callable=AsyncMock)
def test_get_run_found(mock_get: AsyncMock) -> None:
    mock_get.return_value = MOCK_RUN_ROW
    response = client.get(f"/api/runs/{MOCK_RUN_ID}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == MOCK_RUN_ID


# ---------------------------------------------------------------------------
# 4. Events & Instructions Endpoints
# ---------------------------------------------------------------------------


@patch("app.api.runs.temporal_service.signal_workflow", new_callable=AsyncMock)
@patch("app.api.runs.supabase_client.get_run", new_callable=AsyncMock)
def test_inject_event_success(mock_get_run: AsyncMock, mock_signal: AsyncMock) -> None:
    mock_get_run.return_value = MOCK_RUN_ROW
    payload = {"event_type": "shipment_delayed", "event_data": {"delay_hours": 24}}
    response = client.post(f"/api/runs/{MOCK_RUN_ID}/events", json=payload)
    assert response.status_code == 202
    assert response.json() == {"status": "event_sent"}
    mock_signal.assert_called_once()


@patch("app.api.events.temporal_service.signal_workflow", new_callable=AsyncMock)
@patch("app.api.events.supabase_client.get_run", new_callable=AsyncMock)
def test_inject_templated_event_success(
    mock_get_run: AsyncMock, mock_signal: AsyncMock
) -> None:
    mock_get_run.return_value = MOCK_RUN_ROW
    response = client.post(
        f"/api/events/runs/{MOCK_RUN_ID}/inject?event_type=payment_failed"
    )
    assert response.status_code == 202
    assert response.json() == {"status": "event_sent", "event_type": "payment_failed"}
    mock_signal.assert_called_once()


@patch("app.api.runs.temporal_service.signal_workflow", new_callable=AsyncMock)
@patch("app.api.runs.supabase_client.insert", new_callable=AsyncMock)
@patch("app.api.runs.supabase_client.get_run", new_callable=AsyncMock)
def test_add_instruction_success(
    mock_get_run: AsyncMock, mock_insert: AsyncMock, mock_signal: AsyncMock
) -> None:
    mock_get_run.return_value = MOCK_RUN_ROW
    mock_insert.return_value = [MOCK_INSTRUCTION_ROW]
    payload = {"instruction": "Prioritize speed over cost."}
    response = client.post(f"/api/runs/{MOCK_RUN_ID}/instructions", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["instruction"] == "Prioritize speed over cost."
    mock_signal.assert_called_once()


@patch("app.api.runs.supabase_client.list_instructions", new_callable=AsyncMock)
def test_list_instructions(mock_list: AsyncMock) -> None:
    mock_list.return_value = [MOCK_INSTRUCTION_ROW]
    response = client.get(f"/api/runs/{MOCK_RUN_ID}/instructions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["instruction"] == "Prioritize speed over cost."


@patch("app.api.runs.supabase_client.list_actions", new_callable=AsyncMock)
def test_list_actions(mock_list: AsyncMock) -> None:
    mock_action = {
        "id": str(uuid4()),
        "run_id": MOCK_RUN_ID,
        "tool_name": "send_customer_message",
        "tool_input": {"message": "Shipment update"},
        "tool_output": {"sent": True},
        "reasoning": "Informing customer",
        "created_at": NOW_ISO,
    }
    mock_list.return_value = [mock_action]
    response = client.get(f"/api/runs/{MOCK_RUN_ID}/actions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["tool_name"] == "send_customer_message"


# ---------------------------------------------------------------------------
# 5. Timeline & Memory Endpoints
# ---------------------------------------------------------------------------


@patch("app.api.runs.supabase_client.list_timeline", new_callable=AsyncMock)
def test_get_timeline(mock_list: AsyncMock) -> None:
    mock_list.return_value = [MOCK_TIMELINE_ROW]
    response = client.get(f"/api/runs/{MOCK_RUN_ID}/timeline")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["event_type"] == "order_created"


@patch("app.api.runs.supabase_client.list_timeline", new_callable=AsyncMock)
@patch("app.api.runs.supabase_client.get_run", new_callable=AsyncMock)
def test_get_memory(mock_get_run: AsyncMock, mock_list_timeline: AsyncMock) -> None:
    mock_get_run.return_value = MOCK_RUN_ROW
    mock_list_timeline.return_value = [MOCK_TIMELINE_ROW]
    response = client.get(f"/api/runs/{MOCK_RUN_ID}/memory")
    assert response.status_code == 200
    data = response.json()
    assert data["run_id"] == MOCK_RUN_ID
    assert data["compact_summary"] == "Order initialized."
    assert len(data["recent_events"]) == 1


# ---------------------------------------------------------------------------
# 6. Lifecycle Control Endpoints (Interrupt, Resume, Terminate)
# ---------------------------------------------------------------------------


@patch("app.api.runs.supabase_client.update", new_callable=AsyncMock)
@patch("app.api.runs.supabase_client.get_run", new_callable=AsyncMock)
def test_interrupt_run(mock_get_run: AsyncMock, mock_update: AsyncMock) -> None:
    mock_get_run.return_value = MOCK_RUN_ROW
    response = client.post(f"/api/runs/{MOCK_RUN_ID}/interrupt")
    assert response.status_code == 202
    assert response.json() == {"status": "paused"}
    mock_update.assert_called_once()


@patch("app.api.runs.supabase_client.update", new_callable=AsyncMock)
@patch("app.api.runs.supabase_client.get_run", new_callable=AsyncMock)
def test_resume_run(mock_get_run: AsyncMock, mock_update: AsyncMock) -> None:
    mock_get_run.return_value = MOCK_RUN_ROW
    response = client.post(f"/api/runs/{MOCK_RUN_ID}/resume")
    assert response.status_code == 202
    assert response.json() == {"status": "resumed"}
    mock_update.assert_called_once()


@patch("app.api.runs.temporal_service.signal_workflow", new_callable=AsyncMock)
@patch("app.api.runs.supabase_client.update", new_callable=AsyncMock)
@patch("app.api.runs.supabase_client.get_run", new_callable=AsyncMock)
def test_terminate_run(
    mock_get_run: AsyncMock, mock_update: AsyncMock, mock_signal: AsyncMock
) -> None:
    mock_get_run.return_value = MOCK_RUN_ROW
    response = client.post(f"/api/runs/{MOCK_RUN_ID}/terminate?reason=manual")
    assert response.status_code == 202
    assert response.json() == {"status": "terminated"}
    mock_signal.assert_called_once()
    mock_update.assert_called_once()
