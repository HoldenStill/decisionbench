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

def test_robust_json_parsing_and_repair():
    from app.services.compiler import robust_json_parse

    # Test exact truncation from user scenario
    truncated = '{ "state": "User needs to choose between self-hosting Hermes Agent on TrueNAS vs. cloud hosting. Two distinct architectural approaches with different trade-offs in cost, privacy, performance, and co'
    repaired = robust_json_parse(truncated)
    assert "state" in repaired
    assert "Hermes Agent" in repaired["state"]

    # Test markdown code block wrapping
    fenced = '```json\n{"state": "Fenced state", "state_mode": "text", "questions": {}}\n```'
    parsed_fenced = robust_json_parse(fenced)
    assert parsed_fenced["state"] == "Fenced state"

    # Test nested truncated JSON
    nested_truncated = '{"state": "Testing", "questions": {"q1": {"type": "choice", "instructions": "Which one?", "choice_criteria": {"opt1": "Desc 1", "opt2": "Desc 2"'
    parsed_nested = robust_json_parse(nested_truncated)
    assert "questions" in parsed_nested
    assert "q1" in parsed_nested["questions"]
