import { MemberSession } from '../mock/types';

const SESSION_STORAGE_KEY = 'prime_view_member_session';
const COOKIE_KEY = 'pv_member_session';

let nodeSessionOverride: MemberSession | null = null;

export function setMockSession(session: MemberSession | null): void {
  nodeSessionOverride = session;
}

export function clearMockSession(): void {
  nodeSessionOverride = null;
}

export interface LoginResult {
  ok: boolean;
  error?: string;
  lockedUntil?: number;
  session?: MemberSession;
}

// Helper to safely read cookie on client
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

// Helper to set cookie
function setCookie(name: string, value: string, maxAgeSeconds: number = 86400): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

// Helper to remove cookie
function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

import { API_BASE_URL } from '../api';

/**
 * Authenticate member by CNIC, Phone, Email, or Membership Number via real NestJS backend.
 */
export async function login(identifier: string, password: string): Promise<LoginResult> {
  const trimmedId = identifier.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/auth/member/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipNo: trimmedId, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.message;
      if (msg === 'Invalid credentials.' || msg === 'Account locked due to too many failed attempts.') {
        return { ok: false, error: msg };
      }
      return {
        ok: false,
        error: 'Something went wrong. Please try again.',
      };
    }

    const { access_token } = await res.json();
    const payload = JSON.parse(
      typeof window !== 'undefined'
        ? atob(access_token.split('.')[1])
        : Buffer.from(access_token.split('.')[1], 'base64').toString()
    );

    const session: MemberSession = {
      customerId: payload.customerId,
      role: 'customer',
      fullName: payload.fullName,
      email: payload.email,
      token: access_token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        setCookie(COOKIE_KEY, JSON.stringify(session));
      } catch {
        // Storage unavailable fallback
      }
    }

    return { ok: true, session };
  } catch {
    return {
      ok: false,
      error: 'Something went wrong. Please try again.',
    };
  }
}

/**
 * Logout member and purge session
 */
export async function logout(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      removeCookie(COOKIE_KEY);
    } catch {
      // Storage unavailable fallback
    }
  }
}

/**
 * Get active MemberSession from sessionStorage or cookie fallback
 */
export function getActiveSession(): MemberSession | null {
  if (nodeSessionOverride) return nodeSessionOverride;
  if (typeof window === 'undefined') return null;

  try {
    // Check sessionStorage first
    const item = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (item) {
      const parsed: MemberSession = JSON.parse(item);
      if (parsed.expiresAt > Date.now()) {
        return parsed;
      }
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }

    // Fallback: check cookie
    const cookieStr = getCookie(COOKIE_KEY);
    if (cookieStr) {
      const parsed: MemberSession = JSON.parse(cookieStr);
      if (parsed.expiresAt > Date.now()) {
        // Re-sync to sessionStorage
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
      removeCookie(COOKIE_KEY);
    }
  } catch {
    // Storage unavailable fallback
  }

  return null;
}


/**
 * Guard for member DAL functions.
 * Throws or returns error if session is absent or expired (Exceptions 5.2 and 5.4).
 */
export function requireMemberSession(): MemberSession {
  const session = getActiveSession();
  if (!session || session.role !== 'customer') {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
