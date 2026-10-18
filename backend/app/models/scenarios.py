from pydantic import BaseModel, Field
from typing import Any, Literal

class ScenarioBase(BaseModel):
    name: str
    description: str | None = None
    category: str = "General"
    raw_prompt: str | None = None
    state_mode: Literal["text", "json"] = "text"
    state_content: str = ""
    questions: dict[str, Any] = Field(default_factory=dict)
    thresholds: dict[str, float] | None = None

class ScenarioCreate(ScenarioBase):
    pass

class ScenarioUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    raw_prompt: str | None = None
    state_mode: Literal["text", "json"] | None = None
    state_content: str | None = None
    questions: dict[str, Any] | None = None
    thresholds: dict[str, float] | None = None

class ScenarioResponse(ScenarioBase):
    id: str
    is_builtin: bool = False
    created_at: str
    updated_at: str
