"""
Anomaly detection service using scikit-learn Isolation Forest.
Runs on numeric columns extracted from evidence data.
"""
import uuid
from typing import Any

try:
    import numpy as np
    import pandas as pd
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.evidence import Evidence
from models.anomaly import AnomalyResult


async def run_anomaly_detection(db: AsyncSession, case_id: str) -> dict[str, Any]:
    """
    Run Isolation Forest on numeric evidence data for a case.
    Stores results in AnomalyResult table.
    """
    if not ML_AVAILABLE:
        return {"total": 0, "anomalies": 0, "rate": 0.0, "note": "ML libraries not installed"}
    # Gather all parsed evidence with numeric data
    result = await db.execute(
        select(Evidence).where(
            Evidence.case_id == case_id,
            Evidence.parsed == True,
            Evidence.file_type.in_(["excel", "csv"]),
        )
    )
    evidence_items = result.scalars().all()

    if not evidence_items:
        return {"total": 0, "anomalies": 0, "rate": 0.0}

    # Delete old anomaly results for this case
    existing = await db.execute(
        select(AnomalyResult).where(AnomalyResult.case_id == case_id)
    )
    for r in existing.scalars().all():
        await db.delete(r)
    await db.flush()

    all_anomalies = 0
    total_records = 0

    for ev in evidence_items:
        meta = ev.extra_metadata or {}
        numeric_summary = meta.get("numeric_summary", {})
        sample_records = meta.get("sample_records", [])

        if not sample_records or not numeric_summary:
            continue

        # Rebuild numeric features from sample (limited to what we stored)
        numeric_cols = list(numeric_summary.keys())
        if not numeric_cols:
            continue

        # Load the actual file for real anomaly detection
        try:
            if ev.file_type == "excel":
                df = pd.read_excel(ev.storage_path, engine="openpyxl")
            else:
                df = pd.read_csv(ev.storage_path, on_bad_lines="skip")

            available_cols = [c for c in numeric_cols if c in df.columns]
            if not available_cols:
                continue

            df_numeric = df[available_cols].select_dtypes(include="number").fillna(0)
            if df_numeric.empty or len(df_numeric) < 5:
                continue

            scaler = StandardScaler()
            X = scaler.fit_transform(df_numeric)

            clf = IsolationForest(
                n_estimators=100,
                contamination=0.05,
                random_state=42,
                n_jobs=-1,
            )
            labels = clf.fit_predict(X)
            scores = clf.decision_function(X)

            # Store results
            for i, (label, score) in enumerate(zip(labels, scores)):
                is_anomaly = label == -1
                if is_anomaly or score < 0.1:  # Store anomalies + borderline
                    feature_vals = {col: float(df_numeric.iloc[i][col]) for col in available_cols}
                    anomaly = AnomalyResult(
                        id=str(uuid.uuid4()),
                        case_id=case_id,
                        evidence_id=ev.id,
                        algorithm="isolation_forest",
                        record_ref=str(i),
                        anomaly_score=float(score),
                        is_anomaly=is_anomaly,
                        feature_values=feature_vals,
                        explanation=_explain_anomaly(feature_vals, numeric_summary, is_anomaly),
                        row_index=i,
                    )
                    db.add(anomaly)
                    if is_anomaly:
                        all_anomalies += 1

            total_records += len(df_numeric)
            await db.flush()

        except Exception:
            continue

    rate = all_anomalies / total_records if total_records > 0 else 0.0
    return {"total": total_records, "anomalies": all_anomalies, "rate": round(rate, 4)}


def _explain_anomaly(
    feature_vals: dict, summary: dict, is_anomaly: bool
) -> str:
    if not is_anomaly:
        return "Borderline record — monitor closely."
    explanations = []
    for feat, val in feature_vals.items():
        stats = summary.get(feat, {})
        if not stats:
            continue
        mean = stats.get("mean", 0)
        std = stats.get("std", 1) or 1
        z = abs((val - mean) / std)
        if z > 2.5:
            explanations.append(
                f"{feat}={val:.2f} is {z:.1f}σ from mean ({mean:.2f})"
            )
    return "; ".join(explanations) if explanations else "Multi-dimensional anomaly detected."
