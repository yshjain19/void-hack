"""
Evidence and CustodyLog ORM models.
"""
import uuid
from datetime import datetime, timezone
from typing import Any, TYPE_CHECKING

from sqlalchemy import String, DateTime, Text, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:
    from models.case import Case


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)  # excel|csv|email|json|other
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parsed: Mapped[bool] = mapped_column(Boolean, default=False)
    parse_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_by: Mapped[str] = mapped_column(String(255), default="system")
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    extra_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="evidence")  # noqa: F821
    custody_logs: Mapped[list["CustodyLog"]] = relationship(
        "CustodyLog", back_populates="evidence", cascade="all, delete-orphan"
    )


class CustodyLog(Base):
    __tablename__ = "custody_logs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    evidence_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("evidence.id", ondelete="CASCADE"), nullable=False
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    actor: Mapped[str] = mapped_column(String(255), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    prev_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    chain_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    event_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    evidence: Mapped["Evidence"] = relationship("Evidence", back_populates="custody_logs")
