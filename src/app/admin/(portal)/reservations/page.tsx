'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  BookmarkCheck, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  History, 
  Edit3, 
  ArrowRight, 
  X,
  Building2,
  RotateCcw,
  MapPin,
  Lock
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getReservations, updateReservationNote, confirmReservation, releaseReservation, ReservationWithConflict } from '@/lib/dal/reservations';
import { bookPlot } from '@/lib/dal/adminPlots';
import { AdminSession, Reservation } from '@/lib/mock/types';
import { mockStore } from '@/lib/mock/store';
import { getBlockDisplayName } from '@/lib/map/regionData';

const SECTOR_THEMES: Record<string, { badge: string; border: string; accent: string }> = {
  abbott: { badge: 'bg-emerald-100 text-emerald-900 border-emerald-300', border: 'border-emerald-200', accent: 'text-emerald-800' },
  royal: { badge: 'bg-amber-100 text-amber-900 border-amber-300', border: 'border-amber-200', accent: 'text-amber-800' },
  overseas: { badge: 'bg-sky-100 text-sky-900 border-sky-300', border: 'border-sky-200', accent: 'text-sky-800' },
  elite: { badge: 'bg-purple-100 text-purple-900 border-purple-300', border: 'border-purple-200', accent: 'text-purple-800' },
  chalet: { badge: 'bg-rose-100 text-rose-900 border-rose-300', border: 'border-rose-200', accent: 'text-rose-800' },
  commercial: { badge: 'bg-indigo-100 text-indigo-900 border-indigo-300', border: 'border-indigo-200', accent: 'text-indigo-800' },
  'npf-phase-1': { badge: 'bg-teal-100 text-teal-900 border-teal-300', border: 'border-teal-200', accent: 'text-teal-800' },
  'npf-phase-2': { badge: 'bg-cyan-100 text-cyan-900 border-cyan-300', border: 'border-cyan-200', accent: 'text-cyan-800' },
};

export default function ReservationsPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [reservations, setReservations] = useState<ReservationWithConflict[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [search, setSearch] = useState<string>('');
  const [blockFilter, setBlockFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // Edit Note Modal State
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [savingNote, setSavingNote] = useState<boolean>(false);

  const loadData = useCallback(async (s: AdminSession) => {
    try {
      mockStore.loadFromStorage();
      const res = await getReservations(s, {
        search,
        blockId: blockFilter,
        status: activeTab === 'active' ? 'active' : undefined,
      });

      if (res.ok) {
        console.log('RESERVATIONS LOADED:', res.reservations.length, res.reservations);
        setReservations(res.reservations);
      }
    } catch (err) {
      console.error('Failed loading reservations:', err);
    } finally {
      setLoading(false);
    }
  }, [search, blockFilter, activeTab]);

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
      channel = new BroadcastChannel('prime-view-sync');
      channel.onmessage = handleSync;
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

  const handleConfirmBooking = async (r: Reservation) => {
    if (!session) return;
    if (!confirm(`Confirm to move ${r.customerName}'s reservation on Plot ${r.plotNumber} to official Booked status? Doing so will supersede any conflicting reservations on this plot.`)) {
      return;
    }
    const res = await confirmReservation(session, r.id, 'one_time');
    if (res.ok) {
      await loadData(session);
    } else {
      alert(`Failed to confirm booking: ${res.error}`);
    }
  };

  const handleReleaseReservation = async (r: Reservation) => {
    if (!session) return;
    const isOwner = r.reservedByAdminId === session.adminId;
    const isSuperAdmin = session.role === 'super_admin';

    const confirmMsg = !isOwner && isSuperAdmin
      ? `SUPER ADMIN OVERRIDE:\n\nAre you sure you want to release the reservation for ${r.customerName} on Plot ${r.plotNumber}?\n\nThis reservation was created by ${r.reservedByAdminName}. Your override will be recorded in the official audit ledger.`
      : `Are you sure you want to release the reservation for ${r.customerName} on Plot ${r.plotNumber}?\n\nThis will revoke the active token reservation and return the plot to Available inventory.`;

    if (!confirm(confirmMsg)) {
      return;
    }

    const res = await releaseReservation(session, r.id, isOwner ? 'Released by reserving admin' : 'Released by Super Admin override');
    if (res.ok) {
      await loadData(session);
    } else {
      if (res.error === 'NOT_RESERVATION_OWNER') {
        alert(`Access Denied: Only the original reserving admin (${r.reservedByAdminName}) or a Super Admin can release this reservation.`);
      } else {
        alert(`Failed to release reservation: ${res.error}`);
      }
    }
  };

  const handleOpenEditNote = (res: Reservation) => {
    setEditingRes(res);
    setNoteText(res.resolutionNote || '');
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !editingRes) return;
    setSavingNote(true);
    try {
      const res = await updateReservationNote(session, editingRes.id, noteText);
      if (res.ok) {
        setEditingRes(null);
        await loadData(session);
      }
    } catch (err) {
      console.error('Failed updating note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="py-12 text-center text-emerald-800 animate-pulse font-medium">
        Loading Reservations Ledger...
      </div>
    );
  }

  const activeReservations = reservations.filter((r) => r.status === 'active');
  const historyReservations = reservations.filter((r) => r.status !== 'active');
  const displayedReservations = activeTab === 'active' ? activeReservations : historyReservations;

  const duplicateConflicts = activeReservations.filter((r) => r.hasDuplicateConflict);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner - Light Warm Amber-Gold Theme */}
      <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white border-2 border-amber-200/90 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-slate-900">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
              Sort Reservation Ledger
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-slate-900">
            Token Allocations & Dispute Management
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Track token deposits, resolve duplicate counter claims, and commit verified reservations into official bookings.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-amber-500 text-amber-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Active Reservations</span>
            <span className="bg-amber-900 text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
              {activeReservations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Resolved History</span>
            <span className="bg-indigo-950 text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
              {historyReservations.length}
            </span>
          </button>
        </div>
      </div>

      {/* Duplicate Race Condition Warning Banner */}
      {duplicateConflicts.length > 0 && activeTab === 'active' && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 shadow-sm flex items-start gap-4 animate-in fade-in">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-amber-950">
              Active Duplicate Reservation Race Condition ({duplicateConflicts.length} Conflicting Claims)
            </h4>
            <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
              Multiple administrators have submitted token deposits on the same plot (e.g. <strong className="text-amber-950 font-bold">Plot R-08</strong> in Royal Block has 2 active claims: Hamid Raza and Zubair Qureshi).
              Select a preferred reservation to commit the official booking; doing so will automatically supersede conflicting deposits into the resolved history ledger.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, plot number, or admin..."
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600"
          />
        </div>

        {/* Block Scope Filter */}
        <select
          value={blockFilter}
          onChange={(e) => setBlockFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white"
        >
          <option value="all">All Accessible Blocks</option>
          {session.role === 'super_admin' ? (
            <>
              <option value="abbott">Abbott Block</option>
              <option value="royal">Royal Block</option>
              <option value="overseas">Overseas Block</option>
              <option value="elite">Elite Block</option>
              <option value="chalet">Chalet Block</option>
              <option value="commercial">Commercial Block</option>
              <option value="npf-phase-1">NPF Phase 1</option>
              <option value="npf-phase-2">NPF Phase 2</option>
            </>
          ) : (
            session.assignedBlocks.map((b) => (
              <option key={b} value={b}>
                {getBlockDisplayName(b)}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Reservations Table / Cards - Crisp White List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        {displayedReservations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <div className="font-serif text-base text-slate-800 font-bold">No Reservations Found</div>
            <p className="text-xs text-slate-500 mt-1">
              No reservation records match the current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedReservations.map((r) => {
              const isConflict = r.hasDuplicateConflict;
              const sectorTheme = SECTOR_THEMES[r.blockId] || { badge: 'bg-slate-100 text-slate-800 border-slate-300', accent: 'text-slate-800' };

              return (
                <div
                  key={r.id}
                  className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isConflict
                      ? 'bg-amber-50/50 hover:bg-amber-50/80 border-l-4 border-l-amber-500'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Left Specs */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/master-plan/${r.blockId}?focusPlot=${r.plotId}`}
                        className="font-bold text-sm text-slate-900 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 group shadow-2xs"
                        title="View and focus plot on Master Plan map"
                      >
                        <span className="font-mono">{r.plotNumber}</span>
                        {r.plot ? (
                          <span className="text-xs text-slate-600 font-medium group-hover:text-emerald-700">
                            {' — '}{r.plot.size}, {r.plot.category.charAt(0).toUpperCase() + r.plot.category.slice(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-normal">
                            {' — '}Details Pending
                          </span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5 ml-0.5" />
                      </Link>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${sectorTheme.badge}`}>
                        {getBlockDisplayName(r.blockId)}
                      </span>
                      {isConflict && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-bold">
                          Race Claim ({r.conflictCount} Claims)
                        </span>
                      )}
                      <span
                        className={`text-[9px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          r.status === 'active'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : r.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : r.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : r.status === 'superseded'
                            ? 'bg-orange-100 text-orange-900 border-orange-300'
                            : r.status === 'expired'
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {r.status === 'cancelled' ? 'Released' : r.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-800">
                      <span className="font-bold text-slate-900 text-sm">{r.customerName}</span>
                      <span className="text-slate-600 font-medium">{r.customerPhone}</span>
                      <span className="text-slate-400 font-medium">{r.customerEmail}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 text-[11px] text-slate-500">
                      <span>
                        Token Deposit:{' '}
                        <strong className="text-emerald-800 font-mono font-bold">
                          PKR {r.tokenFee.toLocaleString()}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Valid Until:{' '}
                        <strong className="text-slate-900 font-mono">
                          {new Date(r.validUntil).toLocaleDateString()}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>Reserved By: <strong className="text-slate-700">{r.reservedByAdminName}</strong></span>
                    </div>

                    {/* Note / Dispute Context */}
                    {r.resolutionNote && (
                      <div className="text-[11px] text-amber-900 bg-amber-50/80 border border-amber-200 p-2 rounded-xl inline-block mt-1">
                        <strong className="text-amber-800">Dispute/Status Note:</strong>{' '}
                        {r.resolutionNote}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEditNote(r)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                      title="Edit dispute / resolution note"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Note</span>
                    </button>

                    {r.status === 'active' && session.permissions.can_book && (
                      <button
                        onClick={() => handleConfirmBooking(r)}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Move this reservation to official Booked status"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-200" />
                        <span>Move to Booked</span>
                      </button>
                    )}

                    {r.status === 'active' && session.permissions.can_reserve && (
                      <button
                        onClick={() => handleReleaseReservation(r)}
                        className={`px-3 py-2 font-bold text-xs rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          r.reservedByAdminId === session.adminId || session.role === 'super_admin'
                            ? 'bg-white hover:bg-rose-50 active:bg-rose-100 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-300'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                        title={
                          r.reservedByAdminId === session.adminId
                            ? 'Release your reservation back to society inventory'
                            : session.role === 'super_admin'
                            ? `Super Admin Override: Release ${r.reservedByAdminName}'s reservation`
                            : `Only reserving admin (${r.reservedByAdminName}) or Super Admin can release`
                        }
                      >
                        {r.reservedByAdminId !== session.adminId && session.role !== 'super_admin' ? (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
                        )}
                        <span>Release</span>
                      </button>
                    )}

                    {r.status === 'active' && (
                      <Link
                        href={`/admin/master-plan/${r.blockId}?focusPlot=${r.plotId}`}
                        className={`px-3.5 py-2 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isConflict
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        title="View and focus plot on Master Plan map"
                      >
                        <MapPin className="w-3.5 h-3.5 text-white" />
                        <span>{isConflict ? 'View Dispute on Map' : 'View on Map'}</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Note Modal - Crisp Light Styling */}
      {editingRes && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-700" />
                <span>Update Dispute / Resolution Note</span>
              </h3>
              <button
                onClick={() => setEditingRes(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Target Plot:</span>{' '}
                <strong className="text-slate-900 font-bold">
                  {editingRes.plotNumber} ({getBlockDisplayName(editingRes.blockId)})
                </strong>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Dispute Context & Resolution Justification
                </label>
                <textarea
                  rows={4}
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Detail priority justification, counter deposit verification, or executive clearance..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 resize-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRes(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {savingNote ? 'Saving...' : 'Save Resolution Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
