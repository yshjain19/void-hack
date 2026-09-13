"""
Report ORM model — tracks generated PDF and JSON reports.
"""
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, ForeignKey, JSON, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:
    from models.case import Case


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False
    )
    format: Mapped[str] = mapped_column(String(10), nullable=False)  # pdf | json
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sha256_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    generated_by: Mapped[str] = mapped_column(String(255), default="system")
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    report_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="reports")  # noqa: F821
