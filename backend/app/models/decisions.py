from pydantic import BaseModel, Field
from typing import Any, Literal

# --- OpenRouter Decisions API Primitives ---

class NoulQuestion(BaseModel):
    type: Literal["noul"] = "noul"
    instructions: str
    criteria: dict[str, str] | None = None

class ChoiceQuestion(BaseModel):
    type: Literal["choice"] = "choice"
    instructions: str
    criteria: dict[str, str]  # 2 to 255 options

class ScoreQuestion(BaseModel):
    type: Literal["score"] = "score"
    instructions: str
    criteria: list[str]  # 2 to 10 ordered rubric descriptions

# --- Answers ---

class NoulAnswer(BaseModel):
    type: Literal["noul"] = "noul"
    noul: float = Field(ge=0.0, le=1.0)

class ChoiceAnswer(BaseModel):
    type: Literal["choice"] = "choice"
    choice: str
    probabilities: dict[str, float]
    confidence: float = Field(ge=0.0, le=1.0)

class ScoreAnswer(BaseModel):
    type: Literal["score"] = "score"
    score: float
    legend: dict[str, str]
    probabilities: dict[str, float]
    confidence: float = Field(ge=0.0, le=1.0)

# --- Derived Mathematical Metrics ---

class QuestionMetrics(BaseModel):
    entropy: float = 0.0
    normalized_entropy: float = 0.0
    certainty: float = 0.0
    top2_margin: float | None = None
    verdict: str | None = None
    deltas: dict[str, float] | None = None

# --- Stage 1 Compilation Schemas ---

class CompiledSchema(BaseModel):
    state: Any
    state_mode: Literal["text", "json"] = "text"
    questions: dict[str, Any]

class CompileRequest(BaseModel):
    prompt: str
    model: str | None = None

class Stage1Telemetry(BaseModel):
    model: str
    latency_ms: int = 0
    tokens_in: int = 0
    tokens_out: int = 0
    cost_usd: float = 0.0
    bypassed: bool = False

class CompileResponse(BaseModel):
    compiled: CompiledSchema
    telemetry: Stage1Telemetry

# --- Stage 2 & Full Execution Schemas ---

class Stage2Telemetry(BaseModel):
    model_requested: str
    model_served: str = ""
    gen_id: str = ""
    latency_ms: int = 0
    tokens_in: int = 0
    tokens_out: int = 0
    cost_usd: float = 0.0
    cost_per_1k: float = 0.0
    cost_per_1m: float = 0.0

class ExecuteRequest(BaseModel):
    mode: Literal["auto_compile", "direct", "sweep", "comparison"] = "auto_compile"
    raw_prompt: str | None = None
    parser_model: str | None = None
    decision_model: str = "typesafe/jev-latest"
    comparison_model: str | None = None
    state: Any = ""
    state_mode: Literal["text", "json"] = "text"
    questions: dict[str, Any] = Field(default_factory=dict)
    thresholds: dict[str, float] | None = None
    parent_run_id: str | None = None
    scenario_id: str | None = None

class ExecuteResponse(BaseModel):
    run_id: str
    mode: str
    raw_prompt: str | None = None
    state: Any
    state_mode: Literal["text", "json"] = "text"
    questions: dict[str, Any]
    answers: dict[str, Any]
    metrics: dict[str, QuestionMetrics]
    stage1_telemetry: Stage1Telemetry
    stage2_telemetry: Stage2Telemetry
    comparison_result: dict[str, Any] | None = None
    sweep_results: list[dict[str, Any]] | None = None
    created_at: str
