"""Pydantic schemas for API request/response models and domain types."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class RunStatus(StrEnum):
    """Lifecycle status of a workflow run."""

    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    TERMINATED = "terminated"


class EventType(StrEnum):
    """Order lifecycle event types injected into workflows."""

    ORDER_CREATED = "order_created"
    PAYMENT_CONFIRMED = "payment_confirmed"
    PAYMENT_FAILED = "payment_failed"
    SHIPMENT_CREATED = "shipment_created"
    SHIPMENT_DELAYED = "shipment_delayed"
    DELIVERED = "delivered"
    REFUND_REQUESTED = "refund_requested"
    CUSTOMER_MESSAGE_RECEIVED = "customer_message_received"
    NO_UPDATE_FOR_N_HOURS = "no_update_for_n_hours"
    AGENT_RUN = "agent_run"


class ToolName(StrEnum):
    """Names of tools the agent can invoke."""

    SEND_CUSTOMER_MESSAGE = "send_customer_message"
    CREATE_INTERNAL_NOTE = "create_internal_note"
    ESCALATE_ISSUE = "escalate_issue"
    MARK_FOR_REVIEW = "mark_for_review"
    SCHEDULE_WAKE_UP = "schedule_wake_up"
    CLOSE_WORKFLOW = "close_workflow"


# Default tool set available to every supervisor unless overridden.
DEFAULT_TOOLS: list[str] = [t.value for t in ToolName]

# Events that always wake the main agent, bypassing the classifier.
HIGH_PRIORITY_EVENTS: frozenset[str] = frozenset(
    {
        EventType.PAYMENT_FAILED.value,
        EventType.REFUND_REQUESTED.value,
        EventType.SHIPMENT_DELAYED.value,
        EventType.CUSTOMER_MESSAGE_RECEIVED.value,
    }
)

# Medium-priority events that wake the agent under the default policy.
MEDIUM_PRIORITY_EVENTS: frozenset[str] = frozenset(
    {
        EventType.PAYMENT_CONFIRMED.value,
        EventType.SHIPMENT_CREATED.value,
        EventType.DELIVERED.value,
    }
)


# ---------------------------------------------------------------------------
# Supervisor schemas
# ---------------------------------------------------------------------------


class SupervisorCreate(BaseModel):
    """Payload for creating a supervisor template."""

    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=1, max_length=200)
    base_instruction: str = Field(..., min_length=1)
    available_tools: list[str] = Field(default_factory=lambda: list(DEFAULT_TOOLS))
    default_wake_up_behavior: dict[str, Any] | None = None
    llm_model_config: dict[str, Any] | None = Field(default=None, alias="model_config")
    wake_up_guidance: str | None = None


class SupervisorResponse(SupervisorCreate):
    """Supervisor template with persistence metadata."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Run schemas
# ---------------------------------------------------------------------------


class RunCreate(BaseModel):
    """Payload for starting a new workflow run for an order."""

    supervisor_id: UUID
    order_id: str = Field(..., min_length=1)


class WorkflowRunState(BaseModel):
    """Serialisable snapshot of the workflow's internal state."""

    event_count: int = 0
    action_count: int = 0
    last_agent_run: str | None = None
    last_summary: str | None = None
    order_id: str | None = None
    created_at: str | None = None


class RunResponse(BaseModel):
    """A workflow run row from Supabase."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    supervisor_id: UUID
    order_id: str
    temporal_workflow_id: str
    status: RunStatus
    current_state: dict[str, Any] = Field(default_factory=dict)
    memory_summary: str | None = None
    next_wake_up_at: datetime | None = None
    created_at: datetime
    completed_at: datetime | None = None
    final_output: dict[str, Any] | None = None


# ---------------------------------------------------------------------------
# Event schemas
# ---------------------------------------------------------------------------


class EventCreate(BaseModel):
    """Payload for injecting an event into a running workflow."""

    event_type: str
    event_data: dict[str, Any] = Field(default_factory=dict)


class TimelineEntry(BaseModel):
    """A single timeline event row."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    run_id: UUID
    event_type: str
    event_data: dict[str, Any] = Field(default_factory=dict)
    action_taken: dict[str, Any] | None = None
    created_at: datetime


class AgentActionResponse(BaseModel):
    """An action the agent took via a tool call."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    run_id: UUID
    tool_name: str
    tool_input: dict[str, Any]
    tool_output: dict[str, Any] | None = None
    reasoning: str | None = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Instruction schemas
# ---------------------------------------------------------------------------


class InstructionCreate(BaseModel):
    """Payload for adding a run-specific instruction to a live workflow."""

    instruction: str = Field(..., min_length=1)


class InstructionResponse(InstructionCreate):
    """A persisted run instruction."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    run_id: UUID
    created_at: datetime


# ---------------------------------------------------------------------------
# Memory schemas
# ---------------------------------------------------------------------------


class MemoryResponse(BaseModel):
    """Compact memory snapshot for a run."""

    run_id: UUID
    compact_summary: str | None
    recent_events: list[TimelineEntry] = Field(default_factory=list)
    sleep_state: str
    next_wake_up: datetime | None
