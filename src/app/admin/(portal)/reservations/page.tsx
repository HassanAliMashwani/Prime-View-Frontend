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
  Building2
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getReservations, updateReservationNote, ReservationWithConflict } from '@/lib/dal/reservations';
import { AdminSession, Reservation } from '@/lib/mock/types';

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
      const res = await getReservations(s, {
        search,
        blockId: blockFilter,
        status: activeTab === 'active' ? 'active' : undefined,
      });

      if (res.ok) {
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
      {/* Header Banner - Executive Forest Green */}
      <div className="bg-gradient-to-r from-[#10251E] to-[#183B2B] border border-[#23503B] rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <BookmarkCheck className="w-3.5 h-3.5" />
              Sort Reservation Ledger
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
            Token Allocations & Dispute Management
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
            Track token deposits, resolve duplicate counter claims, and commit verified reservations into official bookings.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl border border-white/20">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#D4AF37] text-[#10251E] shadow-sm'
                : 'text-emerald-100 hover:text-white'
            }`}
          >
            <span>Active Reservations</span>
            <span className="bg-[#10251E] text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
              {activeReservations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#D4AF37] text-[#10251E] shadow-sm'
                : 'text-emerald-100 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Resolved History</span>
            <span className="bg-[#10251E] text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
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
                {b.toUpperCase()} Block
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
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                        {r.plotNumber}
                      </span>
                      <span className="text-xs uppercase font-mono font-bold text-emerald-800">
                        {r.blockId} Block
                      </span>
                      {isConflict && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-bold">
                          Race Claim ({r.conflictCount} Claims)
                        </span>
                      )}
                      <span
                        className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                          r.status === 'active'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : r.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-800">
                      <span className="font-bold text-[#10251E] text-sm">{r.customerName}</span>
                      <span className="text-slate-600 font-medium">{r.customerPhone}</span>
                      <span className="text-slate-400 font-medium">{r.customerEmail}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 text-[11px] text-slate-500">
                      <span>
                        Token Deposit:{' '}
                        <strong className="text-slate-900 font-mono font-bold">
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
                      <span>Reserved By: <strong>{r.reservedByAdminName}</strong></span>
                    </div>

                    {/* Note / Dispute Context */}
                    {r.resolutionNote && (
                      <div className="text-[11px] text-amber-900 bg-amber-50/70 border border-amber-200 p-2 rounded-xl inline-block mt-1">
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

                    {r.status === 'active' && (
                      <Link
                        href={`/admin/master-plan/${r.blockId}`}
                        className="px-3.5 py-2 bg-[#10251E] hover:bg-[#18392C] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Manage In Grid</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
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
                <strong className="text-slate-900 font-mono font-bold">
                  {editingRes.plotNumber} ({editingRes.blockId} Block)
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 resize-none focus:bg-white focus:border-[#10251E]"
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
                  className="px-4 py-2 bg-[#10251E] hover:bg-[#18392C] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
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
