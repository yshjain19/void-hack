"""
Email (.eml) ingestion service using Python's built-in email parser.
Extracts headers, body, attachments, and forensic metadata.
"""
import email
import email.policy
from email import message_from_file
from email.utils import parseaddr, parsedate_to_datetime
from pathlib import Path
from typing import Any
import re
import hashlib
import base64


IP_PATTERN = re.compile(
    r"(?:^|\s|\[)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?:\]|\s|$)"
)
URL_PATTERN = re.compile(
    r"https?://[^\s<>\"']+", re.IGNORECASE
)
DOMAIN_PATTERN = re.compile(
    r"(?:from|by|via)\s+([a-zA-Z0-9][a-zA-Z0-9\-\.]{0,253}[a-zA-Z0-9])",
    re.IGNORECASE,
)


def parse_email_file(file_path: str) -> dict[str, Any]:
    """
    Parse an .eml file and return forensic metadata including:
    - headers, sender/recipient chain
    - IP addresses from Received headers
    - URLs in body
    - Attachments with hashes
    - Anomaly indicators (spoofing hints, suspicious domains)
    """
    path = Path(file_path)
    with open(path, "rb") as f:
        msg = email.message_from_binary_file(f, policy=email.policy.default)

    # ── Headers ──────────────────────────────────────────────
    headers = {}
    for key in set(msg.keys()):
        vals = msg.get_all(key)
        headers[key] = vals if len(vals) > 1 else vals[0]

    from_raw = msg.get("From", "")
    to_raw = msg.get("To", "")
    reply_to_raw = msg.get("Reply-To", "")
    from_name, from_addr = parseaddr(from_raw)
    _, reply_to_addr = parseaddr(reply_to_raw)

    # ── Date ─────────────────────────────────────────────────
    date_str = msg.get("Date", "")
    try:
        sent_at = parsedate_to_datetime(date_str).isoformat()
    except Exception:
        sent_at = date_str

    # ── Received chain (hop IPs) ──────────────────────────────
    received_headers = msg.get_all("Received") or []
    hop_ips = []
    hop_domains = []
    for received in received_headers:
        ips = IP_PATTERN.findall(received)
        hop_ips.extend(ips)
        domains = DOMAIN_PATTERN.findall(received)
        hop_domains.extend(domains[:2])

    # Deduplicate while preserving order
    hop_ips = list(dict.fromkeys(hop_ips))
    hop_domains = list(dict.fromkeys(hop_domains))

    # ── Body text and URLs ────────────────────────────────────
    body_plain = ""
    body_html = ""
    urls = []
    attachments = []

    for part in msg.walk():
        ct = part.get_content_type()
        disp = str(part.get("Content-Disposition") or "")

        if "attachment" in disp:
            payload = part.get_payload(decode=True) or b""
            attachments.append(
                {
                    "filename": part.get_filename() or "unknown",
                    "content_type": ct,
                    "size": len(payload),
                    "sha256": hashlib.sha256(payload).hexdigest(),
                }
            )
        elif ct == "text/plain" and not body_plain:
            try:
                body_plain = part.get_payload(decode=True).decode("utf-8", errors="replace")
            except Exception:
                pass
        elif ct == "text/html" and not body_html:
            try:
                body_html = part.get_payload(decode=True).decode("utf-8", errors="replace")
            except Exception:
                pass

    body_text = body_plain or body_html
    urls = list(set(URL_PATTERN.findall(body_text)))

    # ── Spoofing / anomaly indicators ─────────────────────────
    anomaly_flags = []
    if reply_to_addr and from_addr and reply_to_addr.lower() != from_addr.lower():
        anomaly_flags.append({
            "flag": "REPLY_TO_MISMATCH",
            "detail": f"From: {from_addr}, Reply-To: {reply_to_addr}",
        })
    if not msg.get("DKIM-Signature"):
        anomaly_flags.append({"flag": "NO_DKIM", "detail": "Missing DKIM-Signature header"})
    if not msg.get("SPF") and not any("spf" in str(r).lower() for r in received_headers):
        anomaly_flags.append({"flag": "NO_SPF_EVIDENCE", "detail": "No SPF pass/fail in Received headers"})

    suspicious_urls = [u for u in urls if any(
        kw in u.lower() for kw in ["bit.ly", "tinyurl", "paypal-", "secure-", "login-", "verify-"]
    )]
    if suspicious_urls:
        anomaly_flags.append({"flag": "SUSPICIOUS_URLS", "detail": suspicious_urls})

    return {
        "from": {"name": from_name, "address": from_addr},
        "to": to_raw,
        "reply_to": reply_to_addr,
        "subject": msg.get("Subject", ""),
        "sent_at": sent_at,
        "message_id": msg.get("Message-ID", ""),
        "received_hop_ips": hop_ips,
        "received_hop_domains": hop_domains,
        "received_hop_count": len(received_headers),
        "urls": urls,
        "suspicious_urls": suspicious_urls,
        "attachments": attachments,
        "attachment_count": len(attachments),
        "body_preview": body_plain[:500] if body_plain else body_html[:500],
        "anomaly_flags": anomaly_flags,
        "headers": {k: str(v)[:500] for k, v in list(headers.items())[:30]},
        "file_type": "email",
    }
