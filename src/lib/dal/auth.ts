import { mockStore } from '../mock/store';
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

/**
 * Authenticate member by CNIC, Phone, or Email + password.
 * Enforces rate-limiting counter and generic security errors.
 */
export async function login(identifier: string, password: string): Promise<LoginResult> {
  const trimmedId = identifier.trim();

  // 1. Rate-limit check (Exception 5.3)
  const rateCheck = mockStore.checkRateLimit(trimmedId);
  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.remainingLockoutSeconds || 300) / 60);
    return {
      ok: false,
      error: `Too many failed login attempts. Account temporarily locked. Please try again in ${minutes} minute(s).`,
      lockedUntil: Date.now() + (rateCheck.remainingLockoutSeconds || 300) * 1000,
    };
  }

  // 2. Lookup customer by CNIC, Phone, or Email (case-insensitive)
  const customer = mockStore.customers.find((c) => {
    const matchCnic = c.cnic.replace(/\D/g, '') === trimmedId.replace(/\D/g, '');
    const matchPhone = c.phone.replace(/\D/g, '') === trimmedId.replace(/\D/g, '');
    const matchEmail = c.email.toLowerCase() === trimmedId.toLowerCase();
    return matchCnic || matchPhone || matchEmail;
  });

  // 3. Validate credentials
  if (!customer || customer.passwordHash !== password) {
    const failureResult = mockStore.recordFailedLogin(trimmedId);
    if (failureResult.locked) {
      return {
        ok: false,
        error: 'Too many failed login attempts. Account temporarily locked for 5 minutes.',
        lockedUntil: Date.now() + 300 * 1000,
      };
    }
    // Generic error message (Section 2.2 security requirement)
    return {
      ok: false,
      error: 'Invalid credentials. Please verify your details and try again.',
    };
  }

  // Check account status
  if (customer.accountStatus === 'suspended') {
    return {
      ok: false,
      error: 'Your member account is currently suspended. Please contact society administration.',
    };
  }

  // 4. Success — reset rate limit counter & create session
  mockStore.resetFailedLogins(trimmedId);
  customer.lastLogin = new Date().toISOString();

  const session: MemberSession = {
    customerId: customer.id,
    role: 'customer',
    fullName: customer.fullName,
    email: customer.email,
    token: `mock-token-${customer.id}-${Date.now()}`,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  // Persist session to sessionStorage AND cookie so it survives page refreshes
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      setCookie(COOKIE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Could not write to storage:', e);
    }
  }

  // Audit log entry
  mockStore.addAuditEntry({
    actorId: customer.id,
    actorName: customer.fullName,
    actorRole: 'customer',
    action: 'MEMBER_LOGIN',
    entityType: 'customer',
    entityId: customer.id,
    details: `Member ${customer.fullName} logged in successfully`,
  });

  return { ok: true, session };
}

/**
 * Logout member and purge session
 */
export async function logout(): Promise<void> {
  const current = getActiveSession();
  if (current) {
    mockStore.addAuditEntry({
      actorId: current.customerId,
      actorName: current.fullName,
      actorRole: 'customer',
      action: 'MEMBER_LOGOUT',
      entityType: 'customer',
      entityId: current.customerId,
      details: `Member ${current.fullName} logged out`,
    });
  }

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      removeCookie(COOKIE_KEY);
    } catch (e) {
      console.warn('Could not remove storage item:', e);
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
  } catch (e) {
    console.warn('Error reading active session:', e);
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
