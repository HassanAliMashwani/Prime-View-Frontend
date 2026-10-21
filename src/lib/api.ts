/**
 * Shared API utilities for DAL functions that call the real NestJS backend.
 * Phase 1 read-side swap — Doc 09 §6.
 */

import { API_BASE_URL, getApiBaseUrl } from './apiBase';
import { toSafeErrorMessage, GENERAL_SAFE_ERROR } from './safeError';
export { API_BASE_URL, getApiBaseUrl, toSafeErrorMessage, GENERAL_SAFE_ERROR };

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

function sanitizeErrorMessage(rawMessage?: any, rawError?: any): string {
  const combined = `${rawMessage || ''} ${rawError || ''}`.toLowerCase();
  if (
    combined.includes('disallowed_executable_content') ||
    combined.includes('disallowed executable') ||
    combined.includes('program content')
  ) {
    return 'This file was not accepted. A receipt must be a photo or a PDF. This file contains program content, so it cannot be uploaded.';
  }

  if (Array.isArray(rawMessage)) {
    return rawMessage.join(', ');
  }
  if (typeof rawMessage === 'string' && rawMessage.trim()) {
    const text = rawMessage.trim();
    if (!text.includes('    at ') && !text.includes('PrismaClient') && !text.includes('syntax error')) {
      return text;
    }
  }
  if (typeof rawError === 'string' && rawError.trim()) {
    const text = rawError.trim();
    if (!text.includes('    at ') && !text.includes('PrismaClient') && !text.includes('syntax error')) {
      return text;
    }
  }
  if (rawMessage !== undefined && rawMessage !== null) {
    const sanitized = toSafeErrorMessage(rawMessage);
    if (sanitized !== GENERAL_SAFE_ERROR) return sanitized;
  }
  if (rawError !== undefined && rawError !== null) {
    const sanitized = toSafeErrorMessage(rawError);
    if (sanitized !== GENERAL_SAFE_ERROR) return sanitized;
  }
  return typeof rawMessage === 'string' ? rawMessage : typeof rawError === 'string' ? rawError : GENERAL_SAFE_ERROR;
}

/**
 * Generic API GET helper.
 */
export async function apiGet<T>(path: string, token?: string, signal?: AbortSignal): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      signal,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const safeMsg = sanitizeErrorMessage(body?.message, body?.error);
      return {
        ok: false,
        error: safeMsg,
        message: safeMsg,
        status: res.status,
      };
    }
    return { ok: true, data: (body?.data !== undefined ? body.data : body) as T, status: res.status };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { ok: false, error: 'REQUEST_ABORTED' };
    }
    return { ok: false, error: GENERAL_SAFE_ERROR, message: GENERAL_SAFE_ERROR };
  }
}

/**
 * Generic API POST helper.
 */
export async function apiPost<T>(
  path: string,
  bodyData: any,
  token?: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(token),
        ...(headers || {}),
      },
      body: JSON.stringify(bodyData),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const safeMsg = sanitizeErrorMessage(body?.message, body?.error);
      return {
        ok: false,
        error: safeMsg,
        message: safeMsg,
        status: res.status,
      };
    }
    return { ok: true, data: (body?.data !== undefined ? body.data : body) as T, status: res.status };
  } catch {
    return { ok: false, error: GENERAL_SAFE_ERROR, message: GENERAL_SAFE_ERROR };
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
      const safeMsg = sanitizeErrorMessage(body?.message, body?.error);
      return {
        ok: false,
        error: safeMsg,
        message: safeMsg,
        status: res.status,
      };
    }
    return { ok: true, data: (body?.data !== undefined ? body.data : body) as T, status: res.status };
  } catch {
    return { ok: false, error: GENERAL_SAFE_ERROR, message: GENERAL_SAFE_ERROR };
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
      const safeMsg = sanitizeErrorMessage(body?.message, body?.error);
      return {
        ok: false,
        error: safeMsg,
        message: safeMsg,
        status: res.status,
      };
    }
    return { ok: true, data: (body?.data !== undefined ? body.data : body) as T, status: res.status };
  } catch {
    return { ok: false, error: GENERAL_SAFE_ERROR, message: GENERAL_SAFE_ERROR };
  }
}

export * from './requestLanes';



