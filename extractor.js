/**
 * extractor.js – Document Text Extraction Module
 * AutoForm AI
 *
 * Handles text extraction from:
 *   - PDF  → PDF.js
 *   - DOCX → Mammoth.js
 *   - Images (JPG/PNG/WEBP/BMP/TIFF) → Tesseract.js OCR
 */

// ── Configure PDF.js worker ──────────────────────────────────────
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

/**
 * Main dispatcher – detects file type and routes to appropriate extractor.
 * @param {File} file
 * @param {Function} onProgress – called with (percent, message)
 * @returns {Promise<string>} extracted plain text
 */
async function extractTextFromFile(file, onProgress = () => {}) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return extractFromPDF(file, onProgress);
  } else if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/msword' ||
    name.endsWith('.docx') ||
    name.endsWith('.doc')
  ) {
    return extractFromDOCX(file, onProgress);
  } else if (
    type.startsWith('image/') ||
    /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(name)
  ) {
    return extractFromImage(file, onProgress);
  } else {
    throw new Error(`Unsupported file type: ${file.type || name}`);
  }
}

/**
 * Extract text from a PDF file using PDF.js.
 * @param {File} file
 * @param {Function} onProgress
 * @returns {Promise<string>}
 */
async function extractFromPDF(file, onProgress) {
  onProgress(5, 'Loading PDF...');

  const arrayBuffer = await file.arrayBuffer();

  onProgress(15, 'Parsing PDF structure...');

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;

  onProgress(25, `Found ${numPages} page(s). Extracting text...`);

  let fullText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Reconstruct text with spatial awareness
    let pageText = '';
    let lastY = null;

    for (const item of textContent.items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        pageText += '\n';
      }
      pageText += item.str + ' ';
      lastY = item.transform[5];
    }

    fullText += pageText.trim() + '\n\n';

    const progress = 25 + Math.round((pageNum / numPages) * 55);
    onProgress(progress, `Processed page ${pageNum} of ${numPages}`);
  }

  onProgress(85, 'Finalizing extraction...');
  return cleanText(fullText);
}

/**
 * Extract text from a DOCX file using Mammoth.js.
 * @param {File} file
 * @param {Function} onProgress
 * @returns {Promise<string>}
 */
async function extractFromDOCX(file, onProgress) {
  onProgress(10, 'Loading Word document...');

  if (typeof mammoth === 'undefined') {
    throw new Error('Mammoth.js is not loaded. Please check your internet connection.');
  }

  const arrayBuffer = await file.arrayBuffer();
  onProgress(40, 'Parsing document structure...');

  const result = await mammoth.extractRawText({ arrayBuffer });

  onProgress(85, 'Text extracted successfully...');

  if (result.messages && result.messages.length > 0) {
    console.warn('Mammoth messages:', result.messages);
  }

  return cleanText(result.value);
}

/**
 * Extract text from an image file using Tesseract.js OCR.
 * @param {File} file
 * @param {Function} onProgress
 * @returns {Promise<string>}
 */
async function extractFromImage(file, onProgress) {
  onProgress(5, 'Initializing OCR engine...');

  if (typeof Tesseract === 'undefined') {
    throw new Error('Tesseract.js is not loaded. Please check your internet connection.');
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const pct = Math.round(m.progress * 75) + 10;
          onProgress(pct, `OCR in progress: ${Math.round(m.progress * 100)}%`);
        } else if (m.status === 'loading tesseract core') {
          onProgress(8, 'Loading OCR engine...');
        } else if (m.status === 'initializing api') {
          onProgress(12, 'Initializing OCR...');
        } else if (m.status === 'loading language traineddata') {
          onProgress(18, 'Loading language model...');
        }
      }
    });

    const { data } = await worker.recognize(imageUrl);
    await worker.terminate();

    onProgress(85, `OCR complete (confidence: ${Math.round(data.confidence)}%)`);

    return cleanText(data.text);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Clean and normalize extracted text.
 * @param {string} text
 * @returns {string}
 */
function cleanText(text) {
  return text
    // Remove non-printable characters except newlines/tabs
    .replace(/[^\x20-\x7E\n\r\t\u00A0-\u024F]/g, ' ')
    // Collapse multiple spaces to one
    .replace(/[ \t]+/g, ' ')
    // Collapse more than 3 consecutive newlines
    .replace(/\n{4,}/g, '\n\n\n')
    // Trim leading/trailing whitespace on each line
    .split('\n').map(l => l.trim()).join('\n')
    // Final trim
    .trim();
}
