"""
JSON report builder — generates machine-readable forensic report.
"""
import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.case import Case
from models.evidence import Evidence
from models.entity import Entity
from models.anomaly import AnomalyResult
from core.hashing import hash_bytes


async def build_json_report(
    db: AsyncSession,
    case: Case,
    output_path: str,
    options: Any,
) -> None:
    """Generate a machine-readable JSON forensic report."""
    evidence_items = (
        await db.execute(select(Evidence).where(Evidence.case_id == case.id))
    ).scalars().all()

    entities = (
        await db.execute(
            select(Entity)
            .where(Entity.case_id == case.id)
            .order_by(Entity.risk_score.desc())
        )
    ).scalars().all()

    anomalies = (
        await db.execute(
            select(AnomalyResult)
            .where(AnomalyResult.case_id == case.id, AnomalyResult.is_anomaly == True)
        )
    ).scalars().all()

    report: dict[str, Any] = {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generator": "CyberTrace v1.0",
        "case": {
            "id": case.id,
            "title": case.title,
            "description": case.description,
            "status": case.status,
            "priority": case.priority,
            "investigator": case.investigator,
            "tags": case.tags,
            "created_at": case.created_at.isoformat() if case.created_at else None,
            "updated_at": case.updated_at.isoformat() if case.updated_at else None,
        },
        "evidence": [
            {
                "id": ev.id,
                "filename": ev.original_filename,
                "file_type": ev.file_type,
                "file_size": ev.file_size,
                "sha256_hash": ev.sha256_hash,
                "parsed": ev.parsed,
                "uploaded_at": ev.uploaded_at.isoformat() if ev.uploaded_at else None,
                "uploaded_by": ev.uploaded_by,
                "extra_metadata": ev.extra_metadata,
            }
            for ev in evidence_items
        ],
        "entities": [
            {
                "id": e.id,
                "type": e.entity_type,
                "label": e.label,
                "risk_score": e.risk_score,
                "risk_factors": e.risk_factors,
                "source_evidence_id": e.source_evidence_id,
                "aliases": e.aliases,
                "properties": e.properties,
            }
            for e in entities
        ],
        "anomalies": [
            {
                "id": a.id,
                "evidence_id": a.evidence_id,
                "algorithm": a.algorithm,
                "row_index": a.row_index,
                "anomaly_score": a.anomaly_score,
                "is_anomaly": a.is_anomaly,
                "feature_values": a.feature_values,
                "explanation": a.explanation,
            }
            for a in anomalies
        ],
        "summary": {
            "total_evidence_files": len(evidence_items),
            "total_entities": len(entities),
            "total_anomalies": len(anomalies),
            "high_risk_entities": sum(1 for e in entities if e.risk_score >= 0.5),
            "critical_entities": sum(1 for e in entities if e.risk_score >= 0.7),
        },
    }

    json_bytes = json.dumps(report, indent=2, default=str).encode("utf-8")

    # Write to file
    with open(output_path, "wb") as f:
        f.write(json_bytes)
