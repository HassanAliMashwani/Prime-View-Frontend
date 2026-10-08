'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Map, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  History,
  Calendar,
  Search,
  X
} from 'lucide-react';
import { 
  getLiveInventoryStats, 
  getInventoryHistory, 
  InventoryStats, 
  InventoryTotals 
} from '@/lib/dal/inventory';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getCache, setCache } from '@/lib/dal/apiCache';
import { AdminSession } from '@/lib/mock/types';
import { AdminTableShell } from '@/components/admin/table/AdminTableShell';

function RollingCounter({
  value,
  loading,
  hasLoaded,
}: {
  value: number;
  loading: boolean;
  hasLoaded: boolean;
}) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const displayValueRef = React.useRef<number>(value);
  const isFirstLoadRef = React.useRef<boolean>(true);

  useEffect(() => {
    if (!hasLoaded) return;

    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      displayValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    const startValue = displayValueRef.current;
    const endValue = value;
    if (startValue === endValue) return;

    const duration = 600;
    const startTime = performance.now();
    let animationFrameId: number;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * ease);
      displayValueRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        displayValueRef.current = endValue;
        setDisplayValue(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, hasLoaded]);

  if ((!hasLoaded && loading) || (loading && value === 0)) {
    return <span className="inline-block h-8 w-24 bg-slate-200/60 animate-pulse rounded-lg align-middle" />;
  }

  return <span>{displayValue.toLocaleString()}</span>;
}

const PAGE_SIZE = 10;

export default function InventoryOverviewPage() {
  const router = useRouter();

  const getInit = () => {
    if (typeof window === 'undefined') return null;
    const s = getActiveAdminSession();
    if (!s) return null;
    const adminId = s.adminId || s.username || 'admin';
    return getCache<{ stats: InventoryStats[], totals: InventoryTotals | null, total: number }>(`/inventory:${adminId}:page=1:size=${PAGE_SIZE}`, true);
  };
  const init = getInit();

  const [session, setSession] = useState<AdminSession | null>(() => {
    if (typeof window === 'undefined') return null;
    return getActiveAdminSession();
  });

  // Live Inventory State
  const [loadingLive, setLoadingLive] = useState<boolean>(!init);
  const [hasLoadedLiveOnce, setHasLoadedLiveOnce] = useState<boolean>(Boolean(init));
  const [liveStats, setLiveStats] = useState<InventoryStats[]>(init?.stats || []);
  const [liveTotals, setLiveTotals] = useState<InventoryTotals | null>(init?.totals || null);
  const [livePage, setLivePage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(init?.total || 0);
  const [liveError, setLiveError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // History View State (separate section)
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [appliedFrom, setAppliedFrom] = useState<string>('');
  const [appliedTo, setAppliedTo] = useState<string>('');
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyStats, setHistoryStats] = useState<InventoryStats[]>([]);
  const [historyTotals, setHistoryTotals] = useState<InventoryTotals | null>(null);
  const [historyError, setHistoryError] = useState<string>('');
  const [historyHasQueried, setHistoryHasQueried] = useState<boolean>(false);

  const reqIdRef = React.useRef(0);

  useEffect(() => {
    const s = getActiveAdminSession();
    if (s) {
      setSession(s);
    }
  }, []);

  const isSuper = session?.role === 'super_admin';
  const canAccess = isSuper || Boolean(session?.permissions?.can_view_inventory);

  // 1. Live Stats Loader: queries directly from Plot table at moment of request
  const loadLive = useCallback(async (p = livePage) => {
    const adminId = session?.adminId || session?.username || 'admin';
    const cacheKey = `/inventory:${adminId}:page=${p}:size=${PAGE_SIZE}`;

    const cached = getCache<{ stats: InventoryStats[], totals: InventoryTotals | null, total: number }>(cacheKey, true);
    if (cached) {
      setLiveStats(cached.stats);
      setLiveTotals(cached.totals);
      setTotalRecords(cached.total);
      setLoadingLive(false);
    } else {
      setLiveStats((prev) => {
        if (prev.length === 0) {
          setLoadingLive(true);
        }
        return prev;
      });
    }

    const currentReq = ++reqIdRef.current;
    setLiveError('');
    try {
      const data = await getLiveInventoryStats(undefined, session?.token, p, PAGE_SIZE);
      if (currentReq !== reqIdRef.current) return;

      setLiveStats(data.stats);
      setLiveTotals(data.totals || null);
      setTotalRecords(data.total || 0);
      setLastUpdated(new Date());
      setCache(cacheKey, { stats: data.stats, totals: data.totals || null, total: data.total || 0 });
      setHasLoadedLiveOnce(true);

      // Prefetch next page into cache if next page exists
      const totalPages = Math.ceil((data.total || 0) / PAGE_SIZE);
      if (p < totalPages && canAccess) {
        const nextP = p + 1;
        const nextKey = `/inventory:${adminId}:page=${nextP}:size=${PAGE_SIZE}`;
        if (!getCache(nextKey, false)) {
          getLiveInventoryStats(undefined, session?.token, nextP, PAGE_SIZE)
            .then((nextData) => {
              setCache(nextKey, { stats: nextData.stats, totals: nextData.totals || null, total: nextData.total || 0 });
            })
            .catch(() => {});
        }
      }
    } catch {
      if (currentReq !== reqIdRef.current) return;
      setLiveError('Failed to fetch live inventory counts. Please try again.');
    } finally {
      if (currentReq === reqIdRef.current) {
        setLoadingLive(false);
      }
    }
  }, [session, canAccess, livePage]);

  // 2. History Loader: counts status transitions between the two dates
  const loadHistory = useCallback(async (from: string, to: string) => {
    if (!from || !to) return;
    setLoadingHistory(true);
    setHistoryError('');
    try {
      const data = await getInventoryHistory(from, to, undefined, session?.token, 1, 100);
      setHistoryStats(data.stats);
      setHistoryTotals(data.totals || null);
      setHistoryHasQueried(true);
    } catch {
      setHistoryError('Failed to query inventory history for the selected date range.');
    } finally {
      setLoadingHistory(false);
    }
  }, [session?.token]);

  // Initial load when session is ready
  useEffect(() => {
    if (session && canAccess) {
      loadLive(livePage);
    }
  }, [session, canAccess, loadLive, livePage]);

  // 3. Tab return & 15-second polling interval while page is open
  useEffect(() => {
    if (!session || !canAccess) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadLive(livePage);
      }
    };

    const handleFocus = () => {
      loadLive(livePage);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    // Refresh every 15 seconds while open
    const intervalId = setInterval(() => {
      loadLive(livePage);
    }, 15000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [session, canAccess, loadLive, livePage]);

  // Refresh button handler (loads immediately)
  const handleRefreshClick = () => {
    loadLive(livePage);
    if (appliedFrom && appliedTo) {
      loadHistory(appliedFrom, appliedTo);
    }
  };

  // History form submit
  const handleApplyHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      setHistoryError('Please select both From and To dates.');
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      setHistoryError('To date cannot be before From date.');
      return;
    }
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    loadHistory(fromDate, toDate);
  };

  const handleClearHistory = () => {
    setFromDate('');
    setToDate('');
    setAppliedFrom('');
    setAppliedTo('');
    setHistoryStats([]);
    setHistoryTotals(null);
    setHistoryError('');
    setHistoryHasQueried(false);
  };

  const handlePageChange = (newPage: number) => {
    setLivePage(newPage);
  };

  if (session && !canAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-3xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Inventory Overview</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your administrative account does not have permission to view inventory status. Contact administration to adjust your privileges.
        </p>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Use totals from backend (covers ALL accessible blocks of this admin)
  // Fall back to summing current liveStats if totals object is empty
  const totalAvailable = liveTotals?.available ?? liveStats.reduce((sum, s) => sum + s.available, 0);
  const totalReserved = liveTotals?.reserved ?? liveStats.reduce((sum, s) => sum + s.reserved, 0);
  const totalBooked = liveTotals?.booked ?? liveStats.reduce((sum, s) => sum + s.booked, 0);
  const totalAllotted = liveTotals?.allotted ?? liveStats.reduce((sum, s) => sum + s.allotted, 0);
  const totalDisputed = liveTotals?.disputedTotal ?? liveStats.reduce((sum, s) => sum + s.disputedTotal, 0);
  const totalSellable = liveTotals?.total ?? (totalAvailable + totalReserved + totalBooked + totalAllotted);

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* 1. TOP HEADER & IMMEDIATE REFRESH BAR                         */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-serif">
              <Building2 className="w-6 h-6 text-emerald-700" />
              Inventory Status
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Plot Status
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Real-time plot status counts across all authorized society blocks • Live sync every 15s
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => window.print()}
            className="p-2.5 sm:px-3 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[42px]"
            title="Print Inventory"
          >
            <span className="text-xs font-bold">Print</span>
          </button>
          <button
            onClick={handleRefreshClick}
            disabled={loadingLive || loadingHistory}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors border border-slate-200 shadow-xs cursor-pointer min-h-[42px] flex items-center gap-1.5 font-bold text-xs"
            title="Refresh Live Data Immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLive ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {liveError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-xs font-medium">{liveError}</p>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. LIVE SECTION: MAIN AGGREGATE CARDS                         */}
      {/* ============================================================ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Current Live Inventory Totals (All Authorized Blocks)
          </h2>
          {session?.role === 'sub_admin' && (
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
              Scoped to assigned blocks
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Available - Mint */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-900/10 border border-green-500/20 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-700" />
              </div>
              <h3 className="text-green-800 font-bold text-sm">Available</h3>
            </div>
            <div className="text-3xl font-bold text-green-700 min-h-[36px] flex items-center">
              <RollingCounter value={totalAvailable} loading={loadingLive} hasLoaded={hasLoadedLiveOnce} />
            </div>
            <p className="text-xs text-green-700/80 mt-2 font-medium">Ready to book</p>
          </div>

          {/* Reserved - Amber */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="text-amber-800 font-bold text-sm">Reserved</h3>
            </div>
            <div className="text-3xl font-bold text-amber-700 min-h-[36px] flex items-center">
              <RollingCounter value={totalReserved} loading={loadingLive} hasLoaded={hasLoadedLiveOnce} />
            </div>
            <p className="text-xs text-amber-700/80 mt-2 font-medium">Held for 24 hours</p>
          </div>

          {/* Booked - Blue */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-900/10 border border-blue-500/20 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
              </div>
              <h3 className="text-blue-800 font-bold text-sm">Booked</h3>
            </div>
            <div className="text-3xl font-bold text-blue-700 min-h-[36px] flex items-center">
              <RollingCounter value={totalBooked} loading={loadingLive} hasLoaded={hasLoadedLiveOnce} />
            </div>
            <p className="text-xs text-blue-700/80 mt-2 font-medium">Installment plan active</p>
          </div>

          {/* Allotted - Purple */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/10 border border-purple-500/20 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Map className="w-5 h-5 text-purple-700" />
              </div>
              <h3 className="text-purple-800 font-bold text-sm">Allotted</h3>
            </div>
            <div className="text-3xl font-bold text-purple-700 min-h-[36px] flex items-center">
              <RollingCounter value={totalAllotted} loading={loadingLive} hasLoaded={hasLoadedLiveOnce} />
            </div>
            <p className="text-xs text-purple-700/80 mt-2 font-medium">Paid in full (One-time)</p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. LIVE SECTION: LIVE BLOCK TABLE                             */}
      {/* ============================================================ */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
          Current Block Inventory Breakdown
        </h2>

        {/* Mobile Stacked Cards (< 768px) */}
        <div className="md:hidden space-y-3">
          {loadingLive && liveStats.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 animate-pulse">
                <div className="h-5 w-32 bg-slate-200 rounded-md" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-4 bg-slate-200 rounded" />
                  <div className="h-4 bg-slate-200 rounded" />
                  <div className="h-4 bg-slate-200 rounded" />
                  <div className="h-4 bg-slate-200 rounded" />
                </div>
              </div>
            ))
          ) : liveStats.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400 font-medium">
              No blocks accessible
            </div>
          ) : (
            liveStats.map((s) => (
              <div key={s.blockId} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                      <Map className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="text-slate-900 font-bold text-sm">{s.blockName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total (4 Core)</span>
                    <span className="text-slate-900 font-bold text-sm">
                      {(s.available + s.reserved + s.booked + s.allotted).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl flex items-center justify-between">
                    <span className="text-emerald-800 font-medium">Available:</span>
                    <span className="text-emerald-700 font-bold">{s.available.toLocaleString()}</span>
                  </div>
                  <div className="bg-amber-50/60 border border-amber-100 p-2.5 rounded-xl flex items-center justify-between">
                    <span className="text-amber-800 font-medium">Reserved:</span>
                    <span className="text-amber-700 font-bold">{s.reserved.toLocaleString()}</span>
                  </div>
                  <div className="bg-blue-50/60 border border-blue-100 p-2.5 rounded-xl flex items-center justify-between">
                    <span className="text-blue-800 font-medium">Booked:</span>
                    <span className="text-blue-700 font-bold">{s.booked.toLocaleString()}</span>
                  </div>
                  <div className="bg-purple-50/60 border border-purple-100 p-2.5 rounded-xl flex items-center justify-between">
                    <span className="text-purple-800 font-medium">Allotted:</span>
                    <span className="text-purple-700 font-bold">{s.allotted.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Stats Table (Desktop >= 768px) */}
        <div className="hidden md:block">
          <AdminTableShell 
            page={livePage} 
            pageSize={PAGE_SIZE} 
            total={totalRecords} 
            onPageChange={handlePageChange} 
            isTable={false}
          >
            <table className="w-full text-left bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-6">Block</th>
                  <th className="py-4 px-6 text-green-800">Available</th>
                  <th className="py-4 px-6 text-amber-800">Reserved</th>
                  <th className="py-4 px-6 text-blue-800">Booked</th>
                  <th className="py-4 px-6 text-purple-800">Allotted</th>
                  <th className="py-4 px-6 text-slate-700">Total (4 Core)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loadingLive && liveStats.length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-6"><div className="h-4 w-32 bg-slate-200/80 rounded-md" /></td>
                      <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-200/80 rounded-md" /></td>
                      <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-200/80 rounded-md" /></td>
                      <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-200/80 rounded-md" /></td>
                      <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-200/80 rounded-md" /></td>
                      <td className="py-4 px-6"><div className="h-4 w-16 bg-slate-200/80 rounded-md" /></td>
                    </tr>
                  ))
                ) : liveStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">No blocks available</td>
                  </tr>
                ) : (
                  liveStats.map((s) => (
                    <tr key={s.blockId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                            <Map className="w-4 h-4 text-slate-600" />
                          </div>
                          <span className="text-slate-800 font-semibold">{s.blockName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-green-700 font-semibold">{s.available.toLocaleString()}</td>
                      <td className="py-4 px-6 text-amber-700 font-semibold">{s.reserved.toLocaleString()}</td>
                      <td className="py-4 px-6 text-blue-700 font-semibold">{s.booked.toLocaleString()}</td>
                      <td className="py-4 px-6 text-purple-700 font-semibold">{s.allotted.toLocaleString()}</td>
                      <td className="py-4 px-6 text-slate-900 font-bold">
                        {(s.available + s.reserved + s.booked + s.allotted).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {liveStats.length > 0 && (
                <tfoot className="bg-slate-50/80 border-t border-slate-200 text-sm">
                  <tr>
                    <td className="py-4 px-6 text-slate-900 font-bold">Total</td>
                    <td className="py-4 px-6 text-green-700 font-bold">{totalAvailable.toLocaleString()}</td>
                    <td className="py-4 px-6 text-amber-700 font-bold">{totalReserved.toLocaleString()}</td>
                    <td className="py-4 px-6 text-blue-700 font-bold">{totalBooked.toLocaleString()}</td>
                    <td className="py-4 px-6 text-purple-700 font-bold">{totalAllotted.toLocaleString()}</td>
                    <td className="py-4 px-6 text-slate-900 font-bold">{totalSellable.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </AdminTableShell>
        </div>

        {totalDisputed > 0 && (
          <div className="text-xs text-slate-500 mt-2 italic px-2">
            * + {totalDisputed} disputed plot(s) not included in the four core counts.
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 4. HISTORY SECTION: SEPARATE FROM & TO STATUS TRANSITIONS    */}
      {/* ============================================================ */}
      <section className="border-t border-slate-200 pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-700" />
              <h2 className="text-xl font-bold text-slate-900 font-serif">History</h2>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Inspect historical plot status transitions between two selected dates. Does not alter live inventory.
            </p>
          </div>

          {/* Date Range Picker Form */}
          <form onSubmit={handleApplyHistory} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-mono font-bold uppercase text-[10px]">From</span>
                <input 
                  type="date" 
                  required
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent border-none text-slate-800 text-xs font-medium focus:outline-hidden p-0 w-32 cursor-pointer"
                />
              </div>
              <span className="text-slate-400 font-mono font-bold lowercase text-xs px-1">to</span>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-mono font-bold uppercase text-[10px]">To</span>
                <input 
                  type="date" 
                  required
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-transparent border-none text-slate-800 text-xs font-medium focus:outline-hidden p-0 w-32 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="submit"
                disabled={loadingHistory || !fromDate || !toDate}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 min-h-[38px]"
              >
                <Search className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                <span>Query History</span>
              </button>

              {historyHasQueried && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Clear Date Filter"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {historyError && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl flex items-center gap-2 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{historyError}</span>
          </div>
        )}

        {/* History Results View */}
        {historyHasQueried ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">
                Showing status changes from <strong className="text-slate-900">{appliedFrom}</strong> to <strong className="text-slate-900">{appliedTo}</strong>
              </span>
              {historyTotals && (
                <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {historyTotals.total.toLocaleString()} Total Transitions
                </span>
              )}
            </div>

            {/* History Transition Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider font-mono">Booked Transitions</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {loadingHistory ? '...' : (historyTotals?.booked ?? 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-blue-800/80 mt-1">Plots booked during period</p>
              </div>

              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <Map className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider font-mono">Allotted Transitions</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {loadingHistory ? '...' : (historyTotals?.allotted ?? 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-purple-800/80 mt-1">Plots allotted / fully paid</p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">Reserved Transitions</span>
                </div>
                <div className="text-2xl font-bold text-amber-700">
                  {loadingHistory ? '...' : (historyTotals?.reserved ?? 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-amber-800/80 mt-1">Holds placed during period</p>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Block History Breakdown ({appliedFrom} → {appliedTo})
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-5">Block</th>
                    <th className="py-3 px-5 text-blue-800">Booked</th>
                    <th className="py-3 px-5 text-purple-800">Allotted</th>
                    <th className="py-3 px-5 text-amber-800">Reserved</th>
                    <th className="py-3 px-5 text-slate-700">Total Period Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingHistory ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3 px-5"><div className="h-4 w-28 bg-slate-200/80 rounded" /></td>
                        <td className="py-3 px-5"><div className="h-4 w-12 bg-slate-200/80 rounded" /></td>
                        <td className="py-3 px-5"><div className="h-4 w-12 bg-slate-200/80 rounded" /></td>
                        <td className="py-3 px-5"><div className="h-4 w-12 bg-slate-200/80 rounded" /></td>
                        <td className="py-3 px-5"><div className="h-4 w-16 bg-slate-200/80 rounded" /></td>
                      </tr>
                    ))
                  ) : historyStats.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-medium text-xs">
                        No status transitions recorded in this timeframe
                      </td>
                    </tr>
                  ) : (
                    historyStats.map((h) => (
                      <tr key={h.blockId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-5 font-semibold text-slate-800">{h.blockName}</td>
                        <td className="py-3 px-5 text-blue-700 font-semibold">{h.booked.toLocaleString()}</td>
                        <td className="py-3 px-5 text-purple-700 font-semibold">{h.allotted.toLocaleString()}</td>
                        <td className="py-3 px-5 text-amber-700 font-semibold">{h.reserved.toLocaleString()}</td>
                        <td className="py-3 px-5 font-bold text-slate-900">
                          {(h.booked + h.allotted + h.reserved).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {historyStats.length > 0 && historyTotals && (
                  <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold text-sm">
                    <tr>
                      <td className="py-3 px-5 text-slate-900">Period Total</td>
                      <td className="py-3 px-5 text-blue-700">{historyTotals.booked.toLocaleString()}</td>
                      <td className="py-3 px-5 text-purple-700">{historyTotals.allotted.toLocaleString()}</td>
                      <td className="py-3 px-5 text-amber-700">{historyTotals.reserved.toLocaleString()}</td>
                      <td className="py-3 px-5 text-slate-900">
                        {(historyTotals.booked + historyTotals.allotted + historyTotals.reserved).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center text-slate-500 space-y-1">
            <History className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-700">Historical Range Mode</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Select a From and To date above and click &quot;Query History&quot; to review status transition activity across that timeframe.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
