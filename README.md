# Order Supervisor AI

A production-ready POC for a long-running **AI Order Supervisor** that monitors order lifecycles from creation until completion using **Temporal Python SDK**, **FastAPI**, **Next.js (App Router)**, and **Supabase (PostgreSQL)**.

---

## Key Features

- **Long-Running Temporal Workflows**: 1 workflow instance per order (`OrderSupervisorWorkflow`).
- **Event-Driven Wake/Sleep Loop**: Workflow sleeps on durable timers and wakes up instantly upon receiving signals (`incoming_event`, `add_instruction`).
- **Lightweight Classifier Policy**: Evaluates incoming events before waking the main LLM agent.
- **5 Mandatory Business Actions**:
  - `message_fulfillment_team`
  - `message_payments_team`
  - `message_logistics_team`
  - `message_customer`
  - `create_internal_note`
- **Raycast/Stripe Minimal UI**: Sleek dark-mode interface with human-centric readable descriptions and `{ } Raw JSON` toggles.
- **Explicit Lifecycle Completion Rules**: Enforces termination on terminal events (`delivered`, `refund_requested`), manual UI cancellation, or maximum workflow age.

---

## Architecture Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Lucide Icons, TanStack Query.
- **Backend API**: Python 3.12, FastAPI, Pydantic v2, Structlog.
- **Orchestration**: Temporal Python SDK (`temporalio`).
- **Persistence**: Supabase (PostgreSQL).
- **LLM Engine**: OpenRouter OpenAI-compatible API.

---

## Quick Start (Choose Option A or B)

### Option A: 1-Command Docker Setup (Recommended)

1. Clone the repository and copy the environment variables:
   ```bash
   cp backend/.env.example .env
   ```
2. Start all services using Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. Open the web applications:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **FastAPI API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Temporal Web UI**: [http://localhost:8080](http://localhost:8080)

---

### Option B: Local Development Setup

#### 1. Start Temporal Local Server
```bash
temporal server start-dev
```

#### 2. Start FastAPI Backend & Temporal Worker
```bash
cd backend
uv sync
uv run uvicorn app.main:app --port 8000
```
In a separate terminal, start the Temporal worker:
```bash
cd backend
uv run python -m app.temporal.worker
```

#### 3. Start Next.js Frontend
```bash
cd frontend
pnpm install
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.



## Project Documentation Artifacts

- **[System Architecture & Video Script](system_architecture_and_demo_script.md)**: System design diagrams (Mermaid sequence & flowcharts) and video demo walkthrough guide.
- **[Implementation Plan](implementation_plan.md)**: Detailed feature implementation roadmap.
