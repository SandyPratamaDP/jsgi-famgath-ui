export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_ROLE_KEY  = 'user_role';
export const DISPLAY_NAME_KEY = 'display_name';

function setCookie(name: string, value: string, hours = 12) {
  const expires = new Date(Date.now() + hours * 3600 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function saveAuth(token: string, role: string, displayName: string) {
  setCookie(AUTH_TOKEN_KEY, token);
  setCookie(USER_ROLE_KEY, role);
  setCookie(DISPLAY_NAME_KEY, displayName);
}

export function clearAuth() {
  deleteCookie(AUTH_TOKEN_KEY);
  deleteCookie(USER_ROLE_KEY);
  deleteCookie(DISPLAY_NAME_KEY);
}

export function getToken(): string | null {
  return getCookie(AUTH_TOKEN_KEY);
}

export function getRole(): string | null {
  return getCookie(USER_ROLE_KEY);
}

export function getDisplayName(): string | null {
  return getCookie(DISPLAY_NAME_KEY);
}
