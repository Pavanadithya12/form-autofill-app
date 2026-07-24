export interface ExtractedField {
  value: string | null;
  confidence: number;
  is_missing: boolean;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year?: string;
  gpa?: string;
}

export interface ExperienceEntry {
  job_title: string;
  company: string;
  duration?: string;
  description?: string;
}

export interface ProjectEntry {
  title: string;
  technologies?: string;
  description?: string;
}

export interface CertificationEntry {
  title: string;
  issuer?: string;
  year?: string;
}

export interface ExtractedData {
  full_name: ExtractedField;
  email: ExtractedField;
  phone: ExtractedField;
  address: ExtractedField;
  dob: ExtractedField;
  skills: string[];
  languages: string[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
}

export interface ExtractionResponse {
  id: string;
  filename: string;
  file_type: string;
  doc_type: 'Resume' | 'Invoice' | 'ID Card' | 'Application Form' | 'Unknown Document';
  summary: string;
  extracted_data: ExtractedData;
  avg_confidence: number;
  created_at: string;
}
