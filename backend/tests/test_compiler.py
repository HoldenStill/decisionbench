import pytest
import json
import respx
import httpx
from app.config import OPENROUTER_CHAT_URL
from app.services.compiler import compile_prompt

MOCK_STAGE1_RESPONSE = {
    "id": "chatcmpl-test123",
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": json.dumps({
                    "state": "User needs to pick between SQLite WAL and Postgres for a TrueNAS home server.",
                    "state_mode": "text",
                    "questions": {
                        "db_engine": {
                            "type": "choice",
                            "instructions": "Which database engine is best?",
                            "choice_criteria": {
                                "sqlite_wal": "Embedded relational engine with zero maintenance.",
                                "postgresql": "Client-server database with high concurrency support."
                            }
                        },
                        "container_safe": {
                            "type": "noul",
                            "instructions": "Is single container safe?",
                            "noul_criteria": {
                                "true": "Single container deployment is safe.",
                                "false": "Single container deployment risks failure."
                            }
                        }
                    }
                })
            }
        }
    ],
    "usage": {
        "prompt_tokens": 120,
        "completion_tokens": 85,
        "cost": 0.000045
    }
}

@pytest.mark.asyncio
@respx.mock
async def test_compiler_service_success():
    respx.post(OPENROUTER_CHAT_URL).mock(
        return_value=httpx.Response(200, json=MOCK_STAGE1_RESPONSE)
    )

    result = await compile_prompt(
        prompt="Should I use SQLite WAL or PostgreSQL?",
        model="openrouter/free",
        api_key_override="sk-or-test"
    )

    assert result.compiled.state_mode == "text"
    assert "db_engine" in result.compiled.questions
    assert result.compiled.questions["db_engine"]["type"] == "choice"
    assert "sqlite_wal" in result.compiled.questions["db_engine"]["criteria"]
    assert "container_safe" in result.compiled.questions
    assert result.compiled.questions["container_safe"]["type"] == "noul"
    assert result.telemetry.tokens_in == 120
    assert result.telemetry.tokens_out == 85

@pytest.mark.asyncio
@respx.mock
async def test_compiler_endpoint(client):
    respx.post(OPENROUTER_CHAT_URL).mock(
        return_value=httpx.Response(200, json=MOCK_STAGE1_RESPONSE)
    )

    response = await client.post(
        "/api/decisions/compile",
        json={"prompt": "Should I use SQLite or Postgres?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "compiled" in data
    assert "telemetry" in data
    assert data["telemetry"]["tokens_in"] == 120
