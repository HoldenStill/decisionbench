from fastapi import APIRouter, HTTPException
from app.models.decisions import (
    CompileRequest,
    CompileResponse,
    ExecuteRequest,
    ExecuteResponse
)
from app.services.compiler import compile_prompt
from app.services.decision_engine import execute_decision_pipeline

router = APIRouter(prefix="/api/decisions", tags=["decisions"])

@router.post("/compile", response_model=CompileResponse)
async def compile_decision(request: CompileRequest):
    """
    Stage 1 Compiler Endpoint:
    Translates a conversational dilemma prompt into a balanced, neutral decision schema (state + questions)
    using OpenRouter chat completions with strict JSON Schema output.
    """
    try:
        response = await compile_prompt(
            prompt=request.prompt,
            model=request.model
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stage 1 compilation failed: {str(e)}")

@router.post("/execute", response_model=ExecuteResponse)
async def execute_decision(request: ExecuteRequest):
    """
    Stage 2 (or Full 2-Stage) Execution Endpoint:
    Supports:
    1. 'auto_compile': Stage 1 prompt compilation followed immediately by Stage 2 execution via Jev.
    2. 'direct': Direct Stage 2 execution of user-supplied or tweaked schema (bypassing Stage 1).
    3. 'comparison': Evaluates identical schema concurrently across decision_model and comparison_model.
    4. 'sweep': 3x consistency evaluation computing stability metrics.
    """
    try:
        response = await execute_decision_pipeline(request)
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decision execution failed: {str(e)}")
