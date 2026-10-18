import json
import time
import httpx
from typing import Any
from app.config import OPENROUTER_CHAT_URL
from app.models.decisions import CompiledSchema, Stage1Telemetry, CompileResponse
from app.services.openrouter import get_active_api_key, get_headers

SYSTEM_PROMPT = """You are DecisionBench's Stage-1 Natural-Language Schema & Criteria Compiler.
Your role is to translate conversational dilemmas into mathematically sound, unbiased structured decision schemas for System One probabilistic decision models (such as typesafe/jev-latest).

CRITICAL DOMAIN RULES:
1. OpenRouter System One decision models NEVER see option keys (such as "sqlite" or "postgres"). They rely 100% on the descriptive text inside "criteria" values to compute probability distributions.
2. CRITERIA NEUTRALITY GUARDRAIL (MANDATORY):
   - You MUST expand bare option names into rich, objective, symmetrical criteria descriptions.
   - Every option in a "choice" or "noul" question MUST receive a balanced description of equal depth, factual weight, and neutral tone.
   - NEVER laud one option while framing another negatively. State objective technical and operational trade-offs neutrally so that Stage 2 computes unbiased probabilities.
3. CONTEXT & STATE EXTRACTION:
   - Extract all stated constraints, goals, environment facts, hardware limits, and budgets into "state".
4. QUESTION PRIMITIVE CLASSIFICATION:
   - "noul": Binary yes/no dilemma or threshold gate (P(yes) in [0.0, 1.0]). Provide "true" and "false" criteria descriptions.
   - "choice": Mutually exclusive categorical selection (2 to 255 options). Map snake_case option keys to balanced criteria descriptions.
   - "score": Ordered rubric or rating scale (2 to 10 levels). Provide an ordered list of criteria descriptions from index 0 (lowest/least) to N-1 (highest/most).

You must return valid JSON matching the requested schema."""

JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "state": {
            "type": "string",
            "description": "Factual background, environmental constraints, user priorities, and technical parameters extracted from the user's prompt."
        },
        "state_mode": {
            "type": "string",
            "enum": ["text", "json"],
            "description": "Format of the state. Use 'text' by default or 'json' if data is explicitly formatted JSON."
        },
        "questions": {
            "type": "object",
            "description": "Mapping of question identifiers (snake_case slug) to typed question definitions.",
            "additionalProperties": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["noul", "choice", "score"],
                        "description": "Question primitive type."
                    },
                    "instructions": {
                        "type": "string",
                        "description": "Clear evaluation question."
                    },
                    "choice_criteria": {
                        "type": "object",
                        "description": "For type='choice': dictionary of option_key to rich, balanced, neutral criteria description.",
                        "additionalProperties": {"type": "string"}
                    },
                    "noul_criteria": {
                        "type": "object",
                        "description": "For type='noul': 'true' and 'false' neutral criteria descriptions.",
                        "properties": {
                            "true": {"type": "string"},
                            "false": {"type": "string"}
                        }
                    },
                    "score_criteria": {
                        "type": "array",
                        "description": "For type='score': ordered list of 2 to 10 level descriptions from index 0 to N-1.",
                        "items": {"type": "string"}
                    }
                },
                "required": ["type", "instructions"]
            }
        }
    },
    "required": ["state", "state_mode", "questions"]
}

def normalize_compiled_questions(raw_questions: dict[str, Any]) -> dict[str, Any]:
    """
    Normalizes the compiler model's raw question output into the exact
    format required by OpenRouter's POST /api/alpha/decisions endpoint.
    """
    normalized = {}
    for q_id, q_data in raw_questions.items():
        q_type = q_data.get("type", "choice")
        instructions = q_data.get("instructions", "Evaluate options.")
        criteria = None

        if q_type == "choice":
            criteria = q_data.get("choice_criteria") or q_data.get("criteria", {})
            if isinstance(criteria, list):
                # Fallback if model gave list for choice
                criteria = {f"option_{i+1}": item for i, item in enumerate(criteria)}
        elif q_type == "noul":
            criteria = q_data.get("noul_criteria") or q_data.get("criteria", {
                "true": "Affirmative evaluation holds under the stated constraints.",
                "false": "Negative evaluation holds under the stated constraints."
            })
        elif q_type == "score":
            criteria = q_data.get("score_criteria") or q_data.get("criteria", [])
            if isinstance(criteria, dict):
                # Convert dict to ordered list
                criteria = [v for _, v in sorted(criteria.items(), key=lambda x: str(x[0]))]

        normalized[q_id] = {
            "type": q_type,
            "instructions": instructions,
            "criteria": criteria
        }
    return normalized

async def compile_prompt(
    prompt: str,
    model: str | None = None,
    api_key_override: str | None = None
) -> CompileResponse:
    """
    Executes Stage 1: Compiles a conversational user prompt into a structured decision schema.
    """
    api_key = api_key_override or await get_active_api_key()
    if not api_key:
        raise ValueError("OpenRouter API key is not configured. Please add your key in Settings.")

    selected_model = model or "openrouter/free"
    headers = get_headers(api_key)

    request_payload = {
        "model": selected_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "decision_schema",
                "strict": True,
                "schema": JSON_SCHEMA
            }
        },
        "temperature": 0.1
    }

    start_time = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(OPENROUTER_CHAT_URL, headers=headers, json=request_payload)

    latency_ms = int((time.perf_counter() - start_time) * 1000)

    if resp.status_code != 200:
        raise RuntimeError(f"Stage 1 compiler ({selected_model}) failed ({resp.status_code}): {resp.text}")

    resp_json = resp.json()
    usage = resp_json.get("usage", {})
    tokens_in = usage.get("prompt_tokens", 0)
    tokens_out = usage.get("completion_tokens", 0)
    # OpenRouter sometimes returns native cost, or 0.0 for free models
    cost_usd = float(usage.get("cost", 0.0))

    choice_msg = resp_json.get("choices", [{}])[0].get("message", {})
    content_raw = choice_msg.get("content", "{}")

    # Strip markdown code blocks if returned
    cleaned_content = content_raw.strip()
    if cleaned_content.startswith("```json"):
        cleaned_content = cleaned_content[7:]
    elif cleaned_content.startswith("```"):
        cleaned_content = cleaned_content[3:]
    if cleaned_content.endswith("```"):
        cleaned_content = cleaned_content[:-3]
    cleaned_content = cleaned_content.strip()

    try:
        parsed_data = json.loads(cleaned_content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Stage 1 compiler output could not be parsed as JSON: {cleaned_content[:200]}") from e

    state = parsed_data.get("state", prompt)
    state_mode = parsed_data.get("state_mode", "text")
    raw_questions = parsed_data.get("questions", {})
    normalized_questions = normalize_compiled_questions(raw_questions)

    compiled_schema = CompiledSchema(
        state=state,
        state_mode=state_mode,
        questions=normalized_questions
    )

    telemetry = Stage1Telemetry(
        model=selected_model,
        latency_ms=latency_ms,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=cost_usd,
        bypassed=False
    )

    return CompileResponse(compiled=compiled_schema, telemetry=telemetry)
