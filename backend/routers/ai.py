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
from services.llm.client import get_llm_client
from services.llm.prompts import build_investigation_prompt, build_report_prompt

router = APIRouter()


class InvestigateRequest(BaseModel):
    question: Optional[str] = None
    stream: bool = False


class ReasoningResponse(BaseModel):
    case_id: str
    question: Optional[str]
    reasoning: str
    hypothesis: Optional[str] = None
    confidence: Optional[str] = None
    next_steps: list[str] = []


@router.post("/investigate/{case_id}", response_model=ReasoningResponse)
async def investigate(
    case_id: str,
    payload: InvestigateRequest,
    db: AsyncSession = Depends(get_db),
):
    """LLM-powered investigation: summarize evidence and generate hypotheses."""
    case = await _get_case_or_404(db, case_id)
    llm = get_llm_client()
    prompt = await build_investigation_prompt(db, case_id, case, payload.question)
    response = await llm.complete(prompt)
    return ReasoningResponse(
        case_id=case_id,
        question=payload.question,
        reasoning=response.get("reasoning", response.get("content", "")),
        hypothesis=response.get("hypothesis"),
        confidence=response.get("confidence"),
        next_steps=response.get("next_steps", []),
    )


@router.post("/report/{case_id}", response_model=dict)
async def generate_narrative(case_id: str, db: AsyncSession = Depends(get_db)):
    """LLM generates the investigation narrative for the report."""
    case = await _get_case_or_404(db, case_id)
    llm = get_llm_client()
    prompt = await build_report_prompt(db, case_id, case)
    response = await llm.complete(prompt)
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
