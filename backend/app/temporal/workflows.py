"""Temporal workflow definition for the order supervisor."""

from __future__ import annotations

import contextlib
import datetime as dt
from typing import Any

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from app.temporal.activities import (
        agent_execute,
        classifier_check,
        persist_final_output,
        persist_timeline_event,
        update_memory,
    )
    from app.temporal.shared import (
        AgentActivityInput,
        AgentActivityResult,
        ClassifierInput,
        PersistEventInput,
        UpdateMemoryInput,
    )

DEFAULT_SLEEP_SECONDS = 300  # 5 minutes


@workflow.defn
class OrderSupervisorWorkflow:
    """Long-running workflow that supervises a single order.

    Supports three triggers for agent inference:
    1. Workflow start
    2. Incoming signal (event)
    3. Scheduled wake-up (timer)
    """

    def __init__(self) -> None:
        self._memory: dict[str, Any] = {}
        self._timeline: list[dict[str, Any]] = []
        self._sleep_seconds: int = DEFAULT_SLEEP_SECONDS
        self._wake_signal_received: bool = False
        self._terminate_requested: bool = False
        self._run_id: str = ""
        self._supervisor_config: dict[str, Any] = {}

    # ------------------------------------------------------------------
    # Signal handlers
    # ------------------------------------------------------------------

    @workflow.signal
    async def incoming_event(self, event: dict[str, Any]) -> None:
        """Handle an incoming order event.

        Runs the lightweight classifier; if it returns True the main agent
        is woken, otherwise the event is persisted to the timeline silently.
        """
        # Always persist event to Supabase timeline table so UI updates immediately
        await workflow.execute_activity(
            persist_timeline_event,
            PersistEventInput(run_id=self._run_id, event=event),
            start_to_close_timeout=dt.timedelta(seconds=5),
        )
        self._timeline.append(event)

        should_wake = await workflow.execute_activity(
            classifier_check,
            ClassifierInput(
                event=event,
                memory=self._memory,
                guidance=self._supervisor_config.get("wake_up_guidance"),
            ),
            start_to_close_timeout=dt.timedelta(seconds=10),
        )

        if should_wake:
            self._wake_signal_received = True

    @workflow.signal
    async def add_instruction(self, instruction: str) -> None:
        """Add a run-specific instruction that becomes part of the context."""
        # Store on the workflow so the next agent run sees it.
        instructions = self._supervisor_config.setdefault("extra_instructions", [])
        if instruction not in instructions:
            instructions.append(instruction)
        # Wake up agent immediately to process new instruction
        self._wake_signal_received = True

    @workflow.signal
    async def terminate(self, reason: str = "manual") -> None:
        """Request the workflow to terminate."""
        self._terminate_requested = True
        self._wake_signal_received = True  # unblock any pending wait

    # ------------------------------------------------------------------
    # Main run loop
    # ------------------------------------------------------------------

    @workflow.run
    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Main workflow entry point - runs until terminal state."""
        self._run_id = input_data["run_id"]
        self._supervisor_config = input_data["supervisor_config"]

        self._memory = {
            "order_id": input_data["order_id"],
            "created_at": workflow.now().isoformat(),
            "event_count": 0,
            "action_count": 0,
            "last_agent_run": None,
            "last_summary": None,
        }

        # Persist order_created initial event
        initial_event = {
            "event_type": "order_created",
            "event_data": {"order_id": input_data["order_id"]},
        }
        await workflow.execute_activity(
            persist_timeline_event,
            PersistEventInput(run_id=self._run_id, event=initial_event),
            start_to_close_timeout=dt.timedelta(seconds=5),
        )
        self._timeline.append(initial_event)

        # First agent run on workflow start.
        await self._run_agent(trigger="start")

        # Main loop: wait for next trigger (signal or timer), then run agent.
        while not self._terminate_requested:
            await self._await_next_trigger()
            if self._terminate_requested:
                break
            trigger = "signal" if self._wake_signal_received else "scheduled"
            self._wake_signal_received = False
            result = await self._run_agent(trigger=trigger)
            if result.close_workflow:
                break

        # Termination / final summary.
        final = await self._run_agent(trigger="termination")

        await workflow.execute_activity(
            persist_final_output,
            {
                "run_id": self._run_id,
                "final_output": final.final_output,
                "memory": self._memory,
            },
            start_to_close_timeout=dt.timedelta(seconds=10),
        )

        return {
            "run_id": self._run_id,
            "status": "completed",
            "final_output": final.final_output,
            "total_events": self._memory.get("event_count", 0),
            "total_actions": self._memory.get("action_count", 0),
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _run_agent(self, *, trigger: str) -> AgentActivityResult:
        """Execute the main agent activity and apply its result."""
        result = await workflow.execute_activity(
            agent_execute,
            AgentActivityInput(
                run_id=self._run_id,
                memory=self._memory,
                timeline=self._timeline,
                supervisor_config=self._supervisor_config,
                additional_instructions=self._supervisor_config.get("extra_instructions", []),
                trigger=trigger,
            ),
            start_to_close_timeout=dt.timedelta(minutes=2),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )

        self._memory = result.updated_memory
        self._timeline.extend(result.new_timeline_entries)

        # Persist agent run entries to Supabase timeline table so UI updates
        for entry in result.new_timeline_entries:
            await workflow.execute_activity(
                persist_timeline_event,
                PersistEventInput(
                    run_id=self._run_id,
                    event=entry,
                    action_taken=entry.get("action_taken"),
                ),
                start_to_close_timeout=dt.timedelta(seconds=5),
            )

        sleep_seconds = result.sleep_seconds or DEFAULT_SLEEP_SECONDS
        self._sleep_seconds = sleep_seconds
        next_wake_up = (workflow.now() + dt.timedelta(seconds=sleep_seconds)).isoformat()

        status = "completed" if result.close_workflow else "running"
        await workflow.execute_activity(
            update_memory,
            UpdateMemoryInput(
                run_id=self._run_id,
                memory=self._memory,
                next_wake_up=next_wake_up,
                status=status,
            ),
            start_to_close_timeout=dt.timedelta(seconds=10),
        )

        return result

    async def _await_next_trigger(self) -> None:
        """Block until either a wake signal arrives or the sleep timer elapses."""
        with contextlib.suppress(Exception):
            await workflow.wait_condition(
                lambda: self._wake_signal_received or self._terminate_requested,
                timeout=float(self._sleep_seconds),
            )
