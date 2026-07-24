/**
 * Client-side document extraction engine.
 * Runs entirely in the browser — no backend required.
 */

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ExtractedField {
  value: string | null;
  confidence: number;
  is_missing: boolean;
}

export interface ExtractionResult {
  id: string;
  filename: string;
  file_type: string;
  doc_type: string;
  summary: string;
  avg_confidence: number;
  created_at: string;
  extracted_data: {
    full_name: ExtractedField;
    email: ExtractedField;
    phone: ExtractedField;
    address: ExtractedField;
    dob: ExtractedField;
    skills: string[];
    languages: string[];
    education: any[];
    experience: any[];
    projects: any[];
    certifications: any[];
  };
}

// ─── PDF Extraction ───────────────────────────────────────────────────────────
async function extractFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

// ─── Image OCR ───────────────────────────────────────────────────────────────
async function extractFromImage(
  file: File,
  onProgress?: (p: number) => void
): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (m: any) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  const { data } = await worker.recognize(file);
  await worker.terminate();
  return data.text;
}

// ─── DOCX Extraction ─────────────────────────────────────────────────────────
async function extractFromDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// ─── NLP / Regex Parsing ─────────────────────────────────────────────────────
function makeField(value: string | null, confidence: number): ExtractedField {
  return { value, confidence, is_missing: !value };
}

function parseEntities(text: string, baseConf: number) {
  // Email
  const emailMatch = text.match(/[\w.+\-]+@[\w\-]+\.[\w.\-]{2,}/);
  const email = emailMatch ? emailMatch[0].trim() : null;

  // Phone
  const phoneMatch = text.match(
    /(?:Phone|Tel|Mobile|Contact)[:\s#.]*([+\d][\d\s\-().]{7,18}\d)|\b\d{10}\b|\+\d{1,3}[\s\-]?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/i
  );
  const phone = phoneMatch ? phoneMatch[0].replace(/^(Phone|Tel|Mobile|Contact)[:\s#.]*/i, '').trim() : null;

  // DOB
  const dobMatch = text.match(
    /(?:DOB|Date\s+of\s+Birth|Born)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})/i
  );
  const dob = dobMatch ? dobMatch[1].trim() : null;

  // Full name — try labeled first, then top-line heuristic
  let name: string | null = null;
  const nameLabelMatch = text.match(
    /(?:Name|Full\s*Name|Candidate)[:\s]+([A-Z][a-zA-Z'\-.]+(?:\s+[A-Z][a-zA-Z'\-.]+){1,4})/i
  );
  if (nameLabelMatch) {
    name = nameLabelMatch[1].trim();
  } else {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 10)) {
      if (email && line.includes(email)) continue;
      if (/^[A-Z][a-zA-Z'\-.]+(?:\s+[A-Z][a-zA-Z'\-.]+){1,3}$/.test(line)) {
        if (!/resume|cv|experience|education|skills/i.test(line)) {
          name = line;
          break;
        }
      }
    }
  }

  // Address
  const addrMatch = text.match(
    /\d+\s+[\w\s]{3,30}(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Blvd|Court|Ct|Lane|Ln)/i
  );
  const address = addrMatch ? addrMatch[0].trim() : null;

  // Skills
  let skills: string[] = [];
  const skillsSection = text.match(
    /(?:SKILLS?|TECHNICAL\s+SKILLS?|TECHNOLOGIES)[:\s]*\n([\s\S]{10,500}?)(?:\n{2,}|\n[A-Z]{3,})/i
  );
  if (skillsSection) {
    skills = skillsSection[1]
      .split(/[,•·\n|\/\\]+/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 30 && !s.match(/^\d+$/))
      .slice(0, 20);
  }

  // Education (Array.from fix for TS downlevelIteration)
  const eduRegex = /(Bachelor|Master|B\.?Tech|M\.?Tech|B\.?E|B\.?Sc|M\.?Sc|MBA|Ph\.?D)[^\n]*?(?:at|from|in)?\s*([A-Z][a-zA-Z\s&]{4,40})?(?:\s+(\d{4}))?/gi;
  const eduMatches = Array.from(text.matchAll(eduRegex));
  const education = eduMatches.slice(0, 4).map((m: RegExpMatchArray) => ({
    degree: m[1]?.trim() || '',
    institution: m[2]?.trim() || 'University',
    year: m[3] || null,
  }));

  // Experience (Array.from fix for TS downlevelIteration)
  const expRegex = /(Software\s+Engineer|Developer|Manager|Analyst|Intern|Lead|Architect|Designer|Consultant)[^\n]*?(?:at|@)\s*([A-Z][a-zA-Z\s&]{3,30})?/gi;
  const expMatches = Array.from(text.matchAll(expRegex));
  const experience = expMatches.slice(0, 4).map((m: RegExpMatchArray) => ({
    job_title: m[1]?.trim() || '',
    company: m[2]?.trim() || 'Company',
    duration: 'Present',
  }));

  // Confidence calculation
  const confs = [
    email ? 0.98 : 0,
    phone ? 0.92 : 0,
    name ? 0.90 : 0,
    dob ? 0.88 : 0,
    address ? 0.80 : 0,
  ].filter(c => c > 0);
  const avgConf = confs.length > 0
    ? Math.round((confs.reduce((a, b) => a + b, 0) / confs.length) * 100) / 100
    : baseConf;

  return {
    full_name: makeField(name, name ? 0.90 : 0),
    email: makeField(email, email ? 0.98 : 0),
    phone: makeField(phone, phone ? 0.92 : 0),
    address: makeField(address, address ? 0.80 : 0),
    dob: makeField(dob, dob ? 0.88 : 0),
    skills,
    languages: [],
    education,
    experience,
    projects: [],
    certifications: [],
    avg_confidence: avgConf,
  };
}

function classifyDoc(text: string): string {
  const t = text.toLowerCase();
  if (/invoice|bill to|amount due|subtotal|tax/.test(t)) return 'invoice';
  if (/identity card|passport|driver license|national id|dob|sex/.test(t)) return 'id_card';
  if (/resume|curriculum vitae|experience|education|skills/.test(t)) return 'resume';
  if (/application form|applicant name|personal details/.test(t)) return 'application_form';
  return 'unknown';
}

function generateSummary(text: string, docType: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const preview = lines.slice(0, 4).join(' ').slice(0, 220);
  const labels: Record<string, string> = {
    resume: 'Candidate Profile Resume',
    invoice: 'Financial Billing Invoice',
    id_card: 'Identification Document',
    application_form: 'Application Form',
    unknown: 'Extracted Document',
  };
  return `${labels[docType] || 'Document'}: ${preview}...`;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────
export async function extractDocument(
  file: File,
  onOcrProgress?: (p: number) => void
): Promise<ExtractionResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let rawText = '';
  let fileType = 'Document';
  let baseConf = 0.90;

  if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'].includes(ext)) {
    rawText = await extractFromImage(file, onOcrProgress);
    fileType = 'Image';
    baseConf = 0.82;
  } else if (ext === 'pdf') {
    rawText = await extractFromPDF(file);
    fileType = 'PDF Document';
    baseConf = 0.95;
  } else if (['docx', 'doc'].includes(ext)) {
    rawText = await extractFromDocx(file);
    fileType = 'Word Document';
    baseConf = 0.93;
  } else {
    throw new Error(`Unsupported file format: .${ext}. Please upload PDF, DOCX, or an image.`);
  }

  if (!rawText || rawText.trim().length < 10) {
    throw new Error('Could not extract readable text from this document. Please try a clearer file.');
  }

  const docType = classifyDoc(rawText);
  const summary = generateSummary(rawText, docType);
  const entities = parseEntities(rawText, baseConf);

  return {
    id: crypto.randomUUID(),
    filename: file.name,
    file_type: fileType,
    doc_type: docType,
    summary,
    avg_confidence: entities.avg_confidence,
    created_at: new Date().toISOString(),
    extracted_data: entities,
  };
}
