import { getToken } from './auth';

// Path relatif: browser cuma manggil origin Next.js sendiri, yang lalu
// di-proxy ke Laravel internal lewat rewrite di next.config.ts.
// Prefix '/famgath' wajib disertakan manual karena basePath Next.js cuma
// berlaku otomatis untuk routing/rewrite, bukan untuk fetch() biasa.
const API_BASE      = '/famgath/api/v1';
const AUTH_API_BASE = '/famgath/api';

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetcher(url: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = new Error('Request failed');
    throw error;
  }

  return response.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function loginApi(username: string, password: string) {
  const response = await fetch(`${AUTH_API_BASE}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login gagal.');
  }

  return data as { token: string; role: string; display_name: string };
}

export async function logoutApi() {
  await fetch(`${AUTH_API_BASE}/v1/auth/logout`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...authHeaders() },
  }).catch(() => {});
}

// ── Employees ────────────────────────────────────────────────────────────────

export async function uploadExcel(file: File) {
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(`${API_BASE}/import-employees`, {
    method: 'POST',
    headers: authHeaders(),
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
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function downloadEmployeePdf(id: number) {
  const response = await fetch(`${API_BASE}/employees/${id}/pdf`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to download PDF');
  return response.blob();
}

export async function downloadEmployeeImage(id: number) {
  const response = await fetch(`${API_BASE}/employees/${id}/image`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to download image');
  return response.blob();
}

export async function generateAndDownloadPdfs() {
  const response = await fetch(`${API_BASE}/employees/generate-pdfs`, {
    method: 'POST',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDF bundle');
  }

  return response.blob();
}
