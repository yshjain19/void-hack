"""
Evidence router — file upload, integrity verification, custody chain.
"""
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.hashing import hash_bytes, verify_file
from core.custody import log_custody_event, get_custody_chain, verify_custody_chain
from models.evidence import Evidence
from models.case import Case
from schemas.evidence import EvidenceResponse, CustodyLogResponse, CustodyChainVerification
from services.ingestion.excel_parser import parse_excel_or_csv
from services.ingestion.email_parser import parse_email_file

router = APIRouter()

ALLOWED_TYPES = {
    ".xlsx": "excel",
    ".xls": "excel",
    ".csv": "csv",
    ".eml": "email",
    ".msg": "email",
    ".json": "json",
}


@router.post("/upload", response_model=EvidenceResponse, status_code=201)
async def upload_evidence(
    case_id: str = Form(...),
    description: str = Form(""),
    actor: str = Form("analyst"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    # Verify case exists
    case = (await db.execute(select(Case).where(Case.id == case_id))).scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    # Read file bytes
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    # Determine file type
    suffix = Path(file.filename or "").suffix.lower()
    file_type = ALLOWED_TYPES.get(suffix, "other")

    # Compute SHA-256
    sha256 = hash_bytes(content)

    # Save to disk
    upload_dir = Path(settings.UPLOAD_DIR) / case_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4()}{suffix}"
    stored_path = upload_dir / stored_name
    stored_path.write_bytes(content)

    # Create evidence record
    ev = Evidence(
        id=str(uuid.uuid4()),
        case_id=case_id,
        filename=stored_name,
        original_filename=file.filename or stored_name,
        file_type=file_type,
        file_size=len(content),
        sha256_hash=sha256,
        storage_path=str(stored_path),
        description=description or None,
        uploaded_by=actor,
    )
    db.add(ev)
    await db.flush()

    # Log initial custody event
    await log_custody_event(
        db, ev.id, "UPLOADED", actor,
        {"original_filename": file.filename, "sha256": sha256, "size": len(content)}
    )

    # Async parse in background (simplified: parse inline for now)
    try:
        extra = {}
        if file_type in ("excel", "csv"):
            extra = parse_excel_or_csv(str(stored_path), file_type)
        elif file_type == "email":
            extra = parse_email_file(str(stored_path))
        ev.extra_metadata = extra
        ev.parsed = True
    except Exception as exc:
        ev.parse_error = str(exc)

    await db.flush()
    await db.refresh(ev)
    return EvidenceResponse.model_validate(ev)


@router.get("/{case_id}", response_model=list[EvidenceResponse])
async def list_evidence(case_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Evidence).where(Evidence.case_id == case_id).order_by(Evidence.uploaded_at.desc())
    )
    return [EvidenceResponse.model_validate(e) for e in result.scalars().all()]


@router.get("/item/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence(evidence_id: str, db: AsyncSession = Depends(get_db)):
    ev = await _get_evidence_or_404(db, evidence_id)
    return EvidenceResponse.model_validate(ev)


@router.get("/item/{evidence_id}/custody", response_model=list[CustodyLogResponse])
async def get_custody(evidence_id: str, db: AsyncSession = Depends(get_db)):
    await _get_evidence_or_404(db, evidence_id)
    logs = await get_custody_chain(db, evidence_id)
    return [CustodyLogResponse.model_validate(l) for l in logs]


@router.get("/item/{evidence_id}/verify", response_model=CustodyChainVerification)
async def verify_evidence(evidence_id: str, db: AsyncSession = Depends(get_db)):
    ev = await _get_evidence_or_404(db, evidence_id)
    chain_result = await verify_custody_chain(db, evidence_id)

    # Also verify current file hash
    current_hash = None
    file_valid = None
    if Path(ev.storage_path).exists():
        current_hash = hash_bytes(Path(ev.storage_path).read_bytes())
        file_valid = current_hash == ev.sha256_hash

    return CustodyChainVerification(
        evidence_id=evidence_id,
        is_valid=chain_result["is_valid"],
        entries=chain_result["entries"],
        broken_at=chain_result.get("broken_at"),
        message=chain_result.get("message"),
        current_file_hash=current_hash,
        stored_hash=ev.sha256_hash,
        file_integrity_valid=file_valid,
    )


@router.delete("/item/{evidence_id}", status_code=204)
async def delete_evidence(
    evidence_id: str, actor: str = "analyst", db: AsyncSession = Depends(get_db)
):
    ev = await _get_evidence_or_404(db, evidence_id)
    await log_custody_event(db, evidence_id, "DELETED", actor, {})
    # Remove file from disk
    p = Path(ev.storage_path)
    if p.exists():
        p.unlink()
    await db.delete(ev)


async def _get_evidence_or_404(db: AsyncSession, evidence_id: str) -> Evidence:
    result = await db.execute(select(Evidence).where(Evidence.id == evidence_id))
    ev = result.scalar_one_or_none()
    if not ev:
        raise HTTPException(404, f"Evidence {evidence_id} not found")
    return ev
