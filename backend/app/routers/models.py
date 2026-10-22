import json
from fastapi import APIRouter
from app.models.settings import ModelItem, ModelsListResponse
from app.database import get_db

router = APIRouter(prefix="/api/models", tags=["models"])

DEFAULT_STAGE1_MODELS = [
    ModelItem(
        id="openrouter/free",
        name="OpenRouter Free Router",
        description="Auto-routes to free models supporting structured outputs.",
        stage="stage1",
        provider="OpenRouter",
        tags=["Free", "Recommended", "Default"],
        input_cost_per_m=0.0,
        output_cost_per_m=0.0,
        is_free=True,
        is_default=True
    ),
    ModelItem(
        id="inclusionai/ling-3.0-flash",
        name="Ling 3.0 Flash",
        description="Ultra-low cost, sub-second latency structured extractor.",
        stage="stage1",
        provider="InclusionAI",
        tags=["Flash", "Ultra-Low Cost"],
        input_cost_per_m=0.06,
        output_cost_per_m=0.15,
        is_free=False,
        is_default=False
    ),
    ModelItem(
        id="openai/gpt-6-luna",
        name="GPT-6 Luna",
        description="High-speed extraction model optimized for structured JSON schemas.",
        stage="stage1",
        provider="OpenAI",
        tags=["Fast", "Precision"],
        input_cost_per_m=0.30,
        output_cost_per_m=1.20,
        is_free=False,
        is_default=False
    ),
    ModelItem(
        id="xiaomi/mimo-v2.6-flash",
        name="MiMo v2.6 Flash",
        description="Fast multilingual parser model.",
        stage="stage1",
        provider="Xiaomi",
        tags=["Flash"],
        input_cost_per_m=0.10,
        output_cost_per_m=0.30,
        is_free=False,
        is_default=False
    ),
    ModelItem(
        id="deepseek/deepseek-v4.1-flash",
        name="DeepSeek v4.1 Flash",
        description="High throughput reasoning-informed parser.",
        stage="stage1",
        provider="DeepSeek",
        tags=["Flash", "Reasoning"],
        input_cost_per_m=0.14,
        output_cost_per_m=0.28,
        is_free=False,
        is_default=False
    ),
]

DEFAULT_STAGE2_MODELS = [
    ModelItem(
        id="typesafe/jev-router",
        name="Jev Router (Latest)",
        description="TypeSafe flagship System One structured decision router (auto-optimizes quality, speed, and cost).",
        stage="stage2",
        provider="TypeSafe",
        tags=["Flagship", "System One", "Recommended", "Default"],
        input_cost_per_m=0.50,
        output_cost_per_m=1.50,
        is_free=False,
        is_default=True
    ),
    ModelItem(
        id="typesafe/jev-1.14",
        name="Jev 1.14",
        description="TypeSafe stable pinned version 1.14 with calibrated uncertainty.",
        stage="stage2",
        provider="TypeSafe",
        tags=["Stable", "Calibrated"],
        input_cost_per_m=0.50,
        output_cost_per_m=1.50,
        is_free=False,
        is_default=False
    ),
    ModelItem(
        id="typesafe/jev-1.13",
        name="Jev 1.13",
        description="TypeSafe previous stable release for benchmark regression testing.",
        stage="stage2",
        provider="TypeSafe",
        tags=["Legacy Stable"],
        input_cost_per_m=0.40,
        output_cost_per_m=1.20,
        is_free=False,
        is_default=False
    ),
    ModelItem(
        id="openai/gpt-6-luna-decisions",
        name="GPT-6 Luna Decisions",
        description="OpenAI's dedicated System One alpha decision model.",
        stage="stage2",
        provider="OpenAI",
        tags=["System One", "Fast"],
        input_cost_per_m=0.60,
        output_cost_per_m=1.80,
        is_free=False,
        is_default=False
    ),
    ModelItem(
        id="~perplexity/pplx-decider-latest",
        name="Pplx Decider Latest",
        description="Perplexity decision engine integrating retrieval-calibrated probabilities.",
        stage="stage2",
        provider="Perplexity",
        tags=["System One", "Retrieval-Grounded"],
        input_cost_per_m=0.80,
        output_cost_per_m=2.00,
        is_free=False,
        is_default=False
    ),
    ModelItem(
        id="microsoft/microsoft-decision-1",
        name="Microsoft Decision-1",
        description="Enterprise decision model with strict confidence bounds.",
        stage="stage2",
        provider="Microsoft",
        tags=["Enterprise"],
        input_cost_per_m=0.75,
        output_cost_per_m=2.25,
        is_free=False,
        is_default=False
    ),
    ModelItem(
        id="inception/mercury-decide:free",
        name="Mercury Decide (Free)",
        description="Inception's free-tier System One probabilistic decider.",
        stage="stage2",
        provider="Inception",
        tags=["Free", "Experimental"],
        input_cost_per_m=0.0,
        output_cost_per_m=0.0,
        is_free=True,
        is_default=False
    ),
]

@router.get("", response_model=ModelsListResponse)
async def list_models():
    """
    Returns curated lists of Stage-1 compiler models and Stage-2 System One decision models,
    annotated with user-defined defaults from the settings table.
    """
    async with get_db() as db:
        async with db.execute("SELECT default_stage1_model, default_stage2_model, pinned_models_json FROM settings WHERE id = 1;") as cursor:
            row = await cursor.fetchone()

    default_s1 = row["default_stage1_model"] if row else "openrouter/free"
    default_s2 = row["default_stage2_model"] if row else "typesafe/jev-router"

    stage1 = []
    for m in DEFAULT_STAGE1_MODELS:
        item = m.model_copy()
        item.is_default = (m.id == default_s1)
        stage1.append(item)

    stage2 = []
    for m in DEFAULT_STAGE2_MODELS:
        item = m.model_copy()
        item.is_default = (m.id == default_s2)
        stage2.append(item)

    # Check for custom pinned models
    if row and row["pinned_models_json"]:
        try:
            custom_slugs = json.loads(row["pinned_models_json"])
            for slug in custom_slugs:
                if not any(x.id == slug for x in stage1) and not any(x.id == slug for x in stage2):
                    # Add as custom stage 2 model by default
                    stage2.append(ModelItem(
                        id=slug,
                        name=slug,
                        description="Custom user-configured model slug.",
                        stage="stage2",
                        provider="Custom",
                        tags=["Custom"],
                        input_cost_per_m=None,
                        output_cost_per_m=None,
                        is_free=False,
                        is_default=(slug == default_s2)
                    ))
        except Exception:
            pass

    return ModelsListResponse(stage1_models=stage1, stage2_models=stage2)
