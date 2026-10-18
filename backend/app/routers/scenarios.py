import json
import uuid
from fastapi import APIRouter, HTTPException, Query
from app.database import get_db
from app.models.scenarios import (
    ScenarioResponse,
    ScenarioCreate,
    ScenarioUpdate
)

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])

def row_to_scenario(row) -> ScenarioResponse:
    thresholds = None
    if row["thresholds_json"]:
        try:
            thresholds = json.loads(row["thresholds_json"])
        except Exception:
            pass

    questions = {}
    if row["questions_json"]:
        try:
            questions = json.loads(row["questions_json"])
        except Exception:
            pass

    return ScenarioResponse(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        category=row["category"] or "General",
        raw_prompt=row["raw_prompt"],
        state_mode=row["state_mode"] or "text",
        state_content=row["state_content"] or "",
        questions=questions,
        thresholds=thresholds,
        is_builtin=bool(row["is_builtin"]),
        created_at=str(row["created_at"]),
        updated_at=str(row["updated_at"])
    )

@router.get("", response_model=list[ScenarioResponse])
async def list_scenarios(category: str | None = Query(None)):
    """List saved scenarios, optionally filtered by category."""
    query = "SELECT * FROM scenarios"
    params = []
    if category:
        query += " WHERE category = ?"
        params.append(category)
    query += " ORDER BY is_builtin DESC, name ASC;"

    async with get_db() as db:
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()

    return [row_to_scenario(r) for r in rows]

@router.get("/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario(scenario_id: str):
    """Retrieve single scenario by ID."""
    async with get_db() as db:
        async with db.execute("SELECT * FROM scenarios WHERE id = ?;", (scenario_id,)) as cursor:
            row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Scenario not found.")
    return row_to_scenario(row)

@router.post("", response_model=ScenarioResponse)
async def create_scenario(payload: ScenarioCreate):
    """Create a new custom scenario template."""
    scenario_id = f"scenario-{uuid.uuid4().hex[:12]}"
    q_json = json.dumps(payload.questions)
    t_json = json.dumps(payload.thresholds) if payload.thresholds else None

    async with get_db() as db:
        await db.execute("""
            INSERT INTO scenarios (
                id, name, description, category, raw_prompt,
                state_mode, state_content, questions_json, thresholds_json, is_builtin
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0);
        """, (
            scenario_id,
            payload.name,
            payload.description,
            payload.category,
            payload.raw_prompt,
            payload.state_mode,
            payload.state_content,
            q_json,
            t_json
        ))
        await db.commit()

    return await get_scenario(scenario_id)

@router.put("/{scenario_id}", response_model=ScenarioResponse)
async def update_scenario(scenario_id: str, payload: ScenarioUpdate):
    """Update an existing scenario."""
    async with get_db() as db:
        async with db.execute("SELECT * FROM scenarios WHERE id = ?;", (scenario_id,)) as cursor:
            row = await cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Scenario not found.")

        name = payload.name if payload.name is not None else row["name"]
        description = payload.description if payload.description is not None else row["description"]
        category = payload.category if payload.category is not None else row["category"]
        raw_prompt = payload.raw_prompt if payload.raw_prompt is not None else row["raw_prompt"]
        state_mode = payload.state_mode if payload.state_mode is not None else row["state_mode"]
        state_content = payload.state_content if payload.state_content is not None else row["state_content"]

        q_json = json.dumps(payload.questions) if payload.questions is not None else row["questions_json"]
        t_json = json.dumps(payload.thresholds) if payload.thresholds is not None else row["thresholds_json"]

        await db.execute("""
            UPDATE scenarios SET
                name = ?, description = ?, category = ?, raw_prompt = ?,
                state_mode = ?, state_content = ?, questions_json = ?, thresholds_json = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
        """, (name, description, category, raw_prompt, state_mode, state_content, q_json, t_json, scenario_id))
        await db.commit()

    return await get_scenario(scenario_id)

@router.delete("/{scenario_id}")
async def delete_scenario(scenario_id: str):
    """Delete a scenario."""
    async with get_db() as db:
        async with db.execute("SELECT is_builtin FROM scenarios WHERE id = ?;", (scenario_id,)) as cursor:
            row = await cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Scenario not found.")

        await db.execute("DELETE FROM scenarios WHERE id = ?;", (scenario_id,))
        await db.commit()

    return {"deleted": True, "id": scenario_id}
