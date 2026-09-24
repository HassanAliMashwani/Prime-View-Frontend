'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MemberHeader } from '@/components/member-portal/MemberHeader';
import { PaymentScheduleTable } from '@/components/member-portal/PaymentScheduleTable';
import { MemberPaymentsSkeleton } from '@/components/ui/skeleton';
import { useMemberStore } from '@/lib/store/useMemberStore';
import { PlotPaymentSchedule } from '@/lib/dal/payments';
import { submitPaymentReceipt, getCustomerReceipts, getBalloonPreview } from '@/lib/dal/receipts';
import { ReceiptSubmission } from '@/lib/mock/types';
import {
  OfficialA4PaymentSlip,
  buildSlipDataFromSubmission,
} from '@/components/receipts/OfficialA4PaymentSlip';
import { compressAndEncodeReceipt } from '@/lib/utils/imageCompression';
import {
  CreditCard,
  CheckCircle2,
  Layers,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Calendar,
  AlertCircle,
  Building2,
  Receipt,
  Upload,
  Clock,
  X,
  FileText,
  ShieldCheck,
  Bell,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

function PaymentsContent() {
  const searchParams = useSearchParams();
  const initialPlotParam = searchParams.get('plot');

  const { schedules, plots, profile, fetchPayments, fetchPlots, fetchProfile, isLoading } = useMemberStore();
  const [activeTab, setActiveTab] = useState<'installment' | 'one_time'>('installment');
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  // Receipts and Verification Slip state
  const [receipts, setReceipts] = useState<ReceiptSubmission[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeSlipSubmission, setActiveSlipSubmission] = useState<ReceiptSubmission | null>(null);

  // Receipt form state
  const [formPlotId, setFormPlotId] = useState<string>('');
  const [formPaymentType, setFormPaymentType] = useState<'installment' | 'one_time'>('installment');
  const [formPaymentKind, setFormPaymentKind] = useState<'regular' | 'balloon'>('regular');
  const [formInstallmentNo, setFormInstallmentNo] = useState<number>(1);
  const [formAmount, setFormAmount] = useState<string>('');
  const [formBankName, setFormBankName] = useState<string>('Meezan Bank');
  const [formTxnRef, setFormTxnRef] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [balloonError, setBalloonError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [formFileName, setFormFileName] = useState<string>('');
  const [formFileUrl, setFormFileUrl] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Unified available plot files for selection in receipts and modal (plots with schedules fallback)
  const availablePlotOptions = React.useMemo(() => {
    let options: any[] = [];
    if (plots && plots.length > 0) {
      options = plots.map((p) => {
        const matchingSchedule = schedules.find((s) => s.plotId === p.id);
        return {
          id: p.id,
          plotNumber: p.plotNumber,
          blockName: matchingSchedule?.blockName || (p as any).blockName || p.blockId,
          size: p.size,
          category: p.category,
          paymentType: matchingSchedule?.paymentType || (p.paymentSummary?.paymentType as any) || 'installment',
        };
      });
    } else if (schedules && schedules.length > 0) {
      options = schedules.map((s) => ({
        id: s.plotId,
        plotNumber: s.plotNumber,
        blockName: s.blockName,
        size: s.size,
        category: 'residential' as const,
        paymentType: s.paymentType,
      }));
    }

    return options.filter((opt) => {
      const s = schedules.find((sched) => sched.plotId === opt.id);
      if (!s) return true; // Keep if schedule not loaded yet
      if (opt.paymentType === 'one_time') {
        // Allow exactly ONE documentation receipt for an already-settled one-time plot
        const alreadySubmitted = receipts.some((r) => r.plotId === opt.id);
        return !alreadySubmitted;
      }
      return s.schedule.some((item) => item.status === 'pending' || item.status === 'overdue');
    });
  }, [plots, schedules, receipts]);

  // Debounced preview fetch for balloon payments
  useEffect(() => {
    if (formPaymentType !== 'installment' || formPaymentKind !== 'balloon' || !formPlotId) {
      setPreviewData(null);
      setBalloonError(null);
      return;
    }
    const numAmt = Number(formAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setPreviewData(null);
      setBalloonError(null);
      return;
    }

    setIsPreviewLoading(true);
    const t = setTimeout(async () => {
      const activeSched = schedules.find((s) => s.plotId === formPlotId);
      const bookingId = (activeSched as any)?.bookingId || (activeSched as any)?.id;
      const res = await getBalloonPreview(formPlotId, numAmt, bookingId);
      if (res.ok && res.data) {
        setPreviewData(res.data);
        setBalloonError(null);
      } else {
        setPreviewData(null);
        setBalloonError(res.message || res.error || 'Failed to calculate balloon preview.');
      }
      setIsPreviewLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, [formAmount, formPaymentKind, formPaymentType, formPlotId, schedules]);

  const loadReceipts = useCallback(async () => {
    if (profile?.id) {
      const data = await getCustomerReceipts(profile.id);
      setReceipts(data);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchPayments();
    fetchPlots();
    fetchProfile();
  }, [fetchPayments, fetchPlots, fetchProfile]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  useEffect(() => {
    if (schedules.length > 0) {
      if (initialPlotParam) {
        const matchingSchedule = schedules.find((s) => s.plotId === initialPlotParam);
        if (matchingSchedule) {
          setActiveTab(matchingSchedule.paymentType === 'installment' ? 'installment' : 'one_time');
          setSelectedPlotId(matchingSchedule.plotId);
          setFormPlotId(matchingSchedule.plotId);
          setFormPaymentType(matchingSchedule.paymentType === 'installment' ? 'installment' : 'one_time');
          return;
        }
      }
      // If no initial plot requested, determine default tab:
      const hasInstallments = schedules.some((s) => s.paymentType === 'installment');
      if (!hasInstallments) {
        setActiveTab('one_time');
      }
    }
    if (availablePlotOptions.length > 0 && !formPlotId) {
      const defaultPlot = selectedPlotId
        ? availablePlotOptions.find((p) => p.id === selectedPlotId) || availablePlotOptions[0]
        : availablePlotOptions[0];
      setFormPlotId(defaultPlot.id);
      if (defaultPlot.paymentType) {
        setFormPaymentType(defaultPlot.paymentType === 'one_time' ? 'one_time' : 'installment');
      }
    }
  }, [schedules, availablePlotOptions, initialPlotParam, formPlotId, selectedPlotId]);

  const installmentPlots = schedules.filter((s) => s.paymentType === 'installment');
  const oneTimePlots = schedules.filter((s) => s.paymentType === 'one_time');

  const currentTabPlots = activeTab === 'installment' ? installmentPlots : oneTimePlots;
  const activeSchedule: PlotPaymentSchedule | undefined = schedules.find(
    (s) => s.plotId === selectedPlotId
  );

  // Compute upcoming/overdue payment alert across plots
  interface UpcomingAlert {
    plotNumber: string;
    plotId: string;
    dueDate: string;
    amount: number;
    installmentNumber: number;
    isOverdue: boolean;
  }

  let upcomingAlert: UpcomingAlert | null = null;
  const today = new Date().toISOString().split('T')[0];

  for (const s of schedules) {
    if (s.paymentType === 'installment') {
      const pendingItems = s.schedule
        .filter((item) => item.status === 'pending' || item.status === 'overdue')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      if (pendingItems.length > 0) {
        const nextItem = pendingItems[0];
        const isItemOverdue = nextItem.status === 'overdue' || nextItem.dueDate < today;

        if (
          !upcomingAlert ||
          (isItemOverdue && !upcomingAlert.isOverdue) ||
          (!upcomingAlert.isOverdue && nextItem.dueDate < upcomingAlert.dueDate)
        ) {
          upcomingAlert = {
            plotNumber: s.plotNumber,
            plotId: s.plotId,
            dueDate: String(nextItem.dueDate).split('T')[0],
            amount: nextItem.amount,
            installmentNumber: nextItem.installmentNumber || 1,
            isOverdue: isItemOverdue,
          };
        }
      }
    }
  }

  const formatPKR = (val: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(val);

  const handleTabChange = (tab: 'installment' | 'one_time') => {
    setActiveTab(tab);
    setSelectedPlotId(null);
  };

  const openUploadModalWithPlot = (plotId?: string, installmentNo?: number, amount?: number) => {
    const targetPlotId = plotId || selectedPlotId || (availablePlotOptions.length > 0 ? availablePlotOptions[0].id : '');
    setFormPlotId(targetPlotId);

    const targetPlot = availablePlotOptions.find((p) => p.id === targetPlotId);
    if (targetPlot?.paymentType) {
      setFormPaymentType(targetPlot.paymentType === 'one_time' ? 'one_time' : 'installment');
    }

    if (installmentNo !== undefined) {
      setFormInstallmentNo(installmentNo);
    } else if (targetPlotId) {
      const sched = schedules.find((s) => s.plotId === targetPlotId);
      const nextPending = sched?.schedule.find((item) => item.status === 'pending' || item.status === 'overdue');
      if (nextPending?.installmentNumber) {
        setFormInstallmentNo(nextPending.installmentNumber);
      }
    }

    if (amount !== undefined) {
      setFormAmount(String(amount));
    } else if (targetPlotId) {
      const sched = schedules.find((s) => s.plotId === targetPlotId);
      if (sched?.paymentType === 'one_time') {
        setFormAmount(String(sched.totalPrice || sched.paidAmount || ''));
      } else {
        const nextPending = sched?.schedule.find((item) => item.status === 'pending' || item.status === 'overdue' || item.status === 'partially_paid');
        if (nextPending?.amount) {
          const outstanding = (Number(nextPending.amount) || 0) - (Number((nextPending as any).paidAmount) || 0);
          setFormAmount(String(outstanding));
        }
      }
    }

    setUploadError(null);
    setUploadSuccess(null);
    setBalloonError(null);
    setShowUploadModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormFileName(file.name);
    setIsCompressing(true);
    setUploadError(null);

    try {
      const compressedDataUrl = await compressAndEncodeReceipt(file, 1000, 0.75);
      setFormFileUrl(compressedDataUrl);
    } catch {
      setUploadError('Failed to read and process receipt image. Please try another file.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setUploadError(null);
    setUploadSuccess(null);

    const amountNum = Number(formAmount);
    if (!formPlotId || isNaN(amountNum) || amountNum <= 0 || !formTxnRef.trim()) {
      setUploadError('Please fill in all mandatory receipt information.');
      return;
    }

    if (!formFileUrl) {
      setUploadError('Please select and upload your bank deposit receipt image or document.');
      return;
    }

    setIsSubmittingReceipt(true);
    try {
      const res = await submitPaymentReceipt(profile.id, {
        plotId: formPlotId,
        paymentType: formPaymentType,
        installmentNumber: formPaymentType === 'installment' ? Number(formInstallmentNo) : undefined,
        amount: amountNum,
        depositoryBank: formBankName,
        bankName: formBankName,
        transactionRef: formTxnRef.trim(),
        paymentDate: formDate,
        receiptFileUrl: formFileUrl,
        receiptFileName: formFileName || 'deposit_receipt.jpg',
        notes: formNotes,
        paymentKind: formPaymentKind,
        previewData: previewData,
      });

      if (res.ok) {
        setUploadSuccess(
          'Payment receipt uploaded successfully! It has been dispatched to the society admin desk for verification.'
        );
        await loadReceipts();
        setFormTxnRef('');
        setFormAmount('');
        setFormNotes('');
        setFormFileName('');
        setFormFileUrl('');
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadSuccess(null);
        }, 2500);
      } else {
        if (res.error === 'ALREADY_PAID') {
          setUploadError(
            res.message || 'This installment has already been settled and marked paid in the society ledger.'
          );
        } else if (res.error === 'ALREADY_RECORDED') {
          setUploadError(
            res.message || 'A documentation receipt has already been submitted and recorded for this payment.'
          );
        } else if (res.error === 'RECEIPT_ALREADY_PENDING') {
          setUploadError(
            res.message || 'A receipt for this payment is already pending verification by the society desk.'
          );
        } else {
          setUploadError(res.message || res.error || 'Failed to submit receipt.');
        }
      }
    } catch {
      setUploadError('An unexpected network error occurred.');
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <MemberHeader
        title="Payments & Ledger"
        subtitle="Independent plot payment schedules, receipts & verified slips"
      />

      <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* ── Upcoming Installment Payment Alert (Requirement 7) ── */}
        {upcomingAlert && (
          <div
            className={`rounded-2xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition-all ${
              upcomingAlert.isOverdue
                ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                : 'bg-[#FAF9F5] border-[#43612B]/30 text-[#151914]'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  upcomingAlert.isOverdue
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-[#EAF0E7] text-[#43612B]'
                }`}
              >
                {upcomingAlert.isOverdue ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      upcomingAlert.isOverdue
                        ? 'bg-rose-200 text-rose-800'
                        : 'bg-[#43612B] text-white'
                    }`}
                  >
                    {upcomingAlert.isOverdue ? 'Overdue Installment Notice' : 'Upcoming Installment Alert'}
                  </span>
                  <span className="text-xs font-bold">Plot {upcomingAlert.plotNumber}</span>
                </div>
                <p className="text-xs text-[#4A5347] leading-relaxed">
                  Installment #{upcomingAlert.installmentNumber} of{' '}
                  <strong className="text-[#151914]">{formatPKR(upcomingAlert.amount)}</strong> is{' '}
                  {upcomingAlert.isOverdue ? 'overdue since' : 'due on'}{' '}
                  <strong className="text-[#151914]">{String(upcomingAlert.dueDate).split('T')[0]}</strong>. Upload your bank deposit slip below once paid.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                openUploadModalWithPlot(
                  upcomingAlert?.plotId,
                  upcomingAlert?.installmentNumber,
                  upcomingAlert?.amount
                )
              }
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                upcomingAlert.isOverdue
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                  : 'bg-[#43612B] hover:bg-[#365222] text-white shadow-[#43612B]/20'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Receipt for Inst. #{upcomingAlert.installmentNumber}</span>
            </button>
          </div>
        )}


        {isLoading ? (
          <MemberPaymentsSkeleton />
        ) : schedules.length === 0 ? (
          /* Single unified empty state for zero-plot accounts */
          <div className="bg-white rounded-3xl border border-black/[0.08] p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF9F5] text-[#6B7462] flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8 text-[#43612B]/70" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-lg text-[#151914]">
                No Properties Linked to Your Account Yet
              </h4>
              <p className="text-xs text-[#6B7462] max-w-md mx-auto leading-relaxed">
                Once a property is registered to your membership, your payment ledgers, statutory fees, and installment schedules will appear here.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/society-members/properties"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#43612B] text-white text-xs font-bold hover:bg-[#344c22] transition-colors"
              >
                <span>Check Properties</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Top-Level Payment Type Tabs ── */}
            <div className="flex items-center gap-3 border-b border-black/[0.08] pb-3">
              <button
                type="button"
                onClick={() => handleTabChange('installment')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                  activeTab === 'installment'
                    ? 'bg-[#43612B] text-white shadow-[0_4px_16px_rgba(67,97,43,0.25)]'
                    : 'bg-white text-[#6B7462] hover:text-[#151914] border border-black/[0.08] hover:bg-black/5'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Installment</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    activeTab === 'installment'
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 text-[#6B7462]'
                  }`}
                >
                  {installmentPlots.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('one_time')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                  activeTab === 'one_time'
                    ? 'bg-[#43612B] text-white shadow-[0_4px_16px_rgba(67,97,43,0.25)]'
                    : 'bg-white text-[#6B7462] hover:text-[#151914] border border-black/[0.08] hover:bg-black/5'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Full Payment</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    activeTab === 'one_time'
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 text-[#6B7462]'
                  }`}
                >
                  {oneTimePlots.length}
                </span>
              </button>
            </div>

            {/* ── Sub-view: Empty Tab State OR Plot List OR Selected Plot Ledger ── */}
            {currentTabPlots.length === 0 ? (
              <div className="bg-white rounded-3xl border border-black/[0.08] p-10 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-[#FAF9F5] text-[#6B7462] flex items-center justify-center mx-auto">
                  <CreditCard className="w-6 h-6 opacity-40" />
                </div>
                <h4 className="font-display font-bold text-base text-[#151914]">
                  No {activeTab === 'installment' ? 'Installment' : 'Full Payment'} Plots
                </h4>
                <p className="text-xs text-[#6B7462] max-w-md mx-auto">
                  {activeTab === 'installment'
                    ? 'No properties on your membership are currently operating under installment terms.'
                    : 'No properties on your membership are registered under full payment settlement.'}
                </p>
              </div>
            ) : !selectedPlotId || !activeSchedule ? (
              /* Plot List for Selected Tab */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#6B7462] font-medium">
                    Select a plot below to view its statutory fees and isolated payment schedule:
                  </p>
                  <span className="text-xs font-semibold text-[#151914]">
                    {currentTabPlots.length} {currentTabPlots.length === 1 ? 'Plot' : 'Plots'} Found
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTabPlots.map((plotSchedule) => {
                    const isInstallment = plotSchedule.paymentType === 'installment';
                    const hasOverdue = plotSchedule.schedule.some((p) => p.status === 'overdue');
                    const overdueCount = plotSchedule.schedule.filter((p) => p.status === 'overdue').length;
                    const paidCount = plotSchedule.schedule.filter((p) => p.status === 'paid').length;
                    const totalCount = plotSchedule.schedule.length;

                    return (
                      <div
                        key={plotSchedule.plotId}
                        onClick={() => setSelectedPlotId(plotSchedule.plotId)}
                        className="bg-white rounded-2xl border border-black/[0.08] p-5 shadow-xs hover:border-[#43612B]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#43612B]">
                                {plotSchedule.blockName}
                              </span>
                              <h3 className="font-display font-bold text-lg text-[#151914] group-hover:text-[#43612B] transition-colors">
                                Plot {plotSchedule.plotNumber}
                              </h3>
                              <p className="text-xs text-[#6B7462]">{plotSchedule.size}</p>
                            </div>

                            {/* Status Chip */}
                            {isInstallment ? (
                              hasOverdue ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                                  <AlertCircle className="w-3 h-3" />
                                  {overdueCount} Overdue
                                </span>
                              ) : paidCount === totalCount && totalCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Settled
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20">
                                  {paidCount} of {totalCount} Paid
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Settled
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-black/[0.05] text-xs">
                            <div>
                              <span className="text-[10px] text-[#6B7462] uppercase tracking-wider block">
                                Total Price
                              </span>
                              <span className="font-bold text-[#151914]">
                                {formatPKR(plotSchedule.totalPrice)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#6B7462] uppercase tracking-wider block">
                                Remaining
                              </span>
                              <span className="font-bold text-[#151914]">
                                {formatPKR(plotSchedule.remainingBalance)}
                              </span>
                            </div>
                          </div>

                          {/* Dynamic Payment Progress Track */}
                          {(() => {
                            const plotPct = isInstallment && totalCount > 0
                              ? Math.min(100, Math.max(0, Math.round((paidCount / totalCount) * 100)))
                              : plotSchedule.totalPrice > 0
                              ? Math.min(100, Math.max(0, Math.round(((plotSchedule.totalPrice - plotSchedule.remainingBalance) / plotSchedule.totalPrice) * 100)))
                              : 0;
                            return (
                              <div className="pt-2 space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-semibold">
                                  <span className="text-[#6B7462]">
                                    {isInstallment ? `${paidCount} of ${totalCount} Paid` : 'Cleared'}
                                  </span>
                                  <span className="text-[#43612B] font-mono">{plotPct}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#43612B] rounded-full transition-all duration-500"
                                    style={{ width: `${plotPct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="mt-4 pt-3 border-t border-black/[0.05] flex items-center justify-between text-xs text-[#43612B] font-bold">
                          <span>View Detailed Ledger &amp; Schedule</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Per-Plot Ledger View */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedPlotId(null)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-[#43612B] bg-[#EAF0E7] hover:bg-[#d8e4d3] transition-colors border border-[#43612B]/20 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to {activeTab === 'installment' ? 'Installment' : 'Full Payment'} Plots</span>
                  </button>

                  <div className="flex items-center gap-3">
                    {(() => {
                      const hasPending = activeSchedule.paymentType === 'one_time' || activeSchedule.schedule.some(i => i.status === 'pending' || i.status === 'overdue' || i.status === 'partially_paid');
                      if (!hasPending) return null;
                      return (
                        <button
                          type="button"
                          onClick={() => openUploadModalWithPlot(activeSchedule.plotId)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#43612B] hover:bg-[#365222] text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Receipt for Plot {activeSchedule.plotNumber}</span>
                        </button>
                      );
                    })()}

                    <div className="hidden sm:flex items-center gap-2 text-xs text-[#6B7462]">
                      <Building2 className="w-3.5 h-3.5 text-[#43612B]" />
                      <span>
                        {activeSchedule.blockName} &bull; Plot {activeSchedule.plotNumber} ({activeSchedule.size})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Financial Summary Card */}
                  <div className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#43612B]">
                          Plot Account Breakdown
                        </span>
                        <h3 className="font-display font-bold text-xl sm:text-2xl text-[#151914] mt-0.5">
                          Plot {activeSchedule.plotNumber} ({activeSchedule.size})
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20">
                          {activeSchedule.paymentType === 'installment'
                            ? activeSchedule.installmentPlan
                              ? `${activeSchedule.installmentPlan.years}-Year Plan (${activeSchedule.installmentPlan.numberOfInstallments} Installments)`
                              : 'Installment Terms'
                            : 'Full Payment Settlement'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
                      <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04]">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
                          Total Plot Price
                        </p>
                        <p className="font-display font-bold text-xl sm:text-2xl text-[#151914] mt-1">
                          {formatPKR(activeSchedule.totalPrice)}
                        </p>
                      </div>

                      <div className="bg-[#EAF0E7]/60 p-4 rounded-2xl border border-[#43612B]/15">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#43612B]">
                          Total Paid to Date
                        </p>
                        <p className="font-display font-bold text-xl sm:text-2xl text-[#43612B] mt-1">
                          {formatPKR(activeSchedule.paidAmount)}
                        </p>
                      </div>

                      <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04]">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
                          Remaining Balance
                        </p>
                        <p className="font-display font-bold text-xl sm:text-2xl text-[#151914] mt-1">
                          {formatPKR(activeSchedule.remainingBalance)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Plot-specific schedule */}
                  {activeSchedule.paymentType === 'installment' ? (
                    <PaymentScheduleTable
                      schedule={activeSchedule.schedule}
                      totalPrice={activeSchedule.totalPrice}
                      paidAmount={activeSchedule.paidAmount}
                    />
                  ) : (
                    <div className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 space-y-6 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-lg text-[#151914]">
                            Full Payment Settlement Complete
                          </h4>
                          <p className="text-xs text-[#6B7462]">
                            This plot file was settled via full payment bank draft. No recurring installments remain.
                          </p>
                        </div>
                      </div>

                      <div className="divide-y divide-black/[0.06] text-xs">
                        <div className="py-3 flex justify-between">
                          <span className="text-[#6B7462]">Settlement Date</span>
                          <span className="font-bold text-[#151914]">
                            {String(activeSchedule.schedule[0]?.paidDate || activeSchedule.schedule[0]?.dueDate || '—').split('T')[0]}
                          </span>
                        </div>
                        <div className="py-3 flex justify-between">
                          <span className="text-[#6B7462]">Paid Amount</span>
                          <span className="font-bold text-[#43612B]">
                            {formatPKR(activeSchedule.paidAmount)}
                          </span>
                        </div>
                        <div className="py-3 flex justify-between">
                          <span className="text-[#6B7462]">Transaction Reference</span>
                          <span className="font-mono font-bold text-[#151914]">
                            {activeSchedule.schedule[0]?.transactionRef || 'TXN-PV-SETTLED'}
                          </span>
                        </div>
                        <div className="py-3 flex justify-between">
                          <span className="text-[#6B7462]">Allotment Clearance</span>
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Clearance Certificate Issued
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* SUBMITTED RECEIPTS & OFFICIAL TWO-PART SLIPS (Requirement 8)  */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 space-y-6 shadow-xs mt-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-black/[0.06]">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#43612B]">
                    Payment Verification Desk
                  </span>
                  <h3 className="font-display font-bold text-xl text-[#151914]">
                    Submitted Receipts &amp; Official Slips
                  </h3>
                  <p className="text-xs text-[#6B7462]">
                    Track uploaded bank deposit slips and view official society verified member slips.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openUploadModalWithPlot()}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#43612B] hover:bg-[#365222] text-white flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload New Receipt</span>
                </button>
              </div>

              {receipts.length === 0 ? (
                <div className="py-10 text-center space-y-3 bg-[#FAF9F7] rounded-2xl border border-black/[0.05]">
                  <Receipt className="w-10 h-10 text-[#6B7462] opacity-40 mx-auto" />
                  <p className="text-xs font-semibold text-[#151914]">No payment receipts submitted yet</p>
                  <p className="text-[11px] text-[#6B7462] max-w-md mx-auto">
                    When you pay your installments or booking charges at the bank, upload a photo or scan of your deposit slip here to receive your official verified member slip.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.06]">
                  {receipts.map((sub) => (
                    <div
                      key={sub.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-black/[0.01] px-2 rounded-xl transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-sm text-[#151914]">
                            Plot {sub.plotNumber} ({sub.blockName})
                          </span>
                          <span className="text-xs text-[#6B7462]">&bull;</span>
                          <span className="text-xs font-semibold text-[#43612B]">
                            {sub.paymentType === 'installment'
                              ? `Installment #${sub.installmentNumber}`
                              : 'Full Payment Settlement'}
                          </span>
                          {sub.paymentType === 'one_time' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              Documentation Record
                            </span>
                          )}
                          {/* Status Badge */}
                          {sub.status === 'verified' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified &amp; Cleared</span>
                            </span>
                          ) : sub.status === 'rejected' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Declined</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Pending Admin Verification</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#6B7462] flex items-center gap-3 flex-wrap">
                          <span>
                            Amount: <strong className="text-[#151914]">{formatPKR(sub.amount)}</strong>
                          </span>
                          <span>&bull;</span>
                          <span>Depository Bank: <strong className="text-[#151914]">{sub.depositoryBank || sub.bankName || 'N/A'}</strong></span>
                          <span>&bull;</span>
                          <span>Ref: <strong className="font-mono text-[#151914]">{sub.transactionRef}</strong></span>
                          <span>&bull;</span>
                          <span>Deposited: {sub.paymentDate}</span>
                        </div>

                        {sub.status === 'rejected' && sub.rejectionReason && (
                          <p className="text-[11px] text-rose-700 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                            <strong>Reason for Rejection:</strong> {sub.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {sub.status === 'verified' && sub.slip ? (
                          <button
                            type="button"
                            onClick={() => setActiveSlipSubmission(sub)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#43612B] hover:bg-[#365222] text-white flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>View Official Member Slip</span>
                          </button>
                        ) : sub.status === 'pending' ? (
                          <span className="text-[11px] text-amber-700 font-medium px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/60">
                            Under Committee Review
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openUploadModalWithPlot(sub.plotId, sub.installmentNumber, sub.amount)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#43612B] hover:bg-[#EAF0E7] border border-[#43612B]/30 cursor-pointer"
                          >
                            Re-upload Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* RECEIPT UPLOAD MODAL DIALOG                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-black/10 shadow-2xl p-6 sm:p-8 space-y-5 my-auto animate-scale-in">
            <div className="flex items-start justify-between pb-4 border-b border-black/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#151914]">
                    Upload Payment Deposit Receipt
                  </h3>
                  <p className="text-xs text-[#6B7462]">
                    Submit your bank slip for administrative verification and A4 slip generation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 text-[#6B7462] hover:text-[#151914] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3.5 rounded-xl bg-[#EAF0E7] border border-[#43612B]/30 text-[#43612B] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleReceiptSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Plot */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    Property Plot File
                  </label>
                  <select
                    value={formPlotId}
                    onChange={(e) => {
                      const newPlotId = e.target.value;
                      setFormPlotId(newPlotId);
                      const selected = availablePlotOptions.find((p) => p.id === newPlotId);
                      if (selected?.paymentType) {
                        setFormPaymentType(selected.paymentType === 'one_time' ? 'one_time' : 'installment');
                      }
                      // Auto-fill next due installment or one-time total amount if available
                      const sched = schedules.find((s) => s.plotId === newPlotId);
                      if (selected?.paymentType === 'one_time' && sched) {
                        setFormAmount(String(sched.totalPrice || sched.paidAmount || ''));
                      } else {
                        const nextPending = sched?.schedule.find((item) => item.status === 'pending' || item.status === 'overdue' || item.status === 'partially_paid');
                        if (nextPending?.installmentNumber) {
                          setFormInstallmentNo(nextPending.installmentNumber);
                        }
                        if (nextPending?.amount) {
                          const outstanding = (Number(nextPending.amount) || 0) - (Number((nextPending as any).paidAmount) || 0);
                          setFormAmount(String(outstanding));
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914] cursor-pointer font-medium"
                    required
                  >
                    {availablePlotOptions.length === 0 ? (
                      <option value="" disabled>
                        No plot files linked to account
                      </option>
                    ) : (
                      availablePlotOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          Plot {p.plotNumber} • {p.blockName} ({p.size})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Payment Nature */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    Payment Type
                  </label>
                  <select
                    value={formPaymentType}
                    onChange={(e) => setFormPaymentType(e.target.value as 'installment' | 'one_time')}
                    disabled={true}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl bg-black/5 text-[#6B7462] cursor-not-allowed"
                  >
                    <option value="installment">Installment Plan</option>
                    <option value="one_time">Full Payment</option>
                  </select>
                </div>

                {/* Payment Kind */}
                {formPaymentType === 'installment' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                      Payment Kind
                    </label>
                    <select
                      value={formPaymentKind}
                      onChange={(e) => setFormPaymentKind(e.target.value as 'regular' | 'balloon')}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914] cursor-pointer"
                    >
                      <option value="regular">Regular Installment</option>
                      <option value="balloon">Balloon / Bulk Payment</option>
                    </select>
                  </div>
                )}

                {/* Installment Number */}
                {formPaymentType === 'installment' && formPaymentKind === 'regular' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                        Installment Number
                      </label>
                      <span className="text-[10px] text-[#6B7462]">Assigned automatically</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-[#6B7462]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={formInstallmentNo ? `Installment #${formInstallmentNo}` : 'Loading...'}
                        disabled
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl bg-black/5 text-[#6B7462] cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    Deposited Amount (PKR)
                  </label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914]"
                    required
                  />
                  {formPaymentType === 'installment' && formPaymentKind === 'balloon' && (
                    <div className="text-[10px] text-[#6B7462] mt-1 space-y-0.5 leading-snug">
                      <p><strong>Note:</strong> Balloon payment allocations apply to oldest outstanding installments first.</p>
                      <p>Customer ledger is updated only after admin verification.</p>
                    </div>
                  )}
                  {formPaymentType === 'installment' && formPaymentKind === 'balloon' && balloonError && (
                    <p className="text-xs font-semibold text-rose-600 mt-1.5">{balloonError}</p>
                  )}
                </div>

                {/* Preview UI */}
                {formPaymentType === 'installment' && formPaymentKind === 'balloon' && (previewData || isPreviewLoading) && (
                  <div className="col-span-1 sm:col-span-2 space-y-2 p-3 sm:p-4 bg-[#EAF0E7]/60 border border-[#43612B]/20 rounded-xl">
                    <h4 className="text-xs font-bold text-[#43612B] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Balloon Allocation Preview
                    </h4>
                    {isPreviewLoading ? (
                      <p className="text-xs text-[#6B7462]">Calculating allocation preview...</p>
                    ) : (() => {
                      const rows = previewData?.allocations ?? previewData?.preview?.allocations ?? [];
                      if (previewData?.error) {
                        return <p className="text-xs font-semibold text-rose-600">{previewData.error}</p>;
                      }
                      if (rows.length === 0) {
                        return <p className="text-xs text-[#6B7462]">No installment allocations available for this amount.</p>;
                      }
                      return (
                        <div className="space-y-1 bg-white/50 rounded-lg p-2 border border-[#43612B]/10">
                          {rows.map((a: any, i: number) => (
                            <div key={i} className="text-[11px] text-[#151914] flex justify-between border-b border-[#43612B]/10 py-1.5 last:border-0 font-medium">
                              <span>{a.installmentNumber ? `Installment #${a.installmentNumber}` : 'Installment Alloc'}</span>
                              <span className="font-mono text-[#43612B]">Rs. {Number(a.amountApplied || 0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Bank Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    Depository Bank
                  </label>
                  <select
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914]"
                  >
                    <option value="Meezan Bank Ltd">Meezan Bank Ltd</option>
                    <option value="Bank of Khyber">Bank of Khyber</option>
                    <option value="Habib Bank Limited (HBL)">Habib Bank Limited (HBL)</option>
                    <option value="Allied Bank Limited">Allied Bank Limited</option>
                    <option value="MCB Bank Limited">MCB Bank Limited</option>
                    <option value="Society Cash Desk / Pay Order">Society Cash Desk / Pay Order</option>
                  </select>
                </div>

                {/* Transaction Ref */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    Challan / Trx Reference
                  </label>
                  <input
                    type="text"
                    value={formTxnRef}
                    onChange={(e) => setFormTxnRef(e.target.value)}
                    placeholder="e.g. MZN-DEP-99482"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914]"
                    required
                  />
                </div>

                {/* Deposit Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    Deposit Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914]"
                    required
                  />
                </div>

                {/* File Attachment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    Upload Bank Slip File
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-[#6B7462] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#EAF0E7] file:text-[#43612B] hover:file:bg-[#d9e5d4] cursor-pointer"
                  />
                  {isCompressing && (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium animate-pulse">
                      <div className="w-2.5 h-2.5 border border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>Optimizing and compressing receipt image...</span>
                    </div>
                  )}
                  {formFileName && !isCompressing && (
                    <p className="text-[10px] text-[#43612B] font-medium truncate">
                      Ready: {formFileName}
                    </p>
                  )}
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Branch name, teller stamp reference, or remarks"
                  className="w-full px-3.5 py-2 text-xs border border-black/10 rounded-xl focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B7462] hover:bg-black/5 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingReceipt || isCompressing}
                  className="px-6 py-2.5 rounded-xl bg-[#43612B] hover:bg-[#365222] disabled:opacity-50 text-white font-bold text-xs tracking-wide flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  {isSubmittingReceipt ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitting Receipt...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Submit for Verification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* OFFICIAL A4 VERIFIED PAYMENT SLIP MODAL                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSlipSubmission && (
        <OfficialA4PaymentSlip
          slip={buildSlipDataFromSubmission(activeSlipSubmission)}
          submission={activeSlipSubmission}
          viewMode="customer"
          onClose={() => setActiveSlipSubmission(null)}
        />
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#43612B]/20 border-t-[#43612B] rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}
