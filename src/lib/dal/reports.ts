import { AdminSession, PlotCategory } from '../mock/types';
import { API_BASE_URL } from '../api';

export interface SalesReportFilters {
  datePreset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'all';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  adminId?: string;
  blockId?: string;
  category?: 'all' | PlotCategory;
  paymentType?: 'all' | 'one_time' | 'installment';
  search?: string;
}

export interface SalesReportItem {
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

export interface SalesReportMetrics {
  totalPlotsSold: number;
  totalRevenuePkr: number;
  todayPlotsSold: number;
  todayRevenuePkr: number;
  topAdmin: {
    name: string;
    count: number;
    revenuePkr: number;
  } | null;
  salesByCategory: Record<string, { count: number; revenuePkr: number }>;
}

const emptyMetrics: SalesReportMetrics = {
  totalPlotsSold: 0,
  totalRevenuePkr: 0,
  todayPlotsSold: 0,
  todayRevenuePkr: 0,
  topAdmin: null,
  salesByCategory: {},
};

/**
 * Retrieve sales history report from live NestJS backend.
 */
export async function getSalesHistoryReport(
  session: AdminSession,
  filters: SalesReportFilters = {}
): Promise<{
  ok: boolean;
  items: SalesReportItem[];
  metrics: SalesReportMetrics;
  error?: string;
  message?: string;
}> {
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

    const queryString = params.toString();
    const url = `${API_BASE_URL}/sales/reports${queryString ? '?' + queryString : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!res.ok) {
      return {
        ok: false,
        items: [],
        metrics: emptyMetrics,
        error: `FETCH_FAILED_${res.status}`,
      };
    }

    const data = await res.json();
    return {
      ok: true,
      items: data.items || [],
      metrics: data.metrics || emptyMetrics,
    };
  } catch (err: any) {
    return {
      ok: false,
      items: [],
      metrics: emptyMetrics,
      error: 'NETWORK_ERROR',
      message: err.message,
    };
  }
}
