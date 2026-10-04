import { AdminSession, AuditEntry } from '../mock/types';
import { apiGet } from '../api';

export interface AuditFilterOptions {
  actorId?: string;
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
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

  const queryParams = new URLSearchParams();
  if (filters?.actorId && filters.actorId !== 'all') queryParams.set('actorId', filters.actorId);
  if (filters?.entityType && filters.entityType !== 'all') queryParams.set('entityType', filters.entityType);
  if (filters?.action && filters.action !== 'all') queryParams.set('action', filters.action);
  if (filters?.startDate) queryParams.set('startDate', filters.startDate);
  if (filters?.endDate) queryParams.set('endDate', filters.endDate);
  if (filters?.search) queryParams.set('search', filters.search);
  if (filters?.page) queryParams.set('page', filters.page.toString());
  if (filters?.pageSize) queryParams.set('pageSize', filters.pageSize.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/admin/audit?${queryString}` : '/admin/audit';

  const res = await apiGet<{ logs: AuditEntry[]; totalCount: number }>(
    endpoint,
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

  return { ok: true, logs: rawLogs, totalCount: res.data?.totalCount || 0 };
}
