import { MemberSession } from '../mock/types';

const SESSION_STORAGE_KEY = 'prime_view_member_session';

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

    // Use the token's own exp claim so the browser session expires exactly when
    // the backend token expires. Fall back to 30 minutes if the claim is absent.
    const expiresAt = payload.exp
      ? payload.exp * 1000
      : Date.now() + 30 * 60 * 1000;

    const session: MemberSession = {
      customerId: payload.customerId,
      role: 'customer',
      fullName: payload.fullName,
      email: payload.email,
      token: access_token,
      expiresAt,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        document.cookie = `pv_member_token=${access_token}; path=/; max-age=1800; SameSite=Lax`;
        document.cookie = `pv_member_session=${encodeURIComponent(trimmedId)}; path=/; max-age=1800; SameSite=Lax`;
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
      document.cookie = 'pv_member_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'pv_member_session=; path=/; max-age=0; SameSite=Lax';
    } catch {
      // Storage unavailable fallback
    }
  }
}

/**
 * Sign the member out, purge session storage (including cached API data),
 * and redirect to the login page with the given message.
 * Called on HTTP 401 from any member API endpoint.
 */
export function handleMemberSessionExpired(
  message = 'Your session has expired. Please sign in again.'
): void {
  if (typeof window === 'undefined') return;
  try {
    // Remove session
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    document.cookie = 'pv_member_token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'pv_member_session=; path=/; max-age=0; SameSite=Lax';

    // Purge all member API cache entries so stale data is never served after re-login
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (
        k &&
        (k.startsWith('pv_cache:/me/') ||
          k.startsWith('pv_cache:/customers/') ||
          k.startsWith('pv_cache:/receipts/'))
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }

  window.location.replace(
    `/society-members/login?message=${encodeURIComponent(message)}`
  );
}

/**
 * Get active MemberSession from sessionStorage or cookie fallback
 */
export function getActiveSession(): MemberSession | null {
  if (nodeSessionOverride) return nodeSessionOverride;
  if (typeof window === 'undefined') return null;

  try {
    // Check sessionStorage
    const item = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (item) {
      const parsed: MemberSession = JSON.parse(item);
      if (parsed.expiresAt > Date.now()) {
        return parsed;
      }
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
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
