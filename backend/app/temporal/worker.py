"""Temporal worker entrypoint.

Run with::

    uv run python -m app.temporal.worker
"""

from __future__ import annotations

import asyncio
import contextlib

from structlog import get_logger
from temporalio.client import Client
from temporalio.worker import Worker

from app.config import get_settings
from app.temporal.activities import (
    agent_execute,
    classifier_check,
    persist_final_output,
    persist_timeline_event,
    update_memory,
)
from app.temporal.workflows import OrderSupervisorWorkflow

logger = get_logger(__name__)


async def main() -> None:
    """Start the Temporal worker and run until interrupted."""
    settings = get_settings()
    client = await Client.connect(settings.temporal_host)

    worker = Worker(
        client,
        task_queue=settings.temporal_task_queue,
        workflows=[OrderSupervisorWorkflow],
        activities=[
            classifier_check,
            agent_execute,
            persist_timeline_event,
            update_memory,
            persist_final_output,
        ],
    )

    logger.info(
        "temporal_worker_starting",
        host=settings.temporal_host,
        task_queue=settings.temporal_task_queue,
    )

    # Run until interrupted.
    try:
        await worker.run()
    except (KeyboardInterrupt, asyncio.CancelledError):
        logger.info("temporal_worker_stopped")


if __name__ == "__main__":
    # Windows-friendly signal handling.
    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(main())
    # On POSIX we could wire SIGINT/SIGTERM explicitly, but asyncio.run
    # already handles KeyboardInterrupt on Windows.
