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
  filters?: AuditFilterOptions,
  signal?: AbortSignal
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
    session.token,
    signal
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

/**
 * Retrieve diff details (oldValue and newValue) for a single audit log entry (Super Admin exclusive).
 * Read-only: fetched directly from real NestJS backend GET /admin/audit/:id.
 */
export async function getAuditLogDiff(
  session: AdminSession,
  id: string,
  signal?: AbortSignal
): Promise<{
  ok: boolean;
  oldValue?: any;
  newValue?: any;
  error?: string;
}> {
  if (session.role !== 'super_admin') {
    return { ok: false, error: 'FORBIDDEN_SUPER_ADMIN_ONLY' };
  }

  const res = await apiGet<{ id: string; oldValue?: any; newValue?: any }>(
    `/admin/audit/${id}`,
    session.token,
    signal
  );

  if (!res.ok) {
    return {
      ok: false,
      error: res.error || 'AUDIT_DIFF_FETCH_FAILED',
    };
  }

  return {
    ok: true,
    oldValue: res.data?.oldValue,
    newValue: res.data?.newValue,
  };
}
