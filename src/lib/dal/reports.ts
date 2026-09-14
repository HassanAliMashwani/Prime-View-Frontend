import { mockStore } from '../mock/store';
import { AdminSession, PlotCategory, AuditEntry } from '../mock/types';
import { canAccessBlock } from './adminAuth';

export interface SalesReportFilters {
  datePreset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'all';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
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

/**
 * Retrieve Sales History Report by joining Audit Log PLOT_BOOKED entries with
 * bookings, plots, and customer profiles.
 * Item 16: Zero redundant tables; 100% audit trail integrity.
 */
import { getSalesHistory } from './salesHistory';

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
  const res = await getSalesHistory(session, filters);
  return {
    ok: res.ok,
    items: res.items,
    metrics: {
      totalPlotsSold: res.kpis.totalPlotsSold,
      totalRevenuePkr: res.kpis.totalRevenuePkr,
      todayPlotsSold: res.kpis.todayPlotsSold,
      todayRevenuePkr: res.kpis.todayRevenuePkr,
      topAdmin: res.kpis.topCloser ? {
        name: res.kpis.topCloser.name,
        count: res.kpis.topCloser.count,
        revenuePkr: res.kpis.topCloser.revenuePkr,
      } : null,
      salesByCategory: res.kpis.salesByCategory,
    },
    error: res.error,
    message: res.message,
  };
}
