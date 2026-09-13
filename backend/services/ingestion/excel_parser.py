"""
Excel and CSV ingestion service using openpyxl and Pandas.
Extracts structured data and entity hints from tabular files.
"""
from pathlib import Path
from typing import Any
import re

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

# Patterns for entity detection in column values
IP_PATTERN = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_PATTERN = re.compile(r"[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}")
ACCOUNT_KEYWORDS = {"account", "acc", "iban", "bic", "swift", "account_no", "account_number"}
AMOUNT_KEYWORDS = {"amount", "value", "total", "sum", "debit", "credit", "balance"}


def parse_excel_or_csv(file_path: str, file_type: str) -> dict[str, Any]:
    """
    Parse an Excel or CSV file and return:
    - summary statistics
    - column info
    - detected entity hints
    - sample records
    """
    path = Path(file_path)
    try:
        if file_type == "excel":
            df = pd.read_excel(path, engine="openpyxl", nrows=10_000)
        else:
            df = pd.read_csv(path, nrows=10_000, on_bad_lines="skip")
    except Exception as e:
        raise ValueError(f"Failed to parse file: {e}")

    # Basic stats
    summary = {
        "rows": len(df),
        "columns": list(df.columns.astype(str)),
        "column_count": len(df.columns),
        "dtypes": {str(k): str(v) for k, v in df.dtypes.items()},
        "null_counts": {str(k): int(v) for k, v in df.isnull().sum().items()},
    }

    # Detect entity columns
    entity_hints = []
    for col in df.columns:
        col_lower = str(col).lower()
        sample_vals = df[col].dropna().astype(str).head(20).tolist()
        col_str = " ".join(sample_vals[:5])

        if any(k in col_lower for k in ACCOUNT_KEYWORDS):
            entity_hints.append({"column": str(col), "type": "account", "sample": sample_vals[:3]})
        elif any(k in col_lower for k in AMOUNT_KEYWORDS):
            entity_hints.append({"column": str(col), "type": "amount", "sample": sample_vals[:3]})
        elif EMAIL_PATTERN.search(col_str):
            entity_hints.append({"column": str(col), "type": "email", "sample": sample_vals[:3]})
        elif IP_PATTERN.search(col_str):
            entity_hints.append({"column": str(col), "type": "ip", "sample": sample_vals[:3]})
        elif "name" in col_lower or "person" in col_lower:
            entity_hints.append({"column": str(col), "type": "person", "sample": sample_vals[:3]})
        elif "org" in col_lower or "company" in col_lower or "bank" in col_lower:
            entity_hints.append({"column": str(col), "type": "organization", "sample": sample_vals[:3]})

    # Sample records (first 5 as dicts)
    sample_records = df.head(5).fillna("").astype(str).to_dict(orient="records")

    # Numeric summary
    numeric_summary = {}
    for col in df.select_dtypes(include="number").columns:
        numeric_summary[str(col)] = {
            "min": float(df[col].min()),
            "max": float(df[col].max()),
            "mean": float(df[col].mean()),
            "std": float(df[col].std()),
        }

    return {
        "summary": summary,
        "entity_hints": entity_hints,
        "sample_records": sample_records,
        "numeric_summary": numeric_summary,
        "file_type": file_type,
    }
