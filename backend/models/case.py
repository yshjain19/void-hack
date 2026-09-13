"""
Case ORM model.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from core.database import Base


class CaseStatus(str, enum.Enum):
    OPEN = "open"
    ACTIVE = "active"
    PENDING = "pending"
    CLOSED = "closed"
    ARCHIVED = "archived"


class CasePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default=CaseStatus.OPEN, nullable=False
    )
    priority: Mapped[str] = mapped_column(
        String(20), default=CasePriority.MEDIUM, nullable=False
    )
    investigator: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)  # comma-separated
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    evidence: Mapped[list["Evidence"]] = relationship(  # noqa: F821
        "Evidence", back_populates="case", cascade="all, delete-orphan"
    )
    entities: Mapped[list["Entity"]] = relationship(  # noqa: F821
        "Entity", back_populates="case", cascade="all, delete-orphan"
    )
    anomaly_results: Mapped[list["AnomalyResult"]] = relationship(  # noqa: F821
        "AnomalyResult", back_populates="case", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship(  # noqa: F821
        "Report", back_populates="case", cascade="all, delete-orphan"
    )
