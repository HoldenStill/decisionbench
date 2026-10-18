from pydantic import BaseModel, Field
from typing import Any

class ThresholdSettings(BaseModel):
    reject: float = Field(default=0.35, ge=0.0, le=1.0)
    commit: float = Field(default=0.75, ge=0.0, le=1.0)

class SettingsResponse(BaseModel):
    is_configured: bool
    masked_key: str
    has_env_key: bool
    default_stage1_model: str
    default_stage2_model: str
    pinned_models: list[str]
    thresholds: ThresholdSettings
    updated_at: str | None = None

class SettingsUpdateRequest(BaseModel):
    openrouter_api_key: str | None = None
    default_stage1_model: str | None = None
    default_stage2_model: str | None = None
    pinned_models: list[str] | None = None
    thresholds: ThresholdSettings | None = None

class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    models_available: int = 0

class ModelItem(BaseModel):
    id: str
    name: str
    description: str | None = None
    stage: str  # "stage1" (compiler) or "stage2" (decision model)
    provider: str
    tags: list[str] = Field(default_factory=list)
    input_cost_per_m: float | None = None
    output_cost_per_m: float | None = None
    is_free: bool = False
    is_default: bool = False

class ModelsListResponse(BaseModel):
    stage1_models: list[ModelItem]
    stage2_models: list[ModelItem]
