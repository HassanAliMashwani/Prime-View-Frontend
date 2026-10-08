import { AdminSession, AdminUser } from '../mock/types';
export type { AdminSession, AdminUser };

const SESSION_STORAGE_KEY = 'prime_view_admin_session';

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
  phone?: string;
  avatarUrl?: string;
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
      return { ok: false, error: 'Something went wrong. Please try again.' };
    }

    const data = await res.json();
    return { ok: true, admin: data.admin };
  } catch {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

/**
 * Self-service profile details update for logged-in administrator
 */
export async function updateAdminProfile(
  session: AdminSession,
  data: { username?: string; fullName?: string; email?: string; phone?: string; avatarUrl?: string },
): Promise<{ ok: boolean; admin?: AdminProfileDetails; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: body.message || 'Failed to update profile.' };
    }

    // Sync updated details to active session
    if (body.admin) {
      const activeSession = getActiveAdminSession();
      if (activeSession) {
        if (body.admin.username) activeSession.username = body.admin.username;
        if (body.admin.fullName) activeSession.fullName = body.admin.fullName;
        if (body.admin.email) activeSession.email = body.admin.email;
        if (body.admin.phone !== undefined) activeSession.phone = body.admin.phone;
        if (body.admin.avatarUrl !== undefined) activeSession.avatarUrl = body.admin.avatarUrl;
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(activeSession));
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(activeSession));
          } catch {}
        }
      }
    }

    return { ok: true, admin: body.admin, message: body.message || 'Profile updated successfully.' };
  } catch {
    return { ok: false, error: 'An unexpected network error occurred.' };
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
      return { ok: false, error: 'Something went wrong. Please try again.' };
    }

    return { ok: true, message: data.message || 'Password updated successfully.' };
  } catch {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}


