"""Pydantic schemas for Reports."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ReportGenerateRequest(BaseModel):
    title: Optional[str] = None
    include_graph: bool = True
    include_anomalies: bool = True
    include_custody: bool = True
    ai_narrative: bool = True
    generated_by: str = "system"


class ReportResponse(BaseModel):
    id: str
    case_id: str
    format: str
    title: str
    file_size: Optional[int] = None
    sha256_hash: Optional[str] = None
    generated_by: str
    summary: Optional[str] = None
    report_metadata: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AnomalyResultResponse(BaseModel):
    id: str
    case_id: str
    evidence_id: Optional[str] = None
    algorithm: str
    record_ref: Optional[str] = None
    anomaly_score: float
    is_anomaly: bool
    feature_values: Optional[dict] = None
    explanation: Optional[str] = None
    row_index: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EntityResponse(BaseModel):
    id: str
    case_id: str
    entity_type: str
    label: str
    aliases: Optional[list] = None
    risk_score: float
    risk_factors: Optional[dict] = None
    source_evidence_id: Optional[str] = None
    neo4j_node_id: Optional[str] = None
    properties: Optional[dict] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
