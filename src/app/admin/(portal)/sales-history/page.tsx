'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  CheckCircle2
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { 
  getSalesHistory, 
  SalesHistoryItem, 
  SalesHistoryKpis, 
  SalesHistoryFilters 
} from '@/lib/dal/salesHistory';
import { AdminSalesHistorySkeleton } from '@/components/ui/skeleton';
import { AdminActionToast } from '@/components/admin/AdminActionToast';
import { AdminSession, PlotCategory } from '@/lib/mock/types';

const SOCIETY_BLOCKS = [
  { id: 'abbott', name: 'Abbott Block' },
  { id: 'royal', name: 'Royal Block' },
  { id: 'overseas', name: 'Overseas Block' },
  { id: 'elite', name: 'Elite Block' },
  { id: 'chalet', name: 'Chalet Block' },
  { id: 'commercial', name: 'Commercial Block' },
  { id: 'npf-phase-1', name: 'NPF Phase 1' },
  { id: 'npf-phase-2', name: 'NPF Phase 2' },
];

export default function SalesHistoryPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
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
  const [blockFilter, setBlockFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const loadData = useCallback(async (currentSession: AdminSession) => {
    try {
      const res = await getSalesHistory(currentSession, {
        datePreset,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        blockId: blockFilter !== 'all' ? blockFilter : undefined,
        category: categoryFilter !== 'all' ? (categoryFilter as PlotCategory) : undefined,
        search: search.trim() || undefined,
      });

      if (!res.ok) {
        setFeedback({ type: 'error', message: res.message || res.error || 'Failed to load sales history report.' });
      } else {
        setItems(res.items);
        setKpis(res.kpis);
      }
    } catch (err) {
      console.error('Failed to load sales report:', err);
      setFeedback({ type: 'error', message: 'An error occurred while generating the sales report.' });
    } finally {
      setLoading(false);
    }
  }, [datePreset, dateFrom, dateTo, blockFilter, categoryFilter, search]);

  useEffect(() => {
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);
    loadData(cur);
  }, [router, loadData]);

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
    if (preset !== 'all') {
      setDateFrom('');
      setDateTo('');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setBlockFilter('all');
    setCategoryFilter('all');
    setSearch('');
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

  // Screen Pagination (20 rows)
  const PAGE_SIZE = 20;
  const [page, setPage] = useState<number>(1);
  useEffect(() => {
    setPage(1);
  }, [datePreset, dateFrom, dateTo, blockFilter, categoryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = items.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, items.length);

  if (loading) {
    return <AdminSalesHistorySkeleton />;
  }

  const totalContractSum = items.reduce((acc, curr) => acc + curr.price, 0);

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
                Immutable chronological sales ledger built directly on audit log booking entries with closing officer attribution.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Print Ledger</span>
          </button>

          {session?.role === 'super_admin' ? null : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Scoped: {session?.assignedBlocks?.join(', ').toUpperCase()}</span>
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
          <div className="mt-2 text-2xl font-bold font-serif text-emerald-900">{kpis.todayPlotsSold} Units</div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            PKR {kpis.todayRevenuePkr.toLocaleString()}
          </div>
        </div>

        {/* Filtered Period Units */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Filtered Units Sold
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-slate-900">{kpis.totalPlotsSold} Units</div>
          <div className="mt-1 text-[11px] text-slate-500">Across selected filters</div>
        </div>

        {/* Filtered Period Revenue */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs lg:col-span-2">
          <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider flex items-center justify-between">
            <span>Total Sales Volume</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-indigo-950 font-mono">
            PKR {kpis.totalRevenuePkr.toLocaleString()}
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
            {kpis.topCloser ? kpis.topCloser.name : 'N/A'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            {kpis.topCloser ? `${kpis.topCloser.count} deals • PKR ${kpis.topCloser.revenuePkr.toLocaleString()}` : '0 deals'}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
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
              onChange={(e) => setBlockFilter(e.target.value)}
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
              onChange={(e) => setCategoryFilter(e.target.value)}
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
                  src="/logo-trimmed.png"
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
                Audit Trail Reference: <strong className="font-mono text-slate-800">PV-SL-AUDIT</strong>
              </div>
              <div className="text-[10px] text-slate-500">
                Printed: <strong>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
            </div>
          </div>

          {/* Audit Scope and Filters Bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700">
            <div>
              <span className="text-slate-400 font-medium">Auditor / Operator: </span>
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
                  ? (session?.role === 'super_admin' ? 'All Blocks' : session?.assignedBlocks?.join(', ') || 'Assigned') 
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
            <div className="text-base font-bold font-serif text-slate-900 mt-0.5">{kpis.totalPlotsSold} Units</div>
          </div>
          <div className="border-r border-slate-200 pr-2">
            <div className="text-[10px] uppercase font-bold text-indigo-900">Total Volume</div>
            <div className="text-base font-bold font-mono text-indigo-950 mt-0.5">PKR {kpis.totalRevenuePkr.toLocaleString()}</div>
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

        {/* Ledger Data Table */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse print:text-[10px] print:border print:border-slate-300">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 print:bg-slate-100 text-[11px] print:text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center print:border print:border-slate-300">#</th>
                <th className="py-3 px-4 print:border print:border-slate-300">Booking Date & Time</th>
                <th className="py-3 px-4 print:border print:border-slate-300">Property Allotted</th>
                <th className="py-3 px-4 print:border print:border-slate-300">Customer Member</th>
                <th className="py-3 px-4 print:border print:border-slate-300">Contract Price</th>
                <th className="py-3 px-4 print:border print:border-slate-300">Payment Scheme</th>
                <th className="py-3 px-4 print:border print:border-slate-300">Sold By (Admin)</th>
                <th className="py-3 px-4 text-right print:hidden">Action</th>
              </tr>
            </thead>
            {/* Screen-Only Paginated Table Rows */}
            <tbody className="divide-y divide-slate-100 text-xs print:hidden">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No plot bookings found for the selected date range or filter criteria.
                  </td>
                </tr>
              ) : (
                pageRows.map((sale, idx) => {
                  const globalIdx = (safePage - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Row Index */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {globalIdx}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-slate-900">{sale.dateStr}</div>
                        <div className="text-[11px] text-slate-400">{sale.timeStr}</div>
                      </td>

                      {/* Property Allotted */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          Plot {sale.plotNumber}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded-sm bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-[10px]">
                            {sale.blockName}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {sale.size} • {sale.category.toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Customer Member */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{sale.customerName}</div>
                        <div className="font-mono text-[11px] text-emerald-800 font-semibold">
                          {sale.membershipNo}
                        </div>
                      </td>

                      {/* Contract Price */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          PKR {sale.price.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">Official Society Rate</div>
                      </td>

                      {/* Payment Scheme */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            sale.paymentType === 'one_time'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {sale.paymentType === 'one_time' ? 'Full Payment' : '24-Mo Installments'}
                        </span>
                      </td>

                      {/* Sold By (Admin) */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sale.sellerAdminName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {sale.sellerAdminRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </div>
                      </td>

                      {/* Screen-Only Action */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/master-plan/${sale.blockId}?focusPlot=${sale.plotId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                        >
                          <span>Locate Plot</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Print-Only Unpaginated Table Rows */}
            <tbody className="hidden print:table-row-group divide-y divide-slate-300 text-[10px]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 print:border print:border-slate-300">
                    No plot bookings found for the selected date range or filter criteria.
                  </td>
                </tr>
              ) : (
                items.map((sale, idx) => {
                  return (
                    <tr key={sale.id} className="hover:bg-transparent print:break-inside-avoid">
                      <td className="py-3 px-3 text-center font-mono text-slate-400 print:border print:border-slate-300">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono print:border print:border-slate-300">
                        <div className="font-bold text-slate-900">{sale.dateStr}</div>
                        <div className="print:text-[9px] text-slate-400">{sale.timeStr}</div>
                      </td>
                      <td className="py-3 px-4 print:border print:border-slate-300">
                        <div className="font-bold text-slate-900 print:text-xs">
                          Plot {sale.plotNumber}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded-sm print:bg-slate-100 print:border print:border-slate-300 print:text-slate-800 font-semibold print:text-[9px]">
                            {sale.blockName}
                          </span>
                          <span className="text-slate-500 print:text-[9px]">
                            {sale.size} • {sale.category.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 print:border print:border-slate-300">
                        <div className="font-bold text-slate-900">{sale.customerName}</div>
                        <div className="font-mono print:text-[9px] print:text-slate-700 font-semibold">
                          {sale.membershipNo}
                        </div>
                      </td>
                      <td className="py-3 px-4 print:border print:border-slate-300">
                        <div className="font-mono font-bold text-slate-900 print:text-xs">
                          PKR {sale.price.toLocaleString()}
                        </div>
                        <div className="print:text-[9px] text-slate-400">Official Society Rate</div>
                      </td>
                      <td className="py-3 px-4 print:border print:border-slate-300">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full print:text-[9px] font-bold border print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                          {sale.paymentType === 'one_time' ? 'Full Payment' : '24-Mo Installments'}
                        </span>
                      </td>
                      <td className="py-3 px-4 print:border print:border-slate-300">
                        <div className="font-bold text-slate-900">
                          {sale.sellerAdminName}
                        </div>
                        <div className="print:text-[9px] text-slate-400 font-mono">
                          {sale.sellerAdminRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right print:hidden">
                        —
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Aggregate Totals */}
            {items.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 print:bg-slate-100 font-bold text-slate-900 print:border print:border-slate-300">
                  <td colSpan={3} className="py-3 px-4 text-left font-sans text-xs print:text-[10px] print:border print:border-slate-300">
                    Grand Total ({items.length} Plots Allotted)
                  </td>
                  <td className="py-3 px-4 text-left font-sans text-xs print:text-[10px] print:border print:border-slate-300 text-slate-500">
                    —
                  </td>
                  <td className="py-3 px-4 font-mono text-sm print:text-xs text-indigo-950 font-bold print:border print:border-slate-300">
                    PKR {totalContractSum.toLocaleString()}
                  </td>
                  <td colSpan={3} className="py-3 px-4 text-slate-500 text-right print:text-left text-[11px] print:text-[9px] print:border print:border-slate-300">
                    Certified Extraction from Audit Trail
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Screen-Only Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 print:hidden">
          <div>
            Showing <span className="font-semibold text-slate-900">{from}–{to}</span> of <span className="font-semibold text-slate-900">{items.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Prev
            </button>
            <span className="text-xs font-medium text-slate-500">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

        {/* Print-Only Signatures and Audit Sign-Off Section */}
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
            Confidential & Official Document • Generated automatically from the Prime View Society Realtime Audit Trail. Any manual amendment or erasure renders this report invalid.
          </div>
        </div>
      </div>

      {/* Action Toast Feedback */}
      <AdminActionToast feedback={feedback} onClose={() => setFeedback(null)} />
    </div>
  );
}
