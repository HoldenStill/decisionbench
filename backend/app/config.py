import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent

# Persistent data directory
# Default to /app/data if running inside Docker container, otherwise ./data in project root
DEFAULT_DATA_DIR = Path("/app/data") if Path("/app/data").exists() or os.getenv("CONTAINER") == "true" else BASE_DIR.parent / "data"
DATA_DIR = Path(os.getenv("DATA_DIR", str(DEFAULT_DATA_DIR))).resolve()
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Database and secrets paths
DB_PATH = DATA_DIR / "decisionbench.db"
SECRET_KEY_PATH = DATA_DIR / ".secret_key"

# Environment overrides
DECISIONBENCH_SECRET_KEY = os.getenv("DECISIONBENCH_SECRET_KEY")
OPENROUTER_API_KEY_ENV = os.getenv("OPENROUTER_API_KEY")

# OpenRouter endpoints
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api")
OPENROUTER_CHAT_URL = f"{OPENROUTER_BASE_URL}/v1/chat/completions"
OPENROUTER_DECISIONS_URL = f"{OPENROUTER_BASE_URL}/alpha/decisions"

# Static assets directory for SPA (packaged in production)
STATIC_DIR = Path(os.getenv("STATIC_DIR", str(BASE_DIR.parent / "frontend" / "dist"))).resolve()
