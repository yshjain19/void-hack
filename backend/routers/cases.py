"""
Cases API router — CRUD for investigation cases.
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.case import Case
from models.evidence import Evidence
from models.entity import Entity
from models.report import Report
from schemas.case import CaseCreate, CaseUpdate, CaseResponse, CaseListResponse
import uuid

router = APIRouter()


@router.post("", response_model=CaseResponse, status_code=201)
async def create_case(payload: CaseCreate, db: AsyncSession = Depends(get_db)):
    case = Case(
        id=str(uuid.uuid4()),
        **payload.model_dump(),
    )
    db.add(case)
    await db.flush()
    await db.refresh(case)
    return _build_response(case, 0, 0, 0)


@router.get("", response_model=CaseListResponse)
async def list_cases(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(Case)
    if status:
        q = q.where(Case.status == status)
    if priority:
        q = q.where(Case.priority == priority)
    if search:
        q = q.where(Case.title.ilike(f"%{search}%"))

    total_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(total_q)).scalar_one()

    q = q.order_by(Case.created_at.desc()).offset(skip).limit(limit)
    cases = (await db.execute(q)).scalars().all()

    items = []
    for c in cases:
        ev_count = (await db.execute(select(func.count(Evidence.id)).where(Evidence.case_id == c.id))).scalar_one()
        ent_count = (await db.execute(select(func.count(Entity.id)).where(Entity.case_id == c.id))).scalar_one()
        rep_count = (await db.execute(select(func.count(Report.id)).where(Report.case_id == c.id))).scalar_one()
        items.append(_build_response(c, ev_count, ent_count, rep_count))

    return CaseListResponse(total=total, items=items)


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(case_id: str, db: AsyncSession = Depends(get_db)):
    case = await _get_or_404(db, case_id)
    ev_count = (await db.execute(select(func.count(Evidence.id)).where(Evidence.case_id == case_id))).scalar_one()
    ent_count = (await db.execute(select(func.count(Entity.id)).where(Entity.case_id == case_id))).scalar_one()
    rep_count = (await db.execute(select(func.count(Report.id)).where(Report.case_id == case_id))).scalar_one()
    return _build_response(case, ev_count, ent_count, rep_count)


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(case_id: str, payload: CaseUpdate, db: AsyncSession = Depends(get_db)):
    case = await _get_or_404(db, case_id)
    update_data = payload.model_dump(exclude_none=True)
    if "status" in update_data and update_data["status"] == "closed":
        update_data["closed_at"] = datetime.now(timezone.utc)
    for k, v in update_data.items():
        setattr(case, k, v)
    case.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(case)
    ev_count = (await db.execute(select(func.count(Evidence.id)).where(Evidence.case_id == case_id))).scalar_one()
    ent_count = (await db.execute(select(func.count(Entity.id)).where(Entity.case_id == case_id))).scalar_one()
    rep_count = (await db.execute(select(func.count(Report.id)).where(Report.case_id == case_id))).scalar_one()
    return _build_response(case, ev_count, ent_count, rep_count)


@router.delete("/{case_id}", status_code=204)
async def delete_case(case_id: str, db: AsyncSession = Depends(get_db)):
    case = await _get_or_404(db, case_id)
    await db.delete(case)


# ─── Helpers ────────────────────────────────────────────────

async def _get_or_404(db: AsyncSession, case_id: str) -> Case:
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return case


def _build_response(case: Case, ev_count: int, ent_count: int, rep_count: int) -> CaseResponse:
    return CaseResponse(
        id=case.id,
        title=case.title,
        description=case.description,
        status=case.status,
        priority=case.priority,
        investigator=case.investigator,
        tags=case.tags,
        created_at=case.created_at,
        updated_at=case.updated_at,
        closed_at=case.closed_at,
        evidence_count=ev_count,
        entity_count=ent_count,
        report_count=rep_count,
    )
