"""FastAPI dependencies (currently minimal; reserved for future DI)."""

from __future__ import annotations

from app.services.supabase_service import SupabaseService, supabase_client
from app.services.temporal_service import TemporalService, temporal_service


async def get_supabase() -> SupabaseService:
    """Return the shared Supabase service singleton."""
    return supabase_client


async def get_temporal() -> TemporalService:
    """Return the shared Temporal service singleton."""
    return temporal_service
