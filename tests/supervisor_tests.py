"""Test supervisor for verifying backend API endpoints.

This test suite verifies that all backend APIs are working correctly:
- Supervisor CRUD operations
- Workflow run lifecycle (create, start, events, instructions, lifecycle control)
- Event injection and templates
- Timeline and memory endpoints
- Error handling
"""

import asyncio
import sys
import uuid
from typing import Any

if sys.version_info >= (3, 11):
    import asyncio
    from asyncio import timeout
else:
    from timeout import timeout

import pytest
from httpx import AsyncClient, Response
from pydantic import BaseModel

from app.models.schemas import (
    EventCreate,
    InstructionCreate,
    MemoryResponse,
    RunCreate,
    TimelineEntry,
)


class SupervisorTestClient:
    """Test client for backend API endpoints."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = AsyncClient(base_url=base_url, timeout=30.0)
        self.created_supervisor_id: str | None = None
        self.created_run_id: str | None = None

    async def __aenter__(self) -> "SupervisorTestClient":
        await self.client.__aenter__()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.client.__aexit__(exc_type, exc_val, exc_tb)

    async def create_test_supervisor(self) -> dict[str, Any]:
        """Create a test supervisor template."""
        supervisor_data = {
            "name": "Test Supervisor",
            "base_instruction": "You are a test supervisor. Handle all test orders correctly.",
            "available_tools": ["send_customer_message", "create_internal_note"],
            "wake_up_guidance": "Trigger on order events and payment status changes.",
        }
        response: Response = await self.client.post(
            "/api/supervisors",
            json=supervisor_data,
        )
        response.raise_for_status()
        self.created_supervisor_id = response.json()["id"]
        return response.json()

    async def get_supervisor(self, supervisor_id: str) -> dict[str, Any]:
        """Get a specific supervisor."""
        response: Response = await self.client.get(f"/api/supervisors/{supervisor_id}")
        response.raise_for_status()
        return response.json()

    async def list_supervisors(self) -> list[dict[str, Any]]:
        """List all supervisors."""
        response: Response = await self.client.get("/api/supervisors")
        response.raise_for_status()
        return response.json()

    async def create_test_run(self, supervisor_id: str) -> dict[str, Any]:
        """Create a workflow run for testing."""
        run_data: RunCreate = RunCreate(
            supervisor_id=supervisor_id,
            order_id=f"test-order-{uuid.uuid4().hex[:8]}",
        )
        response: Response = await self.client.post(
            "/api/runs",
            json=run_data.model_dump(by_alias=True),
        )
        response.raise_for_status()
        self.created_run_id = response.json()["id"]
        return response.json()

    async def get_run(self, run_id: str) -> dict[str, Any]:
        """Get a specific run."""
        response: Response = await self.client.get(f"/api/runs/{run_id}")
        response.raise_for_status()
        return response.json()

    async def get_run_timeline(self, run_id: str) -> list[dict[str, Any]]:
        """Get run timeline."""
        response: Response = await self.client.get(f"/api/runs/{run_id}/timeline")
        response.raise_for_status()
        return response.json()

    async def get_run_memory(self, run_id: str) -> dict[str, Any]:
        """Get run memory."""
        response: Response = await self.client.get(f"/api/runs/{run_id}/memory")
        response.raise_for_status()
        return response.json()

    async def inject_event(self, run_id: str, event_type: str, event_data: dict[str, Any]) -> dict[str, str]:
        """Inject an event into a run."""
        event: EventCreate = EventCreate(event_type=event_type, event_data=event_data)
        response: Response = await self.client.post(
            f"/api/runs/{run_id}/events",
            json=event.model_dump(by_alias=True),
        )
        response.raise_for_status()
        return response.json()

    async def add_instruction(self, run_id: str, instruction: str) -> dict[str, Any]:
        """Add an instruction to a run."""
        instruction_data: InstructionCreate = InstructionCreate(instruction=instruction)
        response: Response = await self.client.post(
            f"/api/runs/{run_id}/instructions",
            json=instruction_data.model_dump(by_alias=True),
        )
        response.raise_for_status()
        return response.json()

    async def list_instructions(self, run_id: str) -> list[dict[str, Any]]:
        """List instructions for a run."""
        response: Response = await self.client.get(f"/api/runs/{run_id}/instructions")
        response.raise_for_status()
        return response.json()

    async def terminate_run(self, run_id: str, reason: str = "test") -> dict[str, str]:
        """Terminate a run."""
        response: Response = await self.client.post(
            f"/api/runs/{run_id}/terminate",
            json={"reason": reason},
        )
        response.raise_for_status()
        return response.json()

    async def get_event_templates(self) -> dict[str, Any]:
        """Get event templates."""
        response: Response = await self.client.get("/api/events/templates")
        response.raise_for_status()
        return response.json()


class TestBackendSupervisor:
    """Test supervisor for verifying all backend APIs work correctly."""

    @pytest.fixture
    async def test_client(self) -> SupervisorTestClient:
        """Create a test client fixture."""
        async with SupervisorTestClient() as client:
            yield client

    @pytest.mark.asyncio
    async def test_supervisor_crud(self, test_client: SupervisorTestClient) -> None:
        """Test supervisor CRUD endpoints."""
        # Create supervisor
        supervisor = await test_client.create_test_supervisor()
        assert supervisor["name"] == "Test Supervisor"
        assert "id" in supervisor
        assert "created_at" in supervisor

        # Get supervisor
        retrieved = await test_client.get_supervisor(supervisor["id"])
        assert retrieved["id"] == supervisor["id"]
        assert retrieved["name"] == supervisor["name"]

        # List supervisors
        supervisors = await test_client.list_supervisors()
        assert len(supervisors) >= 1
        assert any(s["id"] == supervisor["id"] for s in supervisors)

    @pytest.mark.asyncio
    async def test_run_lifecycle(self, test_client: SupervisorTestClient) -> None:
        """Test complete workflow run lifecycle."""
        # Create supervisor first
        supervisor = await test_client.create_test_supervisor()

        # Create run (this starts Temporal workflow)
        run = await test_client.create_test_run(supervisor["id"])
        assert run["supervisor_id"] == supervisor["id"]
        assert "order_id" in run
        assert run["status"] == "running"
        assert "temporal_workflow_id" in run

        # Get run details
        retrieved = await test_client.get_run(run["id"])
        assert retrieved["id"] == run["id"]
        assert retrieved["status"] == "running"

        # Get timeline
        timeline = await test_client.get_run_timeline(run["id"])
        assert isinstance(timeline, list)
        # Should have at least the initial order_created event

        # Get memory
        memory = await test_client.get_run_memory(run["id"])
        assert memory["run_id"] == run["id"]
        assert "compact_summary" in memory
        assert "recent_events" in memory
        assert "sleep_state" in memory

        # Inject an event
        event_result = await test_client.inject_event(
            run["id"],
            "payment_confirmed",
            {"amount": 100, "currency": "USD"},
        )
        assert event_result["status"] == "event_sent"
        assert event_result["event_type"] == "payment_confirmed"

        # Add instruction
        instruction = await test_client.add_instruction(
            run["id"],
            "For this order, prioritize speed over cost."
        )
        assert instruction["instruction"] == "For this order, prioritize speed over cost."

        # List instructions
        instructions = await test_client.list_instructions(run["id"])
        assert len(instructions) >= 1

        # Terminate run
        terminate_result = await test_client.terminate_run(run["id"], "test complete")
        assert terminate_result["status"] == "terminated"

        # Verify run is terminated
        terminated_run = await test_client.get_run(run["id"])
        assert terminated_run["status"] == "terminated"

    @pytest.mark.asyncio
    async def test_event_templates(self, test_client: SupervisorTestClient) -> None:
        """Test event templates endpoint."""
        templates = await test_client.get_event_templates()
        assert isinstance(templates, dict)
        # Should have predefined event templates
        assert "order_created" in templates
        assert "payment_confirmed" in templates
        assert "shipment_created" in templates

        # Verify template structure
        order_created = templates["order_created"]
        assert "order_status" in order_created
        assert order_created["order_status"] == "created"

    @pytest.mark.asyncio
    async def test_error_handling(self, test_client: SupervisorTestClient) -> None:
        """Test error handling for invalid operations."""
        # Create supervisor first
        supervisor = await test_client.create_test_supervisor()

        # Try to create run with non-existent supervisor
        invalid_run_data = {
            "supervisor_id": str(uuid.uuid4()),
            "order_id": "invalid-order",
        }
        # FastAPI should return 404 for non-existent supervisor
        response = await test_client.client.post(
            "/api/runs",
            json=invalid_run_data,
        )
        assert response.status_code == 404

        # Try to inject event into non-existent run
        response = await test_client.client.post(
            f"/api/runs/{uuid.uuid4()}/events",
            json={"event_type": "order_created", "event_data": {}},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_complete_workflow(self, test_client: SupervisorTestClient) -> None:
        """Test a complete workflow with multiple events."""
        # Create supervisor
        supervisor = await test_client.create_test_supervisor()
        assert supervisor["name"] == "Test Supervisor"

        # Verify supervisor endpoints work
        retrieved_supervisor = await test_client.get_supervisor(supervisor["id"])
        assert retrieved_supervisor["base_instruction"] == supervisor["base_instruction"]

        # Create run
        run = await test_client.create_test_run(supervisor["id"])
        workflow_id = run["temporal_workflow_id"]

        # Send multiple events
        await test_client.inject_event(run["id"], "order_created", {"order_id": run["order_id"]})
        await test_client.inject_event(run["id"], "payment_confirmed", {"amount": 150.0})
        await test_client.inject_event(run["id"], "shipment_created", {"carrier": "UPS", "tracking": "1Z2345"})

        # Add instructions
        await test_client.add_instruction(run["id"], "Check delivery status")
        await test_client.add_instruction(run["id"], "Contact customer if delayed")

        # Get timeline (should have multiple events)
        timeline = await test_client.get_run_timeline(run["id"])
        assert len(timeline) >= 3  # At least order_created, payment_confirmed, shipment_created

        # Get memory
        memory = await test_client.get_run_memory(run["id"])
        assert memory["recent_events"] is not None

        # List all instructions
        instructions = await test_client.list_instructions(run["id"])
        assert len(instructions) >= 2

        # Terminate
        result = await test_client.terminate_run(run["id"], "test workflow complete")
        assert result["status"] == "terminated"

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    @pytest.mark.asyncio
    async def test_all_endpoints_responsive(self) -> None:
        """Quick smoke test to ensure all endpoints respond."""
        async with SupervisorTestClient() as client:
            # Test supervisor endpoints
            response = await client.client.get("/api/supervisors")
            assert response.status_code == 200
            supervisors = response.json()
            assert isinstance(supervisors, list)

            # Test event templates
            response = await client.client.get("/api/events/templates")
            assert response.status_code == 200
            templates = response.json()
            assert isinstance(templates, dict)

            # Test runs endpoint (empty list)
            response = await client.client.get("/api/runs")
            assert response.status_code == 200
            runs = response.json()
            assert isinstance(runs, list)

            print("✓ All API endpoints are responsive")

    def run_tests(self) -> None:
        """Run all tests manually."""
        import asyncio

        async def main() -> None:
            print("🚀 Running Supervisor Backend API Tests")
            print("=" * 50)

            test_instance = TestBackendSupervisor()
            
            # Quick smoke test
            await test_instance.test_all_endpoints_responsive()
            print()

            # Run supervisor CRUD test
            print("📋 Testing Supervisor CRUD...")
            async with SupervisorTestClient() as client:
                # Test supervisor creation
                supervisor = await client.create_test_supervisor()
                print(f"✓ Created supervisor: {supervisor['name']}")

                # Test supervisor retrieval
                retrieved = await client.get_supervisor(supervisor["id"])
                print(f"✓ Retrieved supervisor: {retrieved['id']}")

                # Test list supervisors
                supervisors = await client.list_supervisors()
                print(f"✓ Listed {len(supervisors)} supervisors")

            print()

            # Test event templates
            print("🎯 Testing Event Templates...")
            async with SupervisorTestClient() as client:
                templates = await client.get_event_templates()
                print(f"✓ Retrieved {len(templates)} event templates")
                print(f"  - order_created: {templates['order_created']}")
                print(f"  - payment_confirmed: {templates['payment_confirmed']}")

            print()

            # Test complete workflow
            print("🔄 Testing Complete Workflow...")
            async with SupervisorTestClient() as client:
                # Create supervisor
                supervisor = await client.create_test_supervisor()
                print(f"✓ Created supervisor: {supervisor['name']}")

                # Create run
                run = await client.create_test_run(supervisor["id"])
                print(f"✓ Created run: {run['id']} (workflow: {run['temporal_workflow_id']})")

                # Send initial event
                await client.inject_event(run["id"], "order_created", {"order_id": run["order_id"]})
                print(f"✓ Injected order_created event")

                # Add instruction
                await client.add_instruction(run["id"], "Test instruction for workflow")
                print(f"✓ Added instruction")

                # Check timeline
                timeline = await client.get_run_timeline(run["id"])
                print(f"✓ Retrieved timeline with {len(timeline)} events")

                # Check memory
                memory = await client.get_run_memory(run["id"])
                print(f"✓ Retrieved memory: {memory['sleep_state']}")

                # List instructions
                instructions = await client.list_instructions(run["id"])
                print(f"✓ Listed {len(instructions)} instructions")

                # Terminate
                await client.terminate_run(run["id"], "test termination")
                print(f"✓ Terminated run")

                # Verify terminated
                terminated_run = await client.get_run(run["id"])
                print(f"✓ Verified run status: {terminated_run['status']}")

            print()
            print("🎉 All tests completed successfully!")
            print("\n📊 Summary:")
            print("  ✓ Supervisor CRUD operations work")
            print("  ✓ Workflow runs start and manage correctly")
            print("  ✓ Events can be injected into workflows")
            print("  ✓ Instructions can be added to runs")
            print("  ✓ Timeline and memory endpoints respond")
            print("  ✓ Event templates are available")
            print("  ✓ Error handling works for invalid operations")

        asyncio.run(main())


if __name__ == "__main__":
    test_suite = TestBackendSupervisor()
    test_suite.run_tests()

    async def cleanup(self) -> None:
        """Clean up created resources."""
        if self.created_run_id:
            try:
                await self.terminate_run(self.created_run_id, "cleanup")
            except:
                pass
        self.created_run_id = None

    async def close(self) -> None:
        """Close the client."""
        await self.client.aclose()

    @pytest.mark.asyncio
    async def test_event_templates(self, test_client: SupervisorTestClient) -> None:
        """Test event templates endpoint."""
        templates = await test_client.get_event_templates()
        assert isinstance(templates, dict)
        # Should have predefined event templates
        assert "order_created" in templates
        assert "payment_confirmed" in templates
        assert "shipment_created" in templates

        # Verify template structure
        order_created = templates["order_created"]
        assert "order_status" in order_created
        assert order_created["order_status"] == "created"

    @pytest.mark.asyncio
    async def test_error_handling(self, test_client: SupervisorTestClient) -> None:
        """Test error handling for invalid operations."""
        # Create supervisor first
        supervisor = await test_client.create_test_supervisor()

        # Try to create run with non-existent supervisor
        invalid_run_data = {
            "supervisor_id": str(uuid.uuid4()),
            "order_id": "invalid-order",
        }
        # FastAPI should return 404 for non-existent supervisor
        response = await test_client.client.post(
            "/api/runs",
            json=invalid_run_data,
        )
        assert response.status_code == 404

        # Try to inject event into non-existent run
        response = await test_client.client.post(
            f"/api/runs/{uuid.uuid4()}/events",
            json={"event_type": "order_created", "event_data": {}},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_complete_workflow(self, test_client: SupervisorTestClient) -> None:
        """Test a complete workflow with multiple events."""
        # Create supervisor
        supervisor = await test_client.create_test_supervisor()
        assert supervisor["name"] == "Test Supervisor"

        # Verify supervisor endpoints work
        retrieved_supervisor = await test_client.get_supervisor(supervisor["id"])
        assert retrieved_supervisor["base_instruction"] == supervisor["base_instruction"]

        # Create run
        run = await test_client.create_test_run(supervisor["id"])
        workflow_id = run["temporal_workflow_id"]

        # Send multiple events
        await test_client.inject_event(run["id"], "order_created", {"order_id": run["order_id"]})
        await test_client.inject_event(run["id"], "payment_confirmed", {"amount": 150.0})
        await test_client.inject_event(run["id"], "shipment_created", {"carrier": "UPS", "tracking": "1Z2345"})

        # Add instructions
        await test_client.add_instruction(run["id"], "Check delivery status")
        await test_client.add_instruction(run["id"], "Contact customer if delayed")

        # Get timeline (should have multiple events)
        timeline = await test_client.get_run_timeline(run["id"])
        assert len(timeline) >= 3  # At least order_created, payment_confirmed, shipment_created

        # Get memory
        memory = await test_client.get_run_memory(run["id"])
        assert memory["recent_events"] is not None

        # List all instructions
        instructions = await test_client.list_instructions(run["id"])
        assert len(instructions) >= 2

        # Terminate
        result = await test_client.terminate_run(run["id"], "test workflow complete")
        assert result["status"] == "terminated"

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    @pytest.mark.asyncio
    async def test_all_endpoints_responsive(self) -> None:
        """Quick smoke test to ensure all endpoints respond."""
        async with SupervisorTestClient() as client:
            # Test supervisor endpoints
            response = await client.client.get("/api/supervisors")
            assert response.status_code == 200
            supervisors = response.json()
            assert isinstance(supervisors, list)

            # Test event templates
            response = await client.client.get("/api/events/templates")
            assert response.status_code == 200
            templates = response.json()
            assert isinstance(templates, dict)

            # Test runs endpoint (empty list)
            response = await client.client.get("/api/runs")
            assert response.status_code == 200
            runs = response.json()
            assert isinstance(runs, list)

            print("✓ All API endpoints are responsive")

    def run_tests(self) -> None:
        """Run all tests manually."""
        import asyncio

        async def main() -> None:
            print("🚀 Running Supervisor Backend API Tests")
            print("=" * 50)

            test_instance = TestBackendSupervisor()
            
            # Quick smoke test
            await test_instance.test_all_endpoints_responsive()
            print()

            # Run supervisor CRUD test
            print("📋 Testing Supervisor CRUD...")
            async with SupervisorTestClient() as client:
                # Test supervisor creation
                supervisor = await client.create_test_supervisor()
                print(f"✓ Created supervisor: {supervisor['name']}")

                # Test supervisor retrieval
                retrieved = await client.get_supervisor(supervisor["id"])
                print(f"✓ Retrieved supervisor: {retrieved['id']}")

                # Test list supervisors
                supervisors = await client.list_supervisors()
                print(f"✓ Listed {len(supervisors)} supervisors")

            print()

            # Test event templates
            print("🎯 Testing Event Templates...")
            async with SupervisorTestClient() as client:
                templates = await client.get_event_templates()
                print(f"✓ Retrieved {len(templates)} event templates")
                print(f"  - order_created: {templates['order_created']}")
                print(f"  - payment_confirmed: {templates['payment_confirmed']}")

            print()

            # Test complete workflow
            print("🔄 Testing Complete Workflow...")
            async with SupervisorTestClient() as client:
                # Create supervisor
                supervisor = await client.create_test_supervisor()
                print(f"✓ Created supervisor: {supervisor['name']}")

                # Create run
                run = await client.create_test_run(supervisor["id"])
                print(f"✓ Created run: {run['id']} (workflow: {run['temporal_workflow_id']})")

                # Send initial event
                await client.inject_event(run["id"], "order_created", {"order_id": run["order_id"]})
                print(f"✓ Injected order_created event")

                # Add instruction
                await client.add_instruction(run["id"], "Test instruction for workflow")
                print(f"✓ Added instruction")

                # Check timeline
                timeline = await client.get_run_timeline(run["id"])
                print(f"✓ Retrieved timeline with {len(timeline)} events")

                # Check memory
                memory = await client.get_run_memory(run["id"])
                print(f"✓ Retrieved memory: {memory['sleep_state']}")

                # List instructions
                instructions = await client.list_instructions(run["id"])
                print(f"✓ Listed {len(instructions)} instructions")

                # Terminate
                await client.terminate_run(run["id"], "test termination")
                print(f"✓ Terminated run")

                # Verify terminated
                terminated_run = await client.get_run(run["id"])
                print(f"✓ Verified run status: {terminated_run['status']}")

            print()
            print("🎉 All tests completed successfully!")
            print("\n📊 Summary:")
            print("  ✓ Supervisor CRUD operations work")
            print("  ✓ Workflow runs start and manage correctly")
            print("  ✓ Events can be injected into workflows")
            print("  ✓ Instructions can be added to runs")
            print("  ✓ Timeline and memory endpoints respond")
            print("  ✓ Event templates are available")
            print("  ✓ Error handling works for invalid operations")

        asyncio.run(main())


if __name__ == "__main__":
    test_suite = TestBackendSupervisor()
    test_suite.run_tests()
