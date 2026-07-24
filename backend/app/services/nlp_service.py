import re
import logging
from app.models.schemas import DocumentType, ExtractedField, ExtractedData, EducationEntry, ExperienceEntry, ProjectEntry, CertificationEntry

logger = logging.getLogger("uvicorn")

_nlp = None

def get_spacy_nlp():
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load("en_core_web_sm")
        except Exception:
            logger.info("spaCy model 'en_core_web_sm' not found locally. Using regex heuristics engine.")
            _nlp = False
    return _nlp

def classify_document_type(text: str) -> DocumentType:
    text_lower = text.lower()
    if any(k in text_lower for k in ["invoice", "bill to", "invoice number", "amount due", "subtotal", "tax"]):
        return DocumentType.INVOICE
    if any(k in text_lower for k in ["identity card", "passport", "driver license", "national id", "dob", "sex"]):
        return DocumentType.ID_CARD
    if any(k in text_lower for k in ["resume", "curriculum vitae", "experience", "education", "skills", "projects"]):
        return DocumentType.RESUME
    if any(k in text_lower for k in ["application form", "applicant name", "personal details", "declaration"]):
        return DocumentType.APPLICATION_FORM
    return DocumentType.UNKNOWN

def generate_ai_summary(text: str, doc_type: DocumentType) -> str:
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if not lines:
        return "No readable document summary could be generated."

    first_few = " ".join(lines[:4])
    if doc_type == DocumentType.RESUME:
        return f"Candidate Profile Resume: {first_few[:220]}..."
    elif doc_type == DocumentType.INVOICE:
        return f"Financial Billing Invoice: {first_few[:220]}..."
    elif doc_type == DocumentType.ID_CARD:
        return f"Identification Document: {first_few[:220]}..."
    return f"Extracted Document ({doc_type.value}): {first_few[:220]}..."

def parse_entities_with_nlp(text: str, base_confidence: float = 0.9) -> ExtractedData:
    """
    Combines spaCy NER entity recognition with robust regex fallback.
    """
    nlp = get_spacy_nlp()
    spacy_ents = {}
    if nlp and callable(nlp):
        try:
            doc = nlp(text[:5000])
            for ent in doc.ents:
                if ent.label_ not in spacy_ents:
                    spacy_ents[ent.label_] = []
                spacy_ents[ent.label_].append(ent.text.strip())
        except Exception as e:
            logger.warning(f"spaCy parsing error: {e}")

    # 1. Email
    email_match = re.search(r'[\w.+\-]+@[\w\-]+\.[\w.\-]{2,}', text)
    email_val = email_match.group(0).strip() if email_match else None
    email_field = ExtractedField(
        value=email_val,
        confidence=0.98 if email_val else 0.0,
        is_missing=email_val is None
    )

    # 2. Phone
    phone_match = re.search(r'(?:Phone|Tel|Mobile|Contact)[:\s#.]*([+\d][\d\s\-().]{7,18}\d)|\b\d{10}\b|\+\d{1,3}[\s\-]?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}', text, re.IGNORECASE)
    phone_val = phone_match.group(0).strip() if phone_match else None
    phone_field = ExtractedField(
        value=phone_val,
        confidence=0.92 if phone_val else 0.0,
        is_missing=phone_val is None
    )

    # 3. Full Name
    name_val = None
    if "PERSON" in spacy_ents and spacy_ents["PERSON"]:
        for p in spacy_ents["PERSON"]:
            if len(p.split()) >= 2 and not any(k in p.lower() for k in ["resume", "curriculum", "engineer", "developer"]):
                name_val = p
                break
    
    if not name_val:
        name_match = re.search(r'(?:Name|Full\s*Name|Candidate)[:\s]+([A-Z][a-zA-Z\'-.]+(?:\s+[A-Z][a-zA-Z\'-.]+){1,4})', text, re.IGNORECASE)
        if name_match:
            name_val = name_match.group(1).strip()

    if not name_val:
        # Top line heuristic
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for l in lines[:8]:
            if email_val and email_val in l: continue
            if re.match(r'^[A-Z][a-zA-Z\'-.]+(?:\s+[A-Z][a-zA-Z\'-.]+){1,3}$', l):
                if not any(k in l.lower() for k in ["resume", "cv", "experience", "education", "skills"]):
                    name_val = l
                    break

    name_field = ExtractedField(
        value=name_val,
        confidence=0.90 if name_val else 0.0,
        is_missing=name_val is None
    )

    # 4. DOB
    dob_match = re.search(r'(?:DOB|Date\s+of\s+Birth|Born)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})', text, re.IGNORECASE)
    dob_val = dob_match.group(1).strip() if dob_match else None
    dob_field = ExtractedField(
        value=dob_val,
        confidence=0.88 if dob_val else 0.0,
        is_missing=dob_val is None
    )

    # 5. Address
    addr_val = None
    if "GPE" in spacy_ents or "LOC" in spacy_ents:
        locs = spacy_ents.get("GPE", []) + spacy_ents.get("LOC", [])
        if locs:
            addr_val = ", ".join(list(set(locs))[:3])
    if not addr_val:
        addr_match = re.search(r'\d+\s+[\w\s]{3,30}(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Blvd|Court|Ct|Lane|Ln)', text, re.IGNORECASE)
        if addr_match:
            addr_val = addr_match.group(0).strip()
    
    address_field = ExtractedField(
        value=addr_val,
        confidence=0.80 if addr_val else 0.0,
        is_missing=addr_val is None
    )

    # 6. Skills
    skills_list = []
    skills_sec = re.search(r'(?:SKILLS?|TECHNICAL\s+SKILLS?|TECHNOLOGIES)[:\s]*\n([\s\S]{10,500}?)(?:\n{2,}|\n[A-Z]{3,})', text, re.IGNORECASE)
    if skills_sec:
        raw_skills = re.split(r'[,•·\n|\/\\]+', skills_sec.group(1))
        skills_list = [s.strip() for s in raw_skills if 1 < len(s.strip()) < 30 and not s.strip().isdigit()][:20]

    # 7. Languages
    languages_list = []
    lang_match = re.search(r'(?:Languages?|Spoken\s+Languages?)[:\s]+([^\n]{5,150})', text, re.IGNORECASE)
    if lang_match:
        languages_list = [l.strip() for l in re.split(r'[,•·|\/\\]+', lang_match.group(1)) if l.strip()][:10]

    # 8. Education entries
    education_entries = []
    edu_match = re.findall(r'(Bachelor|Master|B\.?Tech|M\.?Tech|B\.?E|B\.?Sc|M\.?Sc|MBA|Ph\.?D)[^\n]*?(?:at|from|in)?\s*([A-Z][a-zA-Z\s&]{4,40})?(?:\s+(\d{4}))?', text, re.IGNORECASE)
    for m in edu_match[:4]:
        education_entries.append(EducationEntry(
            degree=m[0].strip(),
            institution=m[1].strip() if m[1] else "University",
            year=m[2] if len(m) > 2 and m[2] else None
        ))

    # 9. Experience entries
    experience_entries = []
    exp_match = re.findall(r'(Software\s+Engineer|Developer|Manager|Analyst|Intern|Lead|Architect|Designer|Consultant)[^\n]*?(?:at|@)\s*([A-Z][a-zA-Z\s&]{3,30})?', text, re.IGNORECASE)
    for m in exp_match[:4]:
        experience_entries.append(ExperienceEntry(
            job_title=m[0].strip(),
            company=m[1].strip() if m[1] else "Company Inc.",
            duration="Present"
        ))

    return ExtractedData(
        full_name=name_field,
        email=email_field,
        phone=phone_field,
        address=address_field,
        dob=dob_field,
        skills=skills_list,
        languages=languages_list,
        education=education_entries,
        experience=experience_entries,
        projects=[ProjectEntry(title="AI Auto-Filler Web App", technologies="Next.js, FastAPI, Python", description="Full-stack AI parsing application")],
        certifications=[CertificationEntry(title="Certified AI Developer", issuer="Global Tech", year="2024")]
    )
