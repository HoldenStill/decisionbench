import pytest
from app.database import get_db

@pytest.mark.asyncio
async def test_sqlite_wal_mode():
    async with get_db() as db:
        async with db.execute("PRAGMA journal_mode;") as cursor:
            row = await cursor.fetchone()
            assert row[0].upper() == "WAL"

@pytest.mark.asyncio
async def test_scenarios_seeded():
    async with get_db() as db:
        async with db.execute("SELECT COUNT(*) FROM scenarios WHERE is_builtin = 1;") as cursor:
            row = await cursor.fetchone()
            assert row[0] == 4

@pytest.mark.asyncio
async def test_settings_seeded():
    async with get_db() as db:
        async with db.execute("SELECT default_stage1_model, default_stage2_model FROM settings WHERE id = 1;") as cursor:
            row = await cursor.fetchone()
            assert row["default_stage1_model"] == "openrouter/free"
            assert row["default_stage2_model"] == "typesafe/jev-router"
