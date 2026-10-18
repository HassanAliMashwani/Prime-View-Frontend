'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MemberHeader } from '@/components/member-portal/MemberHeader';
import { PaymentScheduleTable } from '@/components/member-portal/PaymentScheduleTable';
import { MemberPaymentsSkeleton } from '@/components/ui/skeleton';
import { useMemberStore } from '@/lib/store/useMemberStore';
import { PlotPaymentSchedule } from '@/lib/dal/payments';
import { submitPaymentReceipt, getCustomerReceipts, getBalloonPreview, uploadReceiptFileToStorage } from '@/lib/dal/receipts';
import { runLane1, runLane2 } from '@/lib/requestLanes';
import { ReceiptSubmission } from '@/lib/mock/types';
import { getActiveSession } from '@/lib/dal/auth';
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
  RefreshCw,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';


// ── Member Payment Form Canonical Helpers ──
function getNextUnpaidBill(sched?: PlotPaymentSchedule | null): import('@/lib/mock/types').PaymentRecord | null {
  if (!sched || !sched.schedule || sched.schedule.length === 0) return null;
  const dueStatuses = ['pending', 'overdue', 'partially_paid'];
  const eligibleTypes = ['plot_downpayment', 'plot_installment', 'plot_biannual', 'plot_possession'];

  const unpaid = sched.schedule
    .filter((item) => eligibleTypes.includes(item.feeType) && dueStatuses.includes(item.status))
    .sort((a, b) => {
      if (a.feeType === 'plot_downpayment' && b.feeType !== 'plot_downpayment') return -1;
      if (b.feeType === 'plot_downpayment' && a.feeType !== 'plot_downpayment') return 1;
      const timeA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const timeB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return (a.installmentNumber || 0) - (b.installmentNumber || 0);
    });

  return unpaid[0] || null;
}

function getBillLabel(bill: import('@/lib/mock/types').PaymentRecord | null): string {
  if (!bill) return 'No unpaid installments';
  if (bill.feeType === 'plot_downpayment') return 'Down Payment';
  if (bill.feeType === 'plot_possession') {
    return bill.installmentNumber ? `Installment #${bill.installmentNumber} (Possession)` : 'Possession Bill';
  }
  if (bill.feeType === 'plot_biannual') {
    return bill.installmentNumber ? `Installment #${bill.installmentNumber} (Bi-Annual)` : 'Bi-Annual Installment';
  }
  return `Installment #${bill.installmentNumber || 1}`;
}

function getTotalStillOwed(sched?: PlotPaymentSchedule | null): number {
  if (!sched) return 0;
  if (sched.remainingBalance !== undefined && sched.remainingBalance !== null && sched.remainingBalance > 0) {
    return sched.remainingBalance;
  }
  const dueStatuses = ['pending', 'overdue', 'partially_paid'];
  const eligibleTypes = ['plot_downpayment', 'plot_installment', 'plot_biannual', 'plot_possession', 'plot_one_time'];
  const unpaid = (sched.schedule || []).filter(
    (item) => eligibleTypes.includes(item.feeType) && dueStatuses.includes(item.status)
  );
  if (unpaid.length > 0) {
    return unpaid.reduce((sum, item) => sum + Math.max(0, (Number(item.amount) || 0) - (Number(item.paidAmount) || 0)), 0);
  }
  return sched.remainingBalance || sched.totalPrice || 0;
}

function PaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlotParam = searchParams.get('plot');
  const uploadParam = searchParams.get('upload');
  const installmentParam = searchParams.get('installment');

  const initialPlotHandledRef = React.useRef(false);
  const lastInitialPlotParamRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (initialPlotParam !== lastInitialPlotParamRef.current) {
      lastInitialPlotParamRef.current = initialPlotParam;
      if (initialPlotParam) {
        initialPlotHandledRef.current = false;
      }
    }
  }, [initialPlotParam]);

  const { schedules, plots, profile, heldPlots = [], fetchPayments, fetchPlots, fetchProfile, fetchDashboardData, isLoading } = useMemberStore();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [activeTab, setActiveTab] = useState<'installment' | 'one_time'>('installment');
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setHasLoadedOnce(true);
    }
  }, [isLoading]);

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
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);
  const [bottomNotice, setBottomNotice] = useState<{ id: string; type: 'sending' | 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (bottomNotice && bottomNotice.type === 'success') {
      const t = setTimeout(() => {
        setBottomNotice((curr) => (curr?.type === 'success' ? null : curr));
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [bottomNotice]);

  // Unified available plot files for selection in receipts and modal (plots with schedules fallback)
  const availablePlotOptions = React.useMemo(() => {
    let options: any[] = [];
    if (plots && plots.length > 0) {
      options = plots
        .filter((p) => p.hasPaymentPlan !== false && (p.billsCount ?? 1) > 0)
        .map((p) => {
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
      if (!s) return false; // Held plot or plot without schedule cannot be selected
      if (opt.paymentType === 'one_time') {
        // Allow exactly ONE documentation receipt for an already-settled one-time plot
        const alreadySubmitted = receipts.some((r) => r.plotId === opt.id);
        return !alreadySubmitted;
      }
      return s.schedule.some((item) => item.status === 'pending' || item.status === 'overdue' || item.status === 'partially_paid');
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
    const activeSched = schedules.find((s) => s.plotId === formPlotId);
    const nextBill = getNextUnpaidBill(activeSched);
    const nextBillUnpaid = nextBill
      ? Math.max(0, (Number(nextBill.amount) || 0) - (Number(nextBill.paidAmount) || 0))
      : 0;
    const totalOwed = getTotalStillOwed(activeSched);

    if (isNaN(numAmt) || numAmt <= 0) {
      setPreviewData(null);
      setBalloonError(null);
      return;
    }

    if (numAmt < nextBillUnpaid) {
      setPreviewData(null);
      setBalloonError(`A balloon payment cannot be smaller than the next bill (PKR ${nextBillUnpaid.toLocaleString()}).`);
      return;
    }

    if (numAmt > totalOwed) {
      setPreviewData(null);
      setBalloonError(`A balloon payment cannot exceed the total balance owed on the plot (PKR ${totalOwed.toLocaleString()}).`);
      return;
    }

    setBalloonError(null);
    setIsPreviewLoading(true);
    const t = setTimeout(async () => {
      try {
        const bookingId = (activeSched as any)?.bookingId || (activeSched as any)?.id;
        const res = await runLane1({
          screen: 'member-payments-balloon',
          fn: async (signal) => getBalloonPreview(formPlotId, numAmt, bookingId, signal),
        });
        if (res.ok && res.data) {
          setPreviewData(res.data);
          setBalloonError(null);
        } else {
          setPreviewData(null);
          setBalloonError(res.message || res.error || 'Failed to calculate balloon preview.');
        }
      } catch (err: any) {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          setPreviewData(null);
          setBalloonError('Failed to calculate balloon preview.');
        }
      } finally {
        setIsPreviewLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [formAmount, formPaymentKind, formPaymentType, formPlotId, schedules]);

  const loadReceipts = useCallback(async (isBackground = false) => {
    if (profile?.id) {
      const runner = isBackground
        ? (fn: (signal?: AbortSignal) => Promise<any>) => runLane2({ screen: 'member-payments-receipts', isRefresh: true, fn })
        : (fn: (signal?: AbortSignal) => Promise<any>) => runLane1({ screen: 'member-payments-receipts', fn });
      try {
        const data = await runner(async (signal) => getCustomerReceipts(profile.id, signal));
        if (data) {
          setReceipts(data);
        }
      } catch (err: any) {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          // non-blocking
        }
      }
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

  // Real-time 30-second background refresh via Lane 2
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchPayments(undefined, true);
      fetchPlots(true);
      loadReceipts(true);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchPayments, fetchPlots, loadReceipts]);

  // Visibilitychange listener for instant sync with 30s throttle
  useEffect(() => {
    let lastRefreshTime = Date.now();
    
    const handleSyncRefresh = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastRefreshTime > 30000) {
          lastRefreshTime = now;
          fetchPayments(undefined, true);
          loadReceipts(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleSyncRefresh);
    return () => {
      document.removeEventListener('visibilitychange', handleSyncRefresh);
    };
  }, [fetchPayments, loadReceipts]);

  useEffect(() => {
    if (schedules.length > 0) {
      if (initialPlotParam && !initialPlotHandledRef.current) {
        const matchingSchedule = schedules.find((s) => s.plotId === initialPlotParam);
        if (matchingSchedule) {
          initialPlotHandledRef.current = true;
          const isOneTime = matchingSchedule.paymentType === 'one_time';
          setActiveTab(isOneTime ? 'one_time' : 'installment');
          setSelectedPlotId(matchingSchedule.plotId);
          setFormPlotId(matchingSchedule.plotId);
          setFormPaymentType(isOneTime ? 'one_time' : 'installment');
          setFormPaymentKind('regular');
          if (isOneTime) {
            setFormAmount(String(getTotalStillOwed(matchingSchedule)));
            setFormInstallmentNo(1);
          } else {
            const nextBill = getNextUnpaidBill(matchingSchedule);
            if (nextBill) {
              setFormInstallmentNo(nextBill.installmentNumber || 0);
              const unpaid = Math.max(0, (Number(nextBill.amount) || 0) - (Number(nextBill.paidAmount) || 0));
              setFormAmount(String(unpaid));
            }
          }
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
      const sched = schedules.find((s) => s.plotId === defaultPlot.id);
      const isOneTime = (defaultPlot.paymentType || sched?.paymentType) === 'one_time';
      setFormPaymentType(isOneTime ? 'one_time' : 'installment');
      setFormPaymentKind('regular');
      if (isOneTime) {
        setFormAmount(String(getTotalStillOwed(sched)));
        setFormInstallmentNo(1);
      } else {
        const nextBill = getNextUnpaidBill(sched);
        if (nextBill) {
          setFormInstallmentNo(nextBill.installmentNumber || 0);
          const unpaid = Math.max(0, (Number(nextBill.amount) || 0) - (Number(nextBill.paidAmount) || 0));
          setFormAmount(String(unpaid));
        }
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

  const handleBackToList = () => {
    setSelectedPlotId(null);
    initialPlotHandledRef.current = true;
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('plot');
      url.searchParams.delete('upload');
      url.searchParams.delete('installment');
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    }
    router.replace('/society-members/payments');
  };

  const handleTabChange = (tab: 'installment' | 'one_time') => {
    setActiveTab(tab);
    setSelectedPlotId(null);
    initialPlotHandledRef.current = true;
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('plot');
      url.searchParams.delete('upload');
      url.searchParams.delete('installment');
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    }
    router.replace('/society-members/payments');
  };

  const openUploadModalWithPlot = (plotId?: string, installmentNo?: number, amount?: number) => {
    const targetPlotId = plotId || selectedPlotId || (availablePlotOptions.length > 0 ? availablePlotOptions[0].id : '');
    setFormPlotId(targetPlotId);

    const targetPlot = availablePlotOptions.find((p) => p.id === targetPlotId);
    const sched = schedules.find((s) => s.plotId === targetPlotId);
    const effectivePaymentType = targetPlot?.paymentType || sched?.paymentType || 'installment';
    setFormPaymentType(effectivePaymentType === 'one_time' ? 'one_time' : 'installment');
    setFormPaymentKind('regular');

    if (effectivePaymentType === 'one_time') {
      const fullUnpaid = getTotalStillOwed(sched);
      setFormAmount(String(fullUnpaid));
      setFormInstallmentNo(1);
    } else {
      const nextBill = getNextUnpaidBill(sched);
      if (nextBill) {
        setFormInstallmentNo(nextBill.installmentNumber || 0);
        const outstanding = Math.max(0, (Number(nextBill.amount) || 0) - (Number(nextBill.paidAmount) || 0));
        setFormAmount(String(outstanding));
      } else {
        setFormInstallmentNo(installmentNo || 1);
        setFormAmount(amount !== undefined ? String(amount) : '0');
      }
    }

    setUploadError(null);
    setUploadSuccess(null);
    setBalloonError(null);
    setShowUploadModal(true);
  };

  // Auto-open upload modal if ?upload=true is passed via URL
  useEffect(() => {
    if (uploadParam === 'true' && schedules.length > 0) {
      openUploadModalWithPlot(
        initialPlotParam || undefined,
        installmentParam ? Number(installmentParam) : undefined
      );
    }
  }, [uploadParam, initialPlotParam, installmentParam, schedules.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedReceiptFile(file);
    setFormFileName(file.name);
    setUploadError(null);
  };

  const handleReceiptSubmit = async (e?: React.FormEvent, retrySub?: any) => {
    if (e) e.preventDefault();
    if (isSubmittingReceipt) return;
    setUploadError(null);
    setUploadSuccess(null);

    const session = getActiveSession();
    const activeCustomerId = profile?.id || session?.customerId;
    if (!activeCustomerId) {
      setUploadError('Active member session not found. Please log in again.');
      return;
    }

    const amountNum = retrySub ? Number(retrySub.amount) : Number(formAmount);
    const plotIdToUse = retrySub ? retrySub.plotId : formPlotId;
    const txnRefToUse = retrySub ? retrySub.transactionRef : formTxnRef.trim();
    const fileToUpload = retrySub?._rawFile || selectedReceiptFile;

    if (!plotIdToUse) {
      setUploadError('Please select a property plot file.');
      return;
    }

    const targetSched = schedules.find((s) => s.plotId === plotIdToUse);
    const effectivePaymentType = targetSched?.paymentType || (retrySub ? retrySub.paymentType : formPaymentType);
    const effectivePaymentKind = retrySub ? retrySub.paymentKind : formPaymentKind;

    if (isNaN(amountNum) || amountNum <= 0) {
      setUploadError('Please enter a valid deposited amount (PKR).');
      return;
    }

    if (effectivePaymentType === 'installment') {
      const nextBill = getNextUnpaidBill(targetSched);
      const unpaidOnNextBill = nextBill
        ? Math.max(0, (Number(nextBill.amount) || 0) - (Number(nextBill.paidAmount) || 0))
        : 0;
      const totalStillOwed = getTotalStillOwed(targetSched);

      if (effectivePaymentKind === 'balloon') {
        if (amountNum < unpaidOnNextBill) {
          setUploadError(`A balloon payment cannot be smaller than the next bill (PKR ${unpaidOnNextBill.toLocaleString()}).`);
          return;
        }
        if (amountNum > totalStillOwed) {
          setUploadError(`A balloon payment cannot exceed the total balance owed on the plot (PKR ${totalStillOwed.toLocaleString()}).`);
          return;
        }
      } else {
        if (unpaidOnNextBill > 0 && Math.abs(amountNum - unpaidOnNextBill) > 0.01) {
          setUploadError(`Regular payment must be exactly what is still unpaid on the next bill (PKR ${unpaidOnNextBill.toLocaleString()}).`);
          return;
        }
      }
    } else if (effectivePaymentType === 'one_time') {
      if (effectivePaymentKind === 'balloon') {
        setUploadError('Balloon payments are not permitted on full-payment plots.');
        return;
      }
      const totalStillOwed = getTotalStillOwed(targetSched);
      if (totalStillOwed > 0 && Math.abs(amountNum - totalStillOwed) > 0.01) {
        setUploadError(`Deposited amount must be the full amount still unpaid on this plot (PKR ${totalStillOwed.toLocaleString()}).`);
        return;
      }
    }

    if (!txnRefToUse) {
      setUploadError('Please enter the Challan / Trx Reference.');
      return;
    }

    if (!fileToUpload && !retrySub?.receiptFileUrl) {
      setUploadError('Please select and upload your bank deposit receipt image or document.');
      return;
    }

    const tempReceiptId = retrySub?.id || `rcpt-temp-${Date.now()}`;
    const matchedPlot = availablePlotOptions.find((p) => p.id === plotIdToUse);

    const optimisticReceipt: ReceiptSubmission = {
      id: tempReceiptId,
      customerId: activeCustomerId,
      customerName: profile?.fullName || session?.fullName || 'Valued Member',
      membershipNo: profile?.membershipNo || (session as any)?.membershipNo || '',
      plotId: plotIdToUse,
      plotNumber: matchedPlot?.plotNumber || retrySub?.plotNumber || '',
      blockName: matchedPlot?.blockName || retrySub?.blockName || '',
      paymentType: retrySub ? retrySub.paymentType : formPaymentType,
      installmentNumber: (retrySub ? retrySub.paymentType : formPaymentType) === 'installment'
        ? Number(retrySub ? retrySub.installmentNumber : formInstallmentNo)
        : undefined,
      amount: amountNum,
      depositoryBank: retrySub ? retrySub.depositoryBank : formBankName,
      bankName: retrySub ? retrySub.bankName : formBankName,
      transactionRef: txnRefToUse,
      paymentDate: retrySub ? retrySub.paymentDate : formDate,
      uploadedAt: new Date().toISOString(),
      receiptFileUrl: '',
      receiptFileName: fileToUpload?.name || formFileName || 'deposit_receipt.jpg',
      notes: retrySub ? retrySub.notes : formNotes,
      status: 'Sending' as any,
      paymentKind: retrySub ? retrySub.paymentKind : formPaymentKind,
    };

    // Add the receipt to the member's list at once with status Sending
    setReceipts((prev) => {
      const idx = prev.findIndex((r) => r.id === tempReceiptId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...optimisticReceipt, _rawFile: fileToUpload } as any;
        return copy;
      }
      return [{ ...optimisticReceipt, _rawFile: fileToUpload } as any, ...prev];
    });

    // Clear any previous error and show busy state immediately on the form
    setUploadError(null);
    setIsSubmittingReceipt(true);

    // Run upload & submission in Lane 1 with isSave: true
    (async () => {
      try {
        await runLane1({
          screen: 'member-payments-receipt',
          isSave: true,
          fn: async () => {
            let storageKey = retrySub?.receiptFileUrl;
            if (!storageKey || storageKey.startsWith('data:') || storageKey.startsWith('blob:')) {
              if (!fileToUpload) {
                throw new Error('Receipt file is required.');
              }
              const uploadRes = await uploadReceiptFileToStorage(fileToUpload);
              if (!uploadRes.ok || !uploadRes.storageKey) {
                throw new Error(uploadRes.error || 'Failed to upload receipt file to storage.');
              }
              storageKey = uploadRes.storageKey;
            }

            const res = await submitPaymentReceipt(activeCustomerId, {
              plotId: optimisticReceipt.plotId,
              paymentType: optimisticReceipt.paymentType as any,
              installmentNumber: optimisticReceipt.installmentNumber,
              amount: optimisticReceipt.amount,
              depositoryBank: optimisticReceipt.depositoryBank,
              bankName: optimisticReceipt.depositoryBank,
              transactionRef: optimisticReceipt.transactionRef,
              paymentDate: optimisticReceipt.paymentDate,
              receiptFileUrl: storageKey, // Save only storage key!
              receiptFileName: optimisticReceipt.receiptFileName,
              notes: optimisticReceipt.notes,
              paymentKind: (optimisticReceipt as any).paymentKind,
              previewData: previewData,
            });

            if (res.ok && res.receipt) {
              const accepted = res.receipt;
              // Quickly close the form modal upon successful submission
              setShowUploadModal(false);
              if (!retrySub) {
                setFormTxnRef('');
                setFormAmount('');
                setFormNotes('');
                setFormFileName('');
                setSelectedReceiptFile(null);
                setPreviewData(null);
                setBalloonError(null);
              }
              setUploadError(null);

              setReceipts((prev) =>
                prev.map((r) =>
                  r.id === tempReceiptId
                    ? { ...accepted, status: 'pending' as const }
                    : r
                )
              );
              setBottomNotice({
                id: tempReceiptId,
                type: 'success',
                message: 'Receipt sent for verification',
              });

              // Refresh payments, plots, dashboard in background AFTER notice is up
              fetchPayments(undefined, true);
              fetchPlots(true);
              fetchDashboardData(true);
              loadReceipts(true);
            } else {
              const errMsg = res.message || res.error || 'Failed to submit receipt.';
              setUploadError(errMsg);
              setReceipts((prev) =>
                prev.map((r) =>
                  r.id === tempReceiptId
                    ? {
                        ...r,
                        status: 'rejected' as const,
                        rejectionReason: errMsg,
                        canRetry: true,
                        _rawFile: fileToUpload,
                      }
                    : r
                )
              );
              setBottomNotice({
                id: tempReceiptId,
                type: 'error',
                message: errMsg,
              });
            }
          },
        });
      } catch (err: any) {
        const errMsg = err?.message || 'Failed to upload receipt.';
        setUploadError(errMsg);
        setReceipts((prev) =>
          prev.map((r) =>
            r.id === tempReceiptId
              ? {
                  ...r,
                  status: 'rejected' as const,
                  rejectionReason: errMsg,
                  canRetry: true,
                  _rawFile: fileToUpload,
                }
              : r
          )
        );
        setBottomNotice({
          id: tempReceiptId,
          type: 'error',
          message: errMsg,
        });
      } finally {
        setIsSubmittingReceipt(false);
      }
    })();
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <MemberHeader
        title="Payments & Ledger"
        subtitle="Independent plot payment schedules, receipts & verified slips"
      />

      <main className="px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:p-8 max-w-7xl w-full mx-auto space-y-3 sm:space-y-8">
        {isLoading && schedules.length === 0 ? (
          <div className="space-y-6">
            {/* ── Top-Level Payment Type Tabs (Equal buttons in 1 row) ── */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 border-b border-black/[0.08] pb-3">
              <button
                type="button"
                onClick={() => handleTabChange('installment')}
                className={`w-full sm:w-auto min-h-[44px] justify-center px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'installment'
                    ? 'bg-[#43612B] text-white shadow-[0_4px_16px_rgba(67,97,43,0.25)]'
                    : 'bg-white text-[#6B7462] hover:text-[#151914] border border-black/[0.08] hover:bg-black/5'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Installment</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('one_time')}
                className={`w-full sm:w-auto min-h-[44px] justify-center px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'one_time'
                    ? 'bg-[#43612B] text-white shadow-[0_4px_16px_rgba(67,97,43,0.25)]'
                    : 'bg-white text-[#6B7462] hover:text-[#151914] border border-black/[0.08] hover:bg-black/5'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Full Payment</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-2 animate-pulse">
                  <div className="h-3.5 w-28 bg-slate-200 rounded" />
                  <div className="h-8 w-36 bg-slate-200 rounded-xl" />
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.08] p-6 shadow-xs space-y-4 animate-pulse">
              <div className="h-6 w-48 bg-slate-200 rounded" />
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl w-full" />
                ))}
              </div>
            </div>
          </div>
        ) : schedules.length === 0 ? (
          heldPlots.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-amber-50/80 rounded-2xl sm:rounded-3xl border border-amber-200 p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-base sm:text-lg text-amber-950">
                      Plots on Administrative Hold
                    </h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      You have {heldPlots.length} property plot{heldPlots.length > 1 ? 's' : ''} currently held pending payment plan finalization by the society administration. No bills have been issued, and no payments are due at this time.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {heldPlots.map((hp) => (
                    <div
                      key={hp.plotId}
                      className="bg-white rounded-xl p-4 border border-amber-200/80 shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                            {hp.blockName}
                          </span>
                          <h5 className="font-display font-bold text-base text-[#151914]">
                            Plot {hp.plotNumber}
                          </h5>
                          <p className="text-xs text-[#6B7462]">{hp.size}</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          Hold Active
                        </span>
                      </div>
                      <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs text-[#6B7462]">
                        <span>Amount Owed: <strong className="text-[#151914] font-mono">PKR 0</strong></span>
                        <span className="font-semibold text-amber-700">Awaiting Plan</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Single unified empty state for zero-plot accounts */
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/[0.08] p-6 sm:p-12 text-center space-y-3 sm:space-y-4 shadow-xs">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FAF9F5] text-[#6B7462] flex items-center justify-center mx-auto">
                <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-[#43612B]/70" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-base sm:text-lg text-[#151914]">
                  No Properties Linked to Your Account Yet
                </h4>
                <p className="text-xs text-[#6B7462] max-w-md mx-auto leading-relaxed">
                  Once a property is registered to your membership, your payment ledgers and installment schedules will appear here.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/society-members/properties"
                  className="w-full sm:w-auto min-h-[44px] justify-center inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#43612B] text-white text-xs font-bold hover:bg-[#344c22] transition-colors"
                >
                  <span>Check Properties</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-3 sm:space-y-6">
            {/* ── Informational banner for held plots awaiting payment plan ── */}
            {heldPlots.length > 0 && (
              <div className="space-y-2">
                {heldPlots.map((hp) => (
                  <div
                    key={hp.plotId}
                    className="rounded-2xl p-3.5 sm:p-4 border border-amber-200 bg-amber-50/80 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                            Held Plot • Pending Plan
                          </span>
                          <span className="text-xs font-bold text-amber-950">
                            Plot {hp.plotNumber} ({hp.blockName}, {hp.size})
                          </span>
                        </div>
                        <p className="text-xs text-amber-800">
                          On administrative hold awaiting payment plan assignment by society office. Amount owed: <strong className="font-mono text-amber-950">PKR 0</strong>.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-100/90 text-amber-800 border border-amber-300/50 shrink-0">
                      Plan Pending Finalization
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* ── Top-Level Payment Type Tabs (Equal buttons in 1 row) ── */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 border-b border-black/[0.08] pb-3">
              <button
                type="button"
                onClick={() => handleTabChange('installment')}
                className={`w-full sm:w-auto min-h-[44px] justify-center px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'installment'
                    ? 'bg-[#43612B] text-white shadow-[0_4px_16px_rgba(67,97,43,0.25)]'
                    : 'bg-white text-[#6B7462] hover:text-[#151914] border border-black/[0.08] hover:bg-black/5'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Installment</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('one_time')}
                className={`w-full sm:w-auto min-h-[44px] justify-center px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'one_time'
                    ? 'bg-[#43612B] text-white shadow-[0_4px_16px_rgba(67,97,43,0.25)]'
                    : 'bg-white text-[#6B7462] hover:text-[#151914] border border-black/[0.08] hover:bg-black/5'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Full Payment</span>
              </button>
            </div>

            {/* ── Upcoming Installment Payment Alert (Only on Installment tab, below tab pills) ── */}
            {activeTab === 'installment' && upcomingAlert && (
              <div
                className={`rounded-2xl p-3.5 sm:p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-sm transition-all ${
                  upcomingAlert.isOverdue
                    ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                    : 'bg-[#FAF9F5] border-[#43612B]/30 text-[#151914]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
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
                  className={`w-full sm:w-auto min-h-[44px] justify-center shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
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

            {/* ── Sub-view: Empty Tab State OR Plot List OR Selected Plot Ledger ── */}
            {currentTabPlots.length === 0 ? (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/[0.08] p-6 sm:p-10 text-center space-y-3 shadow-xs">
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
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#6B7462] font-medium truncate mr-2">
                    Select a plot below to view its isolated payment schedule:
                  </p>
                  <span className="text-xs font-semibold text-[#151914] shrink-0">
                    {currentTabPlots.length} {currentTabPlots.length === 1 ? 'Plot' : 'Plots'} Found
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
                        className="bg-white rounded-2xl border border-black/[0.08] p-3.5 sm:p-5 shadow-xs hover:border-[#43612B]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group min-w-0"
                      >
                        <div className="space-y-2.5 sm:space-y-3">
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#43612B] block truncate">
                                {plotSchedule.blockName}
                              </span>
                              <h3 className="font-display font-bold text-base sm:text-lg text-[#151914] group-hover:text-[#43612B] transition-colors leading-tight truncate">
                                Plot {plotSchedule.plotNumber}
                              </h3>
                              <p className="text-xs text-[#6B7462] truncate">{plotSchedule.size}</p>
                            </div>

                            {/* Status Chip */}
                            {isInstallment ? (
                              hasOverdue ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 sm:py-1 rounded-full bg-red-50 text-red-700 border border-red-200 shrink-0">
                                  <AlertCircle className="w-3 h-3" />
                                  {overdueCount} Overdue
                                </span>
                              ) : paidCount === totalCount && totalCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Settled
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 sm:py-1 rounded-full bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20 shrink-0">
                                  {paidCount} of {totalCount} Paid
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                Settled
                              </span>
                            )}
                          </div>

                          {/* Compact Money Row (3 figures in 1 row on mobile >=380px and desktop) */}
                          <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4 py-2 sm:py-3 border-t border-black/[0.05]">
                            <div className="min-w-0">
                              <span className="text-[11px] text-[#6B7462] uppercase tracking-wider block font-bold truncate">
                                Total Price
                              </span>
                              <span className="font-bold text-base text-[#151914] tabular-nums truncate block">
                                {formatPKR(plotSchedule.totalPrice)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] text-[#6B7462] uppercase tracking-wider block font-bold truncate">
                                Total Paid
                              </span>
                              <span className="font-bold text-base text-[#43612B] tabular-nums truncate block">
                                {formatPKR(plotSchedule.paidAmount)}
                              </span>
                            </div>
                            <div className="min-w-0 col-span-2 min-[380px]:col-span-1 sm:col-span-1">
                              <span className="text-[11px] text-[#6B7462] uppercase tracking-wider block font-bold truncate">
                                Remaining
                              </span>
                              <span className="font-bold text-base text-[#151914] tabular-nums truncate block">
                                {formatPKR(plotSchedule.remainingBalance)}
                              </span>
                            </div>
                          </div>

                          {/* Dynamic Payment Progress Track */}
                          {(() => {
                            const plotPct = (() => {
                              if (plotSchedule.totalPrice <= 0) return 0;
                              if (plotSchedule.remainingBalance <= 0) return 100;
                              const raw = Math.floor((plotSchedule.paidAmount / plotSchedule.totalPrice) * 100);
                              return Math.min(99, Math.max(0, raw));
                            })();
                            return (
                              <div className="pt-1 space-y-1">
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

                        <div className="mt-2.5 pt-2.5 border-t border-black/[0.05] flex items-center justify-between w-full text-xs text-[#43612B] font-bold min-h-[44px]">
                          <span>View Detailed Ledger &amp; Schedule</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Per-Plot Ledger View */
              <div className="space-y-3 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#43612B] bg-[#EAF0E7] hover:bg-[#d8e4d3] transition-colors border border-[#43612B]/20 cursor-pointer"
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
                          className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-[#43612B] hover:bg-[#365222] text-white flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
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

                <div className="space-y-3 sm:space-y-6">
                  {/* Financial Summary Card */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/[0.08] p-3.5 sm:p-8 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-black/[0.06]">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#43612B]">
                          Plot Account Breakdown
                        </span>
                        <h3 className="font-display font-bold text-lg sm:text-2xl text-[#151914] mt-0.5">
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

                    {(() => {
                      const isBalloonTarget =
                        formPaymentKind === 'balloon' &&
                        formPlotId === activeSchedule.plotId &&
                        Number(formAmount) > 0 &&
                        Boolean(previewData) &&
                        !balloonError;
                      const balloonAmount = Number(formAmount) || 0;
                      const previewPaid = activeSchedule.paidAmount + balloonAmount;
                      const previewRemaining = Math.max(0, activeSchedule.remainingBalance - balloonAmount);

                      const pendingAmount = receipts
                        .filter(
                          (r) =>
                            ((r as any).plotId === activeSchedule.plotId || (r as any).bookingId === (activeSchedule as any).bookingId) &&
                            r.status === 'pending'
                        )
                        .reduce((sum, r) => sum + Number(r.amount), 0);

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 pt-3 sm:pt-6">
                          <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04]">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
                              Total Plot Price
                            </p>
                            <p className="font-display font-bold text-xl sm:text-2xl text-[#151914] mt-1">
                              {formatPKR(activeSchedule.totalPrice)}
                            </p>
                          </div>

                          <div className="bg-[#EAF0E7]/60 p-4 rounded-2xl border border-[#43612B]/15 flex flex-col justify-between">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[#43612B]">
                                Total Paid to Date
                              </p>
                              <p className="font-display font-bold text-xl sm:text-2xl text-[#43612B] mt-1">
                                {formatPKR(activeSchedule.paidAmount)}
                              </p>
                            </div>
                            {isBalloonTarget ? (
                              <div className="mt-3 pt-2.5 border-t border-[#43612B]/20">
                                <div className="flex items-baseline justify-between text-xs font-bold text-[#43612B]">
                                  <span>Preview Paid:</span>
                                  <span className="font-mono text-sm text-[#151914]">{formatPKR(previewPaid)}</span>
                                </div>
                                <p className="text-[10px] text-[#43612B] font-medium mt-0.5">
                                  Preview — applied after admin verifies this receipt
                                </p>
                              </div>
                            ) : pendingAmount > 0 ? (
                              <p className="text-[11px] text-amber-700 font-semibold mt-2">
                                Rs {pendingAmount.toLocaleString()} pending verification
                              </p>
                            ) : null}
                          </div>

                          <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] flex flex-col justify-between">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
                                Remaining Balance
                              </p>
                              <p className="font-display font-bold text-xl sm:text-2xl text-[#151914] mt-1">
                                {formatPKR(activeSchedule.remainingBalance)}
                              </p>
                            </div>
                            {isBalloonTarget ? (
                              <div className="mt-3 pt-2.5 border-t border-black/10">
                                <div className="flex items-baseline justify-between text-xs font-bold text-slate-700">
                                  <span>Preview Remaining:</span>
                                  <span className="font-mono text-sm text-[#151914]">{formatPKR(previewRemaining)}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  Preview — applied after admin verifies this receipt
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })()}
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

                      </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* RECEIPT UPLOAD MODAL DIALOG                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-black/10 shadow-2xl p-4 sm:p-6 md:p-8 space-y-5 my-auto animate-scale-in max-h-[100dvh] overflow-y-auto">
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

            {isSubmittingReceipt && (
              <div className="p-3.5 rounded-xl bg-[#EAF0E7] border border-[#43612B]/30 text-[#43612B] text-xs flex items-center gap-2.5 animate-pulse">
                <div className="w-4 h-4 border-2 border-[#43612B]/30 border-t-[#43612B] rounded-full animate-spin shrink-0" />
                <div>
                  <span className="font-bold block">Submitting payment receipt...</span>
                  <span className="text-[11px] text-[#6B7462]">Please wait while your payment details are being transmitted for verification.</span>
                </div>
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
                      const sched = schedules.find((s) => s.plotId === newPlotId);
                      const isOneTime = (selected?.paymentType || sched?.paymentType) === 'one_time';
                      setFormPaymentType(isOneTime ? 'one_time' : 'installment');
                      setFormPaymentKind('regular');
                      setBalloonError(null);
                      setPreviewData(null);

                      if (isOneTime) {
                        setFormAmount(String(getTotalStillOwed(sched)));
                        setFormInstallmentNo(1);
                      } else {
                        const nextBill = getNextUnpaidBill(sched);
                        if (nextBill) {
                          setFormInstallmentNo(nextBill.installmentNumber || 0);
                          const unpaid = Math.max(0, (Number(nextBill.amount) || 0) - (Number(nextBill.paidAmount) || 0));
                          setFormAmount(String(unpaid));
                        } else {
                          setFormAmount('0');
                          setFormInstallmentNo(1);
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

                {/* Payment Nature & Kind */}
                {formPaymentType === 'one_time' ? (
                  <>
                    {/* Locked Payment Type */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                          Payment Type
                        </label>
                        <span className="text-[10px] text-[#6B7462] flex items-center gap-1 font-medium">
                          <ShieldCheck className="w-3 h-3 text-[#43612B]" />
                          Locked
                        </span>
                      </div>
                      <input
                        type="text"
                        value="Full Payment"
                        disabled
                        readOnly
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl bg-black/5 text-[#6B7462] cursor-not-allowed font-medium"
                      />
                    </div>

                    {/* Locked Payment Kind (No Balloon on full-payment plot) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                          Payment Kind
                        </label>
                        <span className="text-[10px] text-[#6B7462] flex items-center gap-1 font-medium">
                          <ShieldCheck className="w-3 h-3 text-[#43612B]" />
                          Locked
                        </span>
                      </div>
                      <input
                        type="text"
                        value="Regular"
                        disabled
                        readOnly
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl bg-black/5 text-[#6B7462] cursor-not-allowed font-medium"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Locked Payment Type for Installment */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                          Payment Type
                        </label>
                        <span className="text-[10px] text-[#6B7462] flex items-center gap-1 font-medium">
                          <ShieldCheck className="w-3 h-3 text-[#43612B]" />
                          Locked
                        </span>
                      </div>
                      <input
                        type="text"
                        value="Installment Plan"
                        disabled
                        readOnly
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl bg-black/5 text-[#6B7462] cursor-not-allowed font-medium"
                      />
                    </div>

                    {/* Payment Kind Dropdown for Installment Plot */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                        Payment Kind
                      </label>
                      <select
                        value={formPaymentKind}
                        onChange={(e) => {
                          const newKind = e.target.value as 'regular' | 'balloon';
                          setFormPaymentKind(newKind);
                          setBalloonError(null);
                          const sched = schedules.find((s) => s.plotId === formPlotId);
                          const nextBill = getNextUnpaidBill(sched);
                          const nextBillUnpaid = nextBill
                            ? Math.max(0, (Number(nextBill.amount) || 0) - (Number(nextBill.paidAmount) || 0))
                            : 0;
                          setFormAmount(String(nextBillUnpaid));
                          if (newKind === 'regular') {
                            setPreviewData(null);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914] cursor-pointer font-medium"
                      >
                        <option value="regular">Regular Installment</option>
                        <option value="balloon">Balloon / Bulk Payment</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Installment Number / Bill Label */}
                {formPaymentType === 'installment' && formPaymentKind === 'regular' && (() => {
                  const currentSched = schedules.find((s) => s.plotId === formPlotId);
                  const currentNextBill = getNextUnpaidBill(currentSched);
                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                          Installment Bill
                        </label>
                        <span className="text-[10px] text-[#6B7462] flex items-center gap-1 font-medium">
                          <ShieldCheck className="w-3 h-3 text-[#43612B]" />
                          Locked
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-[#6B7462]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={getBillLabel(currentNextBill)}
                          disabled
                          readOnly
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl bg-black/5 text-[#6B7462] cursor-not-allowed font-medium"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Deposited Amount */}
                {(() => {
                  const currentSched = schedules.find((s) => s.plotId === formPlotId);
                  const currentNextBill = getNextUnpaidBill(currentSched);
                  const currentUnpaidOnNextBill = currentNextBill
                    ? Math.max(0, (Number(currentNextBill.amount) || 0) - (Number(currentNextBill.paidAmount) || 0))
                    : 0;
                  const currentTotalStillOwed = getTotalStillOwed(currentSched);
                  const isAmountLocked = formPaymentType === 'one_time' || formPaymentKind === 'regular';

                  let dynamicBalloonError: string | null = null;
                  if (formPaymentType === 'installment' && formPaymentKind === 'balloon') {
                    const entered = Number(formAmount);
                    if (!isNaN(entered) && formAmount !== '') {
                      if (entered < currentUnpaidOnNextBill) {
                        dynamicBalloonError = `A balloon payment cannot be smaller than the next bill (PKR ${currentUnpaidOnNextBill.toLocaleString()}).`;
                      } else if (entered > currentTotalStillOwed) {
                        dynamicBalloonError = `A balloon payment cannot exceed the total balance owed on the plot (PKR ${currentTotalStillOwed.toLocaleString()}).`;
                      }
                    }
                  }

                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                          Deposited Amount (PKR)
                        </label>
                        {isAmountLocked && (
                          <span className="text-[10px] text-[#6B7462] flex items-center gap-1 font-medium">
                            <ShieldCheck className="w-3 h-3 text-[#43612B]" />
                            Locked
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        {isAmountLocked && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-[#6B7462]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        )}
                        <input
                          type="number"
                          value={formAmount}
                          onChange={(e) => {
                            if (!isAmountLocked) {
                              setFormAmount(e.target.value);
                            }
                          }}
                          readOnly={isAmountLocked}
                          disabled={isAmountLocked}
                          placeholder={
                            formPaymentKind === 'balloon'
                              ? `Min: PKR ${currentUnpaidOnNextBill.toLocaleString()} • Max: PKR ${currentTotalStillOwed.toLocaleString()}`
                              : 'e.g. 50000'
                          }
                          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl ${
                            isAmountLocked
                              ? 'pl-9 bg-black/5 text-[#6B7462] cursor-not-allowed font-mono font-bold'
                              : 'bg-white text-[#151914] focus:ring-2 focus:ring-[#43612B] font-mono'
                          }`}
                          required
                        />
                      </div>

                      {formPaymentType === 'installment' && formPaymentKind === 'balloon' && (
                        <div className="text-[10px] text-[#6B7462] mt-1 space-y-0.5 leading-snug">
                          <p>
                            <strong>Min Allowed:</strong> PKR {currentUnpaidOnNextBill.toLocaleString()} (Next Bill) •{' '}
                            <strong>Max Allowed:</strong> PKR {currentTotalStillOwed.toLocaleString()} (Total Owed)
                          </p>
                          <p>Allocations apply to oldest unpaid bills first. Verified by society desk.</p>
                        </div>
                      )}

                      {formPaymentType === 'installment' && formPaymentKind === 'balloon' && (balloonError || dynamicBalloonError) && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 mt-1.5 font-medium">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>{dynamicBalloonError || balloonError}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

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
              {/* In-form status & messages directly above the action buttons */}
              {uploadError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{uploadError}</span>
                </div>
              )}

              {isSubmittingReceipt && (
                <div className="p-3.5 rounded-xl bg-[#EAF0E7] border border-[#43612B]/40 text-[#43612B] text-xs flex items-center gap-2.5 shadow-2xs animate-pulse">
                  <div className="w-4 h-4 border-2 border-[#43612B]/30 border-t-[#43612B] rounded-full animate-spin shrink-0" />
                  <div>
                    <span className="font-bold block text-xs sm:text-sm">Submitting payment receipt...</span>
                    <span className="text-[11px] text-[#43612B]/80 font-medium">Please wait while your receipt is transmitted for verification.</span>
                  </div>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3.5 rounded-xl bg-[#EAF0E7] border border-[#43612B]/30 text-[#43612B] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isSubmittingReceipt}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B7462] hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>

                {(() => {
                  const currentSched = schedules.find((s) => s.plotId === formPlotId);
                  const currentNextBill = getNextUnpaidBill(currentSched);
                  const currentUnpaidOnNextBill = currentNextBill
                    ? Math.max(0, (Number(currentNextBill.amount) || 0) - (Number(currentNextBill.paidAmount) || 0))
                    : 0;
                  const currentTotalStillOwed = getTotalStillOwed(currentSched);
                  const isBalloonInvalid = formPaymentType === 'installment' && formPaymentKind === 'balloon' && (
                    Number(formAmount) < currentUnpaidOnNextBill || Number(formAmount) > currentTotalStillOwed || isNaN(Number(formAmount)) || Number(formAmount) <= 0
                  );

                  return (
                    <button
                      type="submit"
                      disabled={isSubmittingReceipt || isCompressing || isBalloonInvalid}
                      className="min-w-[190px] justify-center px-6 py-2.5 rounded-xl bg-[#43612B] hover:bg-[#365222] disabled:opacity-50 text-white font-bold text-xs tracking-wide flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                    >
                      {isSubmittingReceipt ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Uploading…</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Submit for Verification</span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* OFFICIAL A4 VERIFIED PAYMENT SLIP MODAL                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSlipSubmission && (() => {
        const matchedPlot = plots?.find(
          (p) => p.id === activeSlipSubmission.plotId || p.plotNumber === activeSlipSubmission.plotNumber
        ) || schedules?.find(
          (s) => s.plotId === activeSlipSubmission.plotId || s.plotNumber === activeSlipSubmission.plotNumber
        );
        const resolvedPlotNumber = activeSlipSubmission.plotNumber || matchedPlot?.plotNumber;
        const resolvedBlockName =
          activeSlipSubmission.blockName ||
          (matchedPlot as any)?.blockName ||
          (matchedPlot as any)?.blockId;

        const slipFallbacks = {
          customerName: profile?.fullName,
          membershipNo: profile?.membershipNo,
          fatherOrHusbandName: profile?.fatherOrHusbandName,
          cnic: profile?.cnic,
          plotNumber: resolvedPlotNumber,
          blockName: resolvedBlockName,
          plotSize: (matchedPlot as any)?.size,
          plotCategory: (matchedPlot as any)?.category,
        };

        const enrichedSubmission: ReceiptSubmission = {
          ...activeSlipSubmission,
          customerName: activeSlipSubmission.customerName || profile?.fullName || '',
          membershipNo: activeSlipSubmission.membershipNo || profile?.membershipNo || '',
          fatherOrHusbandName: activeSlipSubmission.fatherOrHusbandName || profile?.fatherOrHusbandName || '',
          customerCnic: activeSlipSubmission.customerCnic || profile?.cnic || '',
          plotNumber: resolvedPlotNumber || '',
          blockName: resolvedBlockName || '',
          plotSize: activeSlipSubmission.plotSize || (matchedPlot as any)?.size || '',
          plotCategory: activeSlipSubmission.plotCategory || (matchedPlot as any)?.category || '',
        };

        return (
          <OfficialA4PaymentSlip
            slip={buildSlipDataFromSubmission(enrichedSubmission, slipFallbacks)}
            submission={enrichedSubmission}
            viewMode="customer"
            onClose={() => setActiveSlipSubmission(null)}
          />
        );
      })()}

      {/* Floating Bottom-Right Notice */}
      {bottomNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border bg-white text-xs font-semibold backdrop-blur-md">
          {bottomNotice.type === 'sending' && (
            <div className="w-4 h-4 border-2 border-[#43612B]/30 border-t-[#43612B] rounded-full animate-spin shrink-0" />
          )}
          {bottomNotice.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          {bottomNotice.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className={bottomNotice.type === 'error' ? 'text-rose-900' : 'text-[#151914]'}>
            {bottomNotice.message}
          </span>
          {bottomNotice.type !== 'sending' && (
            <button
              type="button"
              onClick={() => setBottomNotice(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
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
