"""Agent tool implementations (mocked for the POC)."""

from __future__ import annotations

import json
from typing import Any

from app.models.schemas import ToolName

# A declarative description of each tool, suitable for OpenRouter's
# OpenAI-compatible `tools` field in chat completions.
TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": ToolName.SEND_CUSTOMER_MESSAGE.value,
            "description": "Send a message to the customer about their order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "The message body."},
                    "urgency": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "default": "medium",
                    },
                },
                "required": ["message"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.CREATE_INTERNAL_NOTE.value,
            "description": "Create an internal note visible to the operations team.",
            "parameters": {
                "type": "object",
                "properties": {
                    "note": {"type": "string", "description": "The note content."},
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional tags for categorisation.",
                    },
                },
                "required": ["note"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.ESCALATE_ISSUE.value,
            "description": "Escalate an issue to human support with a priority level.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {"type": "string"},
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "critical"],
                        "default": "medium",
                    },
                },
                "required": ["reason"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.MARK_FOR_REVIEW.value,
            "description": "Mark the order for human review.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {"type": "string"},
                },
                "required": ["reason"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.SCHEDULE_WAKE_UP.value,
            "description": (
                "Schedule the next wake-up for the supervisor. "
                "Use this when no immediate action is needed and the agent "
                "should check back later."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "seconds": {
                        "type": "integer",
                        "description": "Seconds until the next wake-up.",
                    },
                    "reason": {"type": "string"},
                },
                "required": ["seconds"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.CLOSE_WORKFLOW.value,
            "description": (
                "Close the workflow and mark the order as complete. "
                "Use this only when the order has reached a terminal state."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {"type": "string"},
                },
                "required": ["reason"],
            },
        },
    },
]


def _safe_args(arguments: str | None) -> dict[str, Any]:
    """Parse tool-call arguments JSON safely."""
    if not arguments:
        return {}
    try:
        parsed = json.loads(arguments)
        return parsed if isinstance(parsed, dict) else {"_raw": parsed}
    except json.JSONDecodeError:
        return {"_raw": arguments}


async def execute_tool(tool_name: str, arguments: str | None) -> dict[str, Any]:
    """Execute a tool by name. All tools are mocked for the POC.

    Returns a dict with ``tool`` and ``result`` keys. The ``result`` payload
    mirrors what a real integration would return.
    """
    args = _safe_args(arguments)

    if tool_name == ToolName.SEND_CUSTOMER_MESSAGE.value:
        return {
            "tool": tool_name,
            "input": args,
            "result": {
                "sent": True,
                "message": args.get("message", ""),
                "urgency": args.get("urgency", "medium"),
            },
        }

    if tool_name == ToolName.CREATE_INTERNAL_NOTE.value:
        return {
            "tool": tool_name,
            "input": args,
            "result": {
                "created": True,
                "note": args.get("note", ""),
                "tags": args.get("tags", []),
            },
        }

    if tool_name == ToolName.ESCALATE_ISSUE.value:
        return {
            "tool": tool_name,
            "input": args,
            "result": {
                "escalated": True,
                "reason": args.get("reason", ""),
                "priority": args.get("priority", "medium"),
            },
        }

    if tool_name == ToolName.MARK_FOR_REVIEW.value:
        return {
            "tool": tool_name,
            "input": args,
            "result": {"marked": True, "reason": args.get("reason", "")},
        }

    if tool_name == ToolName.SCHEDULE_WAKE_UP.value:
        return {
            "tool": tool_name,
            "input": args,
            "result": {
                "scheduled": True,
                "seconds": int(args.get("seconds", 300)),
                "reason": args.get("reason", ""),
            },
        }

    if tool_name == ToolName.CLOSE_WORKFLOW.value:
        return {
            "tool": tool_name,
            "input": args,
            "result": {"closed": True, "reason": args.get("reason", "")},
        }

    return {
        "tool": tool_name,
        "input": args,
        "result": {"error": f"Unknown tool: {tool_name}"},
    }


__all__ = ["TOOL_DEFINITIONS", "execute_tool"]
