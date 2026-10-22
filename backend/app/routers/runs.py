import json
from typing import Literal
from fastapi import APIRouter, HTTPException, Query, Response
from app.database import get_db
from app.models.runs import RunSummary, RunDetail, RunsListResponse

router = APIRouter(prefix="/api/runs", tags=["runs"])

def row_to_run_summary(row) -> RunSummary:
    return RunSummary(
        id=row["id"],
        parent_run_id=row["parent_run_id"],
        scenario_id=row["scenario_id"],
        mode=row["mode"],
        raw_user_prompt=row["raw_user_prompt"],
        decision_model_requested=row["decision_model_requested"],
        decision_model_served=row["decision_model_served"],
        status=row["status"],
        decision_latency_ms=row["decision_latency_ms"] or 0,
        decision_cost_usd=row["decision_cost_usd"] or 0.0,
        created_at=str(row["created_at"])
    )

def row_to_run_detail(row) -> RunDetail:
    state = row["state_payload"]
    try:
        state = json.loads(row["state_payload"])
    except Exception:
        pass

    questions = {}
    try:
        questions = json.loads(row["questions_payload"])
    except Exception:
        pass

    answers = {}
    try:
        answers = json.loads(row["answers_payload"])
    except Exception:
        pass

    metrics = None
    if row["metrics_payload"]:
        try:
            metrics = json.loads(row["metrics_payload"])
        except Exception:
            pass

    return RunDetail(
        id=row["id"],
        parent_run_id=row["parent_run_id"],
        scenario_id=row["scenario_id"],
        mode=row["mode"],
        raw_user_prompt=row["raw_user_prompt"],
        decision_model_requested=row["decision_model_requested"],
        decision_model_served=row["decision_model_served"],
        status=row["status"],
        decision_latency_ms=row["decision_latency_ms"] or 0,
        decision_cost_usd=row["decision_cost_usd"] or 0.0,
        created_at=str(row["created_at"]),
        parser_model=row["parser_model"],
        parser_latency_ms=row["parser_latency_ms"] or 0,
        parser_tokens_in=row["parser_tokens_in"] or 0,
        parser_tokens_out=row["parser_tokens_out"] or 0,
        parser_cost_usd=row["parser_cost_usd"] or 0.0,
        openrouter_gen_id=row["openrouter_gen_id"],
        state_payload=state,
        questions_payload=questions,
        answers_payload=answers,
        metrics_payload=metrics,
        decision_input_tokens=row["decision_input_tokens"] or 0,
        decision_output_tokens=row["decision_output_tokens"] or 0,
        error_message=row["error_message"]
    )

@router.get("", response_model=RunsListResponse)
async def list_runs(
    mode: str | None = Query(None),
    model: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """List historical decision runs with optional filtering and pagination."""
    where_clauses = []
    params = []

    if mode:
        where_clauses.append("mode = ?")
        params.append(mode)
    if model:
        where_clauses.append("decision_model_requested = ?")
        params.append(model)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    count_sql = f"SELECT COUNT(*) FROM runs {where_sql};"
    select_sql = f"""
        SELECT id, parent_run_id, scenario_id, mode, raw_user_prompt,
               decision_model_requested, decision_model_served, status,
               decision_latency_ms, decision_cost_usd, created_at
        FROM runs {where_sql}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
    """

    async with get_db() as db:
        async with db.execute(count_sql, params) as cursor:
            total_row = await cursor.fetchone()
            total = total_row[0] if total_row else 0

        async with db.execute(select_sql, params + [limit, offset]) as cursor:
            rows = await cursor.fetchall()

    items = [row_to_run_summary(r) for r in rows]
    return RunsListResponse(items=items, total=total, limit=limit, offset=offset)

@router.get("/{run_id}", response_model=RunDetail)
async def get_run(run_id: str):
    """Retrieve full detail for a decision run."""
    async with get_db() as db:
        async with db.execute("SELECT * FROM runs WHERE id = ?;", (run_id,)) as cursor:
            row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Run not found.")
    return row_to_run_detail(row)

@router.delete("/{run_id}")
async def delete_run(run_id: str):
    """Delete a decision run from history."""
    async with get_db() as db:
        async with db.execute("SELECT id FROM runs WHERE id = ?;", (run_id,)) as cursor:
            row = await cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Run not found.")

        await db.execute("DELETE FROM runs WHERE id = ?;", (run_id,))
        await db.commit()

    return {"deleted": True, "id": run_id}

@router.get("/{run_id}/export")
async def export_run(run_id: str, format: Literal["json", "markdown"] = Query("json")):
    """Export a run as formatted JSON or a structured Markdown report."""
    detail = await get_run(run_id)

    if format == "json":
        return detail.model_dump()

    # Generate clean Markdown export
    lines = [
        f"# DecisionBench Run Report: {detail.id}",
        f"**Date**: {detail.created_at} | **Mode**: `{detail.mode}`",
        f"**Decision Model**: `{detail.decision_model_requested}` (Served: `{detail.decision_model_served}`)",
        f"**Decision Latency**: `{detail.decision_latency_ms} ms` | **Cost**: `${detail.decision_cost_usd:.6f}`",
        "",
        "## Evaluated State",
        "```",
        str(detail.state_payload),
        "```",
        "",
        "## Results & Probabilities"
    ]

    for q_key, ans in detail.answers_payload.items():
        q_type = ans.get("type", "unknown")
        lines.append(f"### Question: `{q_key}` ({q_type})")
        if q_type == "noul":
            prob = ans.get("noul", 0.0)
            lines.append(f"- **P(yes)**: `{prob:.4f}`")
        elif q_type == "choice":
            lines.append(f"- **Winning Choice**: `{ans.get('choice')}` (Confidence: `{ans.get('confidence', 0.0):.2%}`)")
            lines.append("- **Probability Distribution**:")
            for opt, p in ans.get("probabilities", {}).items():
                lines.append(f"  - `{opt}`: `{p:.4f}` ({p * 100:.1f}%)")
        elif q_type == "score":
            lines.append(f"- **Expected Score**: `{ans.get('score', 0.0):.2f}`")
            lines.append("- **Level Probabilities**:")
            for lvl, p in ans.get("probabilities", {}).items():
                legend_desc = ans.get("legend", {}).get(lvl, "")
                lines.append(f"  - Level {lvl} ({legend_desc}): `{p:.4f}`")
        lines.append("")

    content = "\n".join(lines)
    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={detail.id}.md"}
    )
