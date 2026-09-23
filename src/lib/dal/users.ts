import { AdminSession, AdminUser, BlockId } from '../mock/types';
import { apiGet, apiPost, apiPatch } from '../api';

export interface CreateSubAdminInput {
  fullName: string;
  email: string;
  username: string;
  password: string;
  assignedBlocks: (BlockId | string)[];
  permissions: {
    can_reserve?: boolean;
    can_book?: boolean;
    can_create_customer?: boolean;
    can_view_customers?: boolean;
    can_view_sales_reports?: boolean;
    can_view_sales_history?: boolean;
    can_edit_content?: boolean;
    can_verify_receipts?: boolean;
    can_view_inventory?: boolean;
    can_view_master_plan?: boolean;
  };
}

export interface UpdateSubAdminInput {
  fullName?: string;
  password?: string;
  status?: 'active' | 'suspended';
  assignedBlocks?: (BlockId | string)[];
  permissions?: {
    can_reserve?: boolean;
    can_book?: boolean;
    can_create_customer?: boolean;
    can_view_customers?: boolean;
    can_view_sales_reports?: boolean;
    can_view_sales_history?: boolean;
    can_edit_content?: boolean;
    can_verify_receipts?: boolean;
    can_view_inventory?: boolean;
    can_view_master_plan?: boolean;
  };
}

/**
 * Retrieve all Sub Administrators (Super Admin exclusive).
 */
export async function getSubAdmins(session: AdminSession): Promise<{
  ok: boolean;
  subAdmins: AdminUser[];
  error?: string;
  message?: string;
}> {
  if (session.role !== 'super_admin') {
    return {
      ok: false,
      subAdmins: [],
      error: 'FORBIDDEN_SUPER_ADMIN_ONLY',
      message: 'Sub Admin management is strictly restricted to Super Administrators.',
    };
  }

  const res = await apiGet<{ ok: boolean; subAdmins: AdminUser[] }>('/admin/sub-admins', session?.token);
  if (!res.ok || !res.data) {
    return {
      ok: false,
      subAdmins: [],
      error: res.error,
      message: res.error || 'Failed to fetch sub-admins.',
    };
  }

  return {
    ok: true,
    subAdmins: res.data.subAdmins || [],
  };
}

/**
 * Create a new Sub Administrator with specific permissions and block scoping.
 */
export async function createSubAdmin(
  session: AdminSession,
  input: CreateSubAdminInput
): Promise<{
  ok: boolean;
  subAdmin?: AdminUser;
  error?: string;
  message?: string;
}> {
  if (session.role !== 'super_admin') {
    return {
      ok: false,
      error: 'FORBIDDEN_SUPER_ADMIN_ONLY',
      message: 'Sub Admin creation is strictly restricted to Super Administrators.',
    };
  }

  const res = await apiPost<{ ok: boolean; subAdmin: AdminUser }>(
    '/admin/sub-admins',
    input,
    session?.token
  );

  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error,
      message: res.error || 'Failed to create sub-admin.',
    };
  }

  return {
    ok: true,
    subAdmin: res.data.subAdmin,
  };
}

/**
 * Update an existing Sub Administrator's permissions, assigned blocks, or status.
 */
export async function updateSubAdmin(
  session: AdminSession,
  adminId: string,
  updates: UpdateSubAdminInput
): Promise<{
  ok: boolean;
  subAdmin?: AdminUser;
  error?: string;
  message?: string;
}> {
  if (session.role !== 'super_admin') {
    return {
      ok: false,
      error: 'FORBIDDEN_SUPER_ADMIN_ONLY',
      message: 'Sub Admin updates are strictly restricted to Super Administrators.',
    };
  }

  const res = await apiPatch<{ ok: boolean; subAdmin: AdminUser }>(
    `/admin/sub-admins/${adminId}`,
    updates,
    session?.token
  );

  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error,
      message: res.error || 'Failed to update sub-admin.',
    };
  }

  return {
    ok: true,
    subAdmin: res.data.subAdmin,
  };
}

/**
 * Reset password for a sub-administrator (Super Admin exclusive).
 */
export async function resetSubAdminPassword(
  session: AdminSession,
  adminId: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string; message?: string }> {
  if (session.role !== 'super_admin') {
    return {
      ok: false,
      error: 'FORBIDDEN_SUPER_ADMIN_ONLY',
      message: 'Sub Admin password reset is strictly restricted to Super Administrators.',
    };
  }

  const res = await apiPost<{ ok: boolean; message: string }>(
    `/admin/sub-admins/${adminId}/reset-password`,
    { newPassword },
    session?.token
  );

  if (!res.ok) {
    return {
      ok: false,
      error: res.error,
      message: res.message || res.error || 'Failed to reset sub-admin password.',
    };
  }

  return {
    ok: true,
    message: res.data?.message || 'Password reset successfully.',
  };
}

