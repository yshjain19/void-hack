"""
Reports router — generate and download PDF/JSON reports.
"""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.hashing import hash_file
from models.case import Case
from models.report import Report
from schemas.report import ReportGenerateRequest, ReportResponse
from services.reports.pdf_builder import build_pdf_report
from services.reports.json_builder import build_json_report

router = APIRouter()


@router.post("/generate/{case_id}", response_model=list[ReportResponse], status_code=201)
async def generate_reports(
    case_id: str,
    payload: ReportGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate both PDF and JSON reports for a case."""
    case = await _get_case_or_404(db, case_id)
    title = payload.title or f"ForensIQ Report — {case.title}"

    reports_dir = Path(settings.REPORTS_DIR) / case_id
    reports_dir.mkdir(parents=True, exist_ok=True)

    created = []

    # ── PDF Report ──────────────────────────────────────────
    pdf_path = reports_dir / f"report_{uuid.uuid4()}.pdf"
    await build_pdf_report(db, case, str(pdf_path), payload)
    pdf_hash = hash_file(str(pdf_path))
    pdf_size = pdf_path.stat().st_size

    pdf_report = Report(
        id=str(uuid.uuid4()),
        case_id=case_id,
        format="pdf",
        title=title,
        file_path=str(pdf_path),
        file_size=pdf_size,
        sha256_hash=pdf_hash,
        generated_by=payload.generated_by,
        report_metadata={"options": payload.model_dump()},
    )
    db.add(pdf_report)
    created.append(pdf_report)

    # ── JSON Report ─────────────────────────────────────────
    json_path = reports_dir / f"report_{uuid.uuid4()}.json"
    await build_json_report(db, case, str(json_path), payload)
    json_hash = hash_file(str(json_path))
    json_size = json_path.stat().st_size

    json_report = Report(
        id=str(uuid.uuid4()),
        case_id=case_id,
        format="json",
        title=title,
        file_path=str(json_path),
        file_size=json_size,
        sha256_hash=json_hash,
        generated_by=payload.generated_by,
        report_metadata={"options": payload.model_dump()},
    )
    db.add(json_report)
    created.append(json_report)

    await db.flush()
    return [ReportResponse.model_validate(r) for r in created]


@router.get("/{case_id}", response_model=list[ReportResponse])
async def list_reports(case_id: str, db: AsyncSession = Depends(get_db)):
    await _get_case_or_404(db, case_id)
    result = await db.execute(
        select(Report).where(Report.case_id == case_id).order_by(Report.created_at.desc())
    )
    return [ReportResponse.model_validate(r) for r in result.scalars().all()]


@router.get("/download/{report_id}")
async def download_report(report_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(404, f"Report {report_id} not found")

    path = Path(report.file_path)
    if not path.exists():
        raise HTTPException(404, "Report file not found on disk")

    media_type = "application/pdf" if report.format == "pdf" else "application/json"
    filename = f"forensiq_report_{report.case_id[:8]}.{report.format}"
    return FileResponse(str(path), media_type=media_type, filename=filename)


@router.delete("/{report_id}", status_code=204)
async def delete_report(report_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(404, "Report not found")
    p = Path(report.file_path)
    if p.exists():
        p.unlink()
    await db.delete(report)


async def _get_case_or_404(db: AsyncSession, case_id: str) -> Case:
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(404, f"Case {case_id} not found")
    return case
