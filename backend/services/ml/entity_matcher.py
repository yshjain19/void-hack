"""
Entity matching service using sentence-transformers cosine similarity.
Finds potentially duplicate or related entities across evidence files.
"""
from typing import Any

import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.entity import Entity

try:
    from sentence_transformers import SentenceTransformer
    _MODEL = None  # Lazy-load to avoid slow startup

    def _get_model() -> SentenceTransformer:
        global _MODEL
        if _MODEL is None:
            _MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        return _MODEL

    ST_AVAILABLE = True
except ImportError:
    ST_AVAILABLE = False


SIMILARITY_THRESHOLD = 0.85


async def find_similar_entities(
    db: AsyncSession, case_id: str, threshold: float = SIMILARITY_THRESHOLD
) -> list[dict[str, Any]]:
    """
    Find pairs of entities with high label similarity using sentence-transformers.
    Useful for detecting aliases, misspellings, or duplicates across evidence files.
    """
    result = await db.execute(
        select(Entity).where(Entity.case_id == case_id)
    )
    entities = result.scalars().all()

    if len(entities) < 2:
        return []

    labels = [e.label for e in entities]
    entity_ids = [e.id for e in entities]
    entity_types = [e.entity_type for e in entities]

    if ST_AVAILABLE:
        model = _get_model()
        embeddings = model.encode(labels, normalize_embeddings=True)
        similarity_matrix = np.dot(embeddings, embeddings.T)
    else:
        # Fallback: simple Jaccard similarity on tokens
        similarity_matrix = _jaccard_matrix(labels)

    matches = []
    n = len(entities)
    for i in range(n):
        for j in range(i + 1, n):
            sim = float(similarity_matrix[i][j])
            if sim >= threshold and labels[i] != labels[j]:
                matches.append({
                    "entity_a": {
                        "id": entity_ids[i],
                        "label": labels[i],
                        "type": entity_types[i],
                    },
                    "entity_b": {
                        "id": entity_ids[j],
                        "label": labels[j],
                        "type": entity_types[j],
                    },
                    "similarity": round(sim, 4),
                    "match_type": "high_similarity" if sim > 0.95 else "possible_alias",
                })

    matches.sort(key=lambda x: x["similarity"], reverse=True)
    return matches[:50]


def _jaccard_matrix(labels: list[str]) -> np.ndarray:
    """Simple token-level Jaccard similarity as fallback."""
    n = len(labels)
    tokenized = [set(l.lower().split()) for l in labels]
    mat = np.eye(n)
    for i in range(n):
        for j in range(i + 1, n):
            a, b = tokenized[i], tokenized[j]
            union = len(a | b)
            if union == 0:
                mat[i][j] = mat[j][i] = 0.0
            else:
                mat[i][j] = mat[j][i] = len(a & b) / union
    return mat
