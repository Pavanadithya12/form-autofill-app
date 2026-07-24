import io
import logging
import pdfplumber

logger = logging.getLogger("uvicorn")

def extract_text_from_pdf(pdf_bytes: bytes) -> tuple[str, float]:
    """
    Extracts text from PDF bytes using pdfplumber.
    Returns tuple of (extracted_text, confidence).
    """
    try:
        text_content = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content.append(page_text)
                
                # Also extract tables if present
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        row_filtered = [str(cell) for cell in row if cell]
                        if row_filtered:
                            text_content.append(" | ".join(row_filtered))

        full_text = "\n".join(text_content)
        confidence = 0.95 if len(full_text.strip()) > 50 else 0.5
        return full_text, confidence
    except Exception as e:
        logger.error(f"PDF extraction error with pdfplumber: {e}")
        return "", 0.0
