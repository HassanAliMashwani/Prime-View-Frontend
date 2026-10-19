import { AdminSession } from '../mock/types';
import { getAdminMasterPlanBlocks } from './adminPlots';
import { getReservations } from './reservations';
import { getLiveInventoryStats } from './inventory';
import { getCustomersDirectory } from './customers';
import { getSalesHistory } from './salesHistory';
import { getAdminReceipts } from './receipts';
import { getCache, setCache, generateCacheKey } from './apiCache';
import { enqueueLane2 } from '../requestLanes';
import { getCustomerProfile } from './customers';
import { getMyPlots } from './plots';
import { getPaymentSchedule, getPaymentHistory } from './payments';
import { getCustomerReceipts } from './receipts';

/**
 * Universal Cache Warmer
 * Fills browser cache (60s TTL) for Admin (Super Admin / Sub-Admin)
 * and Member, keyed by their own ID.
 */

export function warmAdminCache(session: AdminSession) {
  if (!session || !session.token) return;
  const adminId = session.adminId || session.username || 'admin';
  const isSuper = session.role === 'super_admin';
  const perms = session.permissions || {};

  // 1. Dashboard Cache
  const dashboardKey = `/dashboard:${adminId}`;
  if (!getCache(dashboardKey, false)) {
    enqueueLane2(async (sig) => {
      try {
        const [blockRes, resRes] = await Promise.all([
          getAdminMasterPlanBlocks(session, sig),
          getReservations(session, undefined, sig),
        ]);
        if (blockRes.ok) {
          setCache(dashboardKey, {
            blocks: blockRes.blocks || [],
            reservations: resRes.ok ? resRes.reservations || [] : [],
          });
        }
      } catch {}
    }, dashboardKey);
  }

  // 2. Inventory Overview Cache (page 1 or saved page)
  let savedInvPage = 1;
  if (typeof window !== 'undefined') {
    const s = sessionStorage.getItem(`pv_inv_page_${adminId}`);
    const num = Number(s);
    if (!isNaN(num) && num > 0) savedInvPage = num;
  }
  const invKey = `/inventory:${adminId}:page=${savedInvPage}:size=10`;
  if (!getCache(invKey, false) && (isSuper || perms.can_view_inventory)) {
    enqueueLane2(async (sig) => {
      try {
        const data = await getLiveInventoryStats(undefined, session.token, savedInvPage, 10, sig);
        if (data && data.stats) {
          setCache(invKey, { stats: data.stats, totals: data.totals || null, total: data.total || 0 });
        }
      } catch {}
    }, invKey);
  }

  // 3. Master Plan Blocks
  const masterKey = `/master-plan:blocks:${adminId}`;
  if (!getCache(masterKey, false) && (isSuper || perms.can_view_master_plan)) {
    enqueueLane2(async (sig) => {
      try {
        const res = await getAdminMasterPlanBlocks(session, sig);
        if (res.ok && res.blocks) {
          setCache(masterKey, res.blocks);
        }
      } catch {}
    }, masterKey);
  }

  // 4. Sort Reservations (Active page 1)
  const resKey = `/reservations:${adminId}:page=1:size=10:search=:block=all:status=active`;
  if (!getCache(resKey, false) && (isSuper || perms.can_reserve)) {
    enqueueLane2(async (sig) => {
      try {
        const res = await getReservations(session, { page: 1, pageSize: 10, status: 'active', blockId: 'all' }, sig);
        if (res.ok) {
          setCache(resKey, { reservations: res.reservations || [], total: res.total || 0 });
        }
      } catch {}
    }, resKey);
  }

  // 5. Customer Directory (Page 1)
  const custKey = `/customers:v2:${adminId}:page=1:size=10:search=:status=all`;
  if (!getCache(custKey, false) && (isSuper || perms.can_view_customers)) {
    enqueueLane2(async (sig) => {
      try {
        const res = await getCustomersDirectory(session, { page: 1, pageSize: 10, status: 'all' }, sig);
        if (res.ok) {
          setCache(custKey, { customers: res.customers || [], total: res.total || 0 });
        }
      } catch {}
    }, custKey);
  }

  // 6. Sales History (Page 1)
  const salesKey = generateCacheKey('GET', '/sales/history?page=1&pageSize=10', adminId);
  if (!getCache(salesKey, false) && (isSuper || perms.can_view_sales_history)) {
    enqueueLane2(async (sig) => {
      try {
        const res = await getSalesHistory(session, { page: 1, pageSize: 10 }, sig);
        if (res.ok) {
          setCache(salesKey, { items: res.items || [], kpis: res.kpis, total: res.total || 0 });
        }
      } catch {}
    }, salesKey);
  }

  // 7. Receipts Verification (Page 1, pending)
  const receiptsKey = `/receipts:${adminId}:page=1:size=10:status=pending:search=`;
  if (!getCache(receiptsKey, false) && (isSuper || perms.can_verify_receipts)) {
    enqueueLane2(async (sig) => {
      try {
        const res = await getAdminReceipts(session, 'pending', 1, 10, '', sig);
        if (res.ok) {
          setCache(receiptsKey, { receipts: res.receipts || [], totalCount: res.totalCount || 0 });
        }
      } catch {}
    }, receiptsKey);
  }
}

export function warmMemberCache(customerId: string) {
  if (!customerId) return;

  // 1. Profile Cache
  const profileKey = `/customers/${customerId}`;
  if (!getCache(profileKey, false)) {
    enqueueLane2(async (sig) => {
      try {
        await getCustomerProfile(sig);
      } catch {}
    }, profileKey);
  }

  // 2. Member Plots
  const plotsKey = `/me/plots:${customerId}`;
  if (!getCache(plotsKey, false)) {
    enqueueLane2(async (sig) => {
      try {
        await getMyPlots(sig);
      } catch {}
    }, plotsKey);
  }

  // 3. Member Payments
  const paymentsKey = `/me/payments:${customerId}`;
  if (!getCache(paymentsKey, false)) {
    enqueueLane2(async (sig) => {
      try {
        await Promise.all([
          getPaymentSchedule(undefined, sig),
          getPaymentHistory(undefined, sig),
        ]);
      } catch {}
    }, paymentsKey);
  }

  // 4. Receipts
  const receiptsKey = `/receipts:member:${customerId}`;
  if (!getCache(receiptsKey, false)) {
    enqueueLane2(async (sig) => {
      try {
        const r = await getCustomerReceipts(customerId, sig);
        if (Array.isArray(r)) {
          setCache(receiptsKey, r);
        }
      } catch {}
    }, receiptsKey);
  }
}
