'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getAdminMasterPlanBlocks, BlockSummary } from '@/lib/dal/adminPlots';
import { getReservations, ReservationWithConflict } from '@/lib/dal/reservations';
import { AdminSession, AuditEntry } from '@/lib/mock/types';
import { mockStore } from '@/lib/mock/store';

const SECTOR_THEMES: Record<string, { badge: string; border: string; accent: string; btn: string }> = {
  abbott: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    border: 'border-emerald-200 hover:border-emerald-500',
    accent: 'text-emerald-700',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  royal: {
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    border: 'border-amber-200 hover:border-amber-500',
    accent: 'text-amber-700',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  overseas: {
    badge: 'bg-sky-100 text-sky-900 border-sky-300',
    border: 'border-sky-200 hover:border-sky-500',
    accent: 'text-sky-700',
    btn: 'bg-sky-600 hover:bg-sky-700 text-white',
  },
  elite: {
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    border: 'border-purple-200 hover:border-purple-500',
    accent: 'text-purple-700',
    btn: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  chalet: {
    badge: 'bg-rose-100 text-rose-900 border-rose-300',
    border: 'border-rose-200 hover:border-rose-500',
    accent: 'text-rose-700',
    btn: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  commercial: {
    badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    border: 'border-indigo-200 hover:border-indigo-500',
    accent: 'text-indigo-700',
    btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  'npf-phase-1': {
    badge: 'bg-teal-100 text-teal-900 border-teal-300',
    border: 'border-teal-200 hover:border-teal-500',
    accent: 'text-teal-700',
    btn: 'bg-teal-600 hover:bg-teal-700 text-white',
  },
  'npf-phase-2': {
    badge: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    border: 'border-cyan-200 hover:border-cyan-500',
    accent: 'text-cyan-700',
    btn: 'bg-cyan-600 hover:bg-cyan-700 text-white',
  },
};

export default function AdminDashboardPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [blocks, setBlocks] = useState<BlockSummary[]>([]);
  const [reservations, setReservations] = useState<ReservationWithConflict[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async (activeSession: AdminSession) => {
    try {
      mockStore.loadFromStorage();
      const [blockRes, resRes] = await Promise.all([
        getAdminMasterPlanBlocks(activeSession),
        getReservations(activeSession),
      ]);

      if (blockRes.ok) setBlocks(blockRes.blocks);
      if (resRes.ok) setReservations(resRes.reservations);
      setAuditLog(mockStore.auditLog.slice(0, 8));
    } catch (err) {
      console.error('Failed loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const s = getActiveAdminSession();
    if (s) {
      setSession(s);
      loadData(s);
    }
  }, [loadData]);

  // Real-time multi-window sync (Exception 5.5)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSync = () => {
      mockStore.loadFromStorage();
      const s = getActiveAdminSession();
      if (s) {
        loadData(s);
      }
    };

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('prime-view-sync');
        channel.onmessage = handleSync;
      } catch (e) {
        console.warn('BroadcastChannel failed to initialize on dashboard:', e);
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pv_mock_store') {
        handleSync();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadData]);

  if (loading || !session) {
    return (
      <div className="py-12 text-center text-emerald-800 animate-pulse font-medium">
        Loading Administrative Metrics...
      </div>
    );
  }

  // Computed metrics across accessible blocks
  const totalPlots = blocks.reduce((acc, b) => acc + b.totalCount, 0);
  const availablePlots = blocks.reduce((acc, b) => acc + b.availableCount, 0);
  const reservedPlots = blocks.reduce((acc, b) => acc + b.reservedCount, 0);
  const bookedPlots = blocks.reduce((acc, b) => acc + b.bookedCount, 0);
  const conflictsCount = reservations.filter((r) => r.hasDuplicateConflict).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Scope Banner - Modern Executive Light Multi-Color Gradient */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white border-2 border-emerald-200/90 rounded-3xl p-6 sm:p-7 shadow-xs text-slate-900">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-amber-800 font-mono font-bold bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              Logged in as {session.fullName}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-slate-900">
            {session.role === 'super_admin'
              ? 'Executive Society Portfolio'
              : `Assigned Sectors: ${session.assignedBlocks.join(', ').toUpperCase()}`}
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Real-time synchronization active across all administrative terminals via BroadcastChannel.
          </p>
        </div>
      </div>

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

      {/* 4 Distinct Colorful KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Inventory - Blue Theme */}
        <div className="bg-white border-2 border-blue-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all hover:border-blue-400">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Inventory</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif text-blue-950">{totalPlots}</div>
          <div className="text-[11px] text-blue-700/80 mt-1 font-medium">Across {blocks.length} accessible blocks</div>
        </div>

        {/* 2. Available Plots - Emerald Theme */}
        <div className="bg-white border-2 border-emerald-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all hover:border-emerald-400">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Available Plots</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif text-emerald-950">{availablePlots}</div>
          <div className="text-[11px] text-emerald-700/80 mt-1 font-medium">Ready for immediate booking</div>
        </div>

        {/* 3. Active Reservations - Amber Theme */}
        <div className="bg-white border-2 border-amber-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all hover:border-amber-400">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Active Reservations</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif text-amber-950 flex items-center gap-2">
            {reservedPlots}
            {conflictsCount > 0 && (
              <span className="text-[10px] font-sans font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                {conflictsCount} Disputed
              </span>
            )}
          </div>
          <div className="text-[11px] text-amber-800/80 mt-1 font-medium">Token deposits on hold</div>
        </div>

        {/* 4. Booked Plots - Purple Theme */}
        <div className="bg-white border-2 border-purple-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all hover:border-purple-400">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Booked & Confirmed</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif text-purple-950">{bookedPlots}</div>
          <div className="text-[11px] text-purple-700/80 mt-1 font-medium">Verified member allocations</div>
        </div>
      </div>

      {/* Accessible Blocks Overview - Distinct Colored Sectors */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900">
              Accessible Sectors ({blocks.length})
            </h3>
            <p className="text-xs text-slate-500">
              Color-coded sector portfolios within your administrative authority.
            </p>
          </div>
          <Link
            href="/admin/master-plan"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View Interactive Grid</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((block) => {
            const availPct = block.totalCount > 0 ? (block.availableCount / block.totalCount) * 100 : 0;
            const resPct = block.totalCount > 0 ? (block.reservedCount / block.totalCount) * 100 : 0;
            const bookPct = block.totalCount > 0 ? (block.bookedCount / block.totalCount) * 100 : 0;
            const theme = SECTOR_THEMES[block.id] || {
              badge: 'bg-slate-100 text-slate-800 border-slate-300',
              border: 'border-slate-200 hover:border-slate-400',
              accent: 'text-slate-700',
            };

            return (
              <div
                key={block.id}
                className={`bg-slate-50/70 border-2 ${theme.border} rounded-2xl p-5 hover:bg-white transition-all shadow-xs group flex flex-col justify-between`}
              >
                <div>
                  {/* Header: Sector Name & Plot Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`font-serif font-bold text-base tracking-tight ${theme.accent} group-hover:underline`}>
                      {block.name}
                    </span>
                    <span className={`text-[11px] font-mono font-bold border px-2.5 py-1 rounded-lg leading-none inline-flex items-center shadow-2xs ${theme.badge}`}>
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
                  className={`w-full py-2.5 px-4 ${theme.btn} text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 group/btn`}
                >
                  <span>Manage Block Grid</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Recent Reservations & Live Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reservations */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-amber-600" />
              <span>Active Reservations ({reservations.filter((r) => r.status === 'active').length})</span>
            </h3>
            <Link
              href="/admin/reservations"
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Full Ledger →
            </Link>
          </div>

          <div className="space-y-3">
            {reservations
              .filter((r) => r.status === 'active')
              .slice(0, 5)
              .map((r) => {
                const sectorTheme = SECTOR_THEMES[r.blockId] || { badge: 'bg-slate-100 text-slate-800' };
                return (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      r.hasDuplicateConflict
                        ? 'bg-amber-50/90 border-amber-300'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    } flex items-center justify-between gap-3`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs font-mono">{r.plotNumber}</span>
                        <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border ${sectorTheme.badge}`}>
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
              })}
          </div>
        </div>

        {/* Live Society Audit Feed */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Administrative Audit Trail</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>

          <div className="space-y-2.5">
            {auditLog.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">No recent actions logged.</div>
            ) : (
              auditLog.map((log) => {
                let badgeColor = 'bg-slate-100 text-slate-700';
                if (log.action.includes('LOCK')) badgeColor = 'bg-rose-100 text-rose-800';
                else if (log.action.includes('BOOK')) badgeColor = 'bg-purple-100 text-purple-800';
                else if (log.action.includes('RESERV')) badgeColor = 'bg-amber-100 text-amber-800';
                else if (log.action.includes('LOGIN')) badgeColor = 'bg-blue-100 text-blue-800';

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded-md ${badgeColor}`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 mt-1 font-medium">{log.details}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Actor: <strong className="text-slate-800">{log.actorName}</strong> ({log.actorRole})
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
