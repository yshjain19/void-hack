"""
SHA-256 file hashing utilities for evidence integrity.
"""
import hashlib
from pathlib import Path


CHUNK_SIZE = 65_536  # 64 KB


def hash_file(file_path: str | Path) -> str:
    """Compute SHA-256 hash of a file on disk."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(CHUNK_SIZE):
            sha256.update(chunk)
    return sha256.hexdigest()


def hash_bytes(data: bytes) -> str:
    """Compute SHA-256 hash of raw bytes."""
    return hashlib.sha256(data).hexdigest()


def verify_file(file_path: str | Path, expected_hash: str) -> bool:
    """Verify a file's integrity against an expected SHA-256 hash."""
    return hash_file(file_path) == expected_hash


def chain_hash(prev_hash: str, record_data: str) -> str:
    """
    Produce a chained hash for custody-log integrity.
    hash = SHA-256(prev_hash + record_data)
    """
    combined = (prev_hash + record_data).encode("utf-8")
    return hashlib.sha256(combined).hexdigest()
