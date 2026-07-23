"""Shared dataclasses for Temporal activities and workflows."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ClassifierInput:
    """Input for the lightweight wake-up classifier activity."""

    event: dict[str, Any]
    memory: dict[str, Any] = field(default_factory=dict)
    guidance: str | None = None


@dataclass
class AgentActivityInput:
    """Input for the main agent execution activity."""

    run_id: str
    memory: dict[str, Any]
    timeline: list[dict[str, Any]]
    supervisor_config: dict[str, Any]
    additional_instructions: list[str] = field(default_factory=list)
    trigger: str = "scheduled"  # "start" | "signal" | "scheduled" | "termination"


@dataclass
class AgentActivityResult:
    """Output of the main agent execution activity."""

    updated_memory: dict[str, Any]
    new_timeline_entries: list[dict[str, Any]]
    actions_taken: list[dict[str, Any]]
    sleep_seconds: int | None = None
    close_workflow: bool = False
    final_output: dict[str, Any] | None = None


@dataclass
class PersistEventInput:
    """Input for persisting an event to the timeline without waking the agent."""

    run_id: str
    event: dict[str, Any]
    action_taken: dict[str, Any] | None = None


@dataclass
class UpdateMemoryInput:
    """Input for updating the persisted memory snapshot."""

    run_id: str
    memory: dict[str, Any]
    next_wake_up: str | None = None
    status: str | None = None
