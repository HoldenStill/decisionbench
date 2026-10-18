import pytest
import respx
import httpx
from app.config import OPENROUTER_DECISIONS_URL, OPENROUTER_CHAT_URL
from app.services.decision_engine import calculate_shannon_entropy

MOCK_DECISIONS_RESPONSE = {
    "id": "gen-jev12345",
    "model": "typesafe/jev-1.14-20261014",
    "answers": {
        "db_engine": {
            "type": "choice",
            "choice": "sqlite_wal",
            "probabilities": {
                "sqlite_wal": 0.88,
                "postgresql": 0.12
            },
            "confidence": 0.76
        },
        "container_safe": {
            "type": "noul",
            "noul": 0.92
        },
        "complexity": {
            "type": "score",
            "score": 0.20,
            "legend": {
                "0": "Low",
                "1": "Medium",
                "2": "High"
            },
            "probabilities": {
                "0": 0.82,
                "1": 0.16,
                "2": 0.02
            },
            "confidence": 0.80
        }
    },
    "usage": {
        "input_tokens": 150,
        "output_tokens": 25,
        "cost": 0.00012
    }
}

def test_entropy_math():
    # 50/50 toss-up has maximum entropy = 1.0, certainty = 0.0
    h, h_norm, certainty = calculate_shannon_entropy([0.5, 0.5])
    assert abs(h - 1.0) < 0.01
    assert abs(certainty - 0.0) < 0.01

    # Completely certain distribution has 0 entropy, certainty = 1.0
    h_cert, h_norm_cert, cert = calculate_shannon_entropy([1.0, 0.0])
    assert h_cert == 0.0
    assert cert == 1.0

@pytest.mark.asyncio
@respx.mock
async def test_direct_execute_pipeline(client):
    respx.post(OPENROUTER_DECISIONS_URL).mock(
        return_value=httpx.Response(200, json=MOCK_DECISIONS_RESPONSE)
    )

    payload = {
        "mode": "direct",
        "state": "Single user TrueNAS setup with minimal maintenance.",
        "state_mode": "text",
        "decision_model": "typesafe/jev-latest",
        "questions": {
            "db_engine": {
                "type": "choice",
                "instructions": "Which db?",
                "criteria": {
                    "sqlite_wal": "Embedded database.",
                    "postgresql": "Client server database."
                }
            },
            "container_safe": {
                "type": "noul",
                "instructions": "Is single container safe?",
                "criteria": {"true": "Safe.", "false": "Risky."}
            },
            "complexity": {
                "type": "score",
                "instructions": "Rate complexity.",
                "criteria": ["Low", "Medium", "High"]
            }
        }
    }

    resp = await client.post("/api/decisions/execute", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["stage1_telemetry"]["bypassed"] is True
    assert data["stage2_telemetry"]["gen_id"] == "gen-jev12345"
    assert data["stage2_telemetry"]["model_served"] == "typesafe/jev-1.14-20261014"

    # Verify answers
    assert data["answers"]["db_engine"]["choice"] == "sqlite_wal"
    assert data["answers"]["container_safe"]["noul"] == 0.92

    # Verify metrics
    db_metrics = data["metrics"]["db_engine"]
    assert db_metrics["top2_margin"] == 0.76  # 0.88 - 0.12
    assert db_metrics["verdict"] == "sqlite_wal"

    noul_metrics = data["metrics"]["container_safe"]
    assert noul_metrics["verdict"] == "COMMIT"  # 0.92 >= 0.75 default commit threshold

    score_metrics = data["metrics"]["complexity"]
    assert score_metrics["verdict"] == "0.20"

@pytest.mark.asyncio
@respx.mock
async def test_live_tweak_re_run_deltas(client):
    respx.post(OPENROUTER_DECISIONS_URL).mock(
        return_value=httpx.Response(200, json=MOCK_DECISIONS_RESPONSE)
    )

    # First run
    p1 = {
        "mode": "direct",
        "state": "Base state",
        "decision_model": "typesafe/jev-latest",
        "questions": {
            "db_engine": {
                "type": "choice",
                "instructions": "Which db?",
                "criteria": {"sqlite_wal": "Embedded", "postgresql": "Server"}
            }
        }
    }
    r1 = await client.post("/api/decisions/execute", json=p1)
    run1_data = r1.json()
    run1_id = run1_data["run_id"]

    # Mock modified second run with shifted probabilities
    mock_run2_response = {
        "id": "gen-jev-run2",
        "model": "typesafe/jev-1.14-20261014",
        "answers": {
            "db_engine": {
                "type": "choice",
                "choice": "sqlite_wal",
                "probabilities": {
                    "sqlite_wal": 0.95,
                    "postgresql": 0.05
                },
                "confidence": 0.90
            }
        },
        "usage": {"input_tokens": 160, "output_tokens": 25, "cost": 0.00013}
    }
    respx.post(OPENROUTER_DECISIONS_URL).mock(
        return_value=httpx.Response(200, json=mock_run2_response)
    )

    # Tweak re-run referencing parent_run_id
    p2 = {
        "mode": "direct",
        "parent_run_id": run1_id,
        "state": "Updated state with even more strict embedded backup requirement.",
        "decision_model": "typesafe/jev-latest",
        "questions": {
            "db_engine": {
                "type": "choice",
                "instructions": "Which db?",
                "criteria": {"sqlite_wal": "Embedded", "postgresql": "Server"}
            }
        }
    }
    r2 = await client.post("/api/decisions/execute", json=p2)
    assert r2.status_code == 200
    run2_data = r2.json()

    # Delta for sqlite_wal should be 0.95 - 0.88 = +0.07
    deltas = run2_data["metrics"]["db_engine"]["deltas"]
    assert deltas is not None
    assert abs(deltas["sqlite_wal"] - 0.07) < 0.001
    assert abs(deltas["postgresql"] - (-0.07)) < 0.001
