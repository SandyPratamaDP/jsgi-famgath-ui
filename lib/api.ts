const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export async function fetcher(url: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = new Error('Request failed');
    throw error;
  }

  return response.json();
}

export async function uploadExcel(file: File) {
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(`${API_BASE}/import-employees`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const error = new Error('Upload failed');
    throw error;
  }

  return response.json();
}

export async function fetchEmployees() {
  return fetcher('/employees');
}

export async function searchEmployees(query: string) {
  return fetcher(`/employees/search?query=${encodeURIComponent(query)}`);
}

export async function updateEmployee(id: number, payload: Record<string, unknown>) {
  return fetcher(`/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function downloadEmployeePdf(id: number) {
  const response = await fetch(`${API_BASE}/employees/${id}/pdf`);
  if (!response.ok) throw new Error('Failed to download PDF');
  return response.blob();
}

export async function generateAndDownloadPdfs() {
  const response = await fetch(`${API_BASE}/employees/generate-pdfs`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDF bundle');
  }

  return response.blob();
}
