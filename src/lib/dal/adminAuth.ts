import { AdminSession, AdminUser } from '../mock/types';
export type { AdminSession, AdminUser };

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

import { API_BASE_URL } from '../api';

/**
 * Administrative login by username + password via real NestJS backend.
 */
export async function adminLogin(username: string, password: string): Promise<AdminLoginResult> {
  const trimmedUser = username.trim().toLowerCase();

  try {
    const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: trimmedUser, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: err.message || 'Invalid administrative credentials.',
      };
    }

    const { access_token } = await res.json();
    const payload = JSON.parse(
      typeof window !== 'undefined'
        ? atob(access_token.split('.')[1])
        : Buffer.from(access_token.split('.')[1], 'base64').toString()
    );

    const session: AdminSession = {
      adminId: payload.adminId,
      username: payload.username,
      fullName: payload.fullName,
      role: payload.role,
      assignedBlocks: payload.assignedBlocks || [],
      permissions: payload.permissions || {},
      token: access_token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        setCookie(COOKIE_KEY, session.username, 86400);
      } catch {
        // Storage unavailable fallback
      }
    }

    return { ok: true, session };
  } catch (netErr) {
    return {
      ok: false,
      error: 'Backend authentication service unreachable. Please ensure backend is running.',
    };
  }
}

/**
 * Logout administrator and invalidate session
 */
export async function adminLogout(): Promise<{ ok: boolean }> {
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
      sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
      // Ensure session is synchronized to sessionStorage if found in localStorage
      if (sessionData && !sessionStorage.getItem(SESSION_STORAGE_KEY)) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessionData);
      }
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

export interface AdminProfileDetails {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'sub_admin';
  status: string;
  permissions: Record<string, boolean | undefined>;
  assignedBlocks: string[];
  createdDate?: string;
  lastLogin?: string;
}

/**
 * Fetch detailed administrator profile from backend
 */
export async function getAdminProfile(session: AdminSession): Promise<{
  ok: boolean;
  admin?: AdminProfileDetails;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/profile`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.message || 'Failed to fetch admin profile.' };
    }

    const data = await res.json();
    return { ok: true, admin: data.admin };
  } catch {
    return { ok: false, error: 'Network error fetching admin profile.' };
  }
}

/**
 * Self-service password change for logged-in administrator
 */
export async function changeAdminPassword(
  session: AdminSession,
  oldPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.message || 'Password update failed.' };
    }

    return { ok: true, message: data.message || 'Password updated successfully.' };
  } catch {
    return { ok: false, error: 'Network error updating password.' };
  }
}

