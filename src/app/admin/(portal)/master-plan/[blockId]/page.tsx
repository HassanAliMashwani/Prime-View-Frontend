'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Lock, 
  ShieldAlert, 
  ShieldCheck,
  BookmarkCheck, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Phone, 
  Mail, 
  User, 
  Sparkles, 
  RotateCcw, 
  Map as MapIcon, 
  LayoutGrid,
  ChevronDown,
  Check
} from 'lucide-react';
import { AdminMasterPlanSkeleton } from '@/components/ui/skeleton';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { 
  getAdminBlockPlots, 
  getAdminPlotDetails,
  acquireLock, 
  releaseLock,
  startReservingPlot,
  cancelReservingPlot,
  reservePlot, 
  togglePlotAdjustment,
  updatePlotPrice
} from '@/lib/dal/adminPlots';
import { releaseReservation } from '@/lib/dal/reservations';
import { createMinimalBooking } from '@/lib/dal/customers';
import { Block, Plot, AdminSession, Reservation, PlotCategory, Customer, Booking } from '@/lib/mock/types';

import InteractiveBlockMap from '@/components/admin/master-plan/InteractiveBlockMap';
import { hasBlockMap } from '@/lib/map/blockRegistry';
import { formatRemainingHoldTime } from '@/lib/utils/reservationHold';

const CATEGORY_COLORS: Record<string, string> = {
  residential: 'bg-blue-100 text-blue-800 border-blue-300', // Residential in Blue per user specification
  commercial: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  farm_house: 'bg-amber-100 text-amber-800 border-amber-300',
  amenity: 'bg-purple-100 text-purple-800 border-purple-300',
};

const CATEGORY_OPTIONS: { id: 'all' | PlotCategory; label: string; dot: string }[] = [
  { id: 'all', label: 'All Categories', dot: 'bg-slate-400' },
  { id: 'residential', label: 'Residential', dot: 'bg-blue-600' },
  { id: 'commercial', label: 'Commercial', dot: 'bg-indigo-600' },
  { id: 'farm_house', label: 'Farm House', dot: 'bg-amber-600' },
  { id: 'amenity', label: 'Public Amenity', dot: 'bg-purple-600' },
];

function BlockPlotsContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const blockId = params.blockId as string;
  const focusPlotId = searchParams?.get('focusPlot');

  const [session, setSession] = useState<AdminSession | null>(null);
  const [block, setBlock] = useState<Block | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [outOfScope, setOutOfScope] = useState<boolean>(false);
  const [highlightedPlotId, setHighlightedPlotId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'booked' | 'allotted' | 'disputed' | 'adjustment'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'residential' | 'commercial' | 'farm_house' | 'amenity'>('all');
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close category dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasTraced = hasBlockMap(blockId);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');

  // Selected plot for action
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [selectedPlotOwner, setSelectedPlotOwner] = useState<Customer | null>(null);
  const [selectedPlotBooking, setSelectedPlotBooking] = useState<Booking | null>(null);
  const [isLoadingPlotDetails, setIsLoadingPlotDetails] = useState<boolean>(false);
  const [plotReservations, setPlotReservations] = useState<Reservation[]>([]);

  // Modals
  const [isReserveModalOpen, setIsReserveModalOpen] = useState<boolean>(false);
  const [isMinimalBookModalOpen, setIsMinimalBookModalOpen] = useState<boolean>(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState<boolean>(false);
  const [adjustmentReasonInput, setAdjustmentReasonInput] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Admin 3-Field Quick Booking Form State (CR 07 §5)
  const [minimalForm, setMinimalForm] = useState({
    customerName: '',
    cnic: '',
    city: '',
    lockToken: '',
  });

  // Reservation Form State
  const [reserveForm, setReserveForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tokenFee: 50000,
    validDays: 1,
    note: '',
  });

  // Super Admin direct price editing
  const [isEditingPrice, setIsEditingPrice] = useState<boolean>(false);
  const [newPriceInput, setNewPriceInput] = useState<string>('');
  const [priceSaving, setPriceSaving] = useState<boolean>(false);

  const handleSavePrice = async () => {
    if (!session || !selectedPlot) return;
    const num = Number(newPriceInput);
    if (!num || num <= 0) return;
    setPriceSaving(true);
    const res = await updatePlotPrice(session, selectedPlot.id, num);
    setPriceSaving(false);
    if (res.ok && res.plot) {
      setIsEditingPrice(false);
      setSelectedPlot(res.plot);
      await loadPlots(session);
    } else {
      alert(res.message || 'This feature is not available yet (NOT_YET_IMPLEMENTED).');
      setIsEditingPrice(false);
    }
  };

  const loadPlots = useCallback(async (s: AdminSession) => {
    try {
      const res = await getAdminBlockPlots(s, blockId);

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
  }, [blockId]);

  // Compute visible filtered plots based on active search, status and category filters
  const filteredPlots = React.useMemo(() => {
    return plots.filter((plot) => {
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        const matchNum = plot.plotNumber.toLowerCase().includes(q);
        const matchSize = plot.size.toLowerCase().includes(q);
        const matchAmenity = plot.amenityName?.toLowerCase().includes(q);
        if (!matchNum && !matchSize && !matchAmenity) return false;
      }
      if (statusFilter !== 'all') {
        const visualStatus = plot.displayStatus || plot.status;
        if (statusFilter === 'adjustment') {
          if (!plot.isAdjustment) return false;
        } else if (statusFilter === 'disputed') {
          const isDisputed = Boolean(
            visualStatus === 'disputed' || plot.isDisputed || (plot.activeReservationCount && plot.activeReservationCount > 1)
          );
          if (!isDisputed) return false;
        } else if (statusFilter === 'available') {
          if (visualStatus !== 'available' || plot.category === 'amenity' || plot.isAdjustment) return false;
        } else if (visualStatus !== statusFilter) {
          return false;
        }
      }
      if (categoryFilter !== 'all') {
        if (plot.category !== categoryFilter) return false;
      }
      return true;
    });
  }, [plots, search, statusFilter, categoryFilter]);


  useEffect(() => {
    const s = getActiveAdminSession();
    if (s) {
      setSession(s);
      loadPlots(s);
    }
  }, [loadPlots]);

  // Real-time sync via interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      const s = getActiveAdminSession();
      if (s) {
        loadPlots(s);
        // Refresh selected plot if it is open
        if (selectedPlot) {
          getAdminPlotDetails(s, selectedPlot.id).then((res) => {
             if (res.ok && res.plot) {
                setSelectedPlot(res.plot);
                if (res.reservations) setPlotReservations(res.reservations);
                if (res.owner) setSelectedPlotOwner(res.owner);
                if (res.booking) setSelectedPlotBooking(res.booking);
             }
          });
        }
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadPlots, selectedPlot]);

  // Deep-link auto-scroll and highlight for Card Grid mode
  useEffect(() => {
    if (!focusPlotId || plots.length === 0) return;
    const target = plots.find((p) => p.id === focusPlotId);
    if (!target) return;

    if (!hasTraced || viewMode === 'grid') {
      const el = document.getElementById(`plot-card-${focusPlotId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedPlotId(focusPlotId);
        handleSelectPlot(target);
        const timer = setTimeout(() => setHighlightedPlotId(null), 4500);
        return () => clearTimeout(timer);
      }
    }
  }, [focusPlotId, plots, hasTraced, viewMode]);

  // Close Plot Action Drawer and clean up deep-link query param if present
  const handleCloseDrawer = useCallback(() => {
    setSelectedPlot(null);
    setActionError(null);
    setIsEditingPrice(false);
    if (focusPlotId) {
      router.replace(`/admin/master-plan/${blockId}`, { scroll: false });
    }
  }, [focusPlotId, router, blockId]);

  // Open Plot Action Drawer
  const handleSelectPlot = useCallback((plot: Plot) => {
    setSelectedPlot(plot);
    setActionError(null);
    setIsEditingPrice(false);
    setSelectedPlotOwner(null);
    setSelectedPlotBooking(null);
    setPlotReservations([]);
    
    setIsLoadingPlotDetails(true);
    const s = getActiveAdminSession();
    if (s) {
      getAdminPlotDetails(s, plot.id).then((res) => {
        if (res.ok) {
          if (res.plot) setSelectedPlot(res.plot);
          if (res.reservations) setPlotReservations(res.reservations);
          if (res.owner) setSelectedPlotOwner(res.owner);
          if (res.booking) setSelectedPlotBooking(res.booking);
        }
        setIsLoadingPlotDetails(false);
      });
    } else {
      setIsLoadingPlotDetails(false);
    }
  }, []);

  // Keyboard shortcut: Escape to close drawer
  useEffect(() => {
    if (!selectedPlot) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isReserveModalOpen) {
        handleCloseDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlot, isReserveModalOpen, handleCloseDrawer]);

  // Open Reserve Modal (Broadcast non-blocking PLOT_RESERVING)
  const openReserve = async () => {
    if (!selectedPlot || !session) return;
    setReserveForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      tokenFee: 50000,
      validDays: 1,
      note: '',
    });
    setActionError(null);
    setIsReserveModalOpen(true);
    await startReservingPlot(session, selectedPlot.id);
  };

  // Cancel / Close Reserve Modal (Broadcast PLOT_RESERVING_CANCELLED)
  const closeReserveModal = async () => {
    if (session && selectedPlot) {
      await cancelReservingPlot(session, selectedPlot.id);
    }
    setIsReserveModalOpen(false);
    if (session) await loadPlots(session);
  };

  // Cancel / Close Minimal Booking Modal (Release soft lock)
  const closeMinimalBookModal = async () => {
    if (session && selectedPlot) {
      await releaseLock(session, selectedPlot.id);
    }
    setIsMinimalBookModalOpen(false);
    if (session) await loadPlots(session);
  };

  // Submit Admin Minimal Quick Booking
  const handleMinimalBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedPlot) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await createMinimalBooking(session, {
        plotId: selectedPlot.id,
        customerName: minimalForm.customerName,
        cnic: minimalForm.cnic,
        city: minimalForm.city,
        lockToken: minimalForm.lockToken || undefined,
      });

      if (res.ok) {
        setIsMinimalBookModalOpen(false);
        setSelectedPlot(null);
        await loadPlots(session);
      } else {
        setActionError(res.message || res.error || 'Failed to complete quick booking.');
      }
    } catch {
      setActionError('An unexpected error occurred during quick booking.');
    } finally {
      setActionLoading(false);
    }
  };

  // Safety net: cleanup reserving badge and locks on tab close/navigate
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isReserveModalOpen && session && selectedPlot) {
        cancelReservingPlot(session, selectedPlot.id);
      }
      if (isMinimalBookModalOpen && session && selectedPlot) {
        releaseLock(session, selectedPlot.id);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isReserveModalOpen, isMinimalBookModalOpen, session, selectedPlot]);

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
        validDays: Number(reserveForm.validDays) || 1,
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

  // Release / Cancel an Active Reservation (Enforces Ownership & Audit)
  const handleReleaseReservation = async (res: Reservation) => {
    if (!session || !selectedPlot) return;
    const isOwner = res.reservedByAdminId === session.adminId;
    const isSuperAdmin = session.role === 'super_admin';

    const confirmMsg = !isOwner && isSuperAdmin
      ? `SUPER ADMIN OVERRIDE:\n\nAre you sure you want to release the reservation for ${res.customerName} on Plot ${selectedPlot.plotNumber}?\n\nThis reservation was created by ${res.reservedByAdminName}. Your override will be recorded in the official audit ledger.`
      : `Are you sure you want to release the reservation for ${res.customerName} on Plot ${selectedPlot.plotNumber}?\n\nThis will revoke the active token reservation and release the plot back to society inventory.`;

    if (!confirm(confirmMsg)) {
      return;
    }
    setActionLoading(true);
    setActionError(null);

    try {
      const result = await releaseReservation(
        session,
        res.id,
        isOwner ? 'Released by reserving admin via Master Plan' : 'Released by Super Admin override via Master Plan'
      );
      if (result.ok) {
        await loadPlots(session);
        const detailRes = await getAdminPlotDetails(session, selectedPlot.id);
        if (detailRes.ok && detailRes.plot) {
          setSelectedPlot(detailRes.plot);
          setPlotReservations(detailRes.reservations || []);
        }
      } else {
        if (result.error === 'NOT_RESERVATION_OWNER') {
          setActionError(`Access Denied: Only the original reserving officer (${res.reservedByAdminName}) can release this reservation.`);
        } else {
          setActionError('Failed to release reservation. Please try again.');
        }
      }
    } catch {
      setActionError('An unexpected error occurred while releasing the reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Master Plan Adjustment (Town Planning / Boundary Re-survey Freeze - Super Admin Only)
  const handleApplyAdjustment = async () => {
    if (!session || !selectedPlot) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await togglePlotAdjustment(session, selectedPlot.id, true, adjustmentReasonInput);
      if (res.ok && res.plot) {
        setIsAdjustmentModalOpen(false);
        setAdjustmentReasonInput('');
        setSelectedPlot(res.plot);
        await loadPlots(session);
      } else {
        setActionError(res.error || 'Failed to flag plot for adjustment.');
      }
    } catch {
      setActionError('An error occurred while updating plot adjustment status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseAdjustment = async () => {
    if (!session || !selectedPlot) return;
    if (!confirm(`Are you sure you want to release the Master Plan Adjustment Freeze on Plot ${selectedPlot.plotNumber}? This will return the plot to standard society operations.`)) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await togglePlotAdjustment(session, selectedPlot.id, false);
      if (res.ok && res.plot) {
        setSelectedPlot(res.plot);
        await loadPlots(session);
      } else {
        setActionError(res.error || 'Failed to release adjustment freeze.');
      }
    } catch {
      setActionError('An error occurred while releasing plot adjustment freeze.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Booking Flow (Acquires Soft Lock Layer 1 and redirects to Customer Booking Form)
  const openBook = async (prefillReservation?: Reservation) => {
    if (!session || !selectedPlot) return;
    setActionLoading(true);
    setActionError(null);

    // Layer 1 Soft Lock acquisition
    const lockRes = await acquireLock(session, selectedPlot.id);
    if (!lockRes.ok) {
      let lockMsg = 'Failed to acquire booking lock. Please try again.';
      if (lockRes.error === 'LOCKED_BY_ANOTHER') {
        lockMsg = `Plot is currently locked by ${lockRes.lockedByName}. Please wait for lock expiration.`;
      } else if (lockRes.error === 'PLOT_UNDER_ADJUSTMENT') {
        lockMsg = 'This plot is frozen under Town Planning boundary adjustment and cannot be booked.';
      } else if (lockRes.error === 'PLOT_ALREADY_BOOKED') {
        lockMsg = 'This plot has already been booked and allocated to a member.';
      } else if (lockRes.error === 'AMENITY_NOT_SELLABLE') {
        lockMsg = 'Amenity utility plots cannot be booked or sold.';
      } else if (lockRes.error === 'OUT_OF_SCOPE') {
        lockMsg = 'You do not have administrative authority to book plots in this sector.';
      }
      setActionError(lockMsg);
      setActionLoading(false);
      return;
    }

    // Simplified Admin Booking Flow (Change Request 07 §5)
    if (session.role === 'sub_admin') {
      setMinimalForm({
        customerName: prefillReservation?.customerName || '',
        cnic: '',
        city: '',
        lockToken: lockRes.lockToken || '',
      });
      setIsMinimalBookModalOpen(true);
      setActionLoading(false);
      return;
    }

    const params = new URLSearchParams();
    params.set('plotId', selectedPlot.id);
    if (lockRes.lockToken) {
      params.set('lockToken', lockRes.lockToken);
    }
    params.set('returnBlock', blockId);
    if (prefillReservation) {
      params.set('reservationId', prefillReservation.id);
      params.set('customerName', prefillReservation.customerName);
      params.set('customerPhone', prefillReservation.customerPhone);
      params.set('customerEmail', prefillReservation.customerEmail);
    }
    router.push(`/admin/customers?${params.toString()}`);
  };

  if (outOfScope) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto bg-white border border-rose-300 rounded-3xl p-8 shadow-xl">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold font-serif text-slate-900 mb-2">
          Administrative Access Denied
        </h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          Access Restricted: Sector <strong className="text-slate-900 uppercase font-mono">{block?.name || blockId}</strong> is outside your assigned administrative authority. Administrators may view and manage assigned sectors only.
        </p>
        <Link
          href="/admin/master-plan"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-amber-200" />
          <span>Return to Master Plan Overview</span>
        </Link>
      </div>
    );
  }

  const canAccess = session?.role === 'super_admin' || Boolean(session?.permissions?.can_view_master_plan);
  if (session && !canAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Master Plan</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your administrative account does not have permission to view the society master plan. Contact administration to adjust your privileges.
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

  if (loading || !block || !session) {
    return <AdminMasterPlanSkeleton />;
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
            <span className="text-slate-800 font-bold">{block.name}</span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-3">
            <span>{block.name}</span>
            <span className="text-xs font-sans font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-0.5 rounded-full font-bold">
              {filteredPlots.length} Visible Plots
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">{block.description}</p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-64 lg:w-72 min-w-[200px] flex-1 sm:flex-initial">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plot number (e.g. 233, R-06)..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Groups & View Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-0.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shrink-0">
            {(['all', 'available', 'reserved', 'booked', 'allotted', 'disputed', 'adjustment'] as const).map((st) => {
              let activeColor = 'bg-slate-900 text-white shadow-xs';
              if (st === 'available') activeColor = 'bg-emerald-600 text-white shadow-xs';
              else if (st === 'reserved') activeColor = 'bg-amber-500 text-amber-950 shadow-xs';
              else if (st === 'booked') activeColor = 'bg-red-600 text-white shadow-xs'; // Red per user request
              else if (st === 'allotted') activeColor = 'bg-slate-950 text-white shadow-xs';
              else if (st === 'disputed') activeColor = 'bg-red-600 text-white shadow-xs';
              else if (st === 'adjustment') activeColor = 'bg-blue-600 text-white shadow-xs'; // Blue per adjustment freeze specification

              return (
                <button
                  key={st}
                  id={`status-filter-${st}`}
                  onClick={() => setStatusFilter(st)}
                  className={`h-7 px-2.5 sm:px-3 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    statusFilter === st
                      ? activeColor
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {st === 'disputed' && <AlertTriangle className="w-3 h-3 text-white" />}
                  {st === 'adjustment' && <span className="w-2 h-2 rounded-full bg-blue-200 inline-block" />}
                  <span>{st}</span>
                </button>
              );
            })}
          </div>

          {/* Category Filter - Custom Dropdown List */}
          <div className="relative shrink-0" ref={categoryDropdownRef}>
            <button
              type="button"
              id="category-filter-dropdown"
              onClick={() => setIsCategoryOpen((prev) => !prev)}
              className={`h-9 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                categoryFilter === 'residential'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/10'
                  : categoryFilter === 'commercial'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/10'
                  : categoryFilter === 'farm_house'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-500/10'
                  : categoryFilter === 'amenity'
                  ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-500/10'
                  : 'bg-slate-100/90 border-slate-200/80 text-slate-700 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
              aria-expanded={isCategoryOpen}
              aria-haspopup="listbox"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  categoryFilter === 'residential'
                    ? 'bg-blue-600'
                    : categoryFilter === 'commercial'
                    ? 'bg-indigo-600'
                    : categoryFilter === 'farm_house'
                    ? 'bg-amber-600'
                    : categoryFilter === 'amenity'
                    ? 'bg-purple-600'
                    : 'bg-slate-400'
                }`}
              />
              <span className="whitespace-nowrap">
                {categoryFilter === 'all'
                  ? 'Category: All'
                  : categoryFilter === 'residential'
                  ? 'Residential'
                  : categoryFilter === 'commercial'
                  ? 'Commercial'
                  : categoryFilter === 'farm_house'
                  ? 'Farm House'
                  : 'Public Amenity'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  isCategoryOpen ? 'rotate-180 text-slate-700' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Dropdown Menu List */}
            {isCategoryOpen && (
              <div
                role="listbox"
                id="category-options-list"
                className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  Plot Categories
                </div>
                {CATEGORY_OPTIONS.map((opt) => {
                  const isSelected = categoryFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      id={`cat-option-${opt.id}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setCategoryFilter(opt.id);
                        setIsCategoryOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-slate-100 text-slate-900 font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Traced Map / Card Grid Toggle (if block has traced map) */}
          {hasTraced && (
            <div className="flex items-center gap-0.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shrink-0">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Traced Map</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Card Grid</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Traced Map OR Plot Grid */}
      {hasTraced && viewMode === 'map' ? (
        <InteractiveBlockMap
          blockId={blockId}
          plots={plots}
          selectedPlot={selectedPlot}
          onSelectPlot={handleSelectPlot}
          searchFilter={search}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          focusPlotId={focusPlotId}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
        {filteredPlots.map((plot) => {
          const visualStatus = plot.displayStatus || plot.status;
          const isDisputed = Boolean(
            visualStatus === 'disputed' || plot.isDisputed || (plot.activeReservationCount && plot.activeReservationCount > 1)
          );
          const isAdjustment = Boolean(plot.isAdjustment);
          const isLocked = Boolean(plot.lockedBy);
          const isAmenity = plot.category === 'amenity';
          const isReserved = visualStatus === 'reserved';
          const isBooked = visualStatus === 'booked';
          const isAllotted = visualStatus === 'allotted';
          const isCommercialAvailable = plot.category === 'commercial' && visualStatus === 'available' && plot.status === 'available';
          const isAvailable = visualStatus === 'available' && !isAmenity && !isAdjustment;
          const isHighlighted = highlightedPlotId === plot.id;

          const reservingNames = (plot.reservingUsers && plot.reservingUsers.length > 0)
            ? plot.reservingUsers.map((u) => u.adminName.split(' ')[0])
            : plot.reservingByName
            ? [plot.reservingByName.split(' ')[0]]
            : [];
          const isReserving = !isLocked && !isReserved && !isBooked && !isAllotted && reservingNames.length > 0;

          let cardStyle = 'bg-white border-2 border-slate-200 text-slate-800';
          let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';

          if (isLocked) {
            cardStyle = 'bg-rose-50/95 border-2 border-rose-500 text-rose-950 shadow-xs animate-pulse';
            statusBadge = 'bg-rose-600 text-white border-rose-700 font-bold';
          } else if (isDisputed) {
            cardStyle = 'bg-red-50/90 border-2 border-red-500 text-red-950 shadow-xs animate-pulse hover:border-red-600';
            statusBadge = 'bg-red-600 text-white border-red-700 font-bold';
          } else if (isAdjustment) {
            cardStyle = 'bg-blue-50/90 border-2 border-blue-500 text-blue-950 shadow-xs hover:bg-blue-100/90 hover:border-blue-600';
            statusBadge = 'bg-blue-600 text-white border-blue-700 font-bold';
          } else if (isReserving) {
            cardStyle = 'bg-amber-50/90 border-2 border-amber-400 text-amber-950 shadow-xs animate-pulse hover:bg-amber-100/90 hover:border-amber-500';
            statusBadge = 'bg-amber-500 text-amber-950 border-amber-600 font-bold';
          } else if (isAmenity) {
            cardStyle = 'bg-slate-100/90 border-2 border-slate-300 text-slate-800 hover:bg-slate-200/90 hover:border-slate-400';
            statusBadge = 'bg-slate-700 text-white border-slate-800 font-bold';
          } else if (isCommercialAvailable) {
            cardStyle = 'bg-white border-2 border-slate-800 text-slate-900 hover:bg-slate-50';
            statusBadge = 'bg-slate-100 text-slate-900 border-slate-400 font-bold';
          } else if (isAllotted) {
            cardStyle = 'bg-slate-950 border-2 border-slate-800 text-white hover:bg-slate-900';
            statusBadge = 'bg-slate-900 text-white border-slate-700 font-bold';
          } else if (isReserved) {
            cardStyle = 'bg-amber-50/90 border-2 border-amber-400 text-amber-950 hover:bg-amber-100/90 hover:border-amber-500';
            statusBadge = 'bg-amber-500 text-amber-950 border-amber-600 font-bold';
          } else if (isBooked) {
            cardStyle = 'bg-rose-50/90 border-2 border-rose-400 text-rose-950 hover:bg-rose-100/80';
            statusBadge = 'bg-rose-600 text-white border-rose-700 font-bold';
          } else if (isAvailable) {
            cardStyle = 'bg-emerald-50/90 border-2 border-emerald-400 text-emerald-950 hover:bg-emerald-100/90 hover:border-emerald-500';
            statusBadge = 'bg-emerald-600 text-white border-emerald-700 font-bold';
          }

          if (isHighlighted) {
            cardStyle += ' ring-4 ring-yellow-400 ring-offset-2';
          }

          const catBadge = CATEGORY_COLORS[plot.category] || 'bg-slate-100 text-slate-700';

          return (
            <button
              key={plot.id}
              id={`plot-card-${plot.id}`}
              data-plot-id={plot.id}
              data-plot-number={plot.plotNumber}
              data-disputed={isDisputed ? 'true' : 'false'}
              onClick={() => handleSelectPlot(plot)}
              className={`p-3.5 rounded-2xl text-left transition-all hover:scale-[1.02] cursor-pointer relative group flex flex-col justify-between min-h-[120px] shadow-xs hover:shadow-md ${cardStyle}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono font-bold text-sm">
                    {plot.plotNumber}
                  </span>
                  <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-md border ${statusBadge}`}>
                    {isLocked
                      ? `Being booked by ${plot.lockedByName?.split(' ')[0] || 'Admin'}`
                      : isDisputed
                      ? (plot.activeReservationCount && plot.activeReservationCount > 1 ? `Disputed (${plot.activeReservationCount})` : 'Disputed')
                      : isAdjustment
                      ? 'adjustment'
                      : isReserving
                      ? `Being reserved by ${reservingNames.join(', ')}`
                      : isAmenity
                      ? 'Amenity'
                      : visualStatus === 'allotted'
                      ? 'Allotted'
                      : visualStatus === 'booked'
                      ? 'Booked'
                      : visualStatus === 'reserved'
                      ? 'Reserved'
                      : 'Available'}
                  </span>
                </div>

                <div className="text-[11px] font-semibold truncate mt-0.5">
                  {isAmenity ? plot.amenityName : plot.size}
                </div>

                {isDisputed && (
                  <div className="mt-1 text-[9px] font-bold text-fuchsia-900 bg-fuchsia-100/90 border border-fuchsia-300 rounded px-1.5 py-0.5 inline-block">
                    ⚠️ {plot.displayStatusReason || (plot.activeReservationCount && plot.activeReservationCount > 1 ? `${plot.activeReservationCount} competing claims — needs resolution` : 'Plot is disputed')}
                  </div>
                )}

                {isAdjustment && (
                  <div className="mt-1 text-[9px] font-bold text-blue-900 bg-blue-100/90 border border-blue-300 rounded px-1.5 py-0.5 inline-block lowercase">
                    adjustment
                  </div>
                )}

                {/* Category Pill */}
                <div className="mt-1">
                  <span className={`text-[8px] uppercase font-mono font-bold px-1.5 py-0.2 rounded border ${catBadge}`}>
                    {plot.category.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-black/5 flex items-center justify-between text-[10px]">
                <span className="font-mono font-bold">
                  {isAmenity ? 'Public Amenity' : `PKR ${(plot.price / 100000).toFixed(1)}M`}
                </span>
                {isLocked ? (
                  <span className="text-rose-700 font-mono text-[9px] font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{plot.lockedByName?.split(' ')[0]}</span>
                  </span>
                ) : isAdjustment ? (
                  <span className="text-blue-600 font-mono text-[9px] font-bold lowercase">
                    adjustment
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
      )}

      {/* Plot Detail Modal / Action Drawer */}
      {selectedPlot && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDrawer();
          }}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase font-bold text-emerald-800">
                    Sector: {block.name}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${CATEGORY_COLORS[selectedPlot.category]}`}>
                    {selectedPlot.category.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                  Plot {selectedPlot.plotNumber}
                </h3>
              </div>
              <button
                data-testid="close-drawer-btn"
                aria-label="Close plot details"
                onClick={handleCloseDrawer}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
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
              {selectedPlot.isAdjustment ? (
                <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl text-blue-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-blue-900">
                      <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="lowercase font-mono">adjustment</span>
                    </div>
                    <span className="text-[10px] bg-blue-600 text-white font-mono font-bold px-2 py-0.5 rounded-md lowercase">
                      adjustment
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    This plot has been flagged for town planning recalculation or boundary re-survey. 
                    <strong> New reservations and bookings are strictly prohibited.</strong>
                  </p>
                  {selectedPlot.adjustmentReason && (
                    <div className="text-[11px] bg-white/90 border border-blue-200 rounded-xl p-2.5 font-medium">
                      <strong className="text-blue-950">Adjustment Note:</strong> {selectedPlot.adjustmentReason}
                    </div>
                  )}
                  {selectedPlot.adjustmentBy && (
                    <div className="text-[10px] text-blue-600 font-mono">
                      Flagged by: {selectedPlot.adjustmentBy} {selectedPlot.adjustmentDate ? `• ${new Date(selectedPlot.adjustmentDate).toLocaleDateString()}` : ''}
                    </div>
                  )}
                </div>
              ) : selectedPlot.lockedBy ? (
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
              ) : ((selectedPlot.reservingUsers && selectedPlot.reservingUsers.length > 0) || selectedPlot.reservingByName) && selectedPlot.status !== 'reserved' && selectedPlot.status !== 'booked' ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-amber-900">
                    <BookmarkCheck className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-bold text-xs">Reserve Form In Progress</div>
                      <div className="text-[11px] text-amber-800">
                        Being reserved by:{' '}
                        <strong>
                          {selectedPlot.reservingUsers && selectedPlot.reservingUsers.length > 0
                            ? selectedPlot.reservingUsers.map((u) => u.adminName.split(' ')[0]).join(', ')
                            : (selectedPlot.reservingByName?.split(' ')[0] || 'Admin')}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    Non-blocking
                  </span>
                </div>
              ) : selectedPlot.category === 'amenity' ? (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-950">
                  <div className="font-bold text-sm text-purple-900">
                    Non-Sellable Society Amenity: {selectedPlot.amenityName}
                  </div>
                  <p className="text-[11px] mt-1 text-purple-800">
                    This property is reserved for public utility and cannot be booked or reserved.
                  </p>
                </div>
              ) : null}

              {/* Dispute Warning Banner in Drawer */}
              {((selectedPlot.displayStatus || selectedPlot.status) === 'disputed' || selectedPlot.isDisputed || (selectedPlot.activeReservationCount && selectedPlot.activeReservationCount > 1)) && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Disputed Plot</span>
                    </div>
                    <span className="text-[10px] bg-rose-600 text-white font-mono font-bold px-2 py-0.5 rounded-md uppercase">
                      disputed
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
                    {selectedPlot.displayStatusReason || (
                      selectedPlot.activeReservationCount && selectedPlot.activeReservationCount > 1
                        ? `${selectedPlot.activeReservationCount} competing reservations — needs resolution.`
                        : 'Plot is currently marked as disputed.'
                    )}
                  </p>
                </div>
              )}

              {/* Plot Specs */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Plot Size</span>
                  <div className="text-sm font-bold text-slate-900">{selectedPlot.size}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Official Price</span>
                  {isEditingPrice ? (
                    <div className="mt-1 space-y-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-bold text-slate-500">PKR</span>
                        <input
                          type="number"
                          min={100000}
                          step={50000}
                          value={newPriceInput}
                          onChange={(e) => setNewPriceInput(e.target.value)}
                          className="w-28 px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-emerald-400 rounded-lg focus:outline-hidden"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleSavePrice}
                          disabled={priceSaving}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md cursor-pointer"
                        >
                          {priceSaving ? '...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingPrice(false)}
                          className="px-1.5 py-0.5 text-slate-500 hover:text-slate-800 text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-emerald-800 font-mono">
                        {selectedPlot.price > 0 ? `PKR ${selectedPlot.price.toLocaleString()}` : 'Society Amenity'}
                      </span>
                      {session?.role === 'super_admin' && selectedPlot.price > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewPriceInput(String(selectedPlot.price));
                            setIsEditingPrice(true);
                          }}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Current Status</span>
                  <div className="text-sm font-bold capitalize text-slate-900 flex items-center gap-1.5 flex-wrap">
                    <span>{selectedPlot.displayStatus || selectedPlot.status}</span>
                    {selectedPlot.displayStatus && selectedPlot.displayStatus !== selectedPlot.status && (
                      <span className="text-[10px] font-mono text-rose-600 font-normal">
                        (stored: {selectedPlot.status})
                      </span>
                    )}
                  </div>
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
                      className="bg-amber-50/80 border border-amber-200/90 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xs transition-all hover:bg-amber-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">
                          {idx + 1}. {res.customerName}
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                          Token: <strong className="text-slate-900 font-bold">PKR {res.tokenFee.toLocaleString()}</strong> • {res.customerPhone}
                        </div>
                        {res.validUntil && (() => {
                          const hold = formatRemainingHoldTime(res.validUntil);
                          return (
                            <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                              <span>Hold: <strong className="text-slate-800">{new Date(res.validUntil).toLocaleDateString()}</strong></span>
                              <span>•</span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                                hold.isExpired
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : hold.isUrgent
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                <Clock className="w-2.5 h-2.5" />
                                <span>{hold.text}</span>
                              </span>
                            </div>
                          );
                        })()}
                        {res.resolutionNote && (
                          <div className="text-[10px] text-amber-900/90 italic mt-1.5 bg-white/90 px-2.5 py-1 rounded-lg border border-amber-200 leading-snug break-words">
                            Note: {res.resolutionNote}
                          </div>
                        )}
                      </div>

                      {/* Convert / Release Actions */}
                      <div className="shrink-0 flex items-center gap-2">
                        {session?.permissions.can_reserve && (
                          <button
                            type="button"
                            onClick={() => handleReleaseReservation(res)}
                            disabled={actionLoading}
                            className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 font-bold text-xs rounded-xl border transition-all cursor-pointer shadow-2xs whitespace-nowrap disabled:opacity-50 ${
                              res.reservedByAdminId === session.adminId || session.role === 'super_admin'
                                ? 'bg-white hover:bg-rose-50 active:bg-rose-100 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-300'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                            title={
                              res.reservedByAdminId === session.adminId
                                ? 'Release your reservation back to society inventory'
                                : session.role === 'super_admin'
                                ? `Super Admin Override: Release ${res.reservedByAdminName}'s reservation`
                                : `Only reserving admin (${res.reservedByAdminName}) can release`
                            }
                          >
                            {res.reservedByAdminId !== session.adminId && session.role !== 'super_admin' ? (
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
                            )}
                            <span>Release</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openBook(res)}
                          disabled={actionLoading}
                          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap min-w-[135px] disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-200" />
                          <span>Confirm Booking</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Allocated Member Card for Booked Plot */}
              {selectedPlot.status === 'booked' && (() => {
                const booking = selectedPlotBooking;
                const bookedCustomer = selectedPlotOwner;
                
                if (bookedCustomer?.registrationStatus === 'minimal') {
                  return (
                    <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-4 h-4 text-amber-600" />
                          Booked (Pending Formalities)
                        </span>
                        <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-2.5 py-0.5 rounded-full font-mono border border-amber-400">
                          Needs Registration
                        </span>
                      </div>
                      <div className="space-y-1.5 pt-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900">{bookedCustomer.fullName}</span>
                          <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                            MEMBERSHIP PENDING
                          </span>
                        </div>
                        <div className="text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>🪪 CNIC: <strong className="text-slate-800 font-mono">{bookedCustomer.cnic}</strong></span>
                          <span>📍 City: <strong className="text-slate-800">{bookedCustomer.city || bookedCustomer.mailingAddress}</strong></span>
                        </div>
                        
                        {session?.role === 'super_admin' && (
                          <div className="pt-2"> 
                            <Link
                              href={`/admin/customers?completeCustomer=${bookedCustomer.id}`}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>Complete Member Registration (Super Admin)</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-rose-600" />
                        Allocated Society Member
                      </span>
                      <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded-full font-mono">
                        Booked
                      </span>
                    </div>
                    {bookedCustomer ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900">{bookedCustomer.fullName}</span>
                          <span className="text-xs font-mono font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                            {bookedCustomer.membershipNo}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>📞 {bookedCustomer.phone}</span>
                          <span>✉️ {bookedCustomer.email}</span>
                        </div>
                        {booking && (
                          <div className="text-[11px] text-slate-500 font-mono pt-1.5 border-t border-rose-200/60 flex items-center justify-between">
                            <span>Booked on: {new Date(booking.bookingDate).toLocaleDateString()}</span>
                            <span className="capitalize">Plan: {booking.paymentType.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600">Member details linked to active booking record.</div>
                    )}
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-3">
                {selectedPlot.isAdjustment ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center text-xs font-bold text-blue-900 flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Plot Operations Locked Under Boundary Re-survey Freeze</span>
                  </div>
                ) : selectedPlot.category !== 'amenity' && selectedPlot.status !== 'booked' && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={openReserve}
                      disabled={actionLoading}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center shadow-xs whitespace-nowrap"
                    >
                      <BookmarkCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Reserve Plot (Token)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openBook()}
                      disabled={actionLoading || Boolean(selectedPlot.lockedBy && selectedPlot.lockedBy !== session.adminId)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center disabled:opacity-50 whitespace-nowrap"
                    >
                      <Lock className="w-4 h-4 text-emerald-200 shrink-0" />
                      <span>Lock & Book Now</span>
                    </button>
                  </div>
                )}

                {/* Super Admin Master Plan Adjustment Controls */}
                {session?.role === 'super_admin' && (
                  <div className="pt-2 border-t border-slate-200">
                    {selectedPlot.isAdjustment ? (
                      <button
                        type="button"
                        onClick={handleReleaseAdjustment}
                        disabled={actionLoading}
                        className="w-full py-2.5 px-3 bg-white hover:bg-blue-50 border-2 border-blue-400 text-blue-800 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-4 h-4 text-blue-600" />
                        <span>Release Master Plan Adjustment Freeze</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAdjustmentModalOpen(true)}
                        disabled={actionLoading}
                        className="w-full py-2 px-3 bg-slate-100 hover:bg-blue-50 border border-slate-300 hover:border-blue-300 text-slate-700 hover:text-blue-900 font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                        <span>Adjustment</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reserve Plot Modal */}
      {isReserveModalOpen && selectedPlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-amber-600" />
                <span>Reserve Plot {selectedPlot.plotNumber}</span>
              </h3>
              <button
                onClick={closeReserveModal}
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Admin-Adjustable Token Fee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-800 mb-1 font-bold">
                    Token Fee (PKR) • Editable
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    required
                    value={reserveForm.tokenFee}
                    onChange={(e) => setReserveForm({ ...reserveForm, tokenFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-amber-50/80 border border-amber-300 rounded-xl text-amber-950 font-mono font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">Hold Duration (Days)</label>
                    <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Default: 1 day (24h)
                    </span>
                  </div>
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
                  onClick={closeReserveModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {actionLoading ? 'Filing...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Town Planning / Boundary Re-survey Freeze Modal (Super Admin Only) */}
      {isAdjustmentModalOpen && selectedPlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                <span>Town Planning Adjustment Freeze</span>
              </h3>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Flagging Plot <strong className="text-slate-900 font-mono">{selectedPlot.plotNumber}</strong> will immediately lock this plot under a Town Planning / Boundary Re-survey Freeze. All reservations, bookings, and customer allocations will be frozen until released by Super Administration.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApplyAdjustment();
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Freeze / Adjustment Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjustmentReasonInput}
                  onChange={(e) => setAdjustmentReasonInput(e.target.value)}
                  placeholder="e.g. Boundary realignment following road expansion or survey audit..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                ℹ️ <strong>Authority:</strong> Only Super Admins can toggle this freeze. Administrators will see this plot marked in vibrant blue and will be prohibited from creating tokens or bookings.
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !adjustmentReasonInput.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Flagging...' : 'Confirm Freeze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Minimal Booking Modal (Change Request 07 §5) */}
      {isMinimalBookModalOpen && selectedPlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Quick Booking: Plot {selectedPlot.plotNumber}</span>
              </h3>
              <button
                onClick={closeMinimalBookModal}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Auto-filled plot info banner */}
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Sector</span>
                <span className="font-bold text-slate-800">{block.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Plot Number</span>
                <span className="font-mono font-bold text-emerald-800">{selectedPlot.plotNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Size</span>
                <span className="font-bold text-slate-800">{selectedPlot.size}</span>
              </div>
            </div>

            

            <form onSubmit={handleMinimalBookSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Customer Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={minimalForm.customerName}
                  onChange={(e) => setMinimalForm({ ...minimalForm, customerName: e.target.value })}
                  placeholder="e.g. Hamza Tariq"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Customer CNIC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={minimalForm.cnic}
                  onChange={(e) => setMinimalForm({ ...minimalForm, cnic: e.target.value })}
                  placeholder="37405-1234567-1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={minimalForm.city}
                  onChange={(e) => setMinimalForm({ ...minimalForm, city: e.target.value })}
                  placeholder="e.g. Lahore, Rawalpindi, Islamabad"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeMinimalBookModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !minimalForm.customerName.trim() || !minimalForm.cnic.trim() || !minimalForm.city.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Booking...' : 'Confirm Quick Booking'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlockPlotsPage() {
  return (
    <Suspense fallback={<AdminMasterPlanSkeleton />}>
      <BlockPlotsContent />
    </Suspense>
  );
}
