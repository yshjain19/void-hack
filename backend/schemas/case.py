"""Pydantic schemas for Case CRUD."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CaseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: str = "medium"
    investigator: Optional[str] = None
    tags: Optional[str] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    investigator: Optional[str] = None
    tags: Optional[str] = None


class CaseResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    investigator: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    evidence_count: int = 0
    entity_count: int = 0
    report_count: int = 0

    model_config = {"from_attributes": True}


class CaseListResponse(BaseModel):
    total: int
    items: list[CaseResponse]
