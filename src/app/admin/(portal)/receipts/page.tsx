'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Building2,
  CreditCard,
  Printer,
  ExternalLink,
  Receipt,
  FileText,
  Lock,
  Loader2,
} from 'lucide-react';
import { AdminSession, ReceiptSubmission, ReceiptStatus } from '@/lib/mock/types';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getAdminReceipts, verifyReceipt, rejectReceipt, getReceiptFileUrl, cancelReceipt } from '@/lib/dal/receipts';
import { AdminTableSkeleton } from '@/components/ui/skeleton';
import { getCache, setCache, reconcileItems } from '@/lib/dal/apiCache';
import { AdminTableShell } from '@/components/admin/table/AdminTableShell';
import { runLane1, runLane2, enqueueLane2 } from '@/lib/requestLanes';
import { AdminActionToast } from '@/components/admin/AdminActionToast';
import { toSafeErrorMessage } from '@/lib/safeError';

const PAGE_SIZE = 10;

import {
  OfficialA4PaymentSlip,
  buildSlipDataFromSubmission,
} from '@/components/receipts/OfficialA4PaymentSlip';

export default function AdminReceiptsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [receipts, setReceipts] = useState<ReceiptSubmission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | ReceiptStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [activeSlip, setActiveSlip] = useState<ReceiptSubmission | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cardSlipErrors, setCardSlipErrors] = useState<Record<string, string>>({});
  const [rejectModalReceipt, setRejectModalReceipt] = useState<ReceiptSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignStrike, setAssignStrike] = useState(false);
  const [strikeReason, setStrikeReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingPhotoReceiptId, setLoadingPhotoReceiptId] = useState<string | null>(null);
  const [bottomNotice, setBottomNotice] = useState<{
    id: string;
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  // Drift modal state
  const [driftReceipt, setDriftReceipt] = useState<ReceiptSubmission | null>(null);
  const [driftNewPreview, setDriftNewPreview] = useState<any>(null);

  // Action in-progress states
  const [approvingReceiptId, setApprovingReceiptId] = useState<string | null>(null);
  const [approvedSuccessId, setApprovedSuccessId] = useState<string | null>(null);
  const [decliningReceiptId, setDecliningReceiptId] = useState<string | null>(null);
  const [rejectModalError, setRejectModalError] = useState<string | null>(null);

  // Cancel modal state (super_admin only)
  const [cancelModalReceipt, setCancelModalReceipt] = useState<ReceiptSubmission | null>(null);
  const [cancelReasonCode, setCancelReasonCode] = useState<'administrative_error' | 'duplicate_receipt'>('administrative_error');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelConfirmed, setCancelConfirmed] = useState(false);

  const reqIdRef = React.useRef(0);
  const [searchInput, setSearchInput] = useState('');

  const pageRef = React.useRef(page);
  const statusRef = React.useRef(statusFilter);
  const searchRef = React.useRef(searchQuery);
  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { statusRef.current = statusFilter; }, [statusFilter]);
  useEffect(() => { searchRef.current = searchQuery; }, [searchQuery]);

  // Bottom notice auto-clear
  useEffect(() => {
    if (bottomNotice && bottomNotice.type === 'success') {
      const t = setTimeout(() => {
        setBottomNotice((curr) => (curr?.type === 'success' ? null : curr));
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [bottomNotice]);

  // Escape key listener to close Bank Slip image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewImage) {
        setPreviewImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);

  const loadData = useCallback(
    async (
      currentSession: AdminSession,
      p = 1,
      st: 'all' | ReceiptStatus = 'pending',
      search = '',
      isBackground = false
    ) => {
      const isSuper = currentSession.role === 'super_admin';
      const hasAuth = Boolean(currentSession.permissions?.can_verify_receipts);

      if (!isSuper && !hasAuth) {
        setLoading(false);
        return;
      }

      const adminId = currentSession.adminId || 'admin';
      const cacheKey = `/receipts:${adminId}:page=${p}:size=${PAGE_SIZE}:status=${st}:search=${search || ''}`;

      if (!isBackground) {
        const cached = getCache<{ receipts: ReceiptSubmission[], totalCount: number }>(cacheKey, true);
        if (cached) {
          setReceipts(cached.receipts);
          setTotalCount(cached.totalCount);
          setLoading(false);
        } else {
          setLoading(true);
        }
      }

      const currentReq = ++reqIdRef.current;
      const fetcher = async (signal?: AbortSignal) => {
        return await getAdminReceipts(currentSession, st, p, PAGE_SIZE, search, signal);
      };
      
      try {
        let res: any;
        if (isBackground) {
          res = await runLane2({
            screen: 'receipts',
            key: cacheKey,
            isRefresh: true,
            fn: fetcher,
          });
        } else {
          res = await runLane1({
            screen: 'receipts',
            key: cacheKey,
            fn: fetcher,
          });
        }

        if (!res || currentReq !== reqIdRef.current || st !== statusRef.current) return;
        if (res.error === 'REQUEST_ABORTED') return;

        if (res.ok) {
          setReceipts(res.receipts || []);
          setTotalCount(res.totalCount || 0);
          setCache(cacheKey, { receipts: res.receipts || [], totalCount: res.totalCount || 0 });

          // Prefetch next page into cache if next page exists using Lane 2
          const totalPages = Math.ceil((res.totalCount || 0) / PAGE_SIZE);
          if (p < totalPages && (isSuper || hasAuth)) {
            const nextP = p + 1;
            const nextKey = `/receipts:${adminId}:page=${nextP}:size=${PAGE_SIZE}:status=${st}:search=${search || ''}`;
            if (!getCache(nextKey, false)) {
              enqueueLane2(
                async (signal) => {
                  const nextRes = await getAdminReceipts(currentSession, st, nextP, PAGE_SIZE, search, signal);
                  if (nextRes.ok) {
                    setCache(nextKey, { receipts: nextRes.receipts || [], totalCount: nextRes.totalCount || 0 });
                  }
                  return nextRes;
                },
                nextKey,
                'receipts'
              );
            }
          }
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
    },
    []
  );

  const handleStatusFilterChange = (newStatus: 'all' | ReceiptStatus) => {
    if (newStatus === statusFilter) return;
    setStatusFilter(newStatus);
    statusRef.current = newStatus;
    setPage(1);
    const s = session || getActiveAdminSession();
    if (s) {
      const adminId = s.adminId || 'admin';
      const cacheKey = `/receipts:${adminId}:page=1:size=${PAGE_SIZE}:status=${newStatus}:search=${searchInput || ''}`;
      const cached = getCache<{ receipts: ReceiptSubmission[], totalCount: number }>(cacheKey, true);
      if (cached) {
        setReceipts(cached.receipts);
        setTotalCount(cached.totalCount);
        setLoading(false);
      } else {
        setReceipts([]);
        setLoading(true);
      }
      loadData(s, 1, newStatus, searchInput, false);
    }
  };

  // Search input debounce (fires once per search change)
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== searchRef.current) {
        setSearchQuery(searchInput);
        setPage(1);
        if (session) {
          loadData(session, 1, statusRef.current, searchInput, false);
        }
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, session, loadData]);

  useEffect(() => {
    setMounted(true);
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);
    loadData(cur, 1, 'pending', '', false);

    // Auto-refresh via polling using Lane 2
    const intervalId = setInterval(() => {
      const latestSession = getActiveAdminSession();
      if (latestSession && searchRef.current === '' && statusRef.current === 'pending') {
        loadData(latestSession, pageRef.current, statusRef.current, '', true);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [router, loadData]);

  // Flash feedback auto-clear
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4500);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const handleViewSlipImage = async (receiptId: string) => {
    setLoadingPhotoReceiptId(receiptId);
    setCardSlipErrors((prev) => {
      const next = { ...prev };
      delete next[receiptId];
      return next;
    });
    try {
      const res = await runLane1({
        screen: 'receipt-slip',
        fn: async (signal) => getReceiptFileUrl(receiptId, signal),
      });
      if (res.ok && res.fileUrl) {
        setPreviewImage(res.fileUrl);
      } else {
        const errorMsg = toSafeErrorMessage(res.error || 'Bank slip file is missing or inaccessible from storage.');
        setCardSlipErrors((prev) => ({ ...prev, [receiptId]: errorMsg }));
        setBottomNotice({
          id: receiptId,
          type: 'error',
          message: errorMsg,
        });
      }
    } catch (err: any) {
      if (err?.message !== 'REQUEST_SUPERSEDED') {
        const errorMsg = err?.message || 'Storage link failed or bank slip is inaccessible.';
        setCardSlipErrors((prev) => ({ ...prev, [receiptId]: errorMsg }));
        setBottomNotice({
          id: receiptId,
          type: 'error',
          message: errorMsg,
        });
      }
    } finally {
      setLoadingPhotoReceiptId(null);
    }
  };

  // Map of active idempotency keys per receipt verification action
  const idempotencyKeysRef = React.useRef<Map<string, string>>(new Map());

  const handleVerify = async (receiptId: string, confirmPreviewDrift = false) => {
    if (!session || approvingReceiptId || decliningReceiptId) return;
    setApprovingReceiptId(receiptId);

    // Reuse existing key if retrying this approval click; otherwise generate a new UUID once per click
    let idempotencyKey = idempotencyKeysRef.current.get(receiptId);
    if (!idempotencyKey) {
      idempotencyKey = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      idempotencyKeysRef.current.set(receiptId, idempotencyKey);
    }

    try {
      const res = await runLane1({
        screen: 'receipts',
        isSave: true,
        fn: async () => verifyReceipt(session, receiptId, undefined, confirmPreviewDrift, idempotencyKey),
      });
      if (res.ok && res.receipt) {
        idempotencyKeysRef.current.delete(receiptId);
        setApprovedSuccessId(receiptId);
        const slipNumber = res.receipt.slip?.slipNumber || (res.receipt as any).slipNumber || 'PV-SLIP';
        setBottomNotice({
          id: receiptId,
          type: 'success',
          message: `Official Slip #${slipNumber} was generated successfully!`,
        });

        // Update the card immediately from the server's answer
        setReceipts((prev) =>
          prev.map((r) => (r.id === receiptId ? { ...r, ...res.receipt, status: 'verified' as const } : r))
        );

        setDriftReceipt(null);
        setDriftNewPreview(null);
        setActiveSlip(res.receipt);

        // Refresh receipt list in the background
        loadData(session, pageRef.current, statusRef.current, searchRef.current, true);
      } else {
        if (res.error === 'PREVIEW_DRIFT') {
          setBottomNotice(null);
          const rec = receipts.find((r) => r.id === receiptId);
          if (rec) {
            setDriftReceipt(rec);
            setDriftNewPreview(res.newPreview);
          }
        } else {
          const errMessage = toSafeErrorMessage(res.message || res.error || 'Failed to verify receipt.');
          setBottomNotice({
            id: receiptId,
            type: 'error',
            message: errMessage,
          });
        }
      }
    } catch (err: any) {
      if (err?.message !== 'REQUEST_SUPERSEDED') {
        setBottomNotice({
          id: receiptId,
          type: 'error',
          message: err?.message || 'An unexpected error occurred during verification.',
        });
      }
    } finally {
      setApprovingReceiptId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !rejectModalReceipt || approvingReceiptId || decliningReceiptId) return;

    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setRejectModalError('Please specify the reason for declining.');
      return;
    }

    const targetId = rejectModalReceipt.id;
    const memberName = rejectModalReceipt.customerName || (rejectModalReceipt as any).customer?.fullName || 'Member';
    const plotNumber = rejectModalReceipt.plotNumber || (rejectModalReceipt as any).plot?.plotNumber || '';

    setDecliningReceiptId(targetId);
    setRejectModalError(null);

    try {
      const res = await runLane1({
        screen: 'receipts',
        isSave: true,
        fn: async () => rejectReceipt(session, targetId, {
          reason: trimmedReason,
          assignStrike,
          strikeReason: strikeReason.trim() || trimmedReason,
        }),
      });

      if (res.ok) {
        const strikeMsg = res.strikeAssigned ? ' A compliance strike was assigned to the member.' : '';
        const successMsg = `Receipt for ${memberName}${plotNumber ? ` and Plot ${plotNumber}` : ''} was declined.${strikeMsg}`;
        
        // Show one notice and update card immediately from server's answer
        setBottomNotice({
          id: targetId,
          type: 'success',
          message: successMsg,
        });

        // The card leaves Pending Verification and shows Declined, with the reason on the card
        setReceipts((prev) =>
          prev.map((r) =>
            r.id === targetId
              ? {
                  ...r,
                  status: 'rejected' as const,
                  rejectionReason: trimmedReason,
                  customerStrikeCount: res.strikeAssigned
                    ? ((r as any).customerStrikeCount ?? (r as any).customer?.strikeCount ?? 0) + 1
                    : ((r as any).customerStrikeCount ?? (r as any).customer?.strikeCount ?? 0),
                }
              : r
          )
        );

        // Close decline modal window
        setRejectModalReceipt(null);
        setRejectionReason('');
        setAssignStrike(false);
        setStrikeReason('');
        setRejectModalError(null);

        // Refresh receipt list in background
        loadData(session, pageRef.current, statusRef.current, searchRef.current, true);
      } else {
        const errMsg = toSafeErrorMessage(res.message || res.error || 'Failed to decline receipt.');
        setRejectModalError(errMsg);
        setBottomNotice({
          id: targetId,
          type: 'error',
          message: errMsg,
        });
      }
    } catch (err: any) {
      if (err?.message !== 'REQUEST_SUPERSEDED') {
        const errMsg = toSafeErrorMessage(err?.message || 'Something went wrong. Please try again.');
        setRejectModalError(errMsg);
        setBottomNotice({
          id: targetId,
          type: 'error',
          message: errMsg,
        });
      }
    } finally {
      setDecliningReceiptId(null);
    }
  };

  const handleCancelReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !cancelModalReceipt || !cancelReason.trim() || !cancelConfirmed) return;
    setIsProcessing(true);
    const newIdempotencyKey = `cancel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    try {
      const res = await cancelReceipt(
        session,
        cancelModalReceipt.id,
        {
          reasonCode: cancelReasonCode,
          reason: cancelReason.trim(),
        },
        newIdempotencyKey
      );
      if (res.ok) {
        setCancelModalReceipt(null);
        setCancelReason('');
        setCancelConfirmed(false);
        setBottomNotice({
          id: cancelModalReceipt.id,
          type: 'success',
          message: `Receipt ${cancelModalReceipt.slipNumber || cancelModalReceipt.id} cancelled successfully.`,
        });
        loadData(session, pageRef.current, statusRef.current, searchRef.current, true);
      } else {
        setBottomNotice({
          id: cancelModalReceipt.id,
          type: 'error',
          message: res.message || 'Failed to cancel receipt.',
        });
      }
    } catch (err: any) {
      setBottomNotice({
        id: cancelModalReceipt.id,
        type: 'error',
        message: err?.message || 'Error cancelling receipt.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPKR = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount);

  if (!mounted || !session) {
    return null;
  }

  // Authorization Guard (Receipt Verification Authority)
  const isSuper = session?.role === 'super_admin';
  const hasAuth = Boolean(session?.permissions?.can_verify_receipts);

  if (!isSuper && !hasAuth) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">
          Access Restricted: Receipt Verification Authority Required
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your administrative profile does not have the <strong>Receipt Verification Authority</strong>. You cannot review customer deposit slips or generate official society slips.
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

  // Filter receipts is now handled by the server
  const filteredReceipts = receipts;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (session) {
      loadData(session, newPage, statusFilter);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Action Toast Feedback Popup */}
      <AdminActionToast feedback={feedback} onClose={() => setFeedback(null)} />

      {/* Header section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-serif tracking-tight flex items-center gap-2">
              <span>Receipt Verification Desk</span>
            </h1>
            <p className="text-xs text-slate-500">
              Verify customer bank deposit slips, sync ledgers to Paid, and generate two-part official A4 slips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Receipt Verification Authority: Active</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="receipt-filter-pending"
            type="button"
            onClick={() => handleStatusFilterChange('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </button>

          <button
            id="receipt-filter-verified"
            type="button"
            onClick={() => handleStatusFilterChange('verified')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'verified'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified &amp; Issued</span>
          </button>

          <button
            id="receipt-filter-rejected"
            type="button"
            onClick={() => handleStatusFilterChange('rejected')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Declined</span>
          </button>

          <button
            id="receipt-filter-cancelled"
            type="button"
            onClick={() => handleStatusFilterChange('cancelled')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'cancelled'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </button>

          <button
            id="receipt-filter-all"
            type="button"
            onClick={() => handleStatusFilterChange('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Submissions</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-auto sm:min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search member, plot, slip #..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-600"
          />
        </div>
      </div>

      {/* Receipts List */}
      <AdminTableShell page={page} pageSize={PAGE_SIZE} total={totalCount} onPageChange={handlePageChange} isTable={false} loading={loading}>
      <div className="space-y-4">
        {loading && filteredReceipts.length === 0 ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-36 bg-slate-200 rounded" />
                  <div className="h-4 w-20 bg-slate-100 rounded" />
                  <div className="h-4 w-28 bg-slate-100 rounded" />
                </div>
                <div className="h-4 w-64 bg-slate-100 rounded" />
                <div className="h-4 w-48 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-serif font-bold text-base text-slate-800">
              No Receipts in this Queue
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There are currently no customer payment receipt submissions matching your selected filter.
            </p>
          </div>
        ) : (
          filteredReceipts.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs hover:border-teal-600/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 overflow-hidden"
            >
              {/* Left Details */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-serif font-bold text-base text-slate-900">
                    {sub.customerName}
                  </span>
                  <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                    {sub.membershipNo}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="font-bold text-xs text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    Plot {sub.plotNumber} ({sub.blockName})
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {sub.paymentType === 'installment'
                      ? `Installment #${sub.installmentNumber}`
                      : 'Full Payment Settlement'}
                  </span>
                  {sub.paymentType === 'one_time' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                      Record Only &bull; Settled
                    </span>
                  )}
                  {(sub as any).paymentKind === 'balloon' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-sm">
                      Balloon Payment
                    </span>
                  )}

                  {/* Status chip */}
                  {sub.status === 'verified' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified</span>
                    </span>
                  ) : sub.status === 'cancelled' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-slate-500" />
                      <span>Cancelled</span>
                    </span>
                  ) : sub.status === 'replaced' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-purple-600" />
                      <span>Replaced</span>
                    </span>
                  ) : sub.status === 'payment_reversed' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      <span>Payment reversed</span>
                    </span>
                  ) : sub.status === 'rejected' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-200 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span>Declined</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Pending Verification</span>
                    </span>
                  )}

                  {/* Member Strike System Badge */}
                  {(() => {
                    const strikeCount = (sub as any).customer?.strikeCount ?? sub.customerStrikeCount ?? 0;
                    const accountStatus = (sub as any).customer?.accountStatus || 'active';
                    return (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
                          strikeCount >= 3
                            ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse'
                            : strikeCount > 0
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                        title={`${strikeCount} of 3 maximum compliance strikes assigned`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>{strikeCount}/3 Strikes</span>
                        {accountStatus === 'suspended' && (
                          <span className="text-rose-700 font-extrabold ml-1">(Suspended)</span>
                        )}
                      </span>
                    );
                  })()}
                </div>

                {/* Financial details row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Deposited Amount
                    </span>
                    <span className="font-serif font-bold text-sm text-emerald-800">
                      {formatPKR(sub.amount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Depository Bank
                    </span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {sub.depositoryBank || sub.bankName || 'Meezan Bank Ltd'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Bank Ref / Challan
                    </span>
                    <span className="font-mono font-bold text-slate-800">{sub.transactionRef}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Deposit Date
                    </span>
                    <span className="text-slate-700">{sub.paymentDate ? String(sub.paymentDate).split('T')[0] : '—'}</span>
                  </div>
                </div>

                {/* Prior Compliance Strikes History Snippet */}
                {(() => {
                  const strikes = (sub as any).customer?.strikeHistory || sub.customerStrikeHistory || [];
                  if (strikes.length === 0) return null;
                  return (
                    <div className="bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Prior Compliance Strikes ({strikes.length}/3):</span>
                      </div>
                      <div className="text-[10px] text-amber-800 space-y-0.5 pl-5">
                        {strikes.slice(-2).map((st: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="font-mono text-slate-500">[{st.assignedAt.split('T')[0]}]</span>
                            <span className="font-semibold text-slate-900">{st.reason}</span>
                            <span className="text-slate-500 font-mono">(Admin: {st.assignedBy})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Verification metadata or rejection reason */}
                {sub.status === 'verified' && sub.slip && (
                  <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap bg-emerald-50/50 border border-emerald-100 px-3 py-2 rounded-xl">
                    <span className="font-mono font-bold text-emerald-900">
                      Slip #{sub.slip.slipNumber}
                    </span>
                    <span>&bull;</span>
                    <span>Security Hash: <code className="text-[10px]">{sub.slip.securityHash}</code></span>
                    <span>&bull;</span>
                    <span>Verified by: <strong>{sub.verifiedByAdminName}</strong></span>
                  </div>
                )}

                {sub.status === 'rejected' && sub.rejectionReason && (
                  <div className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <strong>Rejection Reason:</strong> {sub.rejectionReason}
                  </div>
                )}

                {cardSlipErrors[sub.id] && (
                  <div className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Bank Slip Notice:</strong> {cardSlipErrors[sub.id]}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Action buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2 w-full lg:w-auto shrink-0">
                {/* View attached slip thumbnail */}
                {(sub.hasPhoto !== false || Boolean(sub.receiptFileUrl)) && (
                  <button
                    type="button"
                    disabled={loadingPhotoReceiptId === sub.id}
                    onClick={() => handleViewSlipImage(sub.id)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] min-w-[175px]"
                  >
                    {loadingPhotoReceiptId === sub.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin shrink-0" />
                        <span>Opening slip…</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>View Bank Slip Image</span>
                      </>
                    )}
                  </button>
                )}

                {sub.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={
                        approvingReceiptId === sub.id ||
                        decliningReceiptId === sub.id ||
                        approvedSuccessId === sub.id ||
                        Boolean(approvingReceiptId) ||
                        Boolean(decliningReceiptId)
                      }
                      onClick={() => handleVerify(sub.id)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-75 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] min-w-[110px]"
                    >
                      {approvingReceiptId === sub.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span>Saving…</span>
                        </>
                      ) : approvedSuccessId === sub.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                          <span>Success!</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Approve</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={
                        approvingReceiptId === sub.id ||
                        decliningReceiptId === sub.id ||
                        Boolean(approvingReceiptId) ||
                        Boolean(decliningReceiptId)
                      }
                      onClick={() => {
                        if (approvingReceiptId || decliningReceiptId) return;
                        setRejectModalReceipt(sub);
                        setRejectionReason('');
                        setAssignStrike(false);
                        setStrikeReason('');
                        setRejectModalError(null);
                      }}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-75 disabled:cursor-not-allowed text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[44px] min-w-[95px]"
                    >
                      {decliningReceiptId === sub.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-rose-600 animate-spin shrink-0" />
                          <span>Declining…</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5 shrink-0" />
                          <span>Decline</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {sub.status === 'verified' && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setActiveSlip(sub)}
                      className="px-4 py-2 bg-[#10251E] hover:bg-[#18392C] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>View / Print A4 Slip</span>
                    </button>

                    {session?.role === 'super_admin' && (
                      <>

                        <button
                          type="button"
                          id={`cancel-receipt-${sub.id}`}
                          onClick={() => {
                            setCancelModalReceipt(sub);
                            setCancelReasonCode('administrative_error');
                            setCancelReason('');
                            setCancelConfirmed(false);
                          }}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      </AdminTableShell>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DECLINE RECEIPT MODAL WINDOW                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {rejectModalReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto animate-scale-in flex flex-col">
            <div className="px-6 py-4 bg-rose-50/80 border-b border-rose-100 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-[#151914]">
                    Decline Deposit Receipt
                  </h3>
                  <p className="text-xs text-[#6B7462]">
                    {rejectModalReceipt.customerName || (rejectModalReceipt as any).customer?.fullName || 'Member'} • Plot {rejectModalReceipt.plotNumber || (rejectModalReceipt as any).plot?.plotNumber}
                    {rejectModalReceipt.installmentNumber ? ` • Inst. #${rejectModalReceipt.installmentNumber}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (decliningReceiptId) return;
                  setRejectModalReceipt(null);
                  setRejectionReason('');
                  setAssignStrike(false);
                  setStrikeReason('');
                  setRejectModalError(null);
                }}
                disabled={decliningReceiptId === rejectModalReceipt.id}
                className="p-1.5 rounded-lg hover:bg-rose-100/60 text-[#6B7462] hover:text-[#151914] cursor-pointer disabled:opacity-40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">

            {rejectModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{rejectModalError}</span>
              </div>
            )}

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                  Reason for Declining <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectModalError) setRejectModalError(null);
                  }}
                  placeholder="Specify the reason why this deposit receipt is being declined (e.g. unverified transaction reference, deposit not found on bank statement)..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl focus:ring-2 focus:ring-rose-500 bg-white text-[#151914] resize-none"
                  required
                  disabled={decliningReceiptId === rejectModalReceipt.id}
                />
              </div>

              {/* Optional Strike */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignStrike}
                    onChange={(e) => setAssignStrike(e.target.checked)}
                    disabled={decliningReceiptId === rejectModalReceipt.id}
                    className="w-4 h-4 text-amber-700 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-950">
                    Assign a compliance strike to member
                  </span>
                </label>
                <p className="text-[11px] text-amber-800/90 pl-6 leading-tight">
                  Adds 1 strike to the member's account. Three strikes lead to suspension.
                </p>

                {assignStrike && (
                  <div className="pl-6 pt-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                      Strike Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={strikeReason}
                      onChange={(e) => setStrikeReason(e.target.value)}
                      disabled={decliningReceiptId === rejectModalReceipt.id}
                      placeholder="Defaults to decline reason if left blank"
                      className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-black/[0.06] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalReceipt(null);
                    setRejectionReason('');
                    setAssignStrike(false);
                    setStrikeReason('');
                    setRejectModalError(null);
                  }}
                  disabled={decliningReceiptId === rejectModalReceipt.id}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-black/5 disabled:opacity-40 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!rejectionReason.trim() || decliningReceiptId === rejectModalReceipt.id}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all min-w-[140px]"
                >
                  {decliningReceiptId === rejectModalReceipt.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Declining…</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5 shrink-0" />
                      <span>Confirm Decline</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BANK DEPOSIT SLIP DOCUMENT VIEWER MODAL (Photo or PDF)        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bank-slip-modal-title"
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                <div className="min-w-0">
                  <h3 id="bank-slip-modal-title" className="text-sm font-bold text-slate-800 font-serif truncate">
                    Bank Deposit Slip Document
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Official member uploaded deposit proof
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-200/50 hover:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in Tab</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  aria-label="Close bank slip modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/60 flex items-center justify-center min-h-[300px]">
              {previewImage.toLowerCase().includes('.pdf') || previewImage.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewImage}
                  title="Bank Deposit Slip PDF"
                  className="w-full h-[75vh] rounded-xl border border-slate-200 bg-white shadow-xs"
                />
              ) : (
                <img
                  src={previewImage}
                  alt="Bank Deposit Slip"
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-xs border border-slate-200 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* OFFICIAL A4 VERIFIED PAYMENT SLIP MODAL (Both Parts)          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSlip && (
        <OfficialA4PaymentSlip
          slip={buildSlipDataFromSubmission(activeSlip, {
            customerName: activeSlip.customerName || (activeSlip as any).customer?.fullName,
            membershipNo: activeSlip.membershipNo || (activeSlip as any).customer?.membershipNo,
            fatherOrHusbandName: activeSlip.fatherOrHusbandName || (activeSlip as any).customer?.fatherOrHusbandName,
            cnic: activeSlip.customerCnic || (activeSlip as any).customer?.cnic,
            plotNumber: activeSlip.plotNumber,
            blockName: activeSlip.blockName,
            plotSize: activeSlip.plotSize || (activeSlip as any).plot?.size,
            plotCategory: activeSlip.plotCategory || (activeSlip as any).plot?.category,
          })}
          submission={activeSlip}
          viewMode="full"
          onClose={() => setActiveSlip(null)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FIXED BOTTOM-RIGHT NOTICE (Phone Readable)                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {bottomNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] max-w-sm sm:max-w-md w-[calc(100vw-2rem)] p-4 rounded-2xl shadow-2xl border transition-all duration-300 pointer-events-auto backdrop-blur-md flex items-start gap-3 ${
            bottomNotice.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/80 text-emerald-100 shadow-emerald-950/50'
              : 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/50'
          }`}
        >
          {bottomNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold tracking-tight">
              {bottomNotice.type === 'success' ? 'Receipt Action Complete' : 'Verification Issue'}
            </p>
            <p className="text-[11px] leading-relaxed mt-0.5 opacity-90 break-words">
              {bottomNotice.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBottomNotice(null)}
            className="text-white/60 hover:text-white p-1 rounded-lg shrink-0 cursor-pointer transition-colors"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
