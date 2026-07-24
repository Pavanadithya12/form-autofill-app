import json
from fastapi import APIRouter, Response, HTTPException
from app.models.schemas import ExportRequest
from app.services.pdf_generator import generate_pdf_report

router = APIRouter(prefix="/export", tags=["Export"])

@router.post("/json")
async def export_json(request: ExportRequest):
    content = json.dumps(request.data, indent=2)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=extracted_data.json"}
    )

@router.post("/pdf")
async def export_pdf(request: ExportRequest):
    try:
        pdf_bytes = generate_pdf_report(request.data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=extracted_summary_report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Generation error: {e}")
