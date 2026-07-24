import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTask
from app.models.schemas import ExtractionResponse, DocumentType
from app.services.ocr_service import extract_text_from_image
from app.services.pdf_service import extract_text_from_pdf
from app.services.docx_service import extract_text_from_docx
from app.services.nlp_service import parse_entities_with_nlp, classify_document_type, generate_ai_summary
from app.database import save_extraction_history

router = APIRouter(prefix="/extract", tags=["Extraction"])

@APIRouter().post("", response_model=ExtractionResponse)
@router.post("", response_model=ExtractionResponse)
async def extract_document(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided.")
    
    file_bytes = await file.read()
    filename = file.filename or "uploaded_document"
    ext = filename.split(".")[-1].lower()

    extracted_text = ""
    base_confidence = 0.90

    if ext in ["png", "jpg", "jpeg", "webp", "bmp", "tiff"]:
        extracted_text, base_confidence = extract_text_from_image(file_bytes)
        file_type = "Image"
    elif ext == "pdf":
        extracted_text, base_confidence = extract_text_from_pdf(file_bytes)
        file_type = "PDF Document"
    elif ext in ["docx", "doc"]:
        extracted_text, base_confidence = extract_text_from_docx(file_bytes)
        file_type = "Word Document"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file format: .{ext}")

    if not extracted_text or len(extracted_text.strip()) < 10:
        raise HTTPException(
            status_code=422,
            detail="Could not extract readable text from document. Please ensure file is not empty or corrupted."
        )

    doc_type = classify_document_type(extracted_text)
    summary = generate_ai_summary(extracted_text, doc_type)
    extracted_data = parse_entities_with_nlp(extracted_text, base_confidence)

    # Calculate overall avg confidence
    confidences = [
        extracted_data.full_name.confidence,
        extracted_data.email.confidence,
        extracted_data.phone.confidence,
        extracted_data.address.confidence,
        extracted_data.dob.confidence,
    ]
    valid_confs = [c for c in confidences if c > 0]
    avg_confidence = round(sum(valid_confs) / len(valid_confs) if valid_confs else base_confidence, 2)

    doc_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()

    response_data = {
        "id": doc_id,
        "filename": filename,
        "file_type": file_type,
        "doc_type": doc_type.value,
        "summary": summary,
        "extracted_data": extracted_data.model_dump(),
        "avg_confidence": avg_confidence,
        "created_at": created_at
    }

    # Save to MongoDB Atlas
    await save_extraction_history(response_data)

    return response_data
