"""
Risk scorer — computes weighted risk scores for entities.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.entity import Entity
from models.anomaly import AnomalyResult


# Risk factor weights
WEIGHTS = {
    "anomaly_association": 0.35,
    "email_flags": 0.25,
    "suspicious_url": 0.20,
    "high_degree": 0.10,
    "data_completeness": 0.05,
    "entity_type_risk": 0.05,
}

ENTITY_BASE_RISK = {
    "ip": 0.3,
    "email": 0.2,
    "account": 0.15,
    "person": 0.1,
    "organization": 0.1,
    "phone": 0.1,
    "address": 0.05,
}


async def compute_risk_scores(db: AsyncSession, case_id: str) -> int:
    """
    Compute and update risk scores for all entities in a case.
    Returns number of entities scored.
    """
    entities_result = await db.execute(
        select(Entity).where(Entity.case_id == case_id)
    )
    entities = entities_result.scalars().all()

    anomalies_result = await db.execute(
        select(AnomalyResult).where(
            AnomalyResult.case_id == case_id,
            AnomalyResult.is_anomaly == True,
        )
    )
    anomaly_evidence_ids = {a.evidence_id for a in anomalies_result.scalars().all()}

    for ent in entities:
        score = _compute_entity_risk(ent, anomaly_evidence_ids)
        ent.risk_score = round(min(score, 1.0), 4)
        ent.risk_factors = _get_risk_factors(ent, anomaly_evidence_ids)

    await db.flush()
    return len(entities)


def _compute_entity_risk(ent: Entity, anomaly_evidence_ids: set) -> float:
    score = 0.0

    # Base risk by type
    score += ENTITY_BASE_RISK.get(ent.entity_type, 0.05) * WEIGHTS["entity_type_risk"] * 10

    # Associated with anomalous evidence
    if ent.source_evidence_id in anomaly_evidence_ids:
        score += WEIGHTS["anomaly_association"]

    # Email-specific flags
    props = ent.properties or {}
    if ent.entity_type == "email" and props.get("role") == "sender":
        score += WEIGHTS["email_flags"] * 0.5

    # Suspicious URL
    if ent.entity_type == "address" and props.get("type") == "suspicious_url":
        score += WEIGHTS["suspicious_url"]

    # IP addresses are inherently higher risk
    if ent.entity_type == "ip":
        score += 0.15

    return score


def _get_risk_factors(ent: Entity, anomaly_evidence_ids: set) -> dict:
    factors = {}
    if ent.source_evidence_id in anomaly_evidence_ids:
        factors["anomaly_associated"] = True
    props = ent.properties or {}
    if props.get("type") == "suspicious_url":
        factors["suspicious_url"] = True
    if ent.entity_type == "ip":
        factors["ip_address"] = True
    return factors
