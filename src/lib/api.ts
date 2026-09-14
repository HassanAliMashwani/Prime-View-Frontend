/**
 * Shared API utilities for DAL functions that call the real NestJS backend.
 * Phase 1 read-side swap — Doc 09 §6.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const ADMIN_SESSION_KEY = 'prime_view_admin_session';
const MEMBER_SESSION_KEY = 'prime_view_member_session';
const ADMIN_COOKIE_KEY = 'pv_admin_session';
const MEMBER_COOKIE_KEY = 'pv_member_session';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Get the active admin JWT access token from sessionStorage or cookie.
 */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      if (parsed?.token) return parsed.token;
    }
    const cookie = getCookie(ADMIN_COOKIE_KEY);
    if (cookie) {
      const parsed = JSON.parse(cookie);
      if (parsed?.token) return parsed.token;
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Get the active member JWT access token from sessionStorage or cookie.
 */
export function getMemberToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = sessionStorage.getItem(MEMBER_SESSION_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      if (parsed?.token) return parsed.token;
    }
    const cookie = getCookie(MEMBER_COOKIE_KEY);
    if (cookie) {
      const parsed = JSON.parse(cookie);
      if (parsed?.token) return parsed.token;
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Build a standard Authorization header object from a token.
 */
export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Generic API GET helper. Returns { ok, data } or { ok: false, error }.
 */
export async function apiGet<T>(
  path: string,
  token: string
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    });
    if (res.status === 401) return { ok: false, error: 'UNAUTHORIZED', status: 401 };
    if (res.status === 403) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.reason ?? 'FORBIDDEN', status: 403 };
    }
    if (res.status === 404) return { ok: false, error: 'NOT_FOUND', status: 404 };
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: body || `HTTP_${res.status}`, status: res.status };
    }
    const data: T = await res.json();
    return { ok: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'NETWORK_ERROR';
    return { ok: false, error: msg };
  }
}
