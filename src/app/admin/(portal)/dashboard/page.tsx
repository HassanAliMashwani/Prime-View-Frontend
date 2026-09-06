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
      <div className="py-12 text-center text-[#8FAF7E] animate-pulse">
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
    <div className="space-y-8">
      {/* Scope Banner */}
      <div className="bg-gradient-to-r from-[#122A20] to-[#18352A] border border-[#26533F] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A3C692]">
              {session.role === 'super_admin' ? 'Society-Wide Scope' : 'Restricted Block Scope'}
            </span>
            <span className="text-xs text-[#5C7E6F]">•</span>
            <span className="text-xs text-[#D4AF37] font-mono">
              Logged in as {session.fullName}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-white">
            {session.role === 'super_admin'
              ? 'Executive Society Portfolio'
              : `Assigned Sectors: ${session.assignedBlocks.join(', ').toUpperCase()}`}
          </h2>
          <p className="text-xs text-[#A0B8AD] mt-1">
            Real-time synchronization active across all administrative terminals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/master-plan"
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E5C14E] text-[#0A1510] font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Master Plan Grid</span>
          </Link>
          <Link
            href="/admin/reservations"
            className="flex items-center gap-2 bg-[#1C3D2E] hover:bg-[#254F3B] border border-[#376B53] text-[#FAF9F7] font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md transition-all"
          >
            <BookmarkCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Sort Reservations</span>
          </Link>
        </div>
      </div>

      {/* Duplicate Conflict Alert Banner (If Any) */}
      {conflictsCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/70 text-amber-200 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-sm text-amber-300">
              Duplicate Reservation Race Detected ({conflictsCount} conflicting claims)
            </div>
            <p className="text-xs text-amber-200/90 mt-0.5">
              Multiple active token deposits have been filed on identical plot(s) (e.g. Plot R-08 in Royal Block). Review the Sort Reservations ledger immediately to confirm priority or resolve disputes.
            </p>
          </div>
          <Link
            href="/admin/reservations"
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
          >
            Resolve Conflicts
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#10241C] border border-[#1E3E2F] rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between text-[#8FAF7E] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Inventory</span>
            <Building2 className="w-4 h-4 text-[#A3C692]" />
          </div>
          <div className="text-3xl font-bold font-serif text-white">{totalPlots}</div>
          <div className="text-[11px] text-[#7A9C8B] mt-1">Across {blocks.length} accessible blocks</div>
        </div>

        <div className="bg-[#10241C] border border-[#1E3E2F] rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between text-[#8FAF7E] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Plots</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-serif text-emerald-300">{availablePlots}</div>
          <div className="text-[11px] text-[#7A9C8B] mt-1">Ready for reservation / booking</div>
        </div>

        <div className="bg-[#10241C] border border-[#1E3E2F] rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between text-[#8FAF7E] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Reservations</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-serif text-amber-300 flex items-center gap-2">
            {reservedPlots}
            {conflictsCount > 0 && (
              <span className="text-[10px] font-sans font-bold bg-red-900/60 text-red-200 border border-red-700 px-2 py-0.5 rounded-full">
                {conflictsCount} Disputed
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#7A9C8B] mt-1">Pending settlement or confirmation</div>
        </div>

        <div className="bg-[#10241C] border border-[#1E3E2F] rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between text-[#8FAF7E] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Booked & Confirmed</span>
            <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-3xl font-bold font-serif text-[#D4AF37]">{bookedPlots}</div>
          <div className="text-[11px] text-[#7A9C8B] mt-1">Active customer member files</div>
        </div>
      </div>

      {/* Accessible Blocks Overview */}
      <div className="bg-[#0F221A] border border-[#1F4132] rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-white">
              Accessible Sectors ({blocks.length})
            </h3>
            <p className="text-xs text-[#8FAF7E]">
              Overview of plot allocations within your administrative authority.
            </p>
          </div>
          <Link
            href="/admin/master-plan"
            className="text-xs font-semibold text-[#D4AF37] hover:text-[#E5C14E] flex items-center gap-1"
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
                className="bg-[#132A20] border border-[#26533F] rounded-xl p-4 hover:border-[#387559] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm">{block.name}</span>
                  <span className="text-xs font-mono text-[#D4AF37]">{block.totalCount} Plots</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[#0B1A14] flex overflow-hidden mb-3">
                  <div style={{ width: `${availPct}%` }} className="bg-emerald-500" title={`Available: ${block.availableCount}`} />
                  <div style={{ width: `${resPct}%` }} className="bg-amber-400" title={`Reserved: ${block.reservedCount}`} />
                  <div style={{ width: `${bookPct}%` }} className="bg-slate-500" title={`Booked: ${block.bookedCount}`} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-3">
                  <div className="bg-[#0B1A14] p-1.5 rounded">
                    <div className="text-emerald-400 font-bold">{block.availableCount}</div>
                    <div className="text-[#6D917F]">Available</div>
                  </div>
                  <div className="bg-[#0B1A14] p-1.5 rounded">
                    <div className="text-amber-300 font-bold">{block.reservedCount}</div>
                    <div className="text-[#6D917F]">Reserved</div>
                  </div>
                  <div className="bg-[#0B1A14] p-1.5 rounded">
                    <div className="text-slate-300 font-bold">{block.bookedCount}</div>
                    <div className="text-[#6D917F]">Booked</div>
                  </div>
                </div>

                <Link
                  href={`/admin/master-plan/${block.id}`}
                  className="block w-full text-center py-2 bg-[#1C3D2E] hover:bg-[#254F3B] text-white text-xs font-semibold rounded-lg transition-colors"
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
        <div className="bg-[#0F221A] border border-[#1F4132] rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Active Reservations ({reservations.filter((r) => r.status === 'active').length})</span>
            </h3>
            <Link
              href="/admin/reservations"
              className="text-xs font-semibold text-[#D4AF37] hover:underline"
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
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    r.hasDuplicateConflict
                      ? 'bg-amber-950/30 border-amber-600/60'
                      : 'bg-[#132A20] border-[#224A37]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs font-mono">{r.plotNumber}</span>
                      <span className="text-[10px] uppercase font-mono text-[#8FAF7E]">
                        ({r.blockId})
                      </span>
                      {r.hasDuplicateConflict && (
                        <span className="text-[9px] bg-red-900 text-red-200 px-1.5 py-0.2 rounded font-bold">
                          Conflict Claim
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#CBE2BA] mt-0.5">{r.customerName}</div>
                    <div className="text-[10px] text-[#6D917F]">
                      Token: PKR {r.tokenFee.toLocaleString()} • By {r.reservedByAdminName}
                    </div>
                  </div>

                  <Link
                    href={`/admin/reservations`}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-[#1C3D2E] hover:bg-[#254F3B] text-white rounded-lg transition-colors"
                  >
                    Details
                  </Link>
                </div>
              ))}
          </div>
        </div>

        {/* Live Society Audit Feed */}
        <div className="bg-[#0F221A] border border-[#1F4132] rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Administrative Audit Trail</span>
            </h3>
            <span className="text-[11px] font-mono text-[#6D917F]">Live Log</span>
          </div>

          <div className="space-y-2.5">
            {auditLog.length === 0 ? (
              <div className="text-xs text-[#6D917F] py-4 text-center">No recent actions logged.</div>
            ) : (
              auditLog.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-[#132A20] border border-[#224A37] text-xs flex items-start gap-2.5"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px]">{log.action}</span>
                      <span className="text-[9px] text-[#6D917F] font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A0B8AD] mt-0.5">{log.details}</div>
                    <div className="text-[9px] text-[#5C7E6F] mt-0.5">
                      Actor: {log.actorName} ({log.actorRole})
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
