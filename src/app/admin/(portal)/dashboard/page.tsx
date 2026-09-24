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
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getAdminMasterPlanBlocks, BlockSummary } from '@/lib/dal/adminPlots';
import { getReservations, ReservationWithConflict } from '@/lib/dal/reservations';
import { AdminSession, AuditEntry } from '@/lib/mock/types';
import { getAuditLogs } from '@/lib/dal/audit';
import InventoryOverviewChart from '@/components/admin/dashboard/InventoryOverviewChart';
import { getBlockTheme } from '@/lib/map/regionData';

export default function AdminDashboardPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [blocks, setBlocks] = useState<BlockSummary[]>([]);
  const [reservations, setReservations] = useState<ReservationWithConflict[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async (activeSession: AdminSession) => {
    try {
      const [blockRes, resRes, auditRes] = await Promise.all([
        getAdminMasterPlanBlocks(activeSession),
        getReservations(activeSession),
        getAuditLogs(activeSession)
      ]);

      if (blockRes.ok) setBlocks(blockRes.blocks);
      if (resRes.ok) setReservations(resRes.reservations);
      if (auditRes.ok && auditRes.logs) setAuditLog(auditRes.logs.slice(0, 8));
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

  // Real-time sync via interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      const s = getActiveAdminSession();
      if (s) {
        loadData(s);
      }
    }, 30000);

    return () => clearInterval(intervalId);
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

      {/* Aggregate Overview Cards (Purple, Mint, Amber, Blue) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Inventory - Purple */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/10 border border-purple-500/20 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-700" />
            </div>
            <h3 className="text-purple-800 font-bold text-sm">Total Inventory</h3>
          </div>
          <div className="text-3xl font-bold text-purple-700">{totalPlots}</div>
          <p className="text-xs text-purple-700/80 mt-2 font-medium">Across {blocks.length} accessible blocks</p>
        </div>

        {/* 2. Available Plots - Mint */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-900/10 border border-green-500/20 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-700" />
            </div>
            <h3 className="text-green-800 font-bold text-sm">Available Plots</h3>
          </div>
          <div className="text-3xl font-bold text-green-700">{availablePlots}</div>
          <p className="text-xs text-green-700/80 mt-2 font-medium">Ready for immediate booking</p>
        </div>

        {/* 3. Active Reservations - Amber */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="text-amber-800 font-bold text-sm">Active Reservations</h3>
          </div>
          <div className="text-3xl font-bold text-amber-700 flex items-center gap-2">
            {reservedPlots}
            {conflictsCount > 0 && (
              <span className="text-[10px] font-sans font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                {conflictsCount} Disputed
              </span>
            )}
          </div>
          <p className="text-xs text-amber-700/80 mt-2 font-medium">Token deposits on hold</p>
        </div>

        {/* 4. Booked & Confirmed - Blue */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-900/10 border border-blue-500/20 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
            </div>
            <h3 className="text-blue-800 font-bold text-sm">Booked & Confirmed</h3>
          </div>
          <div className="text-3xl font-bold text-blue-700">{bookedPlots}</div>
          <p className="text-xs text-blue-700/80 mt-2 font-medium">Verified member allocations</p>
        </div>
      </div>

      {/* Inventory Overview Trend Chart */}
      <InventoryOverviewChart
        currentAvailable={availablePlots}
        currentReserved={reservedPlots}
        currentBooked={bookedPlots}
      />

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
                          {String(log.action).replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 mt-1 font-medium">{log.details}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Actor: <strong className="text-slate-800">{log.actorName}</strong> ({String(log.actorRole).replace(/_/g, ' ')})
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
