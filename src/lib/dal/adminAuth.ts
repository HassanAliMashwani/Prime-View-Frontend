import { mockStore } from '../mock/store';
import { AdminSession, AdminUser } from '../mock/types';

const SESSION_STORAGE_KEY = 'prime_view_admin_session';
const COOKIE_KEY = 'pv_admin_session';

let nodeSessionOverride: AdminSession | null = null;

export function setMockAdminSession(session: AdminSession | null): void {
  nodeSessionOverride = session;
}

export function clearMockAdminSession(): void {
  nodeSessionOverride = null;
}

export interface AdminLoginResult {
  ok: boolean;
  error?: string;
  lockedUntil?: number;
  session?: AdminSession;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number = 86400): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Administrative login by username + password.
 * Rate limited to 5 attempts per 5 minutes.
 */
export async function adminLogin(username: string, password: string): Promise<AdminLoginResult> {
  const trimmedUser = username.trim().toLowerCase();

  // 1. Rate limiting check (Exception 5.3)
  const rateCheck = mockStore.checkRateLimit(trimmedUser);
  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.remainingLockoutSeconds || 300) / 60);
    return {
      ok: false,
      error: `Too many failed login attempts. Account temporarily locked. Please try again in ${minutes} minute(s).`,
      lockedUntil: Date.now() + (rateCheck.remainingLockoutSeconds || 300) * 1000,
    };
  }

  // 2. Lookup Admin
  const admin = mockStore.adminUsers.find(
    (u) => u.username.toLowerCase() === trimmedUser
  );

  if (!admin || admin.passwordHash !== password) {
    const lockout = mockStore.recordFailedLogin(trimmedUser);
    if (lockout.locked) {
      return {
        ok: false,
        error: `Too many failed attempts. Administrative access locked for 5 minutes.`,
        lockedUntil: Date.now() + 300 * 1000,
      };
    }
    return {
      ok: false,
      error: 'Invalid administrative credentials.',
    };
  }

  // 3. Status check
  if (admin.status !== 'active') {
    return {
      ok: false,
      error: 'Administrative account is suspended. Contact the Chief Executive Officer.',
    };
  }

  // 4. Reset failed attempts
  mockStore.resetFailedLogins(trimmedUser);

  // 5. Create session (24 hour expiration)
  const session: AdminSession = {
    adminId: admin.id,
    username: admin.username,
    fullName: admin.fullName,
    role: admin.role,
    assignedBlocks: [...admin.assignedBlocks],
    permissions: { ...admin.permissions },
    token: `pv_admin_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };

  if (typeof window !== 'undefined') {
    try {
      // Strictly write to current tab's isolated sessionStorage.
      // Do NOT write to localStorage or shared cookies to guarantee
      // cross-tab / cross-window isolation for concurrent multi-admin workflows.
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage unavailable fallback
    }
  }

  // 6. Audit Log
  mockStore.addAuditEntry({
    actorId: admin.id,
    actorName: admin.fullName,
    actorRole: admin.role,
    action: 'ADMIN_LOGIN',
    entityType: 'customer',
    entityId: admin.id,
    details: `Admin ${admin.fullName} (${admin.role}) logged in successfully.`,
  });

  return { ok: true, session };
}

/**
 * Logout administrator and invalidate session
 */
export async function adminLogout(): Promise<{ ok: boolean }> {
  const current = getActiveAdminSession();
  if (current) {
    mockStore.addAuditEntry({
      actorId: current.adminId,
      actorName: current.fullName,
      actorRole: current.role,
      action: 'ADMIN_LOGOUT',
      entityType: 'customer',
      entityId: current.adminId,
      details: `Admin ${current.fullName} logged out.`,
    });
  }

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Storage fallback
    }
  }
  removeCookie(COOKIE_KEY);
  nodeSessionOverride = null;

  return { ok: true };
}

/**
 * Get the current active administrative session
 */
export function getActiveAdminSession(): AdminSession | null {
  if (nodeSessionOverride) {
    if (nodeSessionOverride.expiresAt > Date.now()) {
      return nodeSessionOverride;
    }
    nodeSessionOverride = null;
    return null;
  }

  let sessionData: string | null = null;

  if (typeof window !== 'undefined') {
    try {
      // Tab-isolated session storage only — guarantees zero cross-tab session contamination
      sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      sessionData = null;
    }
  }

  if (!sessionData) return null;

  try {
    const session = JSON.parse(sessionData) as AdminSession;
    if (session.expiresAt && session.expiresAt < Date.now()) {
      adminLogout();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Strict check for administrative permission to access a block (Exception 5.4)
 */
export function canAccessBlock(session: AdminSession, blockId: string): boolean {
  if (session.role === 'super_admin') {
    return true;
  }
  return session.assignedBlocks.includes(blockId);
}
