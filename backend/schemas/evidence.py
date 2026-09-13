"""Pydantic schemas for Evidence and CustodyLog."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel


class EvidenceResponse(BaseModel):
    id: str
    case_id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    sha256_hash: str
    description: Optional[str] = None
    parsed: bool
    parse_error: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime
    extra_metadata: Optional[dict] = None

    model_config = {"from_attributes": True}


class CustodyLogResponse(BaseModel):
    id: str
    evidence_id: str
    action: str
    actor: str
    timestamp: datetime
    sequence: int
    prev_hash: str
    chain_hash: str
    event_metadata: Optional[dict] = None

    model_config = {"from_attributes": True}


class CustodyChainVerification(BaseModel):
    evidence_id: str
    is_valid: bool
    entries: int
    broken_at: Optional[int] = None
    message: Optional[str] = None
    current_file_hash: Optional[str] = None
    stored_hash: Optional[str] = None
    file_integrity_valid: Optional[bool] = None
