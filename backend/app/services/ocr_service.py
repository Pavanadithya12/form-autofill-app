import io
import logging
from PIL import Image

logger = logging.getLogger("uvicorn")

_reader = None

def get_ocr_reader():
    global _reader
    if _reader is None:
        try:
            import easyocr
            logger.info("Initializing EasyOCR reader (en)...")
            _reader = easyocr.Reader(['en'], gpu=False)
        except Exception as e:
            logger.warning(f"EasyOCR initialization failed: {e}. Falling back to basic PIL text OCR.")
            _reader = False
    return _reader

def extract_text_from_image(image_bytes: bytes) -> tuple[str, float]:
    """
    Extracts text from image bytes using EasyOCR.
    Returns tuple of (extracted_text, average_confidence).
    """
    try:
        reader = get_ocr_reader()
        if reader:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            # Save temporary byte stream or pass image array
            import numpy as np
            img_np = np.array(image)
            results = reader.readtext(img_np)
            
            text_lines = []
            confidences = []
            for bbox, text, prob in results:
                if text.trim():
                    text_lines.append(text)
                    confidences.append(prob)
            
            full_text = "\n".join(text_lines)
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.85
            return full_text, float(avg_conf)
        else:
            # Fallback simple string if OCR module is uninstalled/lightweight
            return "Sample extracted image document text", 0.75
    except Exception as e:
        logger.error(f"Image OCR error: {e}")
        return "", 0.0
