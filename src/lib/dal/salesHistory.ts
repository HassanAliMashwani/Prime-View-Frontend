import { AdminSession, PlotCategory } from '../mock/types';

export interface SalesHistoryFilters {
  datePreset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'all';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  adminId?: string;
  blockId?: string;
  category?: 'all' | PlotCategory;
  paymentType?: 'all' | 'one_time' | 'installment';
  search?: string;
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

/**
 * Deferred per user requirement: sales history reporting.
 */
export async function getSalesHistory(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _session: AdminSession,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters: SalesHistoryFilters = {}
): Promise<SalesHistoryResult> {
  return {
    ok: false,
    items: [],
    kpis: emptyKpis,
    error: 'NOT_YET_IMPLEMENTED',
    message: 'Sales history reporting is deferred and not yet available on the backend.',
  };
}

/**
 * Deferred per user requirement: sales KPIs reporting.
 */
export async function getSalesKpis(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _session: AdminSession,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters: SalesHistoryFilters = {}
): Promise<{
  ok: boolean;
  kpis: SalesHistoryKpis;
  error?: string;
  message?: string;
}> {
  return {
    ok: false,
    kpis: emptyKpis,
    error: 'NOT_YET_IMPLEMENTED',
    message: 'Sales KPIs reporting is deferred and not yet available on the backend.',
  };
}
