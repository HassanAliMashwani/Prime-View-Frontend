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

export async function getInventoryStats(
  from?: string,
  to?: string,
  blockId?: string,
  token?: string,
  page?: number,
  pageSize?: number
): Promise<{ ok: boolean; stats: InventoryStats[]; total?: number; page?: number; pageSize?: number }> {
  const query = new URLSearchParams();
  if (from) query.append('from', from);
  if (to) query.append('to', to);
  if (blockId) query.append('blockId', blockId);
  if (page) query.append('page', String(page));
  if (pageSize) query.append('pageSize', String(pageSize));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const authToken = token || getAdminToken() || undefined;
  const res = await apiGet<any>(`/inventory/stats${queryString}`, authToken);
  if (!res.ok) {
    throw new Error(res.error || res.message || 'Failed to fetch inventory stats');
  }
  
  return {
    ok: true,
    stats: res.data?.stats || [],
    total: res.data?.total,
    page: res.data?.page,
    pageSize: res.data?.pageSize,
  };
}
