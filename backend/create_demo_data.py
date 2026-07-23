"""Script to populate demo supervisor and run with all fields for testing."""

import asyncio
from uuid import uuid4
from app.services.supabase_service import supabase_client

SUPERVISOR_DATA = {
    "name": "Express Logistics & VIP Customer Supervisor",
    "base_instruction": (
        "You are an autonomous order supervisor overseeing VIP e-commerce express orders. "
        "Your goal is to guarantee 24h delivery, resolve payment declines immediately, and maintain "
        "high customer satisfaction. If shipment is delayed or payment fails, notify logistics/payments "
        "team immediately and send update to customer. If order is delivered, close workflow supervision."
    ),
    "available_tools": [
        "message_fulfillment_team",
        "message_payments_team",
        "message_logistics_team",
        "message_customer",
        "create_internal_note",
        "schedule_wake_up",
        "escalate_issue",
        "close_workflow",
    ],
    "default_wake_up_behavior": {
        "default_check_interval_seconds": 300,
        "max_workflow_age_days": 7,
        "auto_wake_on_high_priority": True,
    },
    "model_config": {
        "model": "openrouter/free",
        "temperature": 0.2,
        "max_tokens": 1000,
    },
    "wake_up_guidance": "Wake up immediately on payment_failed, refund_requested, or shipment_delayed > 12h.",
}


async def main() -> None:
    print("Creating supervisor template in database...")
    created_supervisors = await supabase_client.insert("supervisors", SUPERVISOR_DATA)
    if not created_supervisors:
        print("Failed to create supervisor template.")
        return

    sup = created_supervisors[0]
    supervisor_id = sup["id"]
    print(f"✓ Created Supervisor Template! ID: {supervisor_id}")

    order_id = f"ORD-9988-VIP-{uuid4().hex[:4].upper()}"
    print(f"Creating workflow run for order: {order_id}...")

    workflow_id = f"order-supervisor-{order_id}"
    run_rows = await supabase_client.insert(
        "workflow_runs",
        {
            "supervisor_id": supervisor_id,
            "order_id": order_id,
            "temporal_workflow_id": workflow_id,
            "status": "running",
            "current_state": {
                "event_count": 1,
                "action_count": 1,
                "last_summary": "Order supervision run created for VIP express delivery.",
            },
            "memory_summary": "Initial order creation event ingested into workflow context.",
        },
    )

    if run_rows:
        run = run_rows[0]
        run_id = run["id"]
        print(f"✓ Created Workflow Run! Run ID: {run_id} | Order ID: {order_id}")

        # Add initial timeline event
        await supabase_client.insert(
            "timeline_events",
            {
                "run_id": run_id,
                "event_type": "order_created",
                "event_data": {
                    "order_id": order_id,
                    "customer_tier": "VIP",
                    "delivery_type": "Express 24h Guaranteed",
                    "amount": 499.99,
                },
                "action_taken": {
                    "tool": "create_internal_note",
                    "note": "Initial order supervision started for VIP customer.",
                },
            },
        )

        # Add initial action record
        await supabase_client.insert(
            "agent_actions",
            {
                "run_id": run_id,
                "tool_name": "create_internal_note",
                "tool_input": {
                    "note": "Order supervision initialized. VIP delivery monitoring active.",
                    "tags": ["vip", "express"],
                },
                "tool_output": {"created": True},
                "reasoning": "VIP order created. Logging initial internal note for logistics operations team.",
            },
        )
        print("✓ Created initial timeline event and activity action record!")

    print("\n--- Demo Setup Complete ---")
    print(f"View in UI: http://localhost:3000/runs/{run_rows[0]['id']}")


if __name__ == "__main__":
    asyncio.run(main())
