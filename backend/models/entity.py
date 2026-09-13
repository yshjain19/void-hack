"""
Entity ORM model — represents persons, organizations, IPs, accounts, etc.
"""
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, Float, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:
    from models.case import Case


class Entity(Base):
    __tablename__ = "entities"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False
    )
    entity_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # person | organization | ip | account | email | phone | address
    label: Mapped[str] = mapped_column(String(512), nullable=False)
    aliases: Mapped[list | None] = mapped_column(JSON, nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_factors: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    source_evidence_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("evidence.id"), nullable=True
    )
    neo4j_node_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    properties: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="entities")  # noqa: F821
