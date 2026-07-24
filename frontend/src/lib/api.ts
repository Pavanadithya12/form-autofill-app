import axios from 'axios';
import { ExtractionResponse } from '../types/extraction';

const RENDER_BACKEND = 'https://form-autofill-app-4qdn.onrender.com';
const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : `${RENDER_BACKEND}/api`;

// Axios instance with 120 second timeout (for Render cold starts)
const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

/** Ping backend to wake it up (called on page load) */
export async function pingBackend(): Promise<void> {
  await axios.get(`${RENDER_BACKEND}/`, { timeout: 30000 });
}

export async function uploadDocument(file: File): Promise<ExtractionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ExtractionResponse>('/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

export async function fetchHistory(): Promise<ExtractionResponse[]> {
  const response = await api.get<ExtractionResponse[]>('/history');
  return response.data;
}

export async function exportDataJSON(data: any) {
  const response = await api.post('/export/json', { data, format: 'json' }, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'extracted_data.json');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function exportDataPDF(data: any) {
  const response = await api.post('/export/pdf', { data, format: 'pdf' }, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'extracted_summary_report.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
}
