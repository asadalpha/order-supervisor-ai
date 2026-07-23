"""Agent tool implementations for business action dispatches."""

from __future__ import annotations

import json
from typing import Any

from app.models.schemas import ToolName

# A declarative description of each business action tool for OpenRouter LLM.
TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": ToolName.MESSAGE_FULFILLMENT_TEAM.value,
            "description": "Send a message to the warehouse/fulfillment operations team.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Message for fulfillment team."},
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
            "name": ToolName.MESSAGE_PAYMENTS_TEAM.value,
            "description": "Send a message to the finance/payments team regarding payment issues.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Message for payments team."},
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
            "name": ToolName.MESSAGE_LOGISTICS_TEAM.value,
            "description": "Send a message to the carrier/logistics team about shipping delays.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Message for logistics team."},
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
            "name": ToolName.MESSAGE_CUSTOMER.value,
            "description": "Send a message to the customer about their order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Message for the customer."},
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
            "name": ToolName.SEND_CUSTOMER_MESSAGE.value,
            "description": "Send a message to the customer about their order (alias for message_customer).",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Message body."},
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
            "description": "Create an internal note visible to the order operations team.",
            "parameters": {
                "type": "object",
                "properties": {
                    "note": {"type": "string", "description": "The note content."},
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional tags.",
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
            "description": "Escalate an issue to human support.",
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
            "name": ToolName.SCHEDULE_WAKE_UP.value,
            "description": "Schedule the next wake-up timer for the supervisor.",
            "parameters": {
                "type": "object",
                "properties": {
                    "seconds": {
                        "type": "integer",
                        "description": "Seconds until next wake-up.",
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
            "description": "Recommend closing the order supervision workflow.",
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
    """Execute a business action tool.

    Returns a dict with ``tool`` and ``result`` keys mirroring real dispatches.
    """
    args = _safe_args(arguments)

    if tool_name in (
        ToolName.MESSAGE_FULFILLMENT_TEAM.value,
        ToolName.MESSAGE_PAYMENTS_TEAM.value,
        ToolName.MESSAGE_LOGISTICS_TEAM.value,
        ToolName.MESSAGE_CUSTOMER.value,
        ToolName.SEND_CUSTOMER_MESSAGE.value,
    ):
        return {
            "tool": tool_name,
            "input": args,
            "result": {
                "sent": True,
                "recipient": tool_name,
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
        "result": {"executed": True, "details": args},
    }


__all__ = ["TOOL_DEFINITIONS", "execute_tool"]
