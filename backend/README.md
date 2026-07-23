# Order Supervisor - Backend

FastAPI + Temporal + Supabase backend for the AI order supervisor POC.

## Stack

- **FastAPI** - REST API for workflow/run management
- **Temporal Python SDK** - long-running workflow orchestration
- **Supabase** (PostgreSQL) - persistence for runs, timeline, memory
- **OpenRouter** - LLM access for the agent
- **uv** - dependency management

## Setup

```bash
# Install uv (if not installed)
# macOS/Linux:  curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows:      powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

cd backend
uv sync                  # install dependencies
uv sync --extra dev      # install dev tools (ruff, mypy, pytest)

cp .env.example .env     # then edit .env with your credentials
```

## Run

You need Temporal running (see root `docker-compose.yml`):

```bash
docker compose up -d temporal temporal-ui
```

Then start the API and the Temporal worker:

```bash
# Terminal 1 - API
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2 - Temporal worker
uv run python -m app.temporal.worker
```

- API docs: http://localhost:8000/docs
- Temporal UI: http://localhost:8080

## Database

Run the SQL in [`../implementation.md`](../implementation.md#database-schema-supabase)
(section "Database Schema") in the Supabase SQL editor to create the tables.

## Lint / type-check

```bash
uv run ruff check .
uv run ruff format .
uv run mypy app/
```

## Test

```bash
uv run pytest
```

## Project structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Pydantic settings
│   ├── dependencies.py      # FastAPI DI
│   ├── api/                 # REST routers
│   │   ├── supervisors.py
│   │   ├── runs.py
│   │   └── events.py
│   ├── models/
│   │   └── schemas.py       # Pydantic schemas + enums
│   ├── services/
│   │   ├── supabase_service.py
│   │   └── temporal_service.py
│   ├── temporal/
│   │   ├── shared.py        # activity input/output dataclasses
│   │   ├── activities.py    # classifier, agent_execute, persist
│   │   ├── workflows.py     # OrderSupervisorWorkflow
│   │   └── worker.py        # worker entrypoint
│   └── tools/
│       └── __init__.py      # 6 mocked agent tools + definitions
├── pyproject.toml
├── .env.example
└── README.md
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST   | `/api/supervisors` | Create supervisor template |
| GET    | `/api/supervisors` | List supervisors |
| GET    | `/api/supervisors/{id}` | Get supervisor |
| POST   | `/api/runs` | Start a workflow run for an order |
| GET    | `/api/runs` | List runs (optional `?status=`) |
| GET    | `/api/runs/{id}` | Get run |
| POST   | `/api/runs/{id}/events` | Inject an event |
| POST   | `/api/runs/{id}/instructions` | Add run-specific instruction |
| GET    | `/api/runs/{id}/timeline` | Get timeline |
| GET    | `/api/runs/{id}/memory` | Get memory snapshot |
| POST   | `/api/runs/{id}/interrupt` | Pause run |
| POST   | `/api/runs/{id}/resume` | Resume run |
| POST   | `/api/runs/{id}/terminate` | Terminate run |
| GET    | `/api/events/templates` | Event templates for the UI |
| POST   | `/api/events/runs/{id}/inject` | Inject templated event |
| GET    | `/health` | Health check |