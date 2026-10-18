from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import STATIC_DIR
from app.database import init_db
from app.crypto import get_or_create_secret_key
from app.services.scenario_seeder import seed_scenarios

from app.routers import health, settings, models, decisions, scenarios, runs

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle.
    Initializes database schema, seed data, and cryptography keys.
    """
    # 1. Initialize secret key
    get_or_create_secret_key()
    # 2. Initialize database schema
    await init_db()
    # 3. Seed built-in scenarios
    await seed_scenarios()
    yield

app = FastAPI(
    title="DecisionBench",
    description="System One Decision Workbench & NL-to-Decision Studio",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router)
app.include_router(settings.router)
app.include_router(models.router)
app.include_router(decisions.router)
app.include_router(scenarios.router)
app.include_router(runs.router)

# Serve Frontend SPA static assets if built
if STATIC_DIR.exists() and (STATIC_DIR / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
