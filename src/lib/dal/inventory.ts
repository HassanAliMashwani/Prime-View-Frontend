import { apiGet } from '../api';

export interface InventoryStats {
  blockId: string;
  blockName: string;
  booked: number;
  allotted: number;
  reserved: number;
  available: number;
  disputedTotal: number;
}

export async function getInventoryStats(from?: string, to?: string, blockId?: string): Promise<InventoryStats[]> {
  const query = new URLSearchParams();
  if (from) query.append('from', from);
  if (to) query.append('to', to);
  if (blockId) query.append('blockId', blockId);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await apiGet<InventoryStats[]>(`/inventory/stats${queryString}`);
  if (!res.ok) {
    throw new Error(res.message || 'Failed to fetch inventory stats');
  }
  return res.data || [];
}
