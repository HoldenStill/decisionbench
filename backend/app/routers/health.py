from fastapi import APIRouter
from app.database import get_db

router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("")
async def check_health():
    """
    Health check endpoint verifying database connectivity and journal mode.
    """
    try:
        async with get_db() as db:
            async with db.execute("PRAGMA journal_mode;") as cursor:
                row = await cursor.fetchone()
                journal_mode = row[0] if row else "unknown"
        return {
            "status": "healthy",
            "database": "connected",
            "journal_mode": journal_mode,
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "error",
            "error": str(e)
        }
