"""Pydantic schemas for Graph (Neo4j) responses."""
from typing import Optional, Any
from pydantic import BaseModel


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # person | organization | ip | account | email | phone | address
    risk_score: float = 0.0
    properties: dict = {}
    x: Optional[float] = None
    y: Optional[float] = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str
    weight: float = 1.0
    properties: dict = {}


class GraphResponse(BaseModel):
    case_id: str
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    node_count: int
    edge_count: int


class CommunityResponse(BaseModel):
    case_id: str
    communities: list[dict]
    community_count: int


class PathResponse(BaseModel):
    case_id: str
    source: str
    target: str
    paths: list[list[str]]
    shortest_length: Optional[int] = None
