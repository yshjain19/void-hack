"""
LLM prompt builders for investigation and report narrative generation.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.case import Case
from models.evidence import Evidence
from models.entity import Entity
from models.anomaly import AnomalyResult


async def build_investigation_prompt(
    db: AsyncSession, case_id: str, case: Case, question: str | None = None
) -> str:
    """Build a structured investigation prompt with all case context."""
    # Evidence summary
    evidence_result = await db.execute(
        select(Evidence).where(Evidence.case_id == case_id).limit(10)
    )
    evidence_items = evidence_result.scalars().all()

    # Top entities by risk
    entities_result = await db.execute(
        select(Entity)
        .where(Entity.case_id == case_id)
        .order_by(Entity.risk_score.desc())
        .limit(15)
    )
    entities = entities_result.scalars().all()

    # Anomalies
    anomalies_result = await db.execute(
        select(AnomalyResult)
        .where(AnomalyResult.case_id == case_id, AnomalyResult.is_anomaly == True)
        .order_by(AnomalyResult.anomaly_score.asc())
        .limit(10)
    )
    anomalies = anomalies_result.scalars().all()

    evidence_text = "\n".join(
        f"  - [{ev.file_type.upper()}] {ev.original_filename} ({ev.file_size:,} bytes, SHA-256: {ev.sha256_hash[:16]}...)"
        for ev in evidence_items
    ) or "  No evidence ingested yet."

    entity_text = "\n".join(
        f"  - [{e.entity_type}] {e.label} (risk_score={e.risk_score:.2f})"
        for e in entities
    ) or "  No entities extracted yet."

    anomaly_text = "\n".join(
        f"  - Row {a.row_index}: score={a.anomaly_score:.4f} — {a.explanation or 'No explanation'}"
        for a in anomalies
    ) or "  No anomalies detected."

    question_block = f"\nINVESTIGATOR QUESTION:\n{question}\n" if question else ""

    return f"""
FORENSIQ INVESTIGATION BRIEF
=============================
Case ID: {case_id}
Title: {case.title}
Status: {case.status}
Priority: {case.priority}
Description: {case.description or "Not provided"}
Investigator: {case.investigator or "Unassigned"}

EVIDENCE FILES ({len(evidence_items)}):
{evidence_text}

HIGH-RISK ENTITIES ({len(entities)}):
{entity_text}

ANOMALY DETECTIONS ({len(anomalies)}):
{anomaly_text}
{question_block}
TASK:
Analyze this case as a forensic investigator. Provide:
1. A detailed reasoning about what the evidence suggests
2. Your primary hypothesis about what occurred
3. Your confidence level (low/medium/medium-high/high)
4. Specific next investigative steps (as a list)
5. A brief executive summary

Respond in JSON format with keys: reasoning, hypothesis, confidence, next_steps (array), content, summary.
"""


async def build_report_prompt(
    db: AsyncSession, case_id: str, case: Case
) -> str:
    """Build a prompt for generating the investigation narrative for the PDF report."""
    investigation_prompt = await build_investigation_prompt(db, case_id, case)
    return (
        investigation_prompt
        + "\n\nAdditionally, write a formal investigation narrative (3-5 paragraphs) "
        "suitable for a legal or compliance report. Include it in the 'content' field."
    )
