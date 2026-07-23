"""Temporal activities - units of work executed outside the workflow sandbox."""

from __future__ import annotations

import datetime as dt
from typing import Any, cast

import httpx
from structlog import get_logger
from temporalio import activity

from app.config import Settings, get_settings
from app.models.schemas import HIGH_PRIORITY_EVENTS, MEDIUM_PRIORITY_EVENTS
from app.services.supabase_service import supabase_client
from app.temporal.shared import (
    AgentActivityInput,
    AgentActivityResult,
    ClassifierInput,
    PersistEventInput,
    UpdateMemoryInput,
)
from app.tools import TOOL_DEFINITIONS, execute_tool

logger = get_logger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_TIMEOUT = 60.0


# ---------------------------------------------------------------------------
# Classifier activity
# ---------------------------------------------------------------------------


@activity.defn
async def classifier_check(input_data: ClassifierInput) -> bool:
    """Lightweight wake-up policy.

    Decides whether an incoming event is important enough to wake the main
    agent. Uses a deterministic ruleset based on event type; the supervisor's
    optional ``wake_up_guidance`` is logged for future LLM-based classification.
    """
    event_type = input_data.event.get("event_type", "")

    if event_type in HIGH_PRIORITY_EVENTS:
        logger.info("classifier_wake_high_priority", event_type=event_type)
        return True

    if event_type in MEDIUM_PRIORITY_EVENTS:
        logger.info("classifier_wake_medium_priority", event_type=event_type)
        return True

    if input_data.guidance:
        # Reserved for a future LLM-backed classifier. For now, default to
        # not waking for low-priority events.
        logger.debug("classifier_guidance_present", guidance=input_data.guidance)

    logger.info("classifier_skip", event_type=event_type)
    return False


# ---------------------------------------------------------------------------
# Main agent activity
# ---------------------------------------------------------------------------


@activity.defn
async def agent_execute(input_data: AgentActivityInput) -> AgentActivityResult:
    """Main agent reasoning loop.

    Builds a prompt from memory + recent events, calls the LLM via
    OpenRouter, executes any requested tool calls, and returns the updated
    memory + timeline entries + sleep decision.
    """
    settings = get_settings()
    log = logger.bind(run_id=input_data.run_id, trigger=input_data.trigger)

    context = _build_context(input_data)
    messages = [
        {"role": "system", "content": _build_system_prompt(input_data.supervisor_config)},
        {"role": "user", "content": _build_user_prompt(context)},
    ]

    log.info("agent_llm_call_start")
    result = await _call_llm(settings, messages)
    message = result["choices"][0]["message"]
    log.info("agent_llm_call_done")

    actions_taken: list[dict[str, Any]] = []
    sleep_seconds: int | None = None
    close_workflow = False

    for tool_call in message.get("tool_calls") or []:
        fn = tool_call.get("function", {})
        tool_result = await execute_tool(fn.get("name", ""), fn.get("arguments"))
        actions_taken.append(tool_result)

        if tool_result["tool"] == "schedule_wake_up":
            sleep_seconds = int(tool_result["result"].get("seconds", 300))
        elif tool_result["tool"] == "close_workflow":
            close_workflow = True

    # Persist actions to the agent_actions table for auditability.
    for action in actions_taken:
        await supabase_client.insert(
            "agent_actions",
            {
                "run_id": input_data.run_id,
                "tool_name": action["tool"],
                "tool_input": action.get("input", {}),
                "tool_output": action.get("result"),
                "reasoning": message.get("content"),
            },
        )

    # Update memory compactly.
    updated_memory = _update_memory(input_data, message, actions_taken)

    new_timeline_entries: list[dict[str, Any]] = [
        {
            "run_id": input_data.run_id,
            "event_type": "agent_run",
            "event_data": {
                "trigger": input_data.trigger,
                "reasoning": message.get("content", ""),
            },
            "action_taken": {"actions": actions_taken} if actions_taken else None,
        }
    ]

    final_output: dict[str, Any] | None = None
    if input_data.trigger == "termination":
        summary_text = (
            (message.get("content") or "").strip()
            or (message.get("reasoning") or "").strip()
            or (updated_memory.get("last_summary") or "").strip()
            or f"Order workflow completed after processing {updated_memory.get('event_count', 0)} events and executing {updated_memory.get('action_count', 0)} actions."
        )
        final_output = {
            "summary": summary_text,
            "actions_taken": len(actions_taken),
            "total_events": updated_memory.get("event_count", 0),
            "total_actions": updated_memory.get("action_count", 0),
        }

    # Default sleep window when the agent did not explicitly schedule one.
    if sleep_seconds is None and not close_workflow:
        sleep_seconds = 300  # 5 minutes

    return AgentActivityResult(
        updated_memory=updated_memory,
        new_timeline_entries=new_timeline_entries,
        actions_taken=actions_taken,
        sleep_seconds=sleep_seconds,
        close_workflow=close_workflow,
        final_output=final_output,
    )


# ---------------------------------------------------------------------------
# Persistence activities
# ---------------------------------------------------------------------------


@activity.defn
async def persist_timeline_event(data: PersistEventInput) -> None:
    """Persist an event to the timeline without waking the main agent."""
    await supabase_client.insert(
        "timeline_events",
        {
            "run_id": data.run_id,
            "event_type": data.event.get("event_type", "unknown"),
            "event_data": data.event,
            "action_taken": data.action_taken,
        },
    )


@activity.defn
async def update_memory(data: UpdateMemoryInput) -> None:
    """Update the persisted memory snapshot for a run."""
    update_payload: dict[str, Any] = {
        "current_state": data.memory,
        "memory_summary": data.memory.get("last_summary"),
        "next_wake_up_at": data.next_wake_up,
    }
    if data.status:
        update_payload["status"] = data.status
        if data.status in ("completed", "terminated"):
            update_payload["completed_at"] = dt.datetime.utcnow().isoformat()

    await supabase_client.update("workflow_runs", update_payload, match={"id": data.run_id})


@activity.defn
async def persist_final_output(data: dict[str, Any]) -> None:
    """Persist the final summary when a workflow completes."""
    await supabase_client.update(
        "workflow_runs",
        {
            "status": "completed",
            "completed_at": dt.datetime.utcnow().isoformat(),
            "final_output": data.get("final_output"),
            "current_state": data.get("memory", {}),
        },
        match={"id": data["run_id"]},
    )


# ---------------------------------------------------------------------------
# LLM helpers
# ---------------------------------------------------------------------------


async def _call_llm(settings: Settings, messages: list[dict[str, str]]) -> dict[str, Any]:
    """Call the OpenRouter chat completions endpoint."""
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "model": settings.openrouter_model,
        "messages": messages,
        "tools": TOOL_DEFINITIONS,
        "tool_choice": "auto",
        "temperature": 0.7,
        "max_tokens": 2000,
    }
    async with httpx.AsyncClient(timeout=OPENROUTER_TIMEOUT) as client:
        response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
        response.raise_for_status()
        return cast(dict[str, Any], response.json())


def _build_system_prompt(config: dict[str, Any]) -> str:
    base = config.get("base_instruction") or "You are an AI order supervisor."
    tools = ", ".join(config.get("available_tools") or [])
    guidance = config.get("wake_up_guidance") or ""
    guidance_line = f"\nWake-up guidance: {guidance}" if guidance else ""
    return (
        f"{base}\n\n"
        f"Available tools: {tools}\n\n"
        "When you decide to take action, call the appropriate tool.\n"
        "When no immediate action is needed, call schedule_wake_up with a "
        "delay in seconds.\n"
        "When the order has reached a terminal state (delivered, refunded, "
        "or closed), call close_workflow.\n"
        "Keep your memory compact by summarising older events."
        f"{guidance_line}"
    )


def _build_context(input_data: AgentActivityInput) -> dict[str, Any]:
    return {
        "run_id": input_data.run_id,
        "trigger": input_data.trigger,
        "memory": input_data.memory,
        "recent_events": input_data.timeline[-10:] if input_data.timeline else [],
        "additional_instructions": input_data.additional_instructions,
    }


def _build_user_prompt(context: dict[str, Any]) -> str:
    if context.get("trigger") == "termination":
        return (
            f"Trigger: termination\n"
            f"Current memory: {context['memory']}\n"
            f"Recent events: {context['recent_events']}\n\n"
            "The order workflow is finishing. Please generate a final summary report of this order workflow, "
            "including key actions taken, outcomes, and final state."
        )
    return (
        f"Trigger: {context['trigger']}\n"
        f"Current memory: {context['memory']}\n"
        f"Recent events (last 10): {context['recent_events']}\n"
        f"Additional instructions: {context['additional_instructions']}\n\n"
        "Decide what actions to take (if any). Call tools when needed, "
        "otherwise call schedule_wake_up to check back later."
    )


def _update_memory(
    input_data: AgentActivityInput,
    message: dict[str, Any],
    actions_taken: list[dict[str, Any]],
) -> dict[str, Any]:
    """Produce a compact memory update from the agent run."""
    memory = dict(input_data.memory)
    memory["last_agent_run"] = dt.datetime.utcnow().isoformat()
    memory["event_count"] = int(memory.get("event_count", 0)) + len(input_data.timeline)
    memory["action_count"] = int(memory.get("action_count", 0)) + len(actions_taken)

    summary = message.get("content") or ""
    if not summary and actions_taken:
        tool_names = ", ".join(a["tool"] for a in actions_taken)
        summary = f"Agent executed tool actions: {tool_names}"
    elif not summary:
        summary = f"Agent reviewed state on trigger: {input_data.trigger}"

    # Rolling summary: keep the latest summary, capped to keep memory compact.
    memory["last_summary"] = summary[:1000]
    return memory


__all__ = [
    "agent_execute",
    "classifier_check",
    "persist_final_output",
    "persist_timeline_event",
    "update_memory",
]
