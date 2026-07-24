from typing import List, Optional, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime

class DocumentType(str, Enum):
    RESUME = "Resume"
    INVOICE = "Invoice"
    ID_CARD = "ID Card"
    APPLICATION_FORM = "Application Form"
    UNKNOWN = "Unknown Document"

class ExtractedField(BaseModel):
    value: Optional[Any] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    is_missing: bool = False

class EducationEntry(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None
    gpa: Optional[str] = None

class ExperienceEntry(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None

class ProjectEntry(BaseModel):
    title: Optional[str] = None
    technologies: Optional[str] = None
    description: Optional[str] = None

class CertificationEntry(BaseModel):
    title: Optional[str] = None
    issuer: Optional[str] = None
    year: Optional[str] = None

class ExtractedData(BaseModel):
    full_name: ExtractedField
    email: ExtractedField
    phone: ExtractedField
    address: ExtractedField
    dob: ExtractedField
    skills: List[str] = []
    languages: List[str] = []
    education: List[EducationEntry] = []
    experience: List[ExperienceEntry] = []
    projects: List[ProjectEntry] = []
    certifications: List[CertificationEntry] = []

class ExtractionResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    doc_type: DocumentType
    summary: str
    extracted_data: ExtractedData
    avg_confidence: float
    created_at: str

class ExportRequest(BaseModel):
    data: dict
    format: str = "json" # json or pdf
