import { AdminSession, PlotCategory } from '../mock/types';

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
 * Deferred per user requirement: sales reports module.
 */
export async function getSalesHistoryReport(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _session: AdminSession,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters: SalesReportFilters = {}
): Promise<{
  ok: boolean;
  items: SalesReportItem[];
  metrics: SalesReportMetrics;
  error?: string;
  message?: string;
}> {
  return {
    ok: false,
    items: [],
    metrics: emptyMetrics,
    error: 'NOT_YET_IMPLEMENTED',
    message: 'Sales reports module is deferred and not yet available on the backend.',
  };
}
