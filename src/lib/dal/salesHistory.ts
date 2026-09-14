import { mockStore } from '../mock/store';
import { AdminSession, PlotCategory, AuditEntry } from '../mock/types';
import { canAccessBlock } from './adminAuth';

export interface SalesHistoryFilters {
  datePreset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'all';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
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

/**
 * Join live auditLog PLOT_BOOKED actions with bookings, plots, customers, and admin users.
 * Strictly computed at runtime from audit trail — no static/dummy tables.
 */
export async function getSalesHistory(
  session: AdminSession,
  filters: SalesHistoryFilters = {}
): Promise<SalesHistoryResult> {
  mockStore.loadFromStorage();

  const isSuper = session.role === 'super_admin';
  const hasPermission = Boolean(
    session.permissions?.can_book ||
    session.permissions?.can_create_customer ||
    session.permissions?.can_view_customers ||
    session.permissions?.can_view_sales_reports
  );

  if (!isSuper && !hasPermission) {
    return {
      ok: false,
      items: [],
      kpis: {
        totalPlotsSold: 0,
        totalRevenuePkr: 0,
        todayPlotsSold: 0,
        todayRevenuePkr: 0,
        topCloser: null,
        salesByCategory: {},
      },
      error: 'FORBIDDEN',
      message: 'You do not have permission to view society sales history.',
    };
  }

  // 1. Source solely from actual auditLog entries where action === 'PLOT_BOOKED'
  const bookingAuditEntries = mockStore.auditLog.filter(
    (entry: AuditEntry) => entry.action === 'PLOT_BOOKED'
  );

  const rawItems: SalesHistoryItem[] = [];

  for (const entry of bookingAuditEntries) {
    let payload: Record<string, any> = {};
    try {
      if (entry.newValue) {
        payload = JSON.parse(entry.newValue);
      }
    } catch {
      payload = {};
    }

    const plotId = payload.plotId || entry.entityId;
    const plot = mockStore.plots.find((p) => p.id === plotId);
    if (!plot) continue;

    const blockId = plot.blockId;
    // Enforce sub-admin block scoping
    if (!isSuper && !canAccessBlock(session, blockId)) {
      continue;
    }

    const block = mockStore.blocks.find((b) => b.id === blockId);
    const blockName = block ? block.name : (payload.blockName || blockId);

    const customerId = payload.customerId || plot.currentOwnerId || '';
    const customer = mockStore.customers.find((c) => c.id === customerId);

    const booking = mockStore.bookings.find(
      (b) => b.plotId === plot.id && (b.customerId === customerId || !customerId)
    );

    const d = new Date(entry.timestamp);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Look up seller admin
    const sellerAdmin = mockStore.adminUsers.find(
      (u) => u.id === (payload.sellerAdminId || entry.actorId)
    );

    const finalPaymentType = (payload.paymentType || booking?.paymentType || 'installment') as 'one_time' | 'installment';

    rawItems.push({
      id: `sale-${entry.id}`,
      auditId: entry.id,
      timestamp: entry.timestamp,
      dateStr,
      timeStr,
      plotId: plot.id,
      plotNumber: plot.plotNumber,
      blockId,
      blockName,
      category: plot.category,
      size: plot.size,
      price: payload.price || plot.price || 0,
      customerId: customer?.id || customerId,
      customerName: customer?.fullName || payload.customerName || 'Society Member',
      membershipNo: customer?.membershipNo || payload.membershipNo || 'PV-M-PENDING',
      paymentType: finalPaymentType,
      sellerAdminId: sellerAdmin?.id || payload.sellerAdminId || entry.actorId,
      sellerAdminName: sellerAdmin?.fullName || payload.sellerAdminName || entry.actorName || 'Admin Officer',
      sellerAdminRole: (sellerAdmin?.role || entry.actorRole) === 'super_admin' ? 'super_admin' : 'sub_admin',
    });
  }

  // 2. Compute "Today" metrics before applying date filters
  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];
  const todayPlotsSold = rawItems.filter((i) => i.dateStr === todayIso).length;
  const todayRevenuePkr = rawItems
    .filter((i) => i.dateStr === todayIso)
    .reduce((sum, i) => sum + (i.price || 0), 0);

  // 3. Apply Filters
  let filtered = [...rawItems];

  // Date Presets
  if (filters.datePreset && filters.datePreset !== 'all') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filters.datePreset === 'today') {
      filtered = filtered.filter((i) => i.dateStr === todayIso);
    } else if (filters.datePreset === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayIso = yesterday.toISOString().split('T')[0];
      filtered = filtered.filter((i) => i.dateStr === yesterdayIso);
    } else if (filters.datePreset === 'last_7_days') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter((i) => new Date(i.timestamp) >= sevenDaysAgo);
    } else if (filters.datePreset === 'last_30_days') {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter((i) => new Date(i.timestamp) >= thirtyDaysAgo);
    } else if (filters.datePreset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter((i) => new Date(i.timestamp) >= startOfMonth);
    }
  }

  // Custom date range
  if (filters.dateFrom) {
    filtered = filtered.filter((i) => i.dateStr >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    filtered = filtered.filter((i) => i.dateStr <= filters.dateTo!);
  }

  // Admin filter
  if (filters.adminId && filters.adminId !== 'all') {
    filtered = filtered.filter((i) => i.sellerAdminId === filters.adminId);
  }

  // Block filter
  if (filters.blockId && filters.blockId !== 'all') {
    filtered = filtered.filter((i) => i.blockId.toLowerCase() === filters.blockId!.toLowerCase());
  }

  // Category filter
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter((i) => i.category === filters.category);
  }

  // Payment type filter
  if (filters.paymentType && filters.paymentType !== 'all') {
    if (filters.paymentType === 'one_time') {
      filtered = filtered.filter((i) => i.paymentType === 'one_time');
    } else {
      filtered = filtered.filter((i) => i.paymentType === filters.paymentType);
    }
  }

  // Keyword search
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.plotNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        i.membershipNo.toLowerCase().includes(q) ||
        i.sellerAdminName.toLowerCase().includes(q) ||
        i.blockName.toLowerCase().includes(q)
    );
  }

  // Sort chronological descending (most recent first)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // 4. Aggregate Filtered KPIs
  const totalPlotsSold = filtered.length;
  const totalRevenuePkr = filtered.reduce((sum, i) => sum + (i.price || 0), 0);

  // Top Closer by deal count in current filter
  const adminStats: Record<string, { id: string; name: string; count: number; revenuePkr: number }> = {};
  const salesByCategory: Record<string, { count: number; revenuePkr: number }> = {};

  filtered.forEach((i) => {
    if (!adminStats[i.sellerAdminId]) {
      adminStats[i.sellerAdminId] = { id: i.sellerAdminId, name: i.sellerAdminName, count: 0, revenuePkr: 0 };
    }
    adminStats[i.sellerAdminId].count += 1;
    adminStats[i.sellerAdminId].revenuePkr += i.price;

    if (!salesByCategory[i.category]) {
      salesByCategory[i.category] = { count: 0, revenuePkr: 0 };
    }
    salesByCategory[i.category].count += 1;
    salesByCategory[i.category].revenuePkr += i.price;
  });

  let topCloser: SalesHistoryKpis['topCloser'] = null;
  Object.values(adminStats).forEach((stat) => {
    if (!topCloser || stat.count > topCloser.count || (stat.count === topCloser.count && stat.revenuePkr > topCloser.revenuePkr)) {
      topCloser = stat;
    }
  });

  return {
    ok: true,
    items: filtered,
    kpis: {
      totalPlotsSold,
      totalRevenuePkr,
      todayPlotsSold,
      todayRevenuePkr,
      topCloser,
      salesByCategory,
    },
  };
}

/**
 * Quick KPI summary fetcher for dashboard cards
 */
export async function getSalesKpis(
  session: AdminSession,
  filters: SalesHistoryFilters = {}
): Promise<{ ok: boolean; kpis: SalesHistoryKpis; error?: string }> {
  const result = await getSalesHistory(session, filters);
  return {
    ok: result.ok,
    kpis: result.kpis,
    error: result.error,
  };
}
