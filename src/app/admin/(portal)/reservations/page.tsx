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
      <div className="py-12 text-center text-[#8FAF7E] animate-pulse">
        Loading Reservations Ledger...
      </div>
    );
  }

  const activeReservations = reservations.filter((r) => r.status === 'active');
  const historyReservations = reservations.filter((r) => r.status !== 'active');
  const displayedReservations = activeTab === 'active' ? activeReservations : historyReservations;

  const duplicateConflicts = activeReservations.filter((r) => r.hasDuplicateConflict);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#11271E] to-[#173428] border border-[#244F3C] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <BookmarkCheck className="w-3.5 h-3.5" />
              Sort Reservation Ledger
            </span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-white">
            Token Allocations & Dispute Management
          </h2>
          <p className="text-xs text-[#A0B8AD] mt-1">
            Track token deposits, resolve duplicate counter claims, and commit verified reservations into official bookings.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-[#091510] p-1.5 rounded-xl border border-[#224436]">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-[#1D4031] text-[#D4AF37] shadow-sm'
                : 'text-[#8FAF7E] hover:text-white'
            }`}
          >
            <span>Active Reservations</span>
            <span className="bg-[#0B1A14] text-[#A3C692] px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
              {activeReservations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-[#1D4031] text-[#D4AF37] shadow-sm'
                : 'text-[#8FAF7E] hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Resolved History</span>
            <span className="bg-[#0B1A14] text-[#A3C692] px-2 py-0.5 rounded-full text-[10px] font-mono">
              {historyReservations.length}
            </span>
          </button>
        </div>
      </div>

      {/* Duplicate Race Condition Warning Banner */}
      {duplicateConflicts.length > 0 && activeTab === 'active' && (
        <div className="bg-amber-950/40 border-2 border-amber-500/80 rounded-2xl p-5 shadow-2xl flex items-start gap-4 animate-in fade-in">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-amber-300">
              Active Duplicate Reservation Race Condition ({duplicateConflicts.length} Conflicting Claims)
            </h4>
            <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
              Multiple administrators have submitted token deposits on the same plot (e.g. <strong className="text-white">Plot R-08</strong> in Royal Block has 2 active claims: Hamid Raza and Zubair Qureshi).
              Select a preferred reservation to commit the official booking; doing so will automatically supersede conflicting deposits into the resolved history ledger.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-[#0F221A] border border-[#1F4433] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6D917F] absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, plot number, or admin..."
            className="w-full pl-9 pr-3 py-2 bg-[#091510] border border-[#224436] rounded-xl text-xs text-white placeholder-[#527264] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Block Scope Filter */}
        <select
          value={blockFilter}
          onChange={(e) => setBlockFilter(e.target.value)}
          className="px-3 py-2 bg-[#091510] border border-[#224436] rounded-xl text-xs text-white font-mono"
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

      {/* Reservations Table / Cards */}
      <div className="bg-[#0F221A] border border-[#1F4433] rounded-2xl shadow-xl overflow-hidden">
        {displayedReservations.length === 0 ? (
          <div className="p-12 text-center text-[#8FAF7E]">
            <Building2 className="w-10 h-10 mx-auto text-[#2D5A46] mb-3" />
            <div className="font-serif text-base text-white">No Reservations Found</div>
            <p className="text-xs text-[#6D917F] mt-1">
              No reservation records match the current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1B3A2C]">
            {displayedReservations.map((r) => {
              const isConflict = r.hasDuplicateConflict;
              return (
                <div
                  key={r.id}
                  className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isConflict ? 'bg-amber-950/20 hover:bg-amber-950/30' : 'hover:bg-[#132A20]'
                  }`}
                >
                  {/* Left Specs */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white bg-[#0A1711] border border-[#224436] px-2.5 py-0.5 rounded-md">
                        {r.plotNumber}
                      </span>
                      <span className="text-xs uppercase font-mono text-[#A3C692]">
                        {r.blockId} Block
                      </span>
                      {isConflict && (
                        <span className="text-[10px] bg-red-950 text-red-200 border border-red-700 px-2 py-0.5 rounded-full font-bold">
                          Race Claim ({r.conflictCount} Claims)
                        </span>
                      )}
                      <span
                        className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                          r.status === 'active'
                            ? 'bg-amber-900/60 text-amber-300'
                            : r.status === 'confirmed'
                            ? 'bg-emerald-900/60 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#FAF9F7]">
                      <span className="font-semibold text-[#D4AF37]">{r.customerName}</span>
                      <span className="text-[#8FAF7E]">{r.customerPhone}</span>
                      <span className="text-[#6D917F]">{r.customerEmail}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 text-[11px] text-[#8FAF7E]">
                      <span>
                        Token Deposit:{' '}
                        <strong className="text-white font-mono">
                          PKR {r.tokenFee.toLocaleString()}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Valid Until:{' '}
                        <strong className="text-white font-mono">
                          {new Date(r.validUntil).toLocaleDateString()}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>Reserved By: {r.reservedByAdminName}</span>
                    </div>

                    {/* Note / Dispute Context */}
                    {r.resolutionNote && (
                      <div className="text-[11px] text-amber-200/90 bg-[#091510] border border-[#224436] p-2 rounded-lg inline-block">
                        <strong className="text-[#8FAF7E]">Dispute/Status Note:</strong>{' '}
                        {r.resolutionNote}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEditNote(r)}
                      className="p-2 bg-[#173629] hover:bg-[#234F3D] text-[#A3C692] hover:text-white rounded-lg border border-[#2C5743] transition-colors flex items-center gap-1.5 text-xs"
                      title="Edit dispute / resolution note"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Note</span>
                    </button>

                    {r.status === 'active' && (
                      <Link
                        href={`/admin/master-plan/${r.blockId}`}
                        className="px-3.5 py-2 bg-[#D4AF37] hover:bg-[#E5C14E] text-[#0A1510] font-bold text-xs rounded-lg shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Manage In Grid</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Note Modal */}
      {editingRes && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E2018] border border-[#224A37] rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A2F] mb-4">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#D4AF37]" />
                <span>Update Dispute / Resolution Note</span>
              </h3>
              <button
                onClick={() => setEditingRes(null)}
                className="text-[#8FAF7E] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4 text-xs">
              <div>
                <span className="text-[#8FAF7E]">Target Plot:</span>{' '}
                <strong className="text-white font-mono">
                  {editingRes.plotNumber} ({editingRes.blockId} Block)
                </strong>
              </div>

              <div>
                <label className="block text-[#B2CEB8] mb-1 font-medium">
                  Dispute Context & Resolution Justification
                </label>
                <textarea
                  rows={4}
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Detail priority justification, counter deposit verification, or executive clearance..."
                  className="w-full px-3 py-2 bg-[#091510] border border-[#224436] rounded-lg text-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRes(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#8FAF7E] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C14E] text-[#0A1510] font-bold text-xs rounded-lg shadow-md transition-colors cursor-pointer"
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
