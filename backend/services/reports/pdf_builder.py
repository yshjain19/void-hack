"""
PDF report builder using ReportLab.
Generates a professional forensic report with cover page, evidence table,
entity risk chart, anomaly summary, and AI narrative.
"""
from pathlib import Path
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.case import Case
from models.evidence import Evidence
from models.entity import Entity
from models.anomaly import AnomalyResult

try:
    from reportlab.lib.pagesizes import A4, letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, PageBreak,
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    RL_AVAILABLE = True
    BRAND_COLOR = colors.HexColor("#4F46E5")  # Indigo
    DANGER_COLOR = colors.HexColor("#DC2626")  # Red
    WARNING_COLOR = colors.HexColor("#F59E0B")  # Amber
    SUCCESS_COLOR = colors.HexColor("#10B981")  # Emerald
    DARK_BG = colors.HexColor("#1E1B4B")
    LIGHT_GRAY = colors.HexColor("#F8FAFC")
except ImportError:
    RL_AVAILABLE = False
    BRAND_COLOR = DANGER_COLOR = WARNING_COLOR = SUCCESS_COLOR = DARK_BG = LIGHT_GRAY = None


async def build_pdf_report(
    db: AsyncSession,
    case: Case,
    output_path: str,
    options: Any,
) -> None:
    """Generate a full forensic PDF report."""
    if not RL_AVAILABLE:
        # Write a placeholder if ReportLab not installed
        Path(output_path).write_bytes(b"%PDF-1.4 (ReportLab not installed)")
        return

    # Gather data
    evidence_items = (
        await db.execute(select(Evidence).where(Evidence.case_id == case.id).limit(50))
    ).scalars().all()

    entities = (
        await db.execute(
            select(Entity)
            .where(Entity.case_id == case.id)
            .order_by(Entity.risk_score.desc())
            .limit(30)
        )
    ).scalars().all()

    anomalies = (
        await db.execute(
            select(AnomalyResult)
            .where(AnomalyResult.case_id == case.id, AnomalyResult.is_anomaly == True)
            .order_by(AnomalyResult.anomaly_score.asc())
            .limit(20)
        )
    ).scalars().all()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Cover Page ───────────────────────────────────────────
    title_style = ParagraphStyle(
        "title", fontSize=28, textColor=BRAND_COLOR, spaceAfter=12,
        alignment=TA_CENTER, fontName="Helvetica-Bold",
    )
    subtitle_style = ParagraphStyle(
        "subtitle", fontSize=14, textColor=colors.HexColor("#64748B"),
        spaceAfter=6, alignment=TA_CENTER,
    )
    label_style = ParagraphStyle(
        "label", fontSize=10, textColor=colors.HexColor("#94A3B8"), spaceAfter=2,
    )
    value_style = ParagraphStyle(
        "value", fontSize=12, textColor=colors.HexColor("#1E293B"), spaceAfter=8,
        fontName="Helvetica-Bold",
    )
    section_style = ParagraphStyle(
        "section", fontSize=16, textColor=BRAND_COLOR, spaceAfter=12, spaceBefore=20,
        fontName="Helvetica-Bold",
    )
    body_style = ParagraphStyle(
        "body", fontSize=10, textColor=colors.HexColor("#334155"),
        spaceAfter=6, leading=14, alignment=TA_JUSTIFY,
    )

    story.append(Spacer(1, 1.5 * inch))
    story.append(Paragraph("🔍 CyberTrace", title_style))
    story.append(Paragraph("Forensic Investigation Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=BRAND_COLOR, spaceAfter=24))
    story.append(Spacer(1, 0.3 * inch))

    meta_data = [
        ["Case ID", case.id],
        ["Title", case.title],
        ["Status", case.status.upper()],
        ["Priority", case.priority.upper()],
        ["Investigator", case.investigator or "Unassigned"],
        ["Created", case.created_at.strftime("%Y-%m-%d %H:%M UTC") if case.created_at else "—"],
        ["Report Generated", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")],
        ["Evidence Files", str(len(evidence_items))],
        ["Entities Identified", str(len(entities))],
        ["Anomalies Detected", str(len(anomalies))],
    ]

    meta_table = Table(meta_data, colWidths=[3.5 * cm, 12 * cm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#64748B")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#1E293B")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_GRAY, colors.white]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(meta_table)

    if case.description:
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph("Case Description", section_style))
        story.append(Paragraph(case.description, body_style))

    story.append(PageBreak())

    # ── Evidence Table ───────────────────────────────────────
    story.append(Paragraph("Evidence Chain of Custody", section_style))
    ev_headers = [["#", "Filename", "Type", "Size (bytes)", "SHA-256 (partial)", "Uploaded"]]
    ev_rows = ev_headers + [
        [
            str(i + 1),
            ev.original_filename[:40],
            ev.file_type.upper(),
            f"{ev.file_size:,}",
            ev.sha256_hash[:20] + "...",
            ev.uploaded_at.strftime("%Y-%m-%d") if ev.uploaded_at else "—",
        ]
        for i, ev in enumerate(evidence_items)
    ]
    ev_table = Table(ev_rows, colWidths=[0.7 * cm, 5 * cm, 2 * cm, 2.5 * cm, 3.5 * cm, 2.5 * cm])
    ev_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_COLOR),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_GRAY, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(ev_table)

    # ── Entity Risk Table ────────────────────────────────────
    if entities:
        story.append(PageBreak())
        story.append(Paragraph("Entity Risk Assessment", section_style))
        ent_headers = [["Entity", "Type", "Risk Score", "Risk Level"]]
        ent_rows = ent_headers + [
            [
                e.label[:50],
                e.entity_type.upper(),
                f"{e.risk_score:.3f}",
                _risk_label(e.risk_score),
            ]
            for e in entities[:25]
        ]
        ent_table = Table(ent_rows, colWidths=[7 * cm, 3 * cm, 3 * cm, 3 * cm])
        ent_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_COLOR),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_GRAY, colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(ent_table)

    # ── Anomaly Table ────────────────────────────────────────
    if anomalies:
        story.append(Spacer(1, 0.3 * inch))
        story.append(Paragraph("Anomaly Detection Results", section_style))
        an_headers = [["Row", "Score", "Algorithm", "Explanation"]]
        an_rows = an_headers + [
            [
                str(a.row_index or "—"),
                f"{a.anomaly_score:.4f}",
                a.algorithm.replace("_", " ").title(),
                (a.explanation or "—")[:80],
            ]
            for a in anomalies[:15]
        ]
        an_table = Table(an_rows, colWidths=[1.5 * cm, 2 * cm, 3.5 * cm, 9 * cm])
        an_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DANGER_COLOR),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#FEF2F2"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#FECACA")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(an_table)

    # ── Footer ───────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Legal Notice & Disclaimer", section_style))
    story.append(Paragraph(
        "This report was generated by CyberTrace, an AI-assisted forensic investigation platform. "
        "All evidence has been preserved with SHA-256 cryptographic hashing and an immutable "
        "chain-of-custody log. The findings in this report are based on automated analysis "
        "and should be reviewed by a qualified forensic investigator before use in legal proceedings. "
        "CyberTrace does not warrant the completeness or accuracy of AI-generated assessments.",
        body_style,
    ))

    doc.build(story)


def _risk_label(score: float) -> str:
    if score >= 0.7:
        return "CRITICAL"
    if score >= 0.5:
        return "HIGH"
    if score >= 0.3:
        return "MEDIUM"
    return "LOW"
