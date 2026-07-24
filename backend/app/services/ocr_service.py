import io
import logging
from PIL import Image

logger = logging.getLogger("uvicorn")


def extract_text_from_image(image_bytes: bytes) -> tuple[str, float]:
    """
    Extracts text from image bytes using pytesseract (lightweight, no PyTorch).
    Returns tuple of (extracted_text, average_confidence).
    """
    try:
        import pytesseract
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        # Get text with confidence data
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        
        words = []
        confidences = []
        for i, word in enumerate(data["text"]):
            word = word.strip()
            conf = int(data["conf"][i])
            if word and conf > 0:
                words.append(word)
                confidences.append(conf / 100.0)

        full_text = " ".join(words)
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.75
        return full_text, float(avg_conf)

    except ImportError:
        logger.warning("pytesseract not installed. Trying basic PIL approach.")
        return _fallback_pil_ocr(image_bytes)
    except Exception as e:
        logger.error(f"Image OCR error: {e}")
        return _fallback_pil_ocr(image_bytes)


def _fallback_pil_ocr(image_bytes: bytes) -> tuple[str, float]:
    """Fallback: return empty so the proper error is raised."""
    return "", 0.0
