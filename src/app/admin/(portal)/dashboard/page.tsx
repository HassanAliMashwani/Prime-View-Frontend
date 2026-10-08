'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Building2,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowRight,
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  KeyRound,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getAdminMasterPlanBlocks, BlockSummary } from '@/lib/dal/adminPlots';
import { getReservations, ReservationWithConflict } from '@/lib/dal/reservations';
import { AdminSession } from '@/lib/mock/types';
import dynamic from 'next/dynamic';
import { getBlockTheme } from '@/lib/map/regionData';
import { AdminDashboardSkeleton } from '@/components/ui/skeleton';
import { getCache, setCache, reconcileItems } from '@/lib/dal/apiCache';
import { getInventoryMonthlyHistory, MonthlyHistoryPoint } from '@/lib/dal/inventory';
import type { TimeRange } from '@/components/admin/dashboard/InventoryOverviewChart';

const InventoryOverviewChart = dynamic(
  () => import('@/components/admin/dashboard/InventoryOverviewChart'),
  { ssr: false }
);

export default function AdminDashboardPage() {
  const getInit = () => {
    if (typeof window === 'undefined') return null;
    const s = getActiveAdminSession();
    if (!s) return null;
    return getCache<any>(`/dashboard:${s.adminId}`, true);
  };
  const init = getInit();

  const getChartCacheKey = (adminId: string, range: TimeRange) => `/dashboard/chart:${adminId}:${range}`;

  const getInitChart = () => {
    if (typeof window === 'undefined') return [];
    const s = getActiveAdminSession();
    if (!s) return [];
    const adminId = s.adminId || 'admin';
    return getCache<MonthlyHistoryPoint[]>(getChartCacheKey(adminId, '6_months'), true) || [];
  };

  const [session, setSession] = useState<AdminSession | null>(() => {
    if (typeof window === 'undefined') return null;
    return getActiveAdminSession();
  });
  const [blocks, setBlocks] = useState<BlockSummary[]>(init?.blocks || []);
  const [reservations, setReservations] = useState<ReservationWithConflict[]>(init?.reservations || []);
  const [loading, setLoading] = useState<boolean>(!init);
  const [chartRange, setChartRange] = useState<TimeRange>('6_months');
  const [monthlyPoints, setMonthlyPoints] = useState<MonthlyHistoryPoint[]>(getInitChart);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const chartReqIdRef = useRef(0);

  const loadChartData = useCallback(async (activeSession: AdminSession, range: TimeRange) => {
    const adminId = activeSession.adminId || 'admin';
    const key = getChartCacheKey(adminId, range);
    const cached = getCache<MonthlyHistoryPoint[]>(key, true);
    if (cached) {
      setMonthlyPoints(cached);
    } else {
      setChartLoading(true);
    }

    const currentReq = ++chartReqIdRef.current;
    try {
      const res = await getInventoryMonthlyHistory(range, activeSession.token);
      if (currentReq !== chartReqIdRef.current) return;
      if (res.ok && res.monthly) {
        setMonthlyPoints(res.monthly);
        setCache(key, res.monthly);

        // Prefetch other two ranges
        const ALL_RANGES: TimeRange[] = ['6_months', '1_year', 'all_time'];
        const otherRanges = ALL_RANGES.filter((r) => r !== range);
        for (const otherRange of otherRanges) {
          const otherKey = getChartCacheKey(adminId, otherRange);
          if (!getCache(otherKey, false)) {
            getInventoryMonthlyHistory(otherRange, activeSession.token)
              .then((otherRes) => {
                if (otherRes.ok && otherRes.monthly) {
                  setCache(otherKey, otherRes.monthly);
                }
              })
              .catch(() => {});
          }
        }
      }
    } catch {
      // non-blocking
    } finally {
      if (currentReq === chartReqIdRef.current) {
        setChartLoading(false);
      }
    }
  }, []);

  const loadData = useCallback(async (activeSession: AdminSession) => {
    try {
      const [blockRes, resRes] = await Promise.all([
        getAdminMasterPlanBlocks(activeSession),
        getReservations(activeSession),
      ]);

      if (blockRes.ok) setBlocks((prev) => reconcileItems(prev, blockRes.blocks, (b) => b.id));
      if (resRes.ok) setReservations((prev) => reconcileItems(prev, resRes.reservations, (r) => r.id));
      
      setCache(`/dashboard:${activeSession.adminId}`, {
        blocks: blockRes.ok ? blockRes.blocks : [],
        reservations: resRes.ok ? resRes.reservations : [],
      });
    } catch {
      console.error('request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const s = getActiveAdminSession();
    if (s) {
      setSession(s);
      loadData(s);
      loadChartData(s, chartRange);
    }
  }, [loadData, loadChartData]);

  // Real-time sync via interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      const s = getActiveAdminSession();
      if (s) {
        loadData(s);
        loadChartData(s, chartRange);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadData, loadChartData, chartRange]);

  const isSuper = session?.role === 'super_admin';
  const canAccess = !session || isSuper || Boolean(session.permissions?.can_view_master_plan);

  if (session && !canAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Master Plan</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your administrative account does not have permission to view the society master plan. Contact administration to adjust your privileges.
        </p>
        <button
          onClick={() => setSession(getActiveAdminSession())}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const isInitialLoading = loading && blocks.length === 0;

  // Computed metrics across accessible blocks
  const totalPlots = blocks.reduce((acc, b) => acc + b.totalCount, 0);
  const availablePlots = blocks.reduce((acc, b) => acc + b.availableCount, 0);
  const reservedPlots = blocks.reduce((acc, b) => acc + b.reservedCount, 0);
  const bookedPlots = blocks.reduce((acc, b) => acc + b.bookedCount, 0);
  const conflictsCount = reservations.filter((r) => r.hasDuplicateConflict).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Duplicate Conflict Alert Banner (If Any) */}
      {conflictsCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-sm text-amber-950">
              Duplicate Reservation Race Detected ({conflictsCount} conflicting claims)
            </div>
            <p className="text-xs text-amber-900/90 mt-0.5">
              Multiple active token deposits have been filed on identical plot(s) (e.g. Plot R-08 in Royal Block). Review the Sort Reservations ledger immediately to confirm priority or resolve disputes.
            </p>
          </div>
          <Link
            href="/admin/reservations"
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            Resolve Conflicts
          </Link>
        </div>
      )}

      {/* Aggregate Overview Cards (Purple, Mint, Amber, Blue) - Preserved during skeleton loading just like Inventory Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Inventory - Purple */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/10 border border-purple-500/20 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-700" />
            </div>
            <h3 className="text-purple-800 font-bold text-sm">Total Inventory</h3>
          </div>
          {isInitialLoading ? (
            <div className="h-9 w-20 bg-purple-500/20 rounded-xl animate-pulse my-0.5" />
          ) : (
            <div className="text-3xl font-bold text-purple-700">{totalPlots}</div>
          )}
          <p className="text-xs text-purple-700/80 mt-2 font-medium flex items-center gap-1">
            <span>Across</span>
            {isInitialLoading ? (
              <span className="inline-block h-3.5 w-4 bg-purple-500/20 rounded-xs animate-pulse" />
            ) : (
              <span>{blocks.length}</span>
            )}
            <span>accessible blocks</span>
          </p>
        </div>

        {/* 2. Available Plots - Mint */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-900/10 border border-green-500/20 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-700" />
            </div>
            <h3 className="text-green-800 font-bold text-sm">Available Plots</h3>
          </div>
          {isInitialLoading ? (
            <div className="h-9 w-20 bg-green-500/20 rounded-xl animate-pulse my-0.5" />
          ) : (
            <div className="text-3xl font-bold text-green-700">{availablePlots}</div>
          )}
          <p className="text-xs text-green-700/80 mt-2 font-medium">
            Ready for immediate booking
          </p>
        </div>

        {/* 3. Active Reservations - Amber */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="text-amber-800 font-bold text-sm">Active Reservations</h3>
          </div>
          {isInitialLoading ? (
            <div className="h-9 w-20 bg-amber-500/20 rounded-xl animate-pulse my-0.5" />
          ) : (
            <div className="text-3xl font-bold text-amber-700 flex items-center gap-2">
              {reservedPlots}
              {conflictsCount > 0 && (
                <span className="text-[10px] font-sans font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                  {conflictsCount} Disputed
                </span>
              )}
            </div>
          )}
          <p className="text-xs text-amber-700/80 mt-2 font-medium">
            Token deposits on hold
          </p>
        </div>

        {/* 4. Booked & Confirmed - Blue */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-900/10 border border-blue-500/20 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
            </div>
            <h3 className="text-blue-800 font-bold text-sm">Booked & Confirmed</h3>
          </div>
          {isInitialLoading ? (
            <div className="h-9 w-20 bg-blue-500/20 rounded-xl animate-pulse my-0.5" />
          ) : (
            <div className="text-3xl font-bold text-blue-700">{bookedPlots}</div>
          )}
          <p className="text-xs text-blue-700/80 mt-2 font-medium">
            Verified member allocations
          </p>
        </div>
      </div>

      {/* Inventory Overview Trend Chart */}
      <InventoryOverviewChart
        currentAvailable={availablePlots}
        currentReserved={reservedPlots}
        currentBooked={bookedPlots}
        monthlyData={monthlyPoints}
        timeRange={chartRange}
        onRangeChange={(range) => {
          setChartRange(range);
          if (session) {
            const adminId = session.adminId || 'admin';
            const cached = getCache<MonthlyHistoryPoint[]>(getChartCacheKey(adminId, range), true);
            if (cached) {
              setMonthlyPoints(cached);
            }
            loadChartData(session, range);
          }
        }}
        isLoading={chartLoading}
      />

      {/* Accessible Blocks Overview - Distinct Colored Sectors */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900">
              Accessible Sectors {isInitialLoading ? '' : `(${blocks.length})`}
            </h3>
          </div>
          <Link
            href="/admin/master-plan"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View Interactive Map</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isInitialLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 bg-slate-200 rounded-md" />
                  <div className="h-5 w-16 bg-slate-200 rounded-md" />
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 bg-white rounded-xl border border-slate-200" />
                  <div className="h-12 bg-white rounded-xl border border-slate-200" />
                  <div className="h-12 bg-white rounded-xl border border-slate-200" />
                </div>
                <div className="h-9 w-full bg-slate-200 rounded-xl" />
              </div>
            ))
          ) : (
            blocks.map((block) => {
              const availPct = block.totalCount > 0 ? (block.availableCount / block.totalCount) * 100 : 0;
              const resPct = block.totalCount > 0 ? (block.reservedCount / block.totalCount) * 100 : 0;
              const bookPct = block.totalCount > 0 ? (block.bookedCount / block.totalCount) * 100 : 0;
              const theme = getBlockTheme(block.id);

              return (
                <div
                  key={block.id}
                  style={theme.cardBorderStyle}
                  className="bg-slate-50/70 border-2 rounded-2xl p-5 hover:bg-white transition-all shadow-xs group flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Sector Name & Plot Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        style={theme.titleStyle}
                        className="font-serif font-bold text-base tracking-tight group-hover:underline"
                      >
                        {block.name}
                      </span>
                      <span
                        style={theme.badgeStyle}
                        className="text-[11px] font-mono font-bold border px-2.5 py-1 rounded-lg leading-none inline-flex items-center shadow-2xs"
                      >
                        {block.totalCount} Plots
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200/90 flex overflow-hidden mb-3.5 shadow-2xs">
                      <div style={{ width: `${availPct}%` }} className="bg-emerald-500" title={`Available: ${block.availableCount}`} />
                      <div style={{ width: `${resPct}%` }} className="bg-amber-400" title={`Reserved: ${block.reservedCount}`} />
                      <div style={{ width: `${bookPct}%` }} className="bg-purple-500" title={`Booked: ${block.bookedCount}`} />
                    </div>

                    {/* 3 Metric Stat Tiles with Perfect Vertical & Horizontal Alignment */}
                    <div className="grid grid-cols-3 gap-2.5 mb-4">
                      <div className="bg-white border border-emerald-200/80 py-2.5 px-1 rounded-xl flex flex-col items-center justify-center text-center shadow-2xs">
                        <span className="text-base font-bold font-mono text-emerald-700 leading-none">
                          {block.availableCount}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-1.5 leading-none">
                          Available
                        </span>
                      </div>
                      <div className="bg-white border border-amber-200/80 py-2.5 px-1 rounded-xl flex flex-col items-center justify-center text-center shadow-2xs">
                        <span className="text-base font-bold font-mono text-amber-700 leading-none">
                          {block.reservedCount}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-1.5 leading-none">
                          Reserved
                        </span>
                      </div>
                      <div className="bg-white border border-purple-200/80 py-2.5 px-1 rounded-xl flex flex-col items-center justify-center text-center shadow-2xs">
                        <span className="text-base font-bold font-mono text-purple-700 leading-none">
                          {block.bookedCount}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-1.5 leading-none">
                          Booked
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Manage Block Grid Action Button */}
                  <Link
                    href={`/admin/master-plan/${block.id}`}
                    style={theme.btnStyle}
                    className="w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 group/btn cursor-pointer"
                  >
                    <span>Manage Block Grid</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Two Column Section: Recent Reservations & Live Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reservations */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-amber-600" />
              <span>Active Reservations {isInitialLoading ? '' : `(${reservations.filter((r) => r.status === 'active').length})`}</span>
            </h3>
            <Link
              href="/admin/reservations"
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Full Ledger →
            </Link>
          </div>

          <div className="space-y-3">
            {isInitialLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 animate-pulse">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-slate-200 rounded-md" />
                    <div className="h-3 w-40 bg-slate-200/70 rounded-md" />
                  </div>
                  <div className="h-7 w-16 bg-slate-200 rounded-xl" />
                </div>
              ))
            ) : reservations.filter((r) => r.status === 'active').length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No active reservations recorded</div>
            ) : (
              reservations
                .filter((r) => r.status === 'active')
                .slice(0, 5)
                .map((r) => {
                  const sectorTheme = getBlockTheme(r.blockId);
                  return (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-2xl border transition-colors ${r.hasDuplicateConflict
                          ? 'bg-amber-50/90 border-amber-300'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                        } flex items-center justify-between gap-3`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs font-mono">{r.plotNumber}</span>
                          <span
                            style={sectorTheme.badgeStyle}
                            className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border"
                          >
                            {r.blockId}
                          </span>
                          {r.hasDuplicateConflict && (
                            <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded font-bold">
                              Conflict Claim
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-900 font-bold mt-0.5 truncate">{r.customerName}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          Token: <strong className="text-slate-800">PKR {r.tokenFee.toLocaleString()}</strong> • By {r.reservedByAdminName}
                        </div>
                      </div>

                      <Link
                        href={`/admin/reservations`}
                        className="px-3.5 py-1.5 text-[11px] font-bold bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl transition-colors shadow-xs shrink-0 whitespace-nowrap inline-flex items-center justify-center min-w-[70px]"
                      >
                        Details
                      </Link>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Administrative Audit Trail Link Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Administrative Audit Trail</span>
              </h3>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Ledger
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete society modification history, administrative actions, and authorization events are audited in the centralized audit log.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Access Activity Logs</span>
            <Link
              href="/admin/audit-log"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Open Audit Log</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
