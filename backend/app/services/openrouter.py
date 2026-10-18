import httpx
from typing import Any
from app.config import (
    OPENROUTER_CHAT_URL,
    OPENROUTER_DECISIONS_URL,
    OPENROUTER_BASE_URL,
    OPENROUTER_API_KEY_ENV,
)
from app.database import get_db
from app.crypto import decrypt_api_key

async def get_active_api_key() -> str:
    """
    Retrieve active OpenRouter API key.
    Checks SQLite settings table (decrypted via Fernet), falling back to OPENROUTER_API_KEY environment variable.
    """
    async with get_db() as db:
        async with db.execute("SELECT encrypted_openrouter_key FROM settings WHERE id = 1;") as cursor:
            row = await cursor.fetchone()
            if row and row["encrypted_openrouter_key"]:
                decrypted = decrypt_api_key(row["encrypted_openrouter_key"])
                if decrypted:
                    return decrypted

    if OPENROUTER_API_KEY_ENV:
        return OPENROUTER_API_KEY_ENV.strip()

    return ""

def get_headers(api_key: str) -> dict[str, str]:
    """Standard headers for OpenRouter API requests."""
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "DecisionBench",
    }

async def test_api_key(api_key: str) -> tuple[bool, str, int]:
    """
    Test OpenRouter API key validity against /api/v1/models.
    Returns (success, message, model_count).
    """
    if not api_key:
        return False, "API key is empty.", 0

    headers = get_headers(api_key)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{OPENROUTER_BASE_URL}/v1/models", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                models = data.get("data", [])
                return True, "Successfully connected to OpenRouter API.", len(models)
            elif resp.status_code == 401:
                return False, "Authentication failed: Invalid OpenRouter API key.", 0
            else:
                return False, f"OpenRouter returned status code {resp.status_code}: {resp.text[:200]}", 0
    except httpx.RequestError as e:
        return False, f"Network error connecting to OpenRouter: {str(e)}", 0
    except Exception as e:
        return False, f"Unexpected error testing API key: {str(e)}", 0
