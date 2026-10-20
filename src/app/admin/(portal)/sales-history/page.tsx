'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { siteConfig } from '@/data/site';
import { 
  ScrollText, 
  TrendingUp, 
  Calendar, 
  Search, 
  User, 
  Building2, 
  CreditCard, 
  Filter, 
  Printer, 
  ShieldCheck, 
  Layers, 
  ExternalLink, 
  RefreshCw,
  X,
  Award,
  Sparkles,
  FileCheck2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getSubAdmins } from '@/lib/dal/users';
import { 
  getSalesHistory, 
  SalesHistoryItem, 
  SalesHistoryKpis, 
  SalesHistoryFilters 
} from '@/lib/dal/salesHistory';
import { AdminSalesHistorySkeleton } from '@/components/ui/skeleton';
import { AdminActionToast } from '@/components/admin/AdminActionToast';
import { AdminSession, PlotCategory } from '@/lib/mock/types';
import { getCache, setCache, generateCacheKey, clearCachePrefix } from '@/lib/dal/apiCache';
import { AdminTableShell } from '@/components/admin/table/AdminTableShell';
import { runLane1, runLane2, enqueueLane2 } from '@/lib/requestLanes';
const PAGE_SIZE = 10;

const SOCIETY_BLOCKS = [
  { id: 'abbott', name: 'Abbott Block' },
  { id: 'royal', name: 'Royal Block' },
  { id: 'overseas', name: 'Overseas Block' },
  { id: 'elite', name: 'Elite Block' },
  { id: 'commercial', name: 'Commercial Block' },
  { id: 'npf-phase-1', name: 'NPF Phase 1' },
  { id: 'npf-phase-2', name: 'NPF Phase 2' },
];

function SalesHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState<boolean>(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<SalesHistoryItem[]>([]);
  const [kpis, setKpis] = useState<SalesHistoryKpis>({
    totalPlotsSold: 0,
    totalRevenuePkr: 0,
    todayPlotsSold: 0,
    todayRevenuePkr: 0,
    topCloser: null,
    salesByCategory: {},
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter States
  const [datePreset, setDatePreset] = useState<SalesHistoryFilters['datePreset']>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [adminFilter, setAdminFilter] = useState<string>('all');
  const [adminOfficers, setAdminOfficers] = useState<Array<{ id: string; name: string; username: string }>>([]);
  const [blockFilter, setBlockFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(parseInt(searchParams?.get('page') || '1', 10));

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    router.push(url.pathname + url.search);
  };

  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printItems, setPrintItems] = useState<SalesHistoryItem[] | null>(null);
  const reqIdRef = React.useRef(0);

  const handlePrint = async () => {
    if (!session) return;
    setIsPrinting(true);
    try {
      const activeAdmin = adminFilter !== 'all' ? adminFilter : undefined;
      const filters = {
        datePreset,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        adminId: activeAdmin,
        blockId: blockFilter !== 'all' ? blockFilter : undefined,
        category: categoryFilter !== 'all' ? (categoryFilter as PlotCategory) : undefined,
        search: search.trim() || undefined,
        page: 1,
        pageSize: 10000,
      };
      const res = await getSalesHistory(session, filters);
      if (res && res.ok && res.items) {
        setPrintItems(res.items);
      } else {
        setPrintItems(items);
      }
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 200);
    } catch (err) {
      console.error('Failed to prepare print ledger', err);
      setPrintItems(items);
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 100);
    }
  };

  const loadData = useCallback(async (
    currentSession: AdminSession, 
    pageParam = 1, 
    background = false,
    overrideAdminId?: string
  ) => {
    const currentReq = ++reqIdRef.current;
    try {
      const activeAdmin = overrideAdminId !== undefined ? overrideAdminId : adminFilter;
      const filters = {
        datePreset,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        adminId: activeAdmin !== 'all' ? activeAdmin : undefined,
        blockId: blockFilter !== 'all' ? blockFilter : undefined,
        category: categoryFilter !== 'all' ? (categoryFilter as PlotCategory) : undefined,
        search: search.trim() || undefined,
        page: pageParam,
        pageSize: PAGE_SIZE
      };

      const pathParams = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v !== undefined) as string[][]);
      const path = `/sales/history?${pathParams.toString()}`;
      const adminId = currentSession.adminId || currentSession.username || 'admin';
      const key = generateCacheKey('GET', path, adminId);

      if (!background) {
        const cached = getCache<{ items: SalesHistoryItem[], kpis: SalesHistoryKpis, total: number }>(key, true);
        if (cached) {
          setItems(cached.items);
          setKpis(cached.kpis);
          setTotalRecords(cached.total);
          setLoading(false);
        } else {
          setLoading(true);
        }
      }

      const fetcher = async (signal?: AbortSignal) => {
        return await getSalesHistory(currentSession, filters, signal);
      };

      let res: any;
      if (background) {
        res = await runLane2({
          screen: 'sales-history',
          key,
          isRefresh: true,
          fn: fetcher,
        });
      } else {
        res = await runLane1({
          screen: 'sales-history',
          key,
          fn: fetcher,
        });
      }

      if (!res || currentReq !== reqIdRef.current) return;

      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: res.error === 'FORBIDDEN_SALES_HISTORY_ACCESS'
            ? (res.message || 'You do not have permission to view sales history.')
            : 'Sales history failed to load.'
        });
      } else {
        setItems(res.items || []);
        setKpis(res.kpis);
        setTotalRecords(res.total || 0);
        setCache(key, { items: res.items || [], kpis: res.kpis, total: res.total || 0 });

        // Prefetch next page into cache if next page exists using Lane 2
        const totalPages = Math.ceil((res.total || 0) / PAGE_SIZE);
        if (pageParam < totalPages) {
          const nextP = pageParam + 1;
          const nextFilters = { ...filters, page: nextP };
          const nextPathParams = new URLSearchParams(Object.entries(nextFilters).filter(([_, v]) => v !== undefined) as string[][]);
          const nextKey = generateCacheKey('GET', `/sales/history?${nextPathParams.toString()}`, adminId);
          if (!getCache(nextKey, false)) {
            enqueueLane2(
              async (signal) => {
                const nextRes = await getSalesHistory(currentSession, nextFilters, signal);
                if (nextRes.ok) {
                  setCache(nextKey, { items: nextRes.items || [], kpis: nextRes.kpis, total: nextRes.total || 0 });
                }
                return nextRes;
              },
              nextKey,
              'sales-history'
            );
          }
        }
      }
    } catch (err: any) {
      if (err?.message === 'REQUEST_SUPERSEDED') return;
      if (currentReq !== reqIdRef.current) return;
      console.error('request failed', err);
      setFeedback({ type: 'error', message: 'Sales history failed to load.' });
    } finally {
      if (currentReq === reqIdRef.current) {
        setHasLoadedOnce(true);
        if (!background) setLoading(false);
      }
    }
  }, [datePreset, dateFrom, dateTo, adminFilter, blockFilter, categoryFilter, search]);

  useEffect(() => {
    setMounted(true);
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);

    if (cur.role === 'super_admin') {
      getSubAdmins(cur, { pageSize: 100 })
        .then((res) => {
          if (res?.ok && res.subAdmins) {
            const list = [
              {
                id: cur.adminId || cur.username || 'superadmin',
                name: `${cur.fullName || 'Super Administrator'} (Super Admin)`,
                username: cur.username,
              },
              ...res.subAdmins.map((sub: any) => ({
                id: sub.id,
                name: `${sub.fullName || sub.username} (@${sub.username})`,
                username: sub.username,
              })),
            ];
            const unique = Array.from(new Map(list.map((item) => [item.id, item])).values());
            setAdminOfficers(unique);
          }
        })
        .catch((err) => console.error('Failed to load sub-admins for officer filter', err));
    }

    loadData(cur, page, false);

    // 30-second refresh in background Lane 2
    const interval = setInterval(() => {
      loadData(cur, page, true);
    }, 30000);

    return () => clearInterval(interval);
  }, [router, loadData, page]);

  // Flash feedback auto-clear (8s)
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle Preset change
  const handlePresetSelect = (preset: SalesHistoryFilters['datePreset']) => {
    setDatePreset(preset);
    let from = dateFrom;
    let to = dateTo;
    if (preset !== 'all') {
      setDateFrom('');
      setDateTo('');
      from = '';
      to = '';
    }
    const adminId = session?.adminId || session?.username || 'admin';
    const filters = {
      datePreset: preset,
      dateFrom: from || undefined,
      dateTo: to || undefined,
      blockId: blockFilter !== 'all' ? blockFilter : undefined,
      category: categoryFilter !== 'all' ? (categoryFilter as PlotCategory) : undefined,
      search: search.trim() || undefined,
      page: 1,
      pageSize: PAGE_SIZE,
    };
    const pathParams = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v !== undefined) as string[][]);
    const key = generateCacheKey('GET', `/sales/history?${pathParams.toString()}`, adminId);
    const cached = getCache<{ items: SalesHistoryItem[], kpis: SalesHistoryKpis, total: number }>(key, true);
    if (cached) {
      setItems(cached.items);
      setKpis(cached.kpis);
      setTotalRecords(cached.total);
      setLoading(false);
    } else {
      setItems([]);
      setLoading(true);
    }
  };

  const handleBlockFilterChange = (val: string) => {
    setBlockFilter(val);
    const adminId = session?.adminId || session?.username || 'admin';
    const filters = {
      datePreset,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      blockId: val !== 'all' ? val : undefined,
      category: categoryFilter !== 'all' ? (categoryFilter as PlotCategory) : undefined,
      search: search.trim() || undefined,
      page: 1,
      pageSize: PAGE_SIZE,
    };
    const pathParams = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v !== undefined) as string[][]);
    const key = generateCacheKey('GET', `/sales/history?${pathParams.toString()}`, adminId);
    const cached = getCache<{ items: SalesHistoryItem[], kpis: SalesHistoryKpis, total: number }>(key, true);
    if (cached) {
      setItems(cached.items);
      setKpis(cached.kpis);
      setTotalRecords(cached.total);
      setLoading(false);
    } else {
      setItems([]);
      setLoading(true);
    }
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
    const adminId = session?.adminId || session?.username || 'admin';
    const filters = {
      datePreset,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      blockId: blockFilter !== 'all' ? blockFilter : undefined,
      category: val !== 'all' ? (val as PlotCategory) : undefined,
      search: search.trim() || undefined,
      page: 1,
      pageSize: PAGE_SIZE,
    };
    const pathParams = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v !== undefined) as string[][]);
    const key = generateCacheKey('GET', `/sales/history?${pathParams.toString()}`, adminId);
    const cached = getCache<{ items: SalesHistoryItem[], kpis: SalesHistoryKpis, total: number }>(key, true);
    if (cached) {
      setItems(cached.items);
      setKpis(cached.kpis);
      setTotalRecords(cached.total);
      setLoading(false);
    } else {
      setItems([]);
      setLoading(true);
    }
  };

  const handleAdminFilterChange = (val: string) => {
    setAdminFilter(val);
    setPage(1);
    const adminId = session?.adminId || session?.username || 'admin';
    const activeAdmin = val !== 'all' ? val : undefined;
    const filters = {
      datePreset,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      adminId: activeAdmin,
      blockId: blockFilter !== 'all' ? blockFilter : undefined,
      category: categoryFilter !== 'all' ? (categoryFilter as PlotCategory) : undefined,
      search: search.trim() || undefined,
      page: 1,
      pageSize: PAGE_SIZE,
    };
    const pathParams = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v !== undefined) as string[][]);
    const key = generateCacheKey('GET', `/sales/history?${pathParams.toString()}`, adminId);
    const cached = getCache<{ items: SalesHistoryItem[], kpis: SalesHistoryKpis, total: number }>(key, true);
    if (cached) {
      setItems(cached.items);
      setKpis(cached.kpis);
      setTotalRecords(cached.total);
      setLoading(false);
    } else {
      setItems([]);
      setLoading(true);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setAdminFilter('all');
    setBlockFilter('all');
    setCategoryFilter('all');
    setSearch('');
    setPage(1);
    const adminId = session?.adminId || session?.username || 'admin';
    const key = generateCacheKey('GET', `/sales/history?datePreset=all&page=1&pageSize=${PAGE_SIZE}`, adminId);
    const cached = getCache<{ items: SalesHistoryItem[], kpis: SalesHistoryKpis, total: number }>(key, true);
    if (cached) {
      setItems(cached.items);
      setKpis(cached.kpis);
      setTotalRecords(cached.total);
      setLoading(false);
    } else {
      setItems([]);
      setLoading(true);
    }
  };

  // Build block options:
  // Super Admin: unique { blockId, blockName } from items plus the 8 society blocks
  // Non-super-admin: only session.assignedBlocks
  const blockOptions = React.useMemo(() => {
    if (session?.role === 'super_admin') {
      const map = new Map<string, string>();
      for (const b of SOCIETY_BLOCKS) map.set(b.id, b.name);
      for (const item of items) {
        if (item.blockId) map.set(item.blockId, item.blockName || item.blockId);
      }
      return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }
    const assigned = session?.assignedBlocks || [];
    return assigned.map((id: string) => {
      const found = SOCIETY_BLOCKS.find((b) => b.id === id);
      return { id, name: found ? found.name : id.toUpperCase() };
    });
  }, [session, items]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = (items || []).filter(
    (sale) => sale && sale.plotId && typeof sale.price === 'number' && !isNaN(sale.price) && isFinite(sale.price) && sale.price > 0
  );
  const from = totalRecords === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, totalRecords);

  const totalContractSum = typeof kpis?.totalRevenuePkr === 'number' && !isNaN(kpis.totalRevenuePkr) ? kpis.totalRevenuePkr : 0;

  const rowsToPrint = printItems !== null ? printItems : items;
  const printPlotCount = rowsToPrint.length;
  const printTotalSum = rowsToPrint.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none print:space-y-0">
      {/* Screen-Only Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xs">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-[#10251E] tracking-tight">
                Society Sales History Report
              </h1>
              <p className="text-xs text-slate-500">
                Plots currently booked in the customer directory.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-70"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Printer className="w-4 h-4 text-white" />
            )}
            <span>{isPrinting ? 'Preparing Print...' : 'Print Ledger'}</span>
          </button>

          {!mounted || !session || session.role === 'super_admin' ? null : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Scoped: {session.assignedBlocks?.join(', ').toUpperCase()}</span>
            </span>
          )}
        </div>
      </div>

      {/* Screen-Only KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 print:hidden">
        {/* Plots Sold Today */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Sold Today</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-emerald-900">
            {loading && items.length === 0 ? (
              <span className="inline-block w-16 h-7 bg-emerald-100 animate-pulse rounded" />
            ) : (
              `${kpis.todayPlotsSold} Units`
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            {loading && items.length === 0 ? (
              <span className="inline-block w-24 h-4 bg-slate-100 animate-pulse rounded" />
            ) : (
              `PKR ${kpis.todayRevenuePkr.toLocaleString()}`
            )}
          </div>
        </div>

        {/* Filtered Period Units */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Filtered Units Sold
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-slate-900">
            {loading && items.length === 0 ? (
              <span className="inline-block w-16 h-7 bg-slate-200 animate-pulse rounded" />
            ) : (
              `${kpis.totalPlotsSold} Units`
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Across selected filters</div>
        </div>

        {/* Filtered Period Revenue */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs lg:col-span-2">
          <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider flex items-center justify-between">
            <span>Total Sales Volume</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-indigo-950 font-mono">
            {loading && items.length === 0 ? (
              <span className="inline-block w-36 h-7 bg-indigo-100 animate-pulse rounded" />
            ) : (
              `PKR ${kpis.totalRevenuePkr.toLocaleString()}`
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Combined contracted value across installments & full payments
          </div>
        </div>

        {/* Top Closer */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>Top Sales Closer</span>
            <Award className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-2 text-base font-bold text-slate-900 truncate">
            {loading && items.length === 0 ? (
              <span className="inline-block w-24 h-5 bg-slate-200 animate-pulse rounded" />
            ) : (
              kpis.topCloser ? kpis.topCloser.name : 'N/A'
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            {loading && items.length === 0 ? (
              <span className="inline-block w-28 h-4 bg-slate-100 animate-pulse rounded" />
            ) : (
              kpis.topCloser ? `${kpis.topCloser.count} deals • PKR ${kpis.topCloser.revenuePkr.toLocaleString()}` : '0 deals'
            )}
          </div>
        </div>
      </div>

      {/* Screen-Only Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 print:hidden">
        {/* Presets Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Presets:</span>
            </span>
            {(['all', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month'] as const).map((preset) => {
              const labels: Record<string, string> = {
                all: 'All Time',
                today: 'Today',
                yesterday: 'Yesterday',
                last_7_days: 'Last 7 Days',
                last_30_days: 'Last 30 Days',
                this_month: 'This Month',
              };
              const active = datePreset === preset;
              return (
                <button
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {labels[preset]}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleClearFilters}
            className="text-xs text-slate-500 hover:text-rose-600 font-semibold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        {/* Detailed Filters Row */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${session?.role === 'super_admin' ? 'md:grid-cols-3 lg:grid-cols-6' : 'md:grid-cols-5'} gap-3 text-xs`}>
          {session?.role === 'super_admin' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Sales Officer</label>
              <select
                value={adminFilter}
                onChange={(e) => handleAdminFilterChange(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-600 bg-white"
              >
                <option value="all">All Admins / Officers</option>
                {adminOfficers.map((adm) => (
                  <option key={adm.id} value={adm.id}>
                    {adm.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date From */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setDatePreset('all');
              }}
              className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setDatePreset('all');
              }}
              className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Sold By Blocks Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Sold By Blocks</label>
            <select
              value={blockFilter}
              onChange={(e) => handleBlockFilterChange(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-600 bg-white"
            >
              <option value="all">All Blocks</option>
              {blockOptions.map((b: { id: string; name: string }) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryFilterChange(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-600 bg-white"
            >
              <option value="all">All Categories</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="farm_house">Farm House</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Plot, Customer, Member #..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PRINTABLE LEDGER CONTAINER (#pv-sales-ledger-printable)              */}
      {/* ==================================================================== */}
      <div 
        id="pv-sales-ledger-printable" 
        className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs print:border-none print:shadow-none print:rounded-none print:p-2 print:overflow-visible"
      >
        {/* Print-Only Official Society Letterhead */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative shrink-0">
                <Image
                  src={siteConfig.logoPath}
                  alt="Prime View Emblem"
                  width={48}
                  height={48}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <div className="font-serif font-black text-2xl tracking-tight text-[#10251E] leading-tight">
                  PRIME VIEW HOUSING SCHEME
                </div>
                <div className="text-[11px] uppercase tracking-widest text-[#8C6D2D] font-bold mt-0.5">
                  Executive Society Administration & Plot Allotment Division
                </div>
                <div className="text-[10px] text-slate-500">
                  Main Expressway Sector, Islamabad / Rawalpindi Territory • UAN: (051) 111-PRIME
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-600">
              <div className="font-mono font-bold text-slate-950 text-xs">
                OFFICIAL SALES & ALLOTMENT LEDGER
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Directory Status: <strong className="font-mono text-slate-800">Live Customer Directory</strong>
              </div>
              <div className="text-[10px] text-slate-500">
                Printed: <strong>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
            </div>
          </div>

          {/* Scope and Filters Bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700">
            <div>
              <span className="text-slate-400 font-medium">Operator: </span>
              <strong className="text-slate-900">{session?.fullName || 'Chief Administrator'}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Period Filter: </span>
              <strong className="text-slate-900 uppercase">
                {datePreset === 'all' 
                  ? (dateFrom || dateTo ? `${dateFrom || 'Start'} to ${dateTo || 'End'}` : 'All Time') 
                  : (datePreset ? datePreset.replace(/_/g, ' ') : 'All Time')}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Sector Scope: </span>
              <strong className="text-slate-900 uppercase">
                {blockFilter === 'all' 
                  ? (!mounted || !session ? 'All Blocks' : session.role === 'super_admin' ? 'All Blocks' : session.assignedBlocks?.join(', ') || 'Assigned') 
                  : blockFilter}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Category: </span>
              <strong className="text-slate-900 uppercase">{categoryFilter === 'all' ? 'All Categories' : categoryFilter}</strong>
            </div>
          </div>
        </div>

        {/* Print-Only KPI Executive Summary Box */}
        <div className="hidden print:grid grid-cols-4 gap-3 mb-4 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs">
          <div className="border-r border-slate-200 pr-2">
            <div className="text-[10px] uppercase font-bold text-slate-500">Units Allotted</div>
            <div className="text-base font-bold font-serif text-slate-900 mt-0.5">{printPlotCount} Units</div>
          </div>
          <div className="border-r border-slate-200 pr-2">
            <div className="text-[10px] uppercase font-bold text-indigo-900">Total Volume</div>
            <div className="text-base font-bold font-mono text-indigo-950 mt-0.5">PKR {printTotalSum.toLocaleString()}</div>
          </div>
          <div className="border-r border-slate-200 pr-2">
            <div className="text-[10px] uppercase font-bold text-emerald-800">Sold Today</div>
            <div className="text-base font-bold text-emerald-950 mt-0.5">{kpis.todayPlotsSold} Units</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-800">Top Closer</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">{kpis.topCloser?.name || 'N/A'}</div>
          </div>
        </div>

        {/* Mobile Stacked Cards (< 768px, print:hidden) */}
        <div className="md:hidden print:hidden space-y-3 p-4">
          {loading && items.length === 0 ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No plot bookings found for the selected date range or filter criteria.
            </div>
          ) : (
            pageRows.map((sale, idx) => {
              const globalIdx = (safePage - 1) * PAGE_SIZE + idx + 1;
              const regLabel = sale.registrationStatusLabel || (sale.membershipNo && sale.membershipNo !== '—' ? 'Portal issued' : 'Needs registration');
              const isPortalIssued = regLabel === 'Portal issued';
              return (
                <div key={sale.id} className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
                  {/* 1. Row Index & Date */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-mono text-slate-400 text-xs font-bold">#{globalIdx}</span>
                    <div className="text-right font-mono">
                      <span className="font-bold text-slate-900">{sale.dateStr}</span>
                      <span className="text-[11px] text-slate-400 ml-1.5">{sale.timeStr}</span>
                    </div>
                  </div>

                  {/* 2. Property Allotted */}
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Property Allotted</div>
                    <div className="font-bold text-slate-900 text-sm">
                      Plot {sale.plotNumber}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded-sm bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-[10px]">
                        {sale.blockName}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {sale.size}
                      </span>
                    </div>
                  </div>

                  {/* 3. Customer Member and Action */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Customer Member</div>
                      <div className="font-bold text-slate-900">{sale.customerName}</div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPortalIssued
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {regLabel}
                        </span>
                        {sale.membershipNo && sale.membershipNo !== '—' && (
                          <span className="font-mono text-[11px] text-slate-500 font-medium">
                            {sale.membershipNo}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Link
                        href={`/admin/customers-directory?search=${encodeURIComponent(sale.customerName || sale.membershipNo || '')}`}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-950 border border-cyan-200 text-xs font-semibold transition-colors min-h-[44px]"
                      >
                        <span>Open in Directory</span>
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-700" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Ledger Data Table (Desktop >= 768px, print:block) */}
        <div className="hidden md:block print:block">
          <AdminTableShell page={page} pageSize={PAGE_SIZE} total={totalRecords} onPageChange={handlePageChange} loading={loading}>
            <thead className="sticky top-0 z-10 print:static">
              <tr className="border-b border-slate-200 bg-slate-50 print:bg-slate-100 text-[11px] print:text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center print:border print:border-slate-400 bg-slate-50 print:w-10">#</th>
                <th className="py-3 px-4 print:border print:border-slate-400 bg-slate-50 print:w-40">Booking Date & Time</th>
                <th className="py-3 px-4 print:border print:border-slate-400 bg-slate-50 print:w-48">Property Allotted</th>
                <th className="py-3 px-4 print:border print:border-slate-400 bg-slate-50">Customer Member and Action</th>
              </tr>
            </thead>
            {/* Screen-Only Paginated Table Rows */}
            <tbody className="divide-y divide-slate-100 text-xs print:hidden">
              {loading && items.length === 0 ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-3 text-center"><div className="h-4 w-4 bg-slate-200 rounded mx-auto" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-48 bg-slate-200 rounded" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No plot bookings found for the selected date range or filter criteria.
                  </td>
                </tr>
              ) : (
                pageRows.map((sale, idx) => {
                  const globalIdx = (safePage - 1) * PAGE_SIZE + idx + 1;
                  const regLabel = sale.registrationStatusLabel || (sale.membershipNo && sale.membershipNo !== '—' ? 'Portal issued' : 'Needs registration');
                  const isPortalIssued = regLabel === 'Portal issued';
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. # */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-400">
                        {globalIdx}
                      </td>

                      {/* 2. Booking Date & Time */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-900">{sale.dateStr}</div>
                        <div className="text-[11px] text-slate-400">{sale.timeStr}</div>
                      </td>

                      {/* 3. Property Allotted */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          Plot {sale.plotNumber}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded-sm bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-[10px]">
                            {sale.blockName}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {sale.size}
                          </span>
                        </div>
                      </td>

                      {/* 4. Customer Member and Action */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 text-sm">{sale.customerName}</div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isPortalIssued
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {regLabel}
                              </span>
                              {sale.membershipNo && sale.membershipNo !== '—' && (
                                <span className="font-mono text-[11px] text-slate-500 font-medium">
                                  {sale.membershipNo}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <Link
                              href={`/admin/customers-directory?search=${encodeURIComponent(sale.customerName || sale.membershipNo || '')}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-950 border border-cyan-200 text-xs font-semibold transition-colors shadow-2xs whitespace-nowrap cursor-pointer min-h-[36px]"
                            >
                              <span>Open in Directory</span>
                              <ExternalLink className="w-3.5 h-3.5 text-cyan-700" />
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Print-Only Unpaginated Table Rows */}
            <tbody className="hidden print:table-row-group divide-y divide-slate-300 text-[10px]">
              {rowsToPrint.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 print:border print:border-slate-400">
                    No plot bookings found for the selected date range or filter criteria.
                  </td>
                </tr>
              ) : (
                rowsToPrint.map((sale, idx) => {
                  const regLabel = sale.registrationStatusLabel || (sale.membershipNo && sale.membershipNo !== '—' ? 'Portal issued' : 'Needs registration');
                  return (
                    <tr key={sale.id} className="hover:bg-transparent print:break-inside-avoid">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 print:border print:border-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-mono print:border print:border-slate-400">
                        <div className="font-bold text-slate-900">{sale.dateStr}</div>
                        <div className="print:text-[9px] text-slate-500">{sale.timeStr}</div>
                      </td>
                      <td className="py-2.5 px-4 print:border print:border-slate-400">
                        <div className="font-bold text-slate-900 print:text-xs">
                          Plot {sale.plotNumber}
                        </div>
                        <div className="text-[9px] text-slate-600 mt-0.5">
                          {sale.blockName} • {sale.size}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 print:border print:border-slate-400">
                        <div className="font-bold text-slate-900">{sale.customerName}</div>
                        <div className="font-semibold text-[9px] text-slate-700 mt-0.5">
                          {regLabel}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Single Grand Total */}
            {rowsToPrint.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-900 bg-slate-50 print:bg-slate-100 font-bold text-slate-900 print:border print:border-slate-400 print:break-inside-avoid">
                  <td colSpan={3} className="py-3 px-4 text-left font-sans text-xs print:text-[10px] print:border print:border-slate-400">
                    Grand Total ({printPlotCount} {printPlotCount === 1 ? 'Plot' : 'Plots'})
                  </td>
                  <td className="py-3 px-4 font-mono text-sm print:text-xs text-indigo-950 font-bold print:border print:border-slate-400 text-right">
                    PKR {printTotalSum.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </AdminTableShell>
        </div>

        {/* Print-Only Signatures and Sign-Off Section */}
        <div className="hidden print:block mt-8 pt-6 border-t-2 border-slate-900 print:break-inside-avoid">
          <div className="grid grid-cols-3 gap-8 text-center text-xs">
            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-slate-400 mb-2 h-10 flex items-end justify-center font-script text-slate-700 text-sm">
                {session?.fullName || 'Administrator'}
              </div>
              <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                Prepared By (Closing Officer)
              </div>
              <div className="text-[9px] text-slate-500">Society Sales & Booking Desk</div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-slate-400 mb-2 h-10" />
              <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                Verified By (Finance Department)
              </div>
              <div className="text-[9px] text-slate-500">Audit & Accounts Ledger Division</div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-slate-400 mb-2 h-10 flex items-end justify-center">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">[ Official Seal ]</span>
              </div>
              <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                Approved By (Super Administrator)
              </div>
              <div className="text-[9px] text-slate-500">Prime View Executive Board</div>
            </div>
          </div>

          <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-500">
            Confidential & Official Document • Generated automatically from Prime View Society Live Records. Any manual amendment or erasure renders this report invalid.
          </div>
        </div>
      </div>

      {/* Action Toast Feedback */}
      <AdminActionToast feedback={feedback} onClose={() => setFeedback(null)} />
    </div>
  );
}

export default function SalesHistoryPage() {
  return (
    <Suspense fallback={null}>
      <SalesHistoryContent />
    </Suspense>
  );
}
