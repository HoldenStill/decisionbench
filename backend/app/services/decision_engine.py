import math
import time
import uuid
import json
import asyncio
import httpx
from typing import Any
from app.config import OPENROUTER_DECISIONS_URL
from app.database import get_db
from app.models.decisions import (
    ExecuteRequest,
    ExecuteResponse,
    Stage1Telemetry,
    Stage2Telemetry,
    QuestionMetrics,
    CompiledSchema
)
from app.services.openrouter import get_active_api_key, get_headers
from app.services.compiler import compile_prompt

def calculate_shannon_entropy(probs: list[float]) -> tuple[float, float, float]:
    """
    Calculates Shannon Entropy (H), Normalized Entropy (H_norm in [0, 1]), and Certainty (1 - H_norm).
    """
    valid_probs = [p for p in probs if p > 0.0]
    k = len(probs)
    if k <= 1 or not valid_probs:
        return 0.0, 0.0, 1.0

    h = -sum(p * math.log2(p) for p in valid_probs)
    max_h = math.log2(k)
    h_norm = min(1.0, max(0.0, h / max_h)) if max_h > 0 else 0.0
    certainty = 1.0 - h_norm
    return round(h, 4), round(h_norm, 4), round(certainty, 4)

def compute_question_metrics(
    q_key: str,
    q_data: dict[str, Any],
    answer_data: dict[str, Any],
    thresholds: dict[str, float],
    parent_answers: dict[str, Any] | None = None
) -> QuestionMetrics:
    """
    Computes derived math metrics for a single question response:
    Shannon entropy, certainty, Top-2 margin, verdict, and deltas against parent run.
    """
    q_type = answer_data.get("type") or q_data.get("type", "choice")
    reject_threshold = thresholds.get("reject", 0.35)
    commit_threshold = thresholds.get("commit", 0.75)

    entropy = 0.0
    norm_entropy = 0.0
    certainty = 0.0
    top2_margin = None
    verdict = None
    deltas: dict[str, float] | None = None

    if q_type == "noul":
        prob_yes = float(answer_data.get("noul", 0.5))
        prob_no = 1.0 - prob_yes
        entropy, norm_entropy, certainty = calculate_shannon_entropy([prob_yes, prob_no])

        # Distance from 0.5 encodes certainty directly for binary
        certainty = round(abs(prob_yes - 0.5) * 2.0, 4)

        if prob_yes >= commit_threshold:
            verdict = "COMMIT"
        elif prob_yes <= reject_threshold:
            verdict = "REJECT"
        else:
            verdict = "REVIEW"

        if parent_answers and q_key in parent_answers:
            parent_ans = parent_answers[q_key]
            if parent_ans.get("type") == "noul":
                old_p = float(parent_ans.get("noul", 0.0))
                deltas = {"noul": round(prob_yes - old_p, 4)}

    elif q_type == "choice":
        probs_dict = answer_data.get("probabilities", {})
        probs_list = list(probs_dict.values())
        entropy, norm_entropy, certainty = calculate_shannon_entropy(probs_list)

        # Top-2 Margin Delta P = P_1 - P_2
        sorted_probs = sorted(probs_list, reverse=True)
        if len(sorted_probs) >= 2:
            top2_margin = round(sorted_probs[0] - sorted_probs[1], 4)
        elif len(sorted_probs) == 1:
            top2_margin = round(sorted_probs[0], 4)

        verdict = answer_data.get("choice")

        if parent_answers and q_key in parent_answers:
            parent_ans = parent_answers[q_key]
            parent_probs = parent_ans.get("probabilities", {})
            deltas = {}
            for opt_key, new_p in probs_dict.items():
                old_p = parent_probs.get(opt_key, 0.0)
                deltas[opt_key] = round(new_p - old_p, 4)

    elif q_type == "score":
        probs_dict = answer_data.get("probabilities", {})
        probs_list = list(probs_dict.values())
        entropy, norm_entropy, certainty = calculate_shannon_entropy(probs_list)

        expected_val = float(answer_data.get("score", 0.0))
        verdict = f"{expected_val:.2f}"

        if parent_answers and q_key in parent_answers:
            parent_ans = parent_answers[q_key]
            if parent_ans.get("type") == "score":
                old_score = float(parent_ans.get("score", 0.0))
                deltas = {"score": round(expected_val - old_score, 4)}

    return QuestionMetrics(
        entropy=entropy,
        normalized_entropy=norm_entropy,
        certainty=certainty,
        top2_margin=top2_margin,
        verdict=verdict,
        deltas=deltas
    )

DECISION_MODEL_ALIASES: dict[str, str] = {
    "typesafe/jev-latest": "typesafe/jev-router",
    "typesafe/jev": "typesafe/jev-router",
    "jev-latest": "typesafe/jev-router",
    "jev-router": "typesafe/jev-router",
    "typesafe/jev-latest-decisions": "typesafe/jev-router",
}

async def call_openrouter_decisions(
    model: str,
    state: Any,
    questions: dict[str, Any],
    api_key: str
) -> tuple[dict[str, Any], Stage2Telemetry]:
    """
    Calls OpenRouter's System One Decisions API (POST /api/alpha/decisions).
    Returns (raw_response_dict, stage2_telemetry).
    """
    headers = get_headers(api_key)
    resolved_model = DECISION_MODEL_ALIASES.get(model, model)
    payload = {
        "model": resolved_model,
        "state": state,
        "questions": questions
    }

    start_time = time.perf_counter()
    async with httpx.AsyncClient(timeout=45.0) as client:
        resp = await client.post(OPENROUTER_DECISIONS_URL, headers=headers, json=payload)

    latency_ms = int((time.perf_counter() - start_time) * 1000)

    if resp.status_code != 200:
        raise RuntimeError(f"OpenRouter Decisions API ({model}) failed ({resp.status_code}): {resp.text}")

    resp_json = resp.json()
    gen_id = resp_json.get("id", f"gen-{uuid.uuid4().hex[:12]}")
    model_served = resp_json.get("model", model)
    usage = resp_json.get("usage", {})
    tokens_in = usage.get("input_tokens", usage.get("prompt_tokens", 0))
    tokens_out = usage.get("output_tokens", usage.get("completion_tokens", 0))
    cost_usd = float(usage.get("cost", 0.0))

    cost_per_1k = round(cost_usd * 1000.0, 4)
    cost_per_1m = round(cost_usd * 1000000.0, 2)

    telemetry = Stage2Telemetry(
        model_requested=model,
        model_served=model_served,
        gen_id=gen_id,
        latency_ms=latency_ms,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=cost_usd,
        cost_per_1k=cost_per_1k,
        cost_per_1m=cost_per_1m
    )

    return resp_json, telemetry

async def execute_decision_pipeline(request: ExecuteRequest) -> ExecuteResponse:
    """
    Unified execution pipeline supporting:
    - Full Auto-Compile + Stage 2 Run
    - Direct Stage 2 Execution (Workbench or Card Live Tweak)
    - Consistency Sweep (3x)
    - Side-by-Side Model Comparison
    """
    api_key = await get_active_api_key()
    if not api_key:
        raise ValueError("OpenRouter API key is not configured. Please add your key in Settings.")

    run_id = f"run-{uuid.uuid4().hex[:12]}"
    mode = request.mode
    raw_prompt = request.raw_prompt
    state = request.state
    state_mode = request.state_mode
    questions = request.questions
    thresholds = request.thresholds or {"reject": 0.35, "commit": 0.75}

    stage1_telemetry = Stage1Telemetry(model="bypassed", bypassed=True)

    # 1. Run Stage 1 compiler if in auto_compile mode and prompt is provided
    if mode == "auto_compile" and raw_prompt and (not questions or len(questions) == 0):
        compile_res = await compile_prompt(
            prompt=raw_prompt,
            model=request.parser_model,
            api_key_override=api_key
        )
        state = compile_res.compiled.state
        state_mode = compile_res.compiled.state_mode
        questions = compile_res.compiled.questions
        stage1_telemetry = compile_res.telemetry

    # Retrieve parent answers if parent_run_id is supplied for delta calculations
    parent_answers = None
    if request.parent_run_id:
        async with get_db() as db:
            async with db.execute("SELECT answers_payload FROM runs WHERE id = ?;", (request.parent_run_id,)) as cursor:
                p_row = await cursor.fetchone()
                if p_row and p_row["answers_payload"]:
                    try:
                        parent_answers = json.loads(p_row["answers_payload"])
                    except Exception:
                        pass

    # 2. Execute Stage 2 System One Decisions
    comparison_result = None
    sweep_results = None

    if mode == "comparison" and request.comparison_model:
        # Side-by-side model comparison
        task_primary = call_openrouter_decisions(request.decision_model, state, questions, api_key)
        task_compare = call_openrouter_decisions(request.comparison_model, state, questions, api_key)

        (primary_resp, stage2_telemetry), (compare_resp, compare_telemetry) = await asyncio.gather(
            task_primary, task_compare
        )

        primary_answers = primary_resp.get("answers", {})
        compare_answers = compare_resp.get("answers", {})

        # Compute metrics for comparison model
        compare_metrics = {}
        for q_key, q_data in questions.items():
            ans_data = compare_answers.get(q_key, {})
            compare_metrics[q_key] = compute_question_metrics(q_key, q_data, ans_data, thresholds)

        comparison_result = {
            "model_requested": request.comparison_model,
            "model_served": compare_telemetry.model_served,
            "answers": compare_answers,
            "metrics": {k: v.model_dump() for k, v in compare_metrics.items()},
            "telemetry": compare_telemetry.model_dump()
        }
        answers = primary_answers

    elif mode == "sweep":
        # 3x consistency sweep
        sweep_runs = []
        for i in range(3):
            resp, telem = await call_openrouter_decisions(request.decision_model, state, questions, api_key)
            sweep_runs.append({
                "iteration": i + 1,
                "answers": resp.get("answers", {}),
                "latency_ms": telem.latency_ms,
                "tokens": telem.tokens_in + telem.tokens_out
            })
            if i == 0:
                answers = resp.get("answers", {})
                stage2_telemetry = telem

        sweep_results = sweep_runs

    else:
        # Standard execution or tweaked re-run
        resp_json, stage2_telemetry = await call_openrouter_decisions(
            request.decision_model, state, questions, api_key
        )
        answers = resp_json.get("answers", {})

    # Compute derived metrics for primary run
    metrics: dict[str, QuestionMetrics] = {}
    for q_key, q_data in questions.items():
        ans_data = answers.get(q_key, {})
        metrics[q_key] = compute_question_metrics(
            q_key=q_key,
            q_data=q_data,
            answer_data=ans_data,
            thresholds=thresholds,
            parent_answers=parent_answers
        )

    created_at = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())

    # 3. Persist run to SQLite runs table
    async with get_db() as db:
        await db.execute("""
            INSERT INTO runs (
                id, parent_run_id, scenario_id, mode, raw_user_prompt,
                parser_model, parser_latency_ms, parser_tokens_in, parser_tokens_out, parser_cost_usd,
                openrouter_gen_id, decision_model_requested, decision_model_served,
                state_payload, questions_payload, answers_payload, metrics_payload,
                decision_input_tokens, decision_output_tokens, decision_cost_usd,
                decision_latency_ms, status, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', NULL);
        """, (
            run_id,
            request.parent_run_id,
            request.scenario_id,
            mode,
            raw_prompt,
            stage1_telemetry.model,
            stage1_telemetry.latency_ms,
            stage1_telemetry.tokens_in,
            stage1_telemetry.tokens_out,
            stage1_telemetry.cost_usd,
            stage2_telemetry.gen_id,
            stage2_telemetry.model_requested,
            stage2_telemetry.model_served,
            json.dumps(state) if isinstance(state, (dict, list)) else str(state),
            json.dumps(questions),
            json.dumps(answers),
            json.dumps({k: v.model_dump() for k, v in metrics.items()}),
            stage2_telemetry.tokens_in,
            stage2_telemetry.tokens_out,
            stage2_telemetry.cost_usd,
            stage2_telemetry.latency_ms,
        ))
        await db.commit()

    return ExecuteResponse(
        run_id=run_id,
        mode=mode,
        raw_prompt=raw_prompt,
        state=state,
        state_mode=state_mode,
        questions=questions,
        answers=answers,
        metrics=metrics,
        stage1_telemetry=stage1_telemetry,
        stage2_telemetry=stage2_telemetry,
        comparison_result=comparison_result,
        sweep_results=sweep_results,
        created_at=created_at
    )
