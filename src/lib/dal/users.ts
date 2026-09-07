import { mockStore } from '../mock/store';
import { AdminSession, AdminUser, AdminPermissions, BlockId } from '../mock/types';

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
    can_edit_content?: boolean;
  };
}

export interface UpdateSubAdminInput {
  fullName?: string;
  status?: 'active' | 'suspended';
  assignedBlocks?: (BlockId | string)[];
  permissions?: {
    can_reserve?: boolean;
    can_book?: boolean;
    can_create_customer?: boolean;
    can_edit_content?: boolean;
  };
}

/**
 * Retrieve all Sub Administrators (Super Admin exclusive).
 */
export async function getSubAdmins(session: AdminSession): Promise<{
  ok: boolean;
  subAdmins: AdminUser[];
  error?: string;
}> {
  mockStore.loadFromStorage();

  // Hard restriction: Sub Admin management is permanently exclusive to Super Admin
  if (session.role !== 'super_admin') {
    return { ok: false, subAdmins: [], error: 'FORBIDDEN_SUPER_ADMIN_ONLY' };
  }

  const subAdmins = mockStore.adminUsers.filter((u) => u.role === 'sub_admin');
  return { ok: true, subAdmins };
}

/**
 * Create a new Sub Administrator with specific permissions and block scoping.
 * Exception 4.1: Atomic uniqueness check for username and email.
 * Hard rule: can_create_sub_admin is never permitted.
 */
export async function createSubAdmin(
  session: AdminSession,
  input: CreateSubAdminInput
): Promise<{
  ok: boolean;
  subAdmin?: AdminUser;
  error?: string;
}> {
  mockStore.loadFromStorage();

  // 1. Role Guard
  if (session.role !== 'super_admin') {
    return { ok: false, error: 'FORBIDDEN_SUPER_ADMIN_ONLY' };
  }

  const trimmedUsername = input.username.trim().toLowerCase();
  const trimmedEmail = input.email.trim().toLowerCase();

  if (!trimmedUsername || !trimmedEmail || !input.fullName.trim() || !input.password.trim()) {
    return { ok: false, error: 'MISSING_REQUIRED_FIELDS' };
  }

  // 2. Exception 4.1: Uniqueness check at commit time
  const existingUsername = mockStore.adminUsers.some(
    (u) => u.username.toLowerCase() === trimmedUsername
  );
  if (existingUsername) {
    return { ok: false, error: 'USERNAME_TAKEN' };
  }

  const existingEmail = mockStore.adminUsers.some(
    (u) => u.email.toLowerCase() === trimmedEmail
  );
  if (existingEmail) {
    return { ok: false, error: 'EMAIL_ALREADY_IN_USE' };
  }

  // 3. Sanitized Permissions (can_manage_sub_admins or can_create_sub_admin omitted permanently)
  const sanitizedPermissions: AdminPermissions = {
    can_reserve: Boolean(input.permissions.can_reserve),
    can_book: Boolean(input.permissions.can_book),
    can_create_customer: Boolean(input.permissions.can_create_customer),
    can_edit_content: Boolean(input.permissions.can_edit_content),
  };

  // 4. Create new sub admin record
  const newSubAdmin: AdminUser = {
    id: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    username: trimmedUsername,
    fullName: input.fullName.trim(),
    email: trimmedEmail,
    role: 'sub_admin',
    assignedBlocks: [...input.assignedBlocks],
    permissions: sanitizedPermissions,
    status: 'active',
    passwordHash: input.password,
    createdDate: new Date().toISOString().split('T')[0],
  };

  mockStore.adminUsers.push(newSubAdmin);

  // 5. Audit log entry & Cross-tab broadcast
  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'SUB_ADMIN_CREATED',
    entityType: 'sub_admin',
    entityId: newSubAdmin.id,
    details: `Created sub-admin ${newSubAdmin.fullName} (${newSubAdmin.username}) with scope: [${newSubAdmin.assignedBlocks.join(', ')}]`,
    newValue: JSON.stringify({
      username: newSubAdmin.username,
      assignedBlocks: newSubAdmin.assignedBlocks,
      permissions: newSubAdmin.permissions,
    }),
  });

  mockStore.broadcast({
    type: 'SUB_ADMIN_CREATED',
    timestamp: new Date().toISOString(),
    adminId: newSubAdmin.id,
  });

  return { ok: true, subAdmin: newSubAdmin };
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
}> {
  mockStore.loadFromStorage();

  // 1. Role Guard
  if (session.role !== 'super_admin') {
    return { ok: false, error: 'FORBIDDEN_SUPER_ADMIN_ONLY' };
  }

  const user = mockStore.adminUsers.find((u) => u.id === adminId);
  if (!user) {
    return { ok: false, error: 'SUB_ADMIN_NOT_FOUND' };
  }

  if (user.role === 'super_admin') {
    return { ok: false, error: 'CANNOT_MODIFY_SUPER_ADMIN' };
  }

  const oldState = {
    fullName: user.fullName,
    status: user.status,
    assignedBlocks: [...user.assignedBlocks],
    permissions: { ...user.permissions },
  };

  // 2. Apply updates
  if (updates.fullName) user.fullName = updates.fullName.trim();
  if (updates.status) user.status = updates.status;
  if (updates.assignedBlocks) user.assignedBlocks = [...updates.assignedBlocks];
  if (updates.permissions) {
    user.permissions = {
      can_reserve: Boolean(updates.permissions.can_reserve),
      can_book: Boolean(updates.permissions.can_book),
      can_create_customer: Boolean(updates.permissions.can_create_customer),
      can_edit_content: Boolean(updates.permissions.can_edit_content),
    };
  }

  // 3. Audit log & Broadcast
  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'SUB_ADMIN_UPDATED',
    entityType: 'sub_admin',
    entityId: user.id,
    details: `Updated sub-admin ${user.fullName} (${user.username})`,
    oldValue: JSON.stringify(oldState),
    newValue: JSON.stringify({
      fullName: user.fullName,
      status: user.status,
      assignedBlocks: user.assignedBlocks,
      permissions: user.permissions,
    }),
  });

  mockStore.broadcast({
    type: 'SUB_ADMIN_UPDATED',
    timestamp: new Date().toISOString(),
    adminId: user.id,
  });

  return { ok: true, subAdmin: user };
}
