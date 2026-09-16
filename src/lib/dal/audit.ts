import { AdminSession, AuditEntry } from '../mock/types';
import { apiGet } from '../api';

export interface AuditFilterOptions {
  actorId?: string;
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Retrieve system activity audit logs (Super Admin exclusive).
 * Read-only: fetched directly from real NestJS backend GET /admin/audit.
 */
export async function getAuditLogs(
  session: AdminSession,
  filters?: AuditFilterOptions
): Promise<{
  ok: boolean;
  logs: AuditEntry[];
  totalCount: number;
  error?: string;
}> {
  // Super Admin Exclusive Guard
  if (session.role !== 'super_admin') {
    return { ok: false, logs: [], totalCount: 0, error: 'FORBIDDEN_SUPER_ADMIN_ONLY' };
  }

  const res = await apiGet<{ logs: AuditEntry[]; totalCount: number }>(
    '/admin/audit',
    session.token
  );

  if (!res.ok) {
    return {
      ok: false,
      logs: [],
      totalCount: 0,
      error: res.error || 'AUDIT_FETCH_FAILED',
    };
  }

  const rawLogs: AuditEntry[] = Array.isArray(res.data?.logs)
    ? res.data.logs
    : Array.isArray(res.data)
    ? (res.data as unknown as AuditEntry[])
    : [];

  let logs = [...rawLogs];

  if (filters?.actorId && filters.actorId !== 'all') {
    logs = logs.filter((l) => l.actorId === filters.actorId);
  }

  if (filters?.entityType && filters.entityType !== 'all') {
    logs = logs.filter((l) => l.entityType === filters.entityType);
  }

  if (filters?.action && filters.action !== 'all') {
    logs = logs.filter((l) => l.action === filters.action);
  }

  if (filters?.startDate) {
    const start = new Date(filters.startDate).getTime();
    logs = logs.filter((l) => new Date(l.timestamp).getTime() >= start);
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate).getTime() + 24 * 60 * 60 * 1000;
    logs = logs.filter((l) => new Date(l.timestamp).getTime() <= end);
  }

  if (filters?.search) {
    const s = filters.search.trim().toLowerCase();
    logs = logs.filter(
      (l) =>
        (l.details && l.details.toLowerCase().includes(s)) ||
        (l.actorName && l.actorName.toLowerCase().includes(s)) ||
        (l.action && l.action.toLowerCase().includes(s)) ||
        (l.entityId && l.entityId.toLowerCase().includes(s))
    );
  }

  return { ok: true, logs, totalCount: logs.length };
}
