"""
AI router — LLM-powered investigation reasoning and report narrative.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from core.database import get_db
from models.case import Case
from services.llm.client import get_llm_client, MockLLMClient
from services.llm.prompts import build_investigation_prompt, build_report_prompt

router = APIRouter()


class InvestigateRequest(BaseModel):
    question: Optional[str] = None
    stream: bool = False
    api_key: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None


class ReasoningResponse(BaseModel):
    case_id: str
    question: Optional[str]
    reasoning: str
    hypothesis: Optional[str] = None
    confidence: Optional[str] = None
    next_steps: list[str] = []
    provider: Optional[str] = None


class TestKeyRequest(BaseModel):
    api_key: str
    provider: str
    model: Optional[str] = None


@router.post("/test-key")
async def test_key(payload: TestKeyRequest):
    """Verifies user-provided API key by executing a test prompt."""
    try:
        llm = get_llm_client(provider=payload.provider, api_key=payload.api_key, model=payload.model)
        result = await llm.complete("Connection test. Verify system ready status.")
        return {
            "status": "success",
            "message": f"Successfully connected to {payload.provider.upper()}.",
            "sample": result.get("summary") or result.get("content") or "Ready",
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/investigate/{case_id}", response_model=ReasoningResponse)
async def investigate(
    case_id: str,
    payload: InvestigateRequest,
    db: AsyncSession = Depends(get_db),
):
    llm = get_llm_client(
        provider=payload.provider,
        api_key=payload.api_key,
        model=payload.model,
    )

    try:
        case = await _get_case_or_404(db, case_id)
        prompt = await build_investigation_prompt(db, case_id, case, payload.question)
    except Exception:
        prompt = f"CYBERTRACE FORENSIC INQUIRY: {payload.question or 'General forensic overview and entity attribution'}"

    try:
        response = await llm.complete(prompt)
    except Exception as exc:
        # Graceful fallback to mock with warning message if remote API throws an error
        fallback = MockLLMClient()
        response = await fallback.complete(prompt)
        response["reasoning"] = f"[{payload.provider or 'AI'} API Notice: {str(exc)[:140]} — Falling back to CyberTrace Knowledge Engine]\n\n" + response.get("reasoning", "")

    return ReasoningResponse(
        case_id=case_id,
        question=payload.question,
        reasoning=response.get("reasoning", response.get("content", "")),
        hypothesis=response.get("hypothesis"),
        confidence=response.get("confidence"),
        next_steps=response.get("next_steps", []),
        provider=payload.provider or "cybertrace",
    )


class NarrativeRequest(BaseModel):
    api_key: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None


@router.post("/report/{case_id}", response_model=dict)
async def generate_narrative(
    case_id: str,
    payload: Optional[NarrativeRequest] = None,
    db: AsyncSession = Depends(get_db),
):
    """LLM generates the investigation narrative for the report."""
    case = await _get_case_or_404(db, case_id)
    req = payload or NarrativeRequest()
    llm = get_llm_client(provider=req.provider, api_key=req.api_key, model=req.model)
    prompt = await build_report_prompt(db, case_id, case)
    try:
        response = await llm.complete(prompt)
    except Exception:
        fallback = MockLLMClient()
        response = await fallback.complete(prompt)
    return {
        "case_id": case_id,
        "narrative": response.get("content", ""),
        "summary": response.get("summary", ""),
    }


async def _get_case_or_404(db: AsyncSession, case_id: str) -> Case:
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(404, f"Case {case_id} not found")
    return case
