import { getToken, clearAuth } from './auth';
import { BASE_PATH } from './basePath';

// Path relatif: browser cuma manggil origin Next.js sendiri, yang lalu
// di-proxy ke Laravel internal lewat rewrite di next.config.ts.
// Prefix basePath wajib disertakan manual karena basePath Next.js cuma
// berlaku otomatis untuk routing/rewrite, bukan untuk fetch() biasa.
const API_BASE      = `${BASE_PATH}/api/v1`;
const AUTH_API_BASE = `${BASE_PATH}/api`;

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Token bisa hangus (expired atau di-revoke, misal habis logout di device lain)
// kapan saja di antara satu polling SWR dan yang berikutnya. Tanpa ini, request
// akan terus gagal diam-diam ("Gagal memuat data") dan user tidak pernah tahu
// dia harus login ulang.
function handleUnauthorized() {
  clearAuth();
  if (typeof window !== 'undefined') {
    window.location.href = `${BASE_PATH}/login?expired=1`;
  }
}

// Semua request berbekal token lewat sini supaya penanganan 401 konsisten
// di seluruh endpoint (json maupun blob/file).
async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    handleUnauthorized();
  }

  return response;
}

export async function fetcher(url: string, options: RequestInit = {}) {
  const response = await authFetch(url, options);

  if (!response.ok) {
    throw new Error('Request failed');
  }

  return response.json();
}

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
    super(body?.message || 'Request failed');
    this.status = status;
    this.body = body;
  }
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

  const response = await authFetch('/import-employees', {
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
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function downloadEmployeePdf(id: number) {
  const response = await authFetch(`/employees/${id}/pdf`);
  if (!response.ok) throw new Error('Failed to download PDF');
  return response.blob();
}

export async function downloadEmployeeImage(id: number) {
  const response = await authFetch(`/employees/${id}/image`);
  if (!response.ok) throw new Error('Failed to download image');
  return response.blob();
}

export async function blastTicketEmail() {
  const response = await authFetch('/employees/blast-email', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to blast ticket email');
  }

  return response.json();
}

export async function sendEmployeeEmail(id: number) {
  const response = await authFetch(`/employees/${id}/send-email`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to send employee ticket email');
  }

  return response.json();
}

export async function downloadBlankTicketForm() {
  const response = await authFetch('/tickets/blank');
  if (!response.ok) throw new Error('Failed to download blank ticket form');
  return response.blob();
}

export async function downloadEmployeeQr(id: number) {
  const response = await authFetch(`/employees/${id}/qr`);
  if (!response.ok) throw new Error('Failed to download QR');
  return response.blob();
}

// ── Ancol gate-entry QR ──────────────────────────────────────────────────────

export type AncolQrCategory = 'local' | 'expat' | 'operational';

export async function fetchAncolQr(category: AncolQrCategory) {
  const response = await authFetch(`/ancol-qr/${category}`);
  if (!response.ok) throw new Error('Failed to load QR');
  return response.blob();
}

export async function uploadAncolQr(category: AncolQrCategory, file: File) {
  const form = new FormData();
  form.append('image', file);

  const response = await authFetch(`/ancol-qr/${category}`, {
    method: 'POST',
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}

// ── Wahana check-in ──────────────────────────────────────────────────────────

export async function searchWahana(query: string) {
  return fetcher(`/wahana/search?query=${encodeURIComponent(query)}`);
}

export async function checkinWahana(employeeId: number, wahana: 'sea_world' | 'samudera') {
  const response = await authFetch(`/wahana/${employeeId}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wahana }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}
