'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Lock, 
  ShieldAlert, 
  BookmarkCheck, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Phone, 
  Mail, 
  User
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { 
  getAdminBlockPlots, 
  acquireLock, 
  releaseLock, 
  reservePlot, 
  bookPlot 
} from '@/lib/dal/adminPlots';
import { Block, Plot, AdminSession, Reservation } from '@/lib/mock/types';
import { mockStore } from '@/lib/mock/store';

export default function BlockPlotsPage() {
  const params = useParams();
  const router = useRouter();
  const blockId = params.blockId as string;

  const [session, setSession] = useState<AdminSession | null>(null);
  const [block, setBlock] = useState<Block | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [outOfScope, setOutOfScope] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'booked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'residential' | 'commercial' | 'farm_house' | 'amenity'>('all');

  // Selected plot for action
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [plotReservations, setPlotReservations] = useState<Reservation[]>([]);

  // Modals
  const [isReserveModalOpen, setIsReserveModalOpen] = useState<boolean>(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Reservation Form State
  const [reserveForm, setReserveForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tokenFee: 50000,
    validDays: 7,
    note: '',
  });

  // Booking Form State
  const [bookForm, setBookForm] = useState({
    fullName: '',
    fatherOrHusbandName: '',
    cnic: '',
    phone: '',
    email: '',
    mailingAddress: '',
    paymentType: 'one_time' as 'one_time' | 'installment',
    reservationId: '' as string | undefined,
  });

  const loadPlots = useCallback(async (s: AdminSession) => {
    try {
      const res = await getAdminBlockPlots(s, blockId, {
        search,
        status: statusFilter,
        category: categoryFilter,
      });

      if (!res.ok) {
        if (res.error === 'OUT_OF_SCOPE') {
          setOutOfScope(true);
        }
      } else {
        setBlock(res.block || null);
        setPlots(res.plots || []);
      }
    } catch (err) {
      console.error('Failed loading plots:', err);
    } finally {
      setLoading(false);
    }
  }, [blockId, search, statusFilter, categoryFilter]);

  useEffect(() => {
    const s = getActiveAdminSession();
    if (s) {
      setSession(s);
      loadPlots(s);
    }
  }, [loadPlots]);

  // Open Plot Action Drawer
  const handleSelectPlot = (plot: Plot) => {
    setSelectedPlot(plot);
    setActionError(null);
    const activeRes = mockStore.reservations.filter(
      (r) => r.plotId === plot.id && r.status === 'active'
    );
    setPlotReservations(activeRes);
  };

  // Open Reserve Modal
  const openReserve = () => {
    if (!selectedPlot) return;
    setReserveForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      tokenFee: 50000,
      validDays: 7,
      note: '',
    });
    setActionError(null);
    setIsReserveModalOpen(true);
  };

  // Submit Reservation
  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedPlot) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await reservePlot(session, {
        plotId: selectedPlot.id,
        customerName: reserveForm.customerName,
        customerPhone: reserveForm.customerPhone,
        customerEmail: reserveForm.customerEmail,
        tokenFee: Number(reserveForm.tokenFee) || 50000,
        validDays: Number(reserveForm.validDays) || 7,
        note: reserveForm.note,
      });

      if (res.ok) {
        setIsReserveModalOpen(false);
        setSelectedPlot(null);
        await loadPlots(session);
      } else {
        setActionError(res.error || 'Failed to place reservation.');
      }
    } catch {
      setActionError('An unexpected error occurred during reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Booking Modal (Acquire Soft Lock Layer 1)
  const openBook = async (prefillReservation?: Reservation) => {
    if (!session || !selectedPlot) return;
    setActionLoading(true);
    setActionError(null);

    // Layer 1 Soft Lock acquisition
    const lockRes = await acquireLock(session, selectedPlot.id);
    if (!lockRes.ok) {
      setActionError(
        lockRes.error === 'LOCKED_BY_ANOTHER'
          ? `Lock Acquisition Failed: Plot is currently locked by ${lockRes.lockedByName}. Please wait for lock expiration.`
          : `Lock Error: ${lockRes.error}`
      );
      setActionLoading(false);
      return;
    }

    if (prefillReservation) {
      setBookForm({
        fullName: prefillReservation.customerName,
        fatherOrHusbandName: '',
        cnic: '',
        phone: prefillReservation.customerPhone,
        email: prefillReservation.customerEmail,
        mailingAddress: '',
        paymentType: 'one_time',
        reservationId: prefillReservation.id,
      });
    } else {
      setBookForm({
        fullName: '',
        fatherOrHusbandName: '',
        cnic: '',
        phone: '',
        email: '',
        mailingAddress: '',
        paymentType: 'one_time',
        reservationId: undefined,
      });
    }

    setIsBookModalOpen(true);
    setActionLoading(false);
  };

  // Cancel Booking (Release Soft Lock)
  const closeBookModal = async () => {
    if (session && selectedPlot && selectedPlot.lockedBy === session.adminId) {
      await releaseLock(session, selectedPlot.id);
    }
    setIsBookModalOpen(false);
    if (session) await loadPlots(session);
  };

  // Submit Booking (Layer 2 Atomic Commit Guard)
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedPlot) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await bookPlot(session, {
        plotId: selectedPlot.id,
        paymentType: bookForm.paymentType,
        customer: {
          fullName: bookForm.fullName,
          fatherOrHusbandName: bookForm.fatherOrHusbandName,
          cnic: bookForm.cnic,
          phone: bookForm.phone,
          email: bookForm.email,
          mailingAddress: bookForm.mailingAddress,
        },
        reservationId: bookForm.reservationId,
      });

      if (res.ok) {
        setIsBookModalOpen(false);
        setSelectedPlot(null);
        await loadPlots(session);
      } else {
        setActionError(
          res.error === 'LOCK_LOST'
            ? 'Atomic Commit Guard: Your booking lock expired or was superseded. Commit rejected.'
            : res.error === 'ALREADY_BOOKED'
            ? 'Plot has already been booked by another administrator.'
            : `Booking commit failed: ${res.error}`
        );
      }
    } catch {
      setActionError('An unexpected error occurred during booking commit.');
    } finally {
      setActionLoading(false);
    }
  };

  if (outOfScope) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto bg-white border border-rose-300 rounded-2xl p-8 shadow-xl">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold font-serif text-slate-900 mb-2">
          Administrative Access Denied
        </h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          Exception 5.4 Enforcement: Sector <strong className="text-slate-900 uppercase font-mono">[{blockId}]</strong> is outside your assigned administrative authority. Sub-administrators may strictly view and manage assigned blocks only.
        </p>
        <Link
          href="/admin/master-plan"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10251E] hover:bg-[#18392C] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
          <span>Return to Master Plan Overview</span>
        </Link>
      </div>
    );
  }

  if (loading || !block || !session) {
    return (
      <div className="py-12 text-center text-emerald-800 animate-pulse font-medium">
        Loading Sector Grid [{blockId}]...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
            <Link href="/admin/master-plan" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              <span>Master Plan</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800">{block.name}</span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-3">
            <span>{block.name}</span>
            <span className="text-xs font-sans font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-0.5 rounded-full font-bold">
              {plots.length} Visible Plots
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">{block.description}</p>
        </div>

        {/* Amenity Badges */}
        <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
          {block.amenities.map((a) => (
            <span
              key={a}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] px-2.5 py-1 rounded-lg font-semibold shadow-xs"
            >
              ★ {a}
            </span>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plot number (e.g. R-06, A-01, AMN-H01)..."
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all', 'available', 'reserved', 'booked'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#10251E] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all', 'residential', 'commercial', 'farm_house', 'amenity'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#10251E] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Plot Grid - Crisp High-Contrast Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
        {plots.map((plot) => {
          const isLocked = Boolean(plot.lockedBy);
          const isAmenity = plot.category === 'amenity';
          const isReserved = plot.status === 'reserved';
          const isBooked = plot.status === 'booked';
          const isAvailable = plot.status === 'available' && !isAmenity;

          let cardBg = 'bg-white border-slate-200';
          let badgeColor = 'bg-slate-100 text-slate-700';

          if (isLocked) {
            cardBg = 'bg-rose-50/90 border-rose-300 shadow-sm animate-pulse';
            badgeColor = 'bg-rose-600 text-white font-bold';
          } else if (isAmenity) {
            cardBg = 'bg-indigo-50/70 border-indigo-200 hover:border-indigo-400';
            badgeColor = 'bg-indigo-100 text-indigo-800 font-bold';
          } else if (isReserved) {
            cardBg = 'bg-amber-50/70 border-amber-300 hover:border-amber-400';
            badgeColor = 'bg-amber-100 text-amber-800 font-bold';
          } else if (isBooked) {
            cardBg = 'bg-slate-100/90 border-slate-300 opacity-80';
            badgeColor = 'bg-slate-200 text-slate-700';
          } else if (isAvailable) {
            cardBg = 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50';
            badgeColor = 'bg-emerald-100 text-emerald-800 font-bold';
          }

          return (
            <button
              key={plot.id}
              onClick={() => handleSelectPlot(plot)}
              className={`p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.02] cursor-pointer relative group flex flex-col justify-between min-h-[115px] shadow-xs hover:shadow-md ${cardBg}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {plot.plotNumber}
                  </span>
                  <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-md ${badgeColor}`}>
                    {isLocked ? 'Locked' : isAmenity ? 'Amenity' : plot.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 truncate font-medium">
                  {isAmenity ? plot.amenityName : plot.size}
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                <span className="font-mono font-bold text-slate-800">
                  {isAmenity ? 'Public Facility' : `PKR ${(plot.price / 100000).toFixed(1)}M`}
                </span>
                {isLocked ? (
                  <span className="text-rose-700 font-mono text-[9px] font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{plot.lockedByName?.split(' ')[0]}</span>
                  </span>
                ) : isReserved ? (
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                ) : isAvailable ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Plot Detail Modal / Action Drawer */}
      {selectedPlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase font-bold text-emerald-800">
                    Sector: {block.name}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-mono uppercase font-semibold text-slate-500">
                    {selectedPlot.category.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                  Plot {selectedPlot.plotNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlot(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-700">
              {actionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Status Banner */}
              {selectedPlot.lockedBy ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-rose-900">
                    <Lock className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="font-bold text-xs">Active Booking Lock (10m)</div>
                      <div className="text-[11px] text-rose-700">
                        Held by: <strong>{selectedPlot.lockedByName}</strong>
                      </div>
                    </div>
                  </div>
                  {session.role === 'super_admin' && (
                    <button
                      onClick={async () => {
                        await releaseLock(session, selectedPlot.id);
                        await loadPlots(session);
                        setSelectedPlot(null);
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg shadow-xs"
                    >
                      Force Release
                    </button>
                  )}
                </div>
              ) : selectedPlot.category === 'amenity' ? (
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-950">
                  <div className="font-bold text-sm text-indigo-900">
                    Non-Sellable Society Amenity: {selectedPlot.amenityName}
                  </div>
                  <p className="text-[11px] mt-1 text-indigo-800">
                    This property is reserved for public utility and cannot be booked or reserved.
                  </p>
                </div>
              ) : null}

              {/* Plot Specs */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Plot Size</span>
                  <div className="text-sm font-bold text-slate-900">{selectedPlot.size}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Official Price</span>
                  <div className="text-sm font-bold text-[#10251E] font-mono">
                    {selectedPlot.price > 0 ? `PKR ${selectedPlot.price.toLocaleString()}` : 'Society Amenity'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Current Status</span>
                  <div className="text-sm font-bold capitalize text-slate-900">{selectedPlot.status}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Plot Type</span>
                  <div className="text-sm font-bold capitalize text-slate-700 font-mono">
                    {selectedPlot.plotType}
                  </div>
                </div>
              </div>

              {/* Active Reservations Details (With Duplicate Conflict Banner) */}
              {plotReservations.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
                      Active Reservations ({plotReservations.length})
                    </span>
                    {plotReservations.length > 1 && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full border border-rose-300">
                        Dispute Race Conflict
                      </span>
                    )}
                  </div>

                  {plotReservations.map((res, idx) => (
                    <div
                      key={res.id}
                      className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {idx + 1}. {res.customerName}
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                          Token: <strong>PKR {res.tokenFee.toLocaleString()}</strong> • {res.customerPhone}
                        </div>
                        {res.resolutionNote && (
                          <div className="text-[10px] text-amber-900 italic mt-1 bg-white/70 px-2 py-0.5 rounded border border-amber-200">
                            Note: {res.resolutionNote}
                          </div>
                        )}
                      </div>

                      {/* Convert to booking */}
                      <button
                        onClick={() => openBook(res)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-[#10251E] hover:bg-[#18392C] text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        Confirm Booking
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                {selectedPlot.category !== 'amenity' && selectedPlot.status !== 'booked' && (
                  <>
                    <button
                      onClick={openReserve}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                    >
                      Reserve Plot (Token Deposit)
                    </button>

                    <button
                      onClick={() => openBook()}
                      disabled={actionLoading || Boolean(selectedPlot.lockedBy && selectedPlot.lockedBy !== session.adminId)}
                      className="flex-1 py-2.5 px-3 bg-[#10251E] hover:bg-[#18392C] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center disabled:opacity-50"
                    >
                      Acquire Lock & Book Now
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reserve Plot Modal - Crisp Light Styling */}
      {isReserveModalOpen && selectedPlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-emerald-700" />
                <span>Reserve Plot {selectedPlot.plotNumber}</span>
              </h3>
              <button
                onClick={() => setIsReserveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReserveSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={reserveForm.customerName}
                  onChange={(e) => setReserveForm({ ...reserveForm, customerName: e.target.value })}
                  placeholder="e.g. Khurram Shehzad"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#10251E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={reserveForm.customerPhone}
                    onChange={(e) => setReserveForm({ ...reserveForm, customerPhone: e.target.value })}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#10251E]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Email Address</label>
                  <input
                    type="email"
                    required
                    value={reserveForm.customerEmail}
                    onChange={(e) => setReserveForm({ ...reserveForm, customerEmail: e.target.value })}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#10251E]"
                  />
                </div>
              </div>

              {/* Admin-Adjustable Token Fee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-800 mb-1 font-bold">
                    Token Fee (PKR) • Editable
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    required
                    value={reserveForm.tokenFee}
                    onChange={(e) => setReserveForm({ ...reserveForm, tokenFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-emerald-50/80 border border-emerald-300 rounded-xl text-emerald-950 font-mono font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Hold Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={reserveForm.validDays}
                    onChange={(e) => setReserveForm({ ...reserveForm, validDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Reservation Notes / Counter Priority</label>
                <textarea
                  rows={2}
                  value={reserveForm.note}
                  onChange={(e) => setReserveForm({ ...reserveForm, note: e.target.value })}
                  placeholder="Record counter slip reference, priority justification, or dispute context..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 resize-none focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReserveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#10251E] hover:bg-[#18392C] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {actionLoading ? 'Filing...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Plot Modal - Crisp Light Styling */}
      {isBookModalOpen && selectedPlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-800 font-bold">
                  <Lock className="w-3 h-3" />
                  <span>10-Minute Lock Active for {session.fullName}</span>
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Commit Booking • Plot {selectedPlot.plotNumber}
                </h3>
              </div>
              <button
                onClick={closeBookModal}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    value={bookForm.fullName}
                    onChange={(e) => setBookForm({ ...bookForm, fullName: e.target.value })}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Father / Husband Name</label>
                  <input
                    type="text"
                    value={bookForm.fatherOrHusbandName}
                    onChange={(e) => setBookForm({ ...bookForm, fatherOrHusbandName: e.target.value })}
                    placeholder="e.g. Muhammad Mehmood"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">CNIC Number</label>
                  <input
                    type="text"
                    value={bookForm.cnic}
                    onChange={(e) => setBookForm({ ...bookForm, cnic: e.target.value })}
                    placeholder="37405-XXXXXXX-X"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={bookForm.phone}
                    onChange={(e) => setBookForm({ ...bookForm, phone: e.target.value })}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={bookForm.email}
                  onChange={(e) => setBookForm({ ...bookForm, email: e.target.value })}
                  placeholder="member@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                />
              </div>

              {/* Payment Schedule Option */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Payment Plan Discipline</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookForm({ ...bookForm, paymentType: 'one_time' })}
                    className={`py-2 px-3 rounded-xl border text-left transition-colors ${
                      bookForm.paymentType === 'one_time'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-semibold">One-Time Payment</div>
                    <div className="text-[10px] text-slate-500">Full settlement upon booking</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookForm({ ...bookForm, paymentType: 'installment' })}
                    className={`py-2 px-3 rounded-xl border text-left transition-colors ${
                      bookForm.paymentType === 'installment'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-semibold">8-Quarter Installments</div>
                    <div className="text-[10px] text-slate-500">Quarterly payment schedule</div>
                  </button>
                </div>
              </div>

              {/* Statutory Fees Isolated Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Plot Price:</span>
                  <span className="font-mono text-slate-900 font-bold">PKR {selectedPlot.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Admission Fee (Isolated Statutory):</span>
                  <span className="font-mono text-emerald-700 font-bold">PKR 2,000</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Share Subscription Fee (Isolated):</span>
                  <span className="font-mono text-emerald-700 font-bold">PKR 10,000</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeBookModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel & Release Lock
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-[#10251E] hover:bg-[#18392C] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {actionLoading ? 'Committing...' : 'Commit Final Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
