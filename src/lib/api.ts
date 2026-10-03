/**
 * Shared API utilities for DAL functions that call the real NestJS backend.
 * Phase 1 read-side swap — Doc 09 §6.
 */

import { API_BASE_URL, getApiBaseUrl } from './apiBase';
export { API_BASE_URL, getApiBaseUrl };

const ADMIN_SESSION_KEY = 'prime_view_admin_session';
const MEMBER_SESSION_KEY = 'prime_view_member_session';

/**
 * Get the active admin JWT access token from sessionStorage or localStorage.
 */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      if (parsed?.token) return parsed.token;
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Get the active member JWT access token from sessionStorage.
 */
export function getMemberToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = sessionStorage.getItem(MEMBER_SESSION_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      if (parsed?.token) return parsed.token;
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Build a standard Authorization header object from a token.
 */
export function authHeader(token?: string): Record<string, string> {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  details?: any;
}

function sanitizeErrorMessage(rawMessage?: any): string {
  if (
    rawMessage === 'Invalid credentials.' ||
    rawMessage === 'Account locked due to too many failed attempts.'
  ) {
    return rawMessage;
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Generic API GET helper.
 */
export async function apiGet<T>(path: string, token?: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const safeMsg = sanitizeErrorMessage(body?.message);
      return {
        ok: false,
        error: safeMsg,
        message: safeMsg,
        status: res.status,
      };
    }
    return { ok: true, data: (body?.data !== undefined ? body.data : body) as T, status: res.status };
  } catch {
    const safeMsg = 'Something went wrong. Please try again.';
    return { ok: false, error: safeMsg, message: safeMsg };
  }
}

/**
 * Generic API POST helper.
 */
export async function apiPost<T>(path: string, bodyData: any, token?: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(bodyData),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const safeMsg = sanitizeErrorMessage(body?.message);
      return {
        ok: false,
        error: safeMsg,
        message: safeMsg,
        status: res.status,
      };
    }
    return { ok: true, data: (body?.data !== undefined ? body.data : body) as T, status: res.status };
  } catch {
    const safeMsg = 'Something went wrong. Please try again.';
    return { ok: false, error: safeMsg, message: safeMsg };
  }
}

/**
 * Generic API PATCH helper.
 */
export async function apiPatch<T>(path: string, bodyData: any, token?: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(bodyData),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const safeMsg = sanitizeErrorMessage(body?.message);
      return {
        ok: false,
        error: safeMsg,
        message: safeMsg,
        status: res.status,
      };
    }
    return { ok: true, data: (body?.data !== undefined ? body.data : body) as T, status: res.status };
  } catch {
    const safeMsg = 'Something went wrong. Please try again.';
    return { ok: false, error: safeMsg, message: safeMsg };
  }
}

/**
 * Generic API DELETE helper.
 */
export async function apiDelete<T = any>(path: string, token?: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const safeMsg = sanitizeErrorMessage(body?.message);
      return {
        ok: false,
        error: safeMsg,
        message: safeMsg,
        status: res.status,
      };
    }
    return { ok: true, data: (body?.data !== undefined ? body.data : body) as T, status: res.status };
  } catch {
    const safeMsg = 'Something went wrong. Please try again.';
    return { ok: false, error: safeMsg, message: safeMsg };
  }
}


