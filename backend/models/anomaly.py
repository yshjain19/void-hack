"""
AnomalyResult ORM model — stores ML anomaly detection results.
"""
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, Float, ForeignKey, JSON, Text, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:
    from models.case import Case


class AnomalyResult(Base):
    __tablename__ = "anomaly_results"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False
    )
    evidence_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("evidence.id"), nullable=True
    )
    algorithm: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # isolation_forest | dbscan | lof
    record_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    anomaly_score: Mapped[float] = mapped_column(Float, nullable=False)
    is_anomaly: Mapped[bool] = mapped_column(Boolean, default=False)
    feature_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    row_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="anomaly_results")  # noqa: F821
