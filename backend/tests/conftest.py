import pytest
import os
import tempfile
from pathlib import Path
import httpx
from cryptography.fernet import Fernet

# Set test environment overrides before importing app modules
test_dir = tempfile.TemporaryDirectory()
test_data_dir = Path(test_dir.name)
test_secret_key = Fernet.generate_key().decode("utf-8")

os.environ["DATA_DIR"] = str(test_data_dir)
os.environ["DECISIONBENCH_SECRET_KEY"] = test_secret_key
os.environ["OPENROUTER_API_KEY"] = "sk-or-v1-testkey1234567890abcdef"

import app.config as config
config.DATA_DIR = test_data_dir
config.DB_PATH = test_data_dir / "decisionbench.db"
config.SECRET_KEY_PATH = test_data_dir / ".secret_key"
config.DECISIONBENCH_SECRET_KEY = test_secret_key

from app.database import init_db
from app.services.scenario_seeder import seed_scenarios
from app.main import app

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    await init_db()
    await seed_scenarios()
    yield
    test_dir.cleanup()

@pytest.fixture
async def client():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
