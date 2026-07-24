import axios from 'axios';
import { ExtractionResponse } from '../types/extraction';

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : '/api';

export async function uploadDocument(file: File): Promise<ExtractionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<ExtractionResponse>(`${API_BASE}/extract`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function fetchHistory(): Promise<ExtractionResponse[]> {
  const response = await axios.get<ExtractionResponse[]>(`${API_BASE}/history`);
  return response.data;
}

export async function exportDataJSON(data: any) {
  const response = await axios.post(`${API_BASE}/export/json`, { data, format: 'json' }, {
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
  const response = await axios.post(`${API_BASE}/export/pdf`, { data, format: 'pdf' }, {
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
