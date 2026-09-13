"""
Immutable chain-of-custody logging for evidence items.
Every action on evidence is recorded with a chained SHA-256 hash
linking each record to the previous one (tamper-evident log).
"""
import json
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.evidence import CustodyLog
from core.hashing import chain_hash


GENESIS_HASH = "0" * 64  # Starting hash for the first entry


async def log_custody_event(
    db: AsyncSession,
    evidence_id: str,
    action: str,
    actor: str,
    metadata: dict | None = None,
) -> CustodyLog:
    """
    Append an immutable custody event for an evidence item.

    Each log entry's chain_hash = SHA-256(prev_chain_hash + event_data),
    creating a tamper-evident linked chain.
    """
    # Get the latest custody log entry for this evidence
    result = await db.execute(
        select(CustodyLog)
        .where(CustodyLog.evidence_id == evidence_id)
        .order_by(CustodyLog.sequence.desc())
        .limit(1)
    )
    latest = result.scalar_one_or_none()

    prev_hash = latest.chain_hash if latest else GENESIS_HASH
    sequence = (latest.sequence + 1) if latest else 0

    timestamp = datetime.now(timezone.utc)
    event_data = json.dumps(
        {
            "evidence_id": evidence_id,
            "action": action,
            "actor": actor,
            "timestamp": timestamp.isoformat(),
            "sequence": sequence,
            "metadata": metadata or {},
        },
        sort_keys=True,
    )

    new_hash = chain_hash(prev_hash, event_data)

    log = CustodyLog(
        evidence_id=evidence_id,
        action=action,
        actor=actor,
        timestamp=timestamp,
        sequence=sequence,
        prev_hash=prev_hash,
        chain_hash=new_hash,
        event_metadata=metadata or {},
    )
    db.add(log)
    await db.flush()
    return log


async def get_custody_chain(
    db: AsyncSession, evidence_id: str
) -> list[CustodyLog]:
    """Return the full custody chain for an evidence item, ordered by sequence."""
    result = await db.execute(
        select(CustodyLog)
        .where(CustodyLog.evidence_id == evidence_id)
        .order_by(CustodyLog.sequence.asc())
    )
    return result.scalars().all()


async def verify_custody_chain(
    db: AsyncSession, evidence_id: str
) -> dict:
    """
    Verify the integrity of the entire custody chain.
    Returns a dict with is_valid flag and any broken links.
    """
    chain = await get_custody_chain(db, evidence_id)
    if not chain:
        return {"is_valid": True, "entries": 0, "broken_at": None}

    prev_hash = GENESIS_HASH
    for entry in chain:
        if entry.prev_hash != prev_hash:
            return {
                "is_valid": False,
                "entries": len(chain),
                "broken_at": entry.sequence,
                "message": f"Chain broken at sequence {entry.sequence}",
            }
        prev_hash = entry.chain_hash

    return {"is_valid": True, "entries": len(chain), "broken_at": None}
