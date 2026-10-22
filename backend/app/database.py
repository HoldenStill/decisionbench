import aiosqlite
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from app.config import DB_PATH

@asynccontextmanager
async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """
    Asynchronous connection context manager.
    Enforces SQLite Write-Ahead Logging (WAL) and foreign keys on every connection.
    """
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL;")
    await db.execute("PRAGMA foreign_keys=ON;")
    try:
        yield db
    finally:
        await db.close()

async def init_db() -> None:
    """
    Initialize SQLite schema for settings, scenarios, and runs tables.
    Safe to call repeatedly on startup.
    """
    async with get_db() as db:
        # Settings table (single-row configuration)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                encrypted_openrouter_key TEXT,
                default_stage1_model TEXT NOT NULL DEFAULT 'openrouter/free',
                default_stage2_model TEXT NOT NULL DEFAULT 'typesafe/jev-router',
                pinned_models_json TEXT DEFAULT '[]',
                thresholds_json TEXT DEFAULT '{"reject": 0.35, "commit": 0.75}',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Ensure default settings row exists
        await db.execute("""
            INSERT OR IGNORE INTO settings (id, encrypted_openrouter_key, default_stage1_model, default_stage2_model)
            VALUES (1, '', 'openrouter/free', 'typesafe/jev-router');
        """)

        # Migrate legacy 'typesafe/jev-latest' settings to active 'typesafe/jev-router'
        await db.execute("""
            UPDATE settings 
            SET default_stage2_model = 'typesafe/jev-router' 
            WHERE default_stage2_model = 'typesafe/jev-latest';
        """)

        # Scenarios table (saved templates and presets)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS scenarios (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT DEFAULT 'General',
                raw_prompt TEXT,
                state_mode TEXT DEFAULT 'text' CHECK (state_mode IN ('text', 'json')),
                state_content TEXT,
                questions_json TEXT NOT NULL,
                thresholds_json TEXT,
                is_builtin INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_scenarios_category ON scenarios (category);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_scenarios_builtin ON scenarios (is_builtin);")

        # Runs table (historical execution ledger)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                parent_run_id TEXT REFERENCES runs(id) ON DELETE SET NULL,
                scenario_id TEXT REFERENCES scenarios(id) ON DELETE SET NULL,
                mode TEXT NOT NULL CHECK (mode IN ('auto_compile', 'direct', 'sweep', 'comparison')),
                raw_user_prompt TEXT,
                parser_model TEXT,
                parser_latency_ms INTEGER DEFAULT 0,
                parser_tokens_in INTEGER DEFAULT 0,
                parser_tokens_out INTEGER DEFAULT 0,
                parser_cost_usd REAL DEFAULT 0.0,
                openrouter_gen_id TEXT,
                decision_model_requested TEXT NOT NULL,
                decision_model_served TEXT,
                state_payload TEXT NOT NULL,
                questions_payload TEXT NOT NULL,
                answers_payload TEXT NOT NULL,
                metrics_payload TEXT,
                decision_input_tokens INTEGER DEFAULT 0,
                decision_output_tokens INTEGER DEFAULT 0,
                decision_cost_usd REAL DEFAULT 0.0,
                decision_latency_ms INTEGER DEFAULT 0,
                status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs (created_at DESC);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_runs_parent ON runs (parent_run_id);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_runs_model ON runs (decision_model_requested);")

        await db.commit()
