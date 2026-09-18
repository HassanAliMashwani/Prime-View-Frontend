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
} from 'lucide-react';
import { AdminSession, ReceiptSubmission, ReceiptStatus } from '@/lib/mock/types';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getAdminReceipts, verifyReceipt, rejectReceipt } from '@/lib/dal/receipts';

import {
  OfficialA4PaymentSlip,
  buildSlipDataFromSubmission,
} from '@/components/receipts/OfficialA4PaymentSlip';

export default function AdminReceiptsPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [receipts, setReceipts] = useState<ReceiptSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | ReceiptStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [activeSlip, setActiveSlip] = useState<ReceiptSubmission | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectModalReceipt, setRejectModalReceipt] = useState<ReceiptSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignStrike, setAssignStrike] = useState(false);
  const [strikeReason, setStrikeReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async (currentSession: AdminSession) => {
    const isSuper = currentSession.role === 'super_admin';
    const hasAuth = Boolean(currentSession.permissions?.can_verify_receipts);

    if (!isSuper && !hasAuth) {
      setLoading(false);
      return;
    }

    const res = await getAdminReceipts(currentSession);
    if (res.ok && res.receipts) {
      setReceipts(res.receipts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);
    loadData(cur);

    // Auto-refresh via polling
    const intervalId = setInterval(() => {
      const latestSession = getActiveAdminSession();
      if (latestSession) {
        loadData(latestSession);
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

  const handleVerify = async (receiptId: string) => {
    if (!session) return;
    setIsProcessing(true);
    try {
      const res = await verifyReceipt(session, receiptId);
      if (res.ok && res.receipt) {
        setFeedback({
          type: 'success',
          message: `Receipt approved! Generated official Slip #${res.receipt.slip?.slipNumber}. Upper part secured in admin records; Lower part sent to customer.`,
        });
        await loadData(session);
        // Automatically open the verified A4 slip preview for review/print
        setActiveSlip(res.receipt);
      } else {
        setFeedback({
          type: 'error',
          message: res.message || res.error || 'Failed to verify receipt.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'An unexpected error occurred during verification.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !rejectModalReceipt) return;

    if (!rejectionReason.trim()) {
      setFeedback({ type: 'error', message: 'Please specify the rejection reason.' });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await rejectReceipt(session, rejectModalReceipt.id, {
        reason: rejectionReason.trim(),
        assignStrike,
        strikeReason: strikeReason.trim() || rejectionReason.trim(),
      });
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `Receipt submission ${rejectModalReceipt.id} has been declined.${
            res.strikeAssigned ? ' A compliance strike was assigned to the member.' : ''
          }`,
        });
        setRejectModalReceipt(null);
        setRejectionReason('');
        setAssignStrike(false);
        setStrikeReason('');
        await loadData(session);
      } else {
        setFeedback({
          type: 'error',
          message: res.message || res.error || 'Failed to reject receipt.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" />
        <span className="ml-3 text-sm font-medium text-slate-600">
          Loading receipt verification queue...
        </span>
      </div>
    );
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
          Your administrative profile does not have the <strong>Receipt Verification Authority</strong> delegated by the Super Administrator. You cannot review customer deposit slips or generate official society slips.
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

  // Filter receipts
  const filteredReceipts = receipts.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const bank = (r.depositoryBank || r.bankName || '').toLowerCase();
      return (
        r.customerName.toLowerCase().includes(q) ||
        r.membershipNo.toLowerCase().includes(q) ||
        r.plotNumber.toLowerCase().includes(q) ||
        r.transactionRef.toLowerCase().includes(q) ||
        bank.includes(q) ||
        (r.slip?.slipNumber && r.slip.slipNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = receipts.filter((r) => r.status === 'pending').length;
  const verifiedCount = receipts.filter((r) => r.status === 'verified').length;
  const rejectedCount = receipts.filter((r) => r.status === 'rejected').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-serif tracking-tight flex items-center gap-2">
              <span>Receipt Verification Desk</span>
              {pendingCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                  {pendingCount} Pending Action
                </span>
              )}
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
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 text-white font-mono">
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('verified')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'verified'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified &amp; Issued</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 text-white font-mono">
              {verifiedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Declined</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 text-white font-mono">
              {rejectedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Submissions ({receipts.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member, plot, slip #..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-600"
          />
        </div>
      </div>

      {/* Receipts List */}
      <div className="space-y-4">
        {filteredReceipts.length === 0 ? (
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
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-teal-600/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
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

                  {/* Status chip */}
                  {sub.status === 'verified' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified &bull; Slip Issued</span>
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
                    <span className="text-slate-700">{sub.paymentDate}</span>
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
              </div>

              {/* Right Action buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2 shrink-0">
                {/* View attached slip thumbnail */}
                {sub.receiptFileUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewImage(sub.receiptFileUrl)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Bank Slip Image</span>
                  </button>
                )}

                {sub.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleVerify(sub.id)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve &amp; Generate A4 Slip</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        setRejectModalReceipt(sub);
                        setRejectionReason('');
                      }}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                )}

                {sub.status === 'verified' && (
                  <button
                    type="button"
                    onClick={() => setActiveSlip(sub)}
                    className="px-4 py-2 bg-[#10251E] hover:bg-[#18392C] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>View / Print A4 Slip</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ATTACHED IMAGE PREVIEW MODAL                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl space-y-4 p-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">Member Bank Deposit Slip Document</h3>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-2">
              <img
                src={previewImage}
                alt="Payment Slip Proof"
                className="max-h-[65vh] object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* REJECT MODAL                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {rejectModalReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                <span>Decline Receipt Submission</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejectModalReceipt(null);
                  setAssignStrike(false);
                  setStrikeReason('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              State the audit rationale for declining this deposit receipt for Member{' '}
              <strong>{rejectModalReceipt.customerName}</strong> (Plot {rejectModalReceipt.plotNumber}).
            </p>

            {/* Current Member Standing Info */}
            {(() => {
              const currentStrikes = (rejectModalReceipt as any).customer?.strikeCount ?? rejectModalReceipt.customerStrikeCount ?? 0;
              return (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Current Member Standing:</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      currentStrikes >= 2
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : currentStrikes === 1
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {currentStrikes}/3 Strikes
                    </span>
                  </div>
                  {currentStrikes === 2 && (
                    <div className="text-[10px] text-rose-700 font-semibold flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Warning: Assigning a strike here will suspend this member account.</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Rejection Rationale
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Bank slip transaction reference does not match society bank account statement."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-rose-600 resize-none"
                />
              </div>

              {/* Inline Strike System wiring (Requirement 4) */}
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={assignStrike}
                    onChange={(e) => {
                      setAssignStrike(e.target.checked);
                      if (e.target.checked && !strikeReason) {
                        setStrikeReason(rejectionReason || 'Unverified / invalid payment deposit receipt');
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Assign strike for this rejection
                    </span>
                    <span className="text-[11px] text-amber-700 leading-tight block">
                      Directly links this rejection to the member’s compliance record.
                    </span>
                  </div>
                </label>

                {assignStrike && (
                  <div className="pt-2 border-t border-amber-200/80 space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-900">
                      Strike Reason / Record
                    </label>
                    <input
                      type="text"
                      value={strikeReason}
                      onChange={(e) => setStrikeReason(e.target.value)}
                      placeholder="e.g. Fraudulent deposit slip submission"
                      className="w-full px-3 py-1.5 text-xs border border-amber-300 bg-white rounded-lg focus:outline-hidden focus:border-amber-600 text-slate-900"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalReceipt(null);
                    setAssignStrike(false);
                    setStrikeReason('');
                  }}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  {assignStrike ? 'Decline & Issue Strike' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* OFFICIAL A4 VERIFIED PAYMENT SLIP MODAL (Both Parts)          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSlip && (
        <OfficialA4PaymentSlip
          slip={buildSlipDataFromSubmission(activeSlip)}
          submission={activeSlip}
          viewMode="full"
          onClose={() => setActiveSlip(null)}
        />
      )}
    </div>
  );
}
