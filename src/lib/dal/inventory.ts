import { apiGet, getAdminToken } from '../api';

export interface InventoryStats {
  blockId: string;
  blockName: string;
  booked: number;
  allotted: number;
  reserved: number;
  available: number;
  disputedTotal: number;
}

export interface InventoryTotals {
  available: number;
  reserved: number;
  booked: number;
  allotted: number;
  disputedTotal: number;
  total: number;
}

export interface InventoryResponse {
  ok: boolean;
  stats: InventoryStats[];
  totals?: InventoryTotals;
  total?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch live plot counts and totals from the Plot table at the moment of request.
 */
export async function getLiveInventoryStats(
  blockId?: string,
  token?: string,
  page?: number,
  pageSize?: number
): Promise<InventoryResponse> {
  const query = new URLSearchParams();
  if (blockId) query.append('blockId', blockId);
  if (page) query.append('page', String(page));
  if (pageSize) query.append('pageSize', String(pageSize));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const authToken = token || getAdminToken() || undefined;
  const res = await apiGet<any>(`/inventory/live${queryString}`, authToken);
  if (!res.ok) {
    // Fallback to /inventory/stats if needed
    const fallbackRes = await apiGet<any>(`/inventory/stats${queryString}`, authToken);
    if (!fallbackRes.ok) {
      throw new Error(fallbackRes.error || fallbackRes.message || 'Failed to fetch live inventory stats');
    }
    return {
      ok: true,
      stats: fallbackRes.data?.stats || [],
      totals: fallbackRes.data?.totals,
      total: fallbackRes.data?.total,
      page: fallbackRes.data?.page,
      pageSize: fallbackRes.data?.pageSize,
    };
  }

  return {
    ok: true,
    stats: res.data?.stats || [],
    totals: res.data?.totals,
    total: res.data?.total,
    page: res.data?.page,
    pageSize: res.data?.pageSize,
  };
}

/**
 * Fetch historical plot status transition counts between two dates.
 */
export async function getInventoryHistory(
  from: string,
  to: string,
  blockId?: string,
  token?: string,
  page?: number,
  pageSize?: number
): Promise<InventoryResponse> {
  const query = new URLSearchParams();
  query.append('from', from);
  query.append('to', to);
  if (blockId) query.append('blockId', blockId);
  if (page) query.append('page', String(page));
  if (pageSize) query.append('pageSize', String(pageSize));

  const queryString = `?${query.toString()}`;
  const authToken = token || getAdminToken() || undefined;
  const res = await apiGet<any>(`/inventory/history${queryString}`, authToken);
  if (!res.ok) {
    const fallbackRes = await apiGet<any>(`/inventory/stats${queryString}`, authToken);
    if (!fallbackRes.ok) {
      throw new Error(fallbackRes.error || fallbackRes.message || 'Failed to fetch inventory history');
    }
    return {
      ok: true,
      stats: fallbackRes.data?.stats || [],
      totals: fallbackRes.data?.totals,
      total: fallbackRes.data?.total,
      page: fallbackRes.data?.page,
      pageSize: fallbackRes.data?.pageSize,
    };
  }

  return {
    ok: true,
    stats: res.data?.stats || [],
    totals: res.data?.totals,
    total: res.data?.total,
    page: res.data?.page,
    pageSize: res.data?.pageSize,
  };
}

export async function getInventoryStats(
  from?: string,
  to?: string,
  blockId?: string,
  token?: string,
  page?: number,
  pageSize?: number
): Promise<InventoryResponse> {
  if (from && to) {
    return getInventoryHistory(from, to, blockId, token, page, pageSize);
  }
  return getLiveInventoryStats(blockId, token, page, pageSize);
}
