# Architecture Note: Order Supervisor AI

An overview of the system architecture, core workflows, orchestration loop, and persistence model for the **Order Supervisor AI** platform.

---

## 1. System Overview

The Order Supervisor AI platform provides autonomous, long-running supervision for individual e-commerce orders using durable Temporal workflows and LLM agent reasoning.

### Request Flow
1. **Next.js Frontend** sends REST API requests to the **FastAPI Backend**.
2. **FastAPI Backend** starts or signals a **Temporal Workflow** (`OrderSupervisorWorkflow`).
3. **Temporal Orchestration Engine** dispatches tasks to the **Temporal Python Worker**.
4. **Temporal Worker** prompts the **OpenRouter LLM API** when reasoning or tool execution is needed.
5. **Worker** logs execution history, state memory, and audit trails to **Supabase PostgreSQL**.
6. **Frontend** polls/fetches real-time status and timeline updates via FastAPI from Supabase.

---

## 2. Core Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router), Tailwind CSS v4, TanStack Query | Real-time monitoring dashboard, timeline inspector, event injector |
| **Backend API** | Python 3.12, FastAPI, Pydantic v2, Structlog | REST API for runs, supervisors, event signals, and instructions |
| **Orchestrator** | Temporal Python SDK (`temporalio`) | Long-running durable workflows per order with timer/signal loops |
| **Persistence** | Supabase (PostgreSQL) | Persistence for templates, run memory, timeline events, & agent actions |
| **LLM Engine** | OpenRouter (OpenAI-compatible API) | Multi-model agent inference & tool calling |

---

## 3. Workflow & Agent Execution Lifecycle

### Step-by-Step Lifecycle
1. **Run Initialization**: User creates a supervision run via `POST /api/runs`. Backend starts a `OrderSupervisorWorkflow` instance and persists the `order_created` event to Supabase.
2. **Event & Signal Ingestion**: External systems or UI inject events (`payment_failed`, `shipment_delayed`, `customer_message_received`). Workflow receives the signal.
3. **Classifier Check**: The lightweight classifier activity evaluates the event priority. If High or Medium priority, the main agent wakes up.
4. **LLM Execution**: The agent receives system instructions, state memory, recent timeline events, and tool definitions. OpenRouter returns tool invocations.
5. **Tool Execution & Logging**: Worker executes requested tools, appends records to `agent_actions`, updates state memory in `workflow_runs`, and persists new timeline entries.
6. **Sleep or Termination**: If active, workflow schedules the next wake-up timer (`schedule_wake_up`). If a terminal event occurs (`delivered`, `refund_requested`) or `close_workflow` is called, a final summary is saved and the workflow completes.

---

## 4. Key Architectural Patterns

- **1 Workflow Instance per Order**: Identified deterministically by `order-{order_id}-{supervisor_id}` to guarantee single-supervisor isolation.
- **Durable Wake/Sleep Loop**: Uses Temporal's `wait_condition` to sleep on durable timers (default 5 mins) and wake up instantly when an incoming signal arrives (`incoming_event`, `add_instruction`).
- **Lightweight Classifier Policy**: Evaluates incoming events before waking the LLM, preventing unnecessary LLM token consumption on low-priority signals.
- **Data Normalization**: Timeline payloads automatically unwrap nested event structures and support both snake_case (`order_id`, `amount_paid`) and camelCase (`orderId`, `amountPaid`) schemas.

---

## 5. Domain Toolset

The AI agent has access to 5 mandatory operational tools and 3 workflow control tools:

1. `message_fulfillment_team`: Dispatch alerts to warehouse operations.
2. `message_payments_team`: Request payment resolution or refund holds.
3. `message_logistics_team`: Coordinate carrier delays or tracking inquiries.
4. `message_customer`: Send automated status emails or notifications.
5. `create_internal_note`: Append operational logs to order history.
6. `schedule_wake_up`: Set custom sleep intervals until next evaluation.
7. `escalate_issue`: Flag order for human customer support review.
8. `close_workflow`: Mark order supervision completed.

---

## 6. Database Schema Summary

- **`supervisors`**: Supervisor configuration templates, system prompts, & enabled tool lists.
- **`workflow_runs`**: Active/completed runs, current state JSON, next wake-up timestamp, & final summary.
- **`timeline_events`**: Chronological order events (`order_created`, `payment_failed`, `shipment_delayed`, `delivered`).
- **`agent_actions`**: Audit log of tool executions, inputs, outputs, and LLM reasoning.
- **`run_instructions`**: Live human operator instructions appended to workflow runs.
