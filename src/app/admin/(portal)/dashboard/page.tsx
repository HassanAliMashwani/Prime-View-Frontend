'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  BookmarkCheck, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  AlertTriangle,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getAdminMasterPlanBlocks, BlockSummary } from '@/lib/dal/adminPlots';
import { getReservations, ReservationWithConflict } from '@/lib/dal/reservations';
import { AdminSession, AuditEntry } from '@/lib/mock/types';
import { mockStore } from '@/lib/mock/store';

export default function AdminDashboardPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [blocks, setBlocks] = useState<BlockSummary[]>([]);
  const [reservations, setReservations] = useState<ReservationWithConflict[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async (activeSession: AdminSession) => {
    try {
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
      {/* Scope Banner - Deep Luxury Emerald */}
      <div className="bg-gradient-to-r from-[#10251E] to-[#183B2B] border border-[#23503B] rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A3C692]">
              {session.role === 'super_admin' ? 'Society-Wide Scope' : 'Restricted Block Scope'}
            </span>
            <span className="text-emerald-400/60">•</span>
            <span className="text-xs text-[#E3D18B] font-mono">
              Logged in as {session.fullName}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
            {session.role === 'super_admin'
              ? 'Executive Society Portfolio'
              : `Assigned Sectors: ${session.assignedBlocks.join(', ').toUpperCase()}`}
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
            Real-time synchronization active across all administrative terminals via BroadcastChannel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/master-plan"
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E5C14E] text-[#10251E] font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Master Plan Grid</span>
          </Link>
          <Link
            href="/admin/reservations"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all"
          >
            <BookmarkCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Sort Reservations</span>
          </Link>
        </div>
      </div>

      {/* Duplicate Conflict Alert Banner (If Any) */}
      {conflictsCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-sm">
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
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors whitespace-nowrap"
          >
            Resolve Conflicts
          </Link>
        </div>
      )}

      {/* KPI Cards - Crisp White with Sharp Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Inventory</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold font-serif text-slate-900">{totalPlots}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across {blocks.length} accessible blocks</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Available Plots</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold font-serif text-emerald-700">{availablePlots}</div>
          <div className="text-[11px] text-slate-500 mt-1">Ready for reservation / booking</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Reservations</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold font-serif text-amber-700 flex items-center gap-2">
            {reservedPlots}
            {conflictsCount > 0 && (
              <span className="text-[10px] font-sans font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                {conflictsCount} Disputed
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Pending settlement or confirmation</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#10251E] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Booked & Confirmed</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-bold font-serif text-[#10251E]">{bookedPlots}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active customer member files</div>
        </div>
      </div>

      {/* Accessible Blocks Overview */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900">
              Accessible Sectors ({blocks.length})
            </h3>
            <p className="text-xs text-slate-500">
              Overview of plot allocations within your administrative authority.
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

            return (
              <div
                key={block.id}
                className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 hover:border-emerald-500 hover:bg-white transition-all shadow-sm group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors">
                    {block.name}
                  </span>
                  <span className="text-xs font-mono font-bold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                    {block.totalCount} Plots
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 flex overflow-hidden mb-3">
                  <div style={{ width: `${availPct}%` }} className="bg-emerald-600" title={`Available: ${block.availableCount}`} />
                  <div style={{ width: `${resPct}%` }} className="bg-amber-500" title={`Reserved: ${block.reservedCount}`} />
                  <div style={{ width: `${bookPct}%` }} className="bg-slate-400" title={`Booked: ${block.bookedCount}`} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-3">
                  <div className="bg-white border border-slate-200 p-2 rounded-xl">
                    <div className="text-emerald-700 font-bold text-xs">{block.availableCount}</div>
                    <div className="text-slate-500 font-medium">Available</div>
                  </div>
                  <div className="bg-white border border-slate-200 p-2 rounded-xl">
                    <div className="text-amber-700 font-bold text-xs">{block.reservedCount}</div>
                    <div className="text-slate-500 font-medium">Reserved</div>
                  </div>
                  <div className="bg-white border border-slate-200 p-2 rounded-xl">
                    <div className="text-slate-700 font-bold text-xs">{block.bookedCount}</div>
                    <div className="text-slate-500 font-medium">Booked</div>
                  </div>
                </div>

                <Link
                  href={`/admin/master-plan/${block.id}`}
                  className="block w-full text-center py-2 bg-[#10251E] hover:bg-[#18392C] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Manage Block Grid →
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Recent Reservations & Live Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reservations */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-emerald-700" />
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
              .map((r) => (
                <div
                  key={r.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                    r.hasDuplicateConflict
                      ? 'bg-amber-50/80 border-amber-300'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs font-mono">{r.plotNumber}</span>
                      <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">
                        ({r.blockId})
                      </span>
                      {r.hasDuplicateConflict && (
                        <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded font-bold">
                          Conflict Claim
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-800 font-semibold mt-0.5">{r.customerName}</div>
                    <div className="text-[11px] text-slate-500">
                      Token: <strong className="text-slate-800">PKR {r.tokenFee.toLocaleString()}</strong> • By {r.reservedByAdminName}
                    </div>
                  </div>

                  <Link
                    href={`/admin/reservations`}
                    className="px-3 py-1.5 text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl transition-colors shadow-sm"
                  >
                    Details
                  </Link>
                </div>
              ))}
          </div>
        </div>

        {/* Live Society Audit Feed */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>Administrative Audit Trail</span>
            </h3>
            <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>

          <div className="space-y-2.5">
            {auditLog.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">No recent actions logged.</div>
            ) : (
              auditLog.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-[11px]">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{log.details}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Actor: <strong className="text-slate-700">{log.actorName}</strong> ({log.actorRole})
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
