"""
Analytics router — anomaly detection, risk scoring, entity similarity.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.case import Case
from models.evidence import Evidence
from models.entity import Entity
from models.anomaly import AnomalyResult
from schemas.report import AnomalyResultResponse, EntityResponse
from services.ml.anomaly import run_anomaly_detection
from services.ml.risk_scorer import compute_risk_scores
from services.ml.entity_matcher import find_similar_entities

router = APIRouter()


@router.post("/anomaly/{case_id}", response_model=dict)
async def run_anomaly(case_id: str, db: AsyncSession = Depends(get_db)):
    """Run Isolation Forest anomaly detection on evidence data."""
    await _get_case_or_404(db, case_id)
    result = await run_anomaly_detection(db, case_id)
    return {
        "message": "Anomaly detection complete",
        "case_id": case_id,
        "total_records": result["total"],
        "anomalies_found": result["anomalies"],
        "anomaly_rate": result["rate"],
    }


@router.get("/anomaly/{case_id}", response_model=list[AnomalyResultResponse])
async def get_anomalies(case_id: str, db: AsyncSession = Depends(get_db)):
    await _get_case_or_404(db, case_id)
    result = await db.execute(
        select(AnomalyResult)
        .where(AnomalyResult.case_id == case_id)
        .order_by(AnomalyResult.anomaly_score.desc())
    )
    return [AnomalyResultResponse.model_validate(r) for r in result.scalars().all()]


@router.post("/risk/{case_id}", response_model=dict)
async def compute_risk(case_id: str, db: AsyncSession = Depends(get_db)):
    """Compute risk scores for all entities in a case."""
    await _get_case_or_404(db, case_id)
    updated = await compute_risk_scores(db, case_id)
    return {"message": "Risk scores updated", "case_id": case_id, "entities_scored": updated}


@router.get("/risk/{case_id}", response_model=list[EntityResponse])
async def get_risk_scores(case_id: str, db: AsyncSession = Depends(get_db)):
    await _get_case_or_404(db, case_id)
    result = await db.execute(
        select(Entity)
        .where(Entity.case_id == case_id)
        .order_by(Entity.risk_score.desc())
    )
    return [EntityResponse.model_validate(e) for e in result.scalars().all()]


@router.post("/similarity/{case_id}", response_model=list[dict])
async def entity_similarity(case_id: str, db: AsyncSession = Depends(get_db)):
    """Use sentence-transformers to find similar entities."""
    await _get_case_or_404(db, case_id)
    matches = await find_similar_entities(db, case_id)
    return matches


async def _get_case_or_404(db: AsyncSession, case_id: str) -> Case:
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(404, f"Case {case_id} not found")
    return case
