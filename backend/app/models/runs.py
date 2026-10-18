from pydantic import BaseModel, Field
from typing import Any

class RunSummary(BaseModel):
    id: str
    parent_run_id: str | None = None
    scenario_id: str | None = None
    mode: str
    raw_user_prompt: str | None = None
    decision_model_requested: str
    decision_model_served: str | None = None
    status: str
    decision_latency_ms: int = 0
    decision_cost_usd: float = 0.0
    created_at: str

class RunDetail(RunSummary):
    parser_model: str | None = None
    parser_latency_ms: int = 0
    parser_tokens_in: int = 0
    parser_tokens_out: int = 0
    parser_cost_usd: float = 0.0
    openrouter_gen_id: str | None = None
    state_payload: Any
    questions_payload: dict[str, Any]
    answers_payload: dict[str, Any]
    metrics_payload: dict[str, Any] | None = None
    decision_input_tokens: int = 0
    decision_output_tokens: int = 0
    error_message: str | None = None

class RunsListResponse(BaseModel):
    items: list[RunSummary]
    total: int
    limit: int
    offset: int
