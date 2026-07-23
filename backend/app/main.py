"""FastAPI application entrypoint.

Run with::

    uv run uvicorn app.main:app --reload
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from structlog import get_logger

from app.api import events, runs, supervisors
from app.config import get_settings

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: startup + shutdown hooks."""
    settings = get_settings()
    logger.info("app_starting", app=settings.app_name, debug=settings.debug)
    yield
    logger.info("app_stopping")


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
        debug=settings.debug,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(supervisors.router, prefix="/api/supervisors", tags=["supervisors"])
    app.include_router(runs.router, prefix="/api/runs", tags=["runs"])
    app.include_router(events.router, prefix="/api/events", tags=["events"])

    @app.get("/health", tags=["health"])
    async def health_check() -> dict[str, str]:
        return {"status": "healthy"}

    return app


app = create_app()
