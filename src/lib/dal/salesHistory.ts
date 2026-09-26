import { AdminSession, PlotCategory } from '../mock/types';
import { API_BASE_URL } from '../api';

export interface SalesHistoryFilters {
  datePreset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'all';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  adminId?: string;
  blockId?: string;
  category?: 'all' | PlotCategory;
  paymentType?: 'all' | 'one_time' | 'installment';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SalesHistoryItem {
  id: string;
  auditId: string;
  timestamp: string;
  dateStr: string;
  timeStr: string;
  plotId: string;
  plotNumber: string;
  blockId: string;
  blockName: string;
  category: PlotCategory;
  size: string;
  price: number;
  customerId: string;
  customerName: string;
  membershipNo: string;
  paymentType: 'one_time' | 'installment';
  sellerAdminId: string;
  sellerAdminName: string;
  sellerAdminRole: 'super_admin' | 'sub_admin';
}

export interface SalesHistoryKpis {
  totalPlotsSold: number;
  totalRevenuePkr: number;
  todayPlotsSold: number;
  todayRevenuePkr: number;
  topCloser: {
    id: string;
    name: string;
    count: number;
    revenuePkr: number;
  } | null;
  salesByCategory: Record<string, { count: number; revenuePkr: number }>;
}

export interface SalesHistoryResult {
  ok: boolean;
  items: SalesHistoryItem[];
  kpis: SalesHistoryKpis;
  total?: number;
  page?: number;
  pageSize?: number;
  error?: string;
  message?: string;
}

const emptyKpis: SalesHistoryKpis = {
  totalPlotsSold: 0,
  totalRevenuePkr: 0,
  todayPlotsSold: 0,
  todayRevenuePkr: 0,
  topCloser: null,
  salesByCategory: {},
};

export async function getSalesHistory(
  session: AdminSession,
  filters: SalesHistoryFilters = {}
): Promise<SalesHistoryResult> {
  try {
    const params = new URLSearchParams();
    if (filters.datePreset) params.append('datePreset', filters.datePreset);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.adminId) params.append('adminId', filters.adminId);
    if (filters.blockId) params.append('blockId', filters.blockId);
    if (filters.category) params.append('category', filters.category);
    if (filters.paymentType) params.append('paymentType', filters.paymentType);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const queryString = params.toString();
    const url = `${API_BASE_URL}/sales/history${queryString ? '?' + queryString : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 403) {
        return {
          ok: false,
          items: [],
          kpis: emptyKpis,
          error: 'FORBIDDEN_SALES_HISTORY_ACCESS',
          message: 'You do not have permission to view sales history.',
        };
      }
      return {
        ok: false,
        items: [],
        kpis: emptyKpis,
        error: 'FETCH_ERROR',
        message: 'Failed to fetch sales history.',
      };
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      ok: false,
      items: [],
      kpis: emptyKpis,
      error: 'NETWORK_ERROR',
      message: error.message || 'A network error occurred.',
    };
  }
}
