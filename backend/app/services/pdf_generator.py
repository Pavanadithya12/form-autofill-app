import io
import logging
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

logger = logging.getLogger("uvicorn")

def generate_pdf_report(data: dict) -> bytes:
    """
    Generates a clean PDF summary report from extracted form data using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#1976d2'),
        spaceAfter=12
    )
    
    story.append(Paragraph("Intelligent Form Auto-Filler — Summary Report", title_style))
    story.append(Spacer(1, 10))

    ext_data = data.get("extracted_data", data)
    
    # Personal Info Table
    table_data = [
        [Paragraph("<b>Field</b>", styles['Normal']), Paragraph("<b>Extracted Value</b>", styles['Normal'])]
    ]

    for key, label in [("full_name", "Full Name"), ("email", "Email Address"), ("phone", "Phone Number"), ("dob", "Date of Birth"), ("address", "Address")]:
        val_obj = ext_data.get(key, {})
        val = val_obj.get("value") if isinstance(val_obj, dict) else str(val_obj)
        table_data.append([Paragraph(f"<b>{label}</b>", styles['Normal']), Paragraph(str(val or "N/A"), styles['Normal'])])

    skills = ext_data.get("skills", [])
    if isinstance(skills, list) and skills:
        table_data.append([Paragraph("<b>Skills</b>", styles['Normal']), Paragraph(", ".join(skills), styles['Normal'])])

    t = Table(table_data, colWidths=[150, 380])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))

    story.append(t)
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
