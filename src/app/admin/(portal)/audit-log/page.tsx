'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ScrollText,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Eye,
  X,
  FileCode,
  RotateCcw,
  Layers,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { AdminSession, AuditEntry } from '@/lib/mock/types';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getAuditLogs, getAuditLogDiff, AuditFilterOptions } from '@/lib/dal/audit';
import { AdminAuditLogSkeleton } from '@/components/ui/skeleton';
import { getCache, setCache, reconcileItems } from '@/lib/dal/apiCache';
import { AdminTableShell } from '@/components/admin/table/AdminTableShell';
import { runLane1, runLane2, enqueueLane2 } from '@/lib/requestLanes';

const PAGE_SIZE = 10;

const ACTION_COLORS: Record<string, string> = {
  PLOT_BOOKED: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  PLOT_RESERVED: 'bg-amber-100 text-amber-900 border-amber-300',
  RESERVATION_CONFIRMED: 'bg-blue-100 text-blue-900 border-blue-300',
  CONTENT_UPDATED: 'bg-violet-100 text-violet-900 border-violet-300',
  CONTENT_LOCK_ACQUIRED: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  SUB_ADMIN_CREATED: 'bg-rose-100 text-rose-900 border-rose-300',
  SUB_ADMIN_UPDATED: 'bg-rose-50 text-rose-800 border-rose-200',
  CUSTOMER_REGISTERED: 'bg-teal-100 text-teal-900 border-teal-300',
  LOCK_ACQUIRED: 'bg-slate-100 text-slate-800 border-slate-300',
  LOCK_RELEASED: 'bg-slate-50 text-slate-700 border-slate-200',
};

export default function AuditLogPage() {
  const router = useRouter();
  const getInit = () => {
    if (typeof window === 'undefined') return null;
    const s = getActiveAdminSession();
    if (!s) return null;
    const adminId = s.adminId || 'admin';
    return getCache<{logs: AuditEntry[], total: number}>(`/audit-logs:${adminId}:page=1:size=${PAGE_SIZE}:search=:actor=all:entity=all:start=:end=`, true);
  };
  const init = getInit();

  const [session, setSession] = useState<AdminSession | null>(() => (typeof window === 'undefined' ? null : getActiveAdminSession()));
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(Boolean(init));
  const [logs, setLogs] = useState<AuditEntry[]>(init?.logs || []);
  const [totalCount, setTotalCount] = useState(init?.total || 0);
  const [loading, setLoading] = useState(!init);
  const [page, setPage] = useState(1);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actorFilter, setActorFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Diff Modal & loading state
  const [diffEntry, setDiffEntry] = useState<AuditEntry | null>(null);
  const [loadingDiffId, setLoadingDiffId] = useState<string | null>(null);

  const reqIdRef = React.useRef(0);
  const pageRef = React.useRef(page);
  const searchRef = React.useRef(searchQuery);
  const actorRef = React.useRef(actorFilter);
  const entityRef = React.useRef(entityFilter);
  const startRef = React.useRef(startDate);
  const endRef = React.useRef(endDate);

  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { searchRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { actorRef.current = actorFilter; }, [actorFilter]);
  useEffect(() => { entityRef.current = entityFilter; }, [entityFilter]);
  useEffect(() => { startRef.current = startDate; }, [startDate]);
  useEffect(() => { endRef.current = endDate; }, [endDate]);

  // Load audit logs
  const loadData = useCallback(async (
    currentSession: AdminSession, 
    p = page, 
    search = searchQuery,
    actor = actorFilter,
    entity = entityFilter,
    start = startDate,
    end = endDate,
    isBackground = false
  ) => {
    if (currentSession.role !== 'super_admin') {
      setLoading(false);
      return;
    }

    const adminId = currentSession.adminId || 'admin';
    const cacheKey = `/audit-logs:${adminId}:page=${p}:size=${PAGE_SIZE}:search=${search || ''}:actor=${actor}:entity=${entity}:start=${start || ''}:end=${end || ''}`;

    const filters: AuditFilterOptions = {
      search: search || undefined,
      entityType: entity !== 'all' ? entity : undefined,
      startDate: start || undefined,
      endDate: end || undefined,
      page: p,
      pageSize: PAGE_SIZE,
    };

    if (actor !== 'all') {
      filters.actorId = actor;
    }

    // Queue only the following page on Lane 2 so Lane 1 remains idle
    const queueNextPage = (totalRecords: number) => {
      const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
      if (p < totalPages && currentSession.role === 'super_admin') {
        const nextP = p + 1;
        const nextKey = `/audit-logs:${adminId}:page=${nextP}:size=${PAGE_SIZE}:search=${search || ''}:actor=${actor}:entity=${entity}:start=${start || ''}:end=${end || ''}`;
        if (!getCache(nextKey, false)) {
          const nextFilters: AuditFilterOptions = {
            ...filters,
            page: nextP,
          };
          enqueueLane2(
            async (signal) => {
              const nextRes = await getAuditLogs(currentSession, nextFilters, signal);
              if (nextRes.ok) {
                setCache(nextKey, { logs: nextRes.logs || [], total: nextRes.totalCount || 0 });
              }
              return nextRes;
            },
            nextKey,
            'audit-log'
          );
        }
      }
    };

    if (!isBackground) {
      const cached = getCache<{ logs: AuditEntry[], total: number }>(cacheKey, true);
      if (cached) {
        // Show cached 10 rows immediately and do not start Lane 1 download of that same page
        setLogs(cached.logs);
        setTotalCount(cached.total);
        setLoading(false);
        setHasLoadedOnce(true);
        // Queue only following page on Lane 2; Lane 1 is idle so download starts at once
        queueNextPage(cached.total);
        return;
      }

      // Not cached: pulse the 10 table rows until page arrives; do not leave previous page's rows on screen
      setLogs([]);
      setLoading(true);
    }

    const currentReq = ++reqIdRef.current;

    const fetcher = async (signal?: AbortSignal) => {
      return await getAuditLogs(currentSession, filters, signal);
    };

    try {
      let res: any;
      if (isBackground) {
        res = await runLane2({
          screen: 'audit-log',
          key: cacheKey,
          isRefresh: true,
          fn: fetcher,
        });
      } else {
        res = await runLane1({
          screen: 'audit-log',
          key: cacheKey,
          fn: fetcher,
        });
      }

      if (!res || currentReq !== reqIdRef.current) return;

      if (res.ok) {
        // Put that page's rows in the table directly
        setLogs(res.logs || []);
        setTotalCount(res.totalCount);
        setCache(cacheKey, { logs: res.logs || [], total: res.totalCount || 0 });

        // Queue only the following page on Lane 2; Lane 1 is now idle
        queueNextPage(res.totalCount);
      }
    } catch (err: any) {
      if (err?.message === 'REQUEST_SUPERSEDED') return;
      if (currentReq !== reqIdRef.current) return;
    } finally {
      if (currentReq === reqIdRef.current && !isBackground) {
        setHasLoadedOnce(true);
        setLoading(false);
      }
    }
  }, [searchQuery, actorFilter, entityFilter, startDate, endDate, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
      if (session) loadData(session, 1, searchInput, actorFilter, entityFilter, startDate, endDate, false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    if (session) loadData(session, 1, searchQuery, actorFilter, entityFilter, startDate, endDate, false);
  }, [actorFilter, entityFilter, startDate, endDate]);

  useEffect(() => {
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);
    loadData(cur, 1, '', 'all', 'all', '', '', false);

    // Cross-tab broadcast listener to automatically refresh audit log on actions
    const handleSync = () => {
      const latest = getActiveAdminSession();
      if (latest && latest.role === 'super_admin' && !searchRef.current && actorRef.current === 'all' && entityRef.current === 'all' && !startRef.current && !endRef.current) {
        loadData(latest, pageRef.current, searchRef.current, actorRef.current, entityRef.current, startRef.current, endRef.current, true);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pv_auth_session') {
        handleSync();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Auto refresh every 30 seconds using Lane 2
    const intervalId = setInterval(handleSync, 30000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(intervalId);
    };
  }, [router, loadData]);

  // Handle filter reset
  const handleResetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setActorFilter('all');
    setEntityFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (session) {
      loadData(session, newPage);
    }
  };

  const handleViewDiff = async (entry: AuditEntry) => {
    if (!session) return;
    if (entry.oldValue !== undefined || entry.newValue !== undefined) {
      setDiffEntry(entry);
      return;
    }
    setLoadingDiffId(entry.id);
    try {
      const res = await getAuditLogDiff(session, entry.id);
      if (res.ok) {
        setDiffEntry({
          ...entry,
          oldValue: res.oldValue,
          newValue: res.newValue,
        });
      }
    } catch {
      // non-blocking
    } finally {
      setLoadingDiffId(null);
    }
  };

  // Pretty JSON formatter helper
  const renderPrettyValue = (val?: string | object | null) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-slate-400 italic">None</span>;
    }

    let displayString = '';
    if (typeof val === 'object') {
      displayString = JSON.stringify(val, null, 2);
    } else if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (typeof parsed === 'object' && parsed !== null) {
          displayString = JSON.stringify(parsed, null, 2);
        } else {
          displayString = String(parsed);
        }
      } catch {
        displayString = val;
      }
    } else {
      displayString = String(val);
    }

    return (
      <pre className="font-mono text-[11px] text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-x-auto whitespace-pre-wrap">
        {displayString}
      </pre>
    );
  };

  if (!session) {
    return null;
  }

  // Super Admin Exclusive Access Check
  if (session.role !== 'super_admin') {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Super Admin Only</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          The system audit trail contains confidential transaction traces and administrative modification diffs. It is strictly reserved for Super Administrators.
        </p>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-serif tracking-tight">
              System Activity & Modification Trail
            </h1>
            <p className="text-xs text-slate-500">
              Immutable historical activity record with actor attribution, timestamps, and modification diffs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
            {loading && !hasLoadedOnce ? (
              <span className="inline-block w-8 h-4 bg-slate-200 animate-pulse rounded align-middle" />
            ) : (
              totalCount
            )}{' '}
            Total Events
          </span>
          {session && (
            <button
              onClick={() => loadData(session)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer"
              title="Refresh Log"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search action, details, actor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
            />
          </div>

          {/* Entity Type Filter */}
          <div>
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 text-slate-700"
            >
              <option value="all">All Entity Types</option>
              <option value="customer">Customer Records</option>
              <option value="plot">Plots</option>
              <option value="booking">Bookings</option>
              <option value="reservation">Reservations</option>
              <option value="content">Content CMS</option>
              <option value="sub_admin">Administrators</option>
              <option value="lock">Concurrency Locks</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 text-slate-700"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 text-slate-700"
            />
          </div>
        </div>

        {(searchQuery || entityFilter !== 'all' || startDate || endDate) && (
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Filtered results active</span>
            <button
              onClick={handleResetFilters}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <AdminTableShell page={page} pageSize={PAGE_SIZE} total={totalCount} onPageChange={handlePageChange} isTable={false} loading={loading}>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Description / Details</th>
                <th className="py-3 px-4 text-right">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-48 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 w-12 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => {
                  const hasDiff = Boolean(entry.hasDiff ?? (entry.oldValue || entry.newValue));
                  const isBusy = loadingDiffId === entry.id;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(entry.timestamp).toLocaleString('en-GB')}</span>
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{entry.actorName}</div>
                        <span
                          className={`inline-block text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded border ${
                            entry.actorRole === 'super_admin'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-blue-100 text-blue-900 border-blue-300'
                          }`}
                        >
                          {String(entry.actorRole).replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase ${
                            ACTION_COLORS[entry.action] || 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {String(entry.action).replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3.5 px-4">
                        <div className="text-[10px] uppercase font-bold text-slate-400">{entry.entityType}</div>
                        <div className="font-mono text-[11px] font-semibold text-slate-700">{entry.entityId}</div>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="text-slate-800 leading-relaxed break-words">{entry.details}</div>
                      </td>

                      {/* Diff Viewer Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {hasDiff ? (
                          <button
                            onClick={() => handleViewDiff(entry)}
                            disabled={isBusy}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3 h-3 text-slate-600 animate-spin" />
                            ) : (
                              <Eye className="w-3 h-3 text-slate-600" />
                            )}
                            <span>{isBusy ? 'Loading...' : 'View Diff'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">No Diff</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </AdminTableShell>

      {/* ==================================================== */}
      {/* DIFF VIEWER MODAL                                    */}
      {/* ==================================================== */}
      {diffEntry && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-3xl shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[#D4AF37]">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base">
                    Audit Diff: {diffEntry.action}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Entity: {diffEntry.entityType} ({diffEntry.entityId}) • Modified by {diffEntry.actorName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDiffEntry(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diff Content */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <strong>Event Summary:</strong> {diffEntry.details}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old Value */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1.5 flex items-center gap-1">
                    <span>Previous State (Before)</span>
                  </div>
                  {renderPrettyValue(diffEntry.oldValue)}
                </div>

                {/* New Value */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5 flex items-center gap-1">
                    <span>Updated State (After)</span>
                  </div>
                  {renderPrettyValue(diffEntry.newValue)}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setDiffEntry(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Close Diff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
