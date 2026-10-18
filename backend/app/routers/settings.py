import json
from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.crypto import encrypt_api_key, decrypt_api_key, mask_api_key
from app.config import OPENROUTER_API_KEY_ENV
from app.models.settings import (
    SettingsResponse,
    SettingsUpdateRequest,
    TestConnectionResponse,
    ThresholdSettings
)
from app.services.openrouter import test_api_key, get_active_api_key

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=SettingsResponse)
async def get_settings():
    """Retrieve application settings with masked OpenRouter API key."""
    async with get_db() as db:
        async with db.execute("""
            SELECT encrypted_openrouter_key, default_stage1_model, default_stage2_model,
                   pinned_models_json, thresholds_json, updated_at
            FROM settings WHERE id = 1;
        """) as cursor:
            row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=500, detail="Settings table uninitialized.")

    raw_key = ""
    if row["encrypted_openrouter_key"]:
        raw_key = decrypt_api_key(row["encrypted_openrouter_key"])
    elif OPENROUTER_API_KEY_ENV:
        raw_key = OPENROUTER_API_KEY_ENV

    masked = mask_api_key(raw_key)
    is_configured = bool(raw_key)
    has_env = bool(OPENROUTER_API_KEY_ENV)

    pinned_models = []
    if row["pinned_models_json"]:
        try:
            pinned_models = json.loads(row["pinned_models_json"])
        except Exception:
            pass

    thresholds_dict = {"reject": 0.35, "commit": 0.75}
    if row["thresholds_json"]:
        try:
            thresholds_dict = json.loads(row["thresholds_json"])
        except Exception:
            pass

    return SettingsResponse(
        is_configured=is_configured,
        masked_key=masked,
        has_env_key=has_env,
        default_stage1_model=row["default_stage1_model"] or "openrouter/free",
        default_stage2_model=row["default_stage2_model"] or "typesafe/jev-latest",
        pinned_models=pinned_models,
        thresholds=ThresholdSettings(**thresholds_dict),
        updated_at=str(row["updated_at"]) if row["updated_at"] else None
    )

@router.post("", response_model=SettingsResponse)
async def update_settings(payload: SettingsUpdateRequest):
    """
    Update settings. If openrouter_api_key is provided, it is encrypted at rest using Fernet.
    """
    async with get_db() as db:
        # Fetch current record
        async with db.execute("SELECT * FROM settings WHERE id = 1;") as cursor:
            current = await cursor.fetchone()

        new_encrypted_key = current["encrypted_openrouter_key"]
        if payload.openrouter_api_key is not None:
            if payload.openrouter_api_key.strip():
                new_encrypted_key = encrypt_api_key(payload.openrouter_api_key.strip())
            else:
                new_encrypted_key = ""

        new_stage1 = payload.default_stage1_model or current["default_stage1_model"]
        new_stage2 = payload.default_stage2_model or current["default_stage2_model"]

        new_pinned = current["pinned_models_json"]
        if payload.pinned_models is not None:
            new_pinned = json.dumps(payload.pinned_models)

        new_thresholds = current["thresholds_json"]
        if payload.thresholds is not None:
            new_thresholds = json.dumps(payload.thresholds.model_dump())

        await db.execute("""
            UPDATE settings
            SET encrypted_openrouter_key = ?,
                default_stage1_model = ?,
                default_stage2_model = ?,
                pinned_models_json = ?,
                thresholds_json = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1;
        """, (new_encrypted_key, new_stage1, new_stage2, new_pinned, new_thresholds))
        await db.commit()

    return await get_settings()

@router.post("/test-connection", response_model=TestConnectionResponse)
async def test_connection(payload: dict | None = None):
    """
    Test connectivity to OpenRouter using either the active key or an explicit key passed in payload.
    """
    key_to_test = payload.get("openrouter_api_key") if payload else None
    if not key_to_test:
        key_to_test = await get_active_api_key()

    success, message, count = await test_api_key(key_to_test)
    return TestConnectionResponse(
        success=success,
        message=message,
        models_available=count
    )
