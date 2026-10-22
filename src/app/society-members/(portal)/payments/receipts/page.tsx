'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MemberHeader } from '@/components/member-portal/MemberHeader';
import { useMemberStore } from '@/lib/store/useMemberStore';
import {
  ReceiptSubmission,
  ReceiptStatus,
} from '@/lib/mock/types';
import {
  getCustomerReceipts,
  submitPaymentReceipt,
  isExecutableReceiptFile,
  DISALLOWED_EXECUTABLE_MESSAGE,
} from '@/lib/dal/receipts';
import { runLane1, runLane2 } from '@/lib/requestLanes';
import { compressAndEncodeReceipt } from '@/lib/utils/imageCompression';
import { toSafeErrorMessage } from '@/lib/safeError';
import {
  OfficialA4PaymentSlip,
  buildSlipDataFromSubmission,
} from '@/components/receipts/OfficialA4PaymentSlip';
import {
  Receipt,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  ArrowLeft,
  X,
  FileText,
  Lock,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { BankCombobox } from '@/components/receipts/BankCombobox';
const formatPKR = (amount: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);

function SubmittedReceiptsContent() {
  const searchParams = useSearchParams();
  const initialPlotParam = searchParams.get('plot');
  const uploadParam = searchParams.get('upload');
  const installmentParam = searchParams.get('installment');
  const reuploadParam = searchParams.get('reupload');

  const { profile, plots, schedules, fetchProfile, fetchPlots, fetchPayments, isLoading } = useMemberStore();

  const [receipts, setReceipts] = useState<ReceiptSubmission[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeSlipSubmission, setActiveSlipSubmission] = useState<ReceiptSubmission | null>(null);
  const [replacesReceipt, setReplacesReceipt] = useState<ReceiptSubmission | null>(null);

  // Upload Form state
  const [formPlotId, setFormPlotId] = useState<string>('');
  const [formPaymentType, setFormPaymentType] = useState<'installment' | 'one_time'>('installment');
  const [formPaymentKind, setFormPaymentKind] = useState<'regular' | 'balloon'>('regular');
  const [formFeeType, setFormFeeType] = useState<string>('plot_installment');
  const [formInstallmentNo, setFormInstallmentNo] = useState<number>(1);
  const [formAmount, setFormAmount] = useState<string>('');
  const [formBankName, setFormBankName] = useState<string>('Meezan Bank Limited');
  const [formTxnRef, setFormTxnRef] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formFileName, setFormFileName] = useState<string>('');
  const [formFileUrl, setFormFileUrl] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);

  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [balloonError, setBalloonError] = useState<string | null>(null);
  const [bottomNotice, setBottomNotice] = useState<{ id: string; type: 'sending' | 'success' | 'error'; message: string } | null>(null);

  // Auto-clear bottom notice
  useEffect(() => {
    if (bottomNotice && bottomNotice.type === 'success') {
      const t = setTimeout(() => {
        setBottomNotice((curr) => (curr?.type === 'success' ? null : curr));
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [bottomNotice]);

  const loadReceiptsData = useCallback(async (isBackground = false) => {
    if (profile?.id) {
      if (!isBackground && !hasLoadedOnce) {
        setLoadingReceipts(true);
      }
      try {
        const runner = isBackground
          ? (fn: (signal?: AbortSignal) => Promise<any>) => runLane2({ screen: 'member-submitted-receipts', isRefresh: true, fn })
          : (fn: (signal?: AbortSignal) => Promise<any>) => runLane1({ screen: 'member-submitted-receipts', fn });
        const data = await runner(async (signal) => getCustomerReceipts(profile.id, signal));
        if (Array.isArray(data)) {
          setReceipts(data);
        }
      } catch (err: any) {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          // non-blocking
        }
      } finally {
        if (!isBackground) {
          setLoadingReceipts(false);
          setHasLoadedOnce(true);
        }
      }
    }
  }, [profile?.id, hasLoadedOnce]);

  useEffect(() => {
    fetchProfile();
    fetchPlots();
    fetchPayments();
  }, [fetchProfile, fetchPlots, fetchPayments]);

  useEffect(() => {
    loadReceiptsData();
  }, [loadReceiptsData]);

  // Real-time 30-second background refresh via Lane 2
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadReceiptsData(true);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [loadReceiptsData]);

  // Mark receipts as opened to clear unread badge in sidebar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pv_receipts_last_opened', new Date().toISOString());
      if ('BroadcastChannel' in window) {
        try {
          const channel = new BroadcastChannel('prime-view-sync');
          channel.postMessage({ type: 'RECEIPTS_OPENED' });
          channel.close();
        } catch {
          // ignore
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && receipts.length > 0) {
      localStorage.setItem('pv_receipts_last_opened', new Date().toISOString());
    }
  }, [receipts]);

  // Unified available plot options
  const availablePlotOptions = useMemo(() => {
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
        size: (s as any).size || (s as any).plotSize,
        category: (s as any).category || (s as any).plotCategory,
        paymentType: s.paymentType,
      }));
    }
    return options;
  }, [plots, schedules]);

  // Helper calculation functions for payment locks
  const getNextUnpaidBill = useCallback((sched: any) => {
    if (!sched || !Array.isArray(sched.schedule)) return null;
    const sorted = [...sched.schedule].sort((a, b) => {
      if (a.feeType === 'plot_downpayment' && b.feeType !== 'plot_downpayment') return -1;
      if (b.feeType === 'plot_downpayment' && a.feeType !== 'plot_downpayment') return 1;
      const timeA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const timeB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return (a.installmentNumber || 0) - (b.installmentNumber || 0);
    });
    return sorted.find((item: any) => {
      const outstanding = Math.max(0, (Number(item.amount) || 0) - (Number(item.paidAmount) || 0));
      return outstanding > 0 && item.status !== 'verified' && item.status !== 'approved';
    }) || null;
  }, []);

  const getTotalStillOwed = useCallback((sched: any) => {
    if (!sched) return 0;
    if (sched.paymentType === 'one_time') {
      const remainingBalance = Number(sched.remainingBalance ?? (Number(sched.totalPrice || 0) - Number(sched.paidAmount || 0)));
      return Math.max(0, remainingBalance);
    }
    if (!Array.isArray(sched.schedule)) return 0;
    return sched.schedule.reduce((sum: number, item: any) => {
      const outstanding = Math.max(0, (Number(item.amount) || 0) - (Number(item.paidAmount) || 0));
      return sum + outstanding;
    }, 0);
  }, []);

  const isBiannualReceiptItem = useCallback((item: any): boolean => {
    return (
      item?.feeType === 'plot_biannual' ||
      String(item?.feeType || '').toLowerCase().includes('biannual') ||
      String(item?.label || '').toLowerCase().includes('bi-annual') ||
      String(item?.label || '').toLowerCase().includes('biannual') ||
      String(item?.feeTitle || '').toLowerCase().includes('bi-annual') ||
      String(item?.feeTitle || '').toLowerCase().includes('biannual')
    );
  }, []);

  const getResolvedReceiptInstallmentNo = useCallback((item: any, sched?: any): number => {
    if (!item) return 1;
    if (isBiannualReceiptItem(item)) {
      if (sched && Array.isArray(sched.schedule)) {
        const biannuals = sched.schedule
          .filter(isBiannualReceiptItem)
          .sort((a: any, b: any) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')));
        const idx = biannuals.findIndex((x: any) => (x.id && x.id === item.id) || x.dueDate === item.dueDate);
        if (idx >= 0) return idx + 1;
      }
      return item.installmentNumber || 1;
    }
    return item.installmentNumber || 1;
  }, [isBiannualReceiptItem]);

  // Helper to find unreplaced declined receipt (Rule 6)
  const getFirstUnreplacedDeclinedReceipt = useCallback(() => {
    return (
      receipts.find((r) => {
        if (r.status !== 'rejected') return false;
        const hasReplacement = receipts.some((other) => other.replacesReceiptId === r.id);
        return !hasReplacement;
      }) || null
    );
  }, [receipts]);

  // Helper to get replacement of a receipt
  const getReplacementForReceipt = useCallback(
    (receiptId: string) => {
      return receipts.find((r) => r.replacesReceiptId === receiptId) || null;
    },
    [receipts]
  );

  const openReuploadModal = useCallback(
    (declinedReceipt: ReceiptSubmission) => {
      setReplacesReceipt(declinedReceipt);
      setFormPlotId(declinedReceipt.plotId);
      setFormPaymentType(declinedReceipt.paymentType || 'installment');
      setFormFeeType(declinedReceipt.feeType || 'plot_installment');
      setFormInstallmentNo(declinedReceipt.installmentNumber || 1);
      setFormPaymentKind('regular');
      setFormAmount(String(declinedReceipt.amount));
      setFormBankName(declinedReceipt.depositoryBank || declinedReceipt.bankName || 'Meezan Bank Limited');
      setFormTxnRef('');
      setFormDate(new Date().toISOString().split('T')[0]);
      setSelectedReceiptFile(null);
      setFormFileName('');
      setFormFileUrl('');
      setFormNotes('');
      setUploadError(null);
      setBalloonError(null);
      setShowUploadModal(true);
    },
    []
  );

  const openUploadModal = (plotId?: string, installmentNo?: number, amount?: number) => {
    // Rule 6: Upload New Receipt, when this member still has a declined slip with no replacement uploaded yet,
    // opens the re-upload of that declined slip first and asks for that image. It does not start a different bill.
    const unreplacedDeclined = getFirstUnreplacedDeclinedReceipt();
    if (unreplacedDeclined) {
      openReuploadModal(unreplacedDeclined);
      return;
    }

    setReplacesReceipt(null);
    const targetPlotId = plotId || initialPlotParam || (availablePlotOptions.length > 0 ? availablePlotOptions[0].id : '');
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
      setFormFeeType('plot_one_time');
    } else {
      const nextBill = getNextUnpaidBill(sched);
      if (nextBill) {
        setFormFeeType(nextBill.feeType || 'plot_installment');
        setFormInstallmentNo(getResolvedReceiptInstallmentNo(nextBill, sched));
        const outstanding = Math.max(0, (Number(nextBill.amount) || 0) - (Number(nextBill.paidAmount) || 0));
        setFormAmount(String(outstanding));
      } else {
        setFormFeeType('plot_installment');
        setFormInstallmentNo(installmentNo || 1);
        setFormAmount(amount !== undefined ? String(amount) : '0');
      }
    }

    setUploadError(null);
    setBalloonError(null);
    setSelectedReceiptFile(null);
    setFormFileName('');
    setFormFileUrl('');
    setFormNotes('');
    setShowUploadModal(true);
  };

  // Auto-open modal if ?reupload=id is passed via URL
  useEffect(() => {
    if (reuploadParam && receipts.length > 0) {
      const target = receipts.find((r) => r.id === reuploadParam);
      if (target && target.status === 'rejected') {
        openReuploadModal(target);
      }
    }
  }, [reuploadParam, receipts, openReuploadModal]);

  // Auto-open modal if ?upload=true is passed via URL
  useEffect(() => {
    if (uploadParam === 'true' && schedules.length > 0) {
      openUploadModal(
        initialPlotParam || undefined,
        installmentParam ? Number(installmentParam) : undefined
      );
    }
  }, [uploadParam, initialPlotParam, installmentParam, schedules.length]);

  // Handle plot change in modal
  const handlePlotSelectionChange = (newPlotId: string) => {
    setFormPlotId(newPlotId);
    const targetPlot = availablePlotOptions.find((p) => p.id === newPlotId);
    const sched = schedules.find((s) => s.plotId === newPlotId);
    const effectivePaymentType = targetPlot?.paymentType || sched?.paymentType || 'installment';
    setFormPaymentType(effectivePaymentType === 'one_time' ? 'one_time' : 'installment');
    setFormPaymentKind('regular');

    if (effectivePaymentType === 'one_time') {
      const fullUnpaid = getTotalStillOwed(sched);
      setFormAmount(String(fullUnpaid));
      setFormInstallmentNo(1);
      setFormFeeType('plot_one_time');
    } else {
      const nextBill = getNextUnpaidBill(sched);
      if (nextBill) {
        setFormFeeType(nextBill.feeType || 'plot_installment');
        setFormInstallmentNo(getResolvedReceiptInstallmentNo(nextBill, sched));
        const outstanding = Math.max(0, (Number(nextBill.amount) || 0) - (Number(nextBill.paidAmount) || 0));
        setFormAmount(String(outstanding));
      } else {
        setFormFeeType('plot_installment');
        setFormInstallmentNo(1);
        setFormAmount('');
      }
    }
    setBalloonError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (await isExecutableReceiptFile(file)) {
      setSelectedReceiptFile(null);
      setFormFileName('');
      setUploadError(DISALLOWED_EXECUTABLE_MESSAGE);
      e.target.value = '';
      return;
    }

    setSelectedReceiptFile(file);
    setFormFileName(file.name);
    setUploadError(null);
  };

  const handleReceiptSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingReceipt) return;
    if (!profile) return;

    if (!selectedReceiptFile && !formFileUrl) {
      setUploadError('Please select a photo or scan of your bank deposit slip.');
      return;
    }

    if (selectedReceiptFile && (await isExecutableReceiptFile(selectedReceiptFile))) {
      setUploadError(DISALLOWED_EXECUTABLE_MESSAGE);
      return;
    }

    if (!formPlotId) {
      setUploadError('Please select a plot.');
      return;
    }
    if (!formTxnRef.trim()) {
      setUploadError('Please enter the bank transaction reference / challan number.');
      return;
    }

    const sched = schedules.find((s) => s.plotId === formPlotId);
    const parsedAmount = parseFloat(formAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setUploadError('Please enter a valid positive payment amount.');
      return;
    }

    // Balloon & Re-upload boundary validation
    if (formPaymentKind === 'balloon') {
      const nextBill = getNextUnpaidBill(sched);
      const nextBillOutstanding = nextBill
        ? Math.max(0, (Number(nextBill.amount) || 0) - (Number(nextBill.paidAmount) || 0))
        : 0;
      const totalOwed = getTotalStillOwed(sched);
      const minBalloon = replacesReceipt ? Number(replacesReceipt.amount) : nextBillOutstanding;
      const maxBalloon = replacesReceipt ? Math.max(Number(replacesReceipt.amount), totalOwed) : totalOwed;

      if (minBalloon > 0 && parsedAmount < minBalloon) {
        setBalloonError(`A balloon payment cannot be smaller than the bill amount (${formatPKR(minBalloon)}).`);
        return;
      }
      if (maxBalloon > 0 && parsedAmount > maxBalloon) {
        setBalloonError(`A balloon payment cannot exceed the total balance owed on the plot (${formatPKR(maxBalloon)}).`);
        return;
      }
    } else if (replacesReceipt) {
      const minBill = Number(replacesReceipt.amount);
      if (parsedAmount < minBill) {
        setUploadError(`The minimum payment is the full current bill (${formatPKR(minBill)}). An installment cannot be saved short.`);
        return;
      }
    }

    setIsSubmittingReceipt(true);
    setUploadError(null);
    setBalloonError(null);

    const tempTxnRef = formTxnRef.trim();
    const tempPlotId = formPlotId;
    const tempAmount = parsedAmount;
    const targetPlot = availablePlotOptions.find((p) => p.id === tempPlotId);
    const tempPlotNumber = targetPlot?.plotNumber || '';
    const tempBlockName = targetPlot?.blockName || '';

    const isReupload = Boolean(replacesReceipt);
    const isReuploadBiannual = replacesReceipt && isBiannualReceiptItem(replacesReceipt);
    const uploadBillLabel = replacesReceipt
      ? (isReuploadBiannual
          ? `Bi-Annual #${replacesReceipt.installmentNumber || 1}`
          : replacesReceipt.feeType === 'plot_downpayment'
          ? 'Down Payment'
          : replacesReceipt.feeType === 'plot_possession'
          ? 'Possession'
          : `Installment #${replacesReceipt.installmentNumber || 1}`)
      : (formFeeType === 'plot_biannual' ? `Bi-Annual #${formInstallmentNo}` : `Installment #${formInstallmentNo}`);

    let compressedDataUrl = formFileUrl;
    if (selectedReceiptFile) {
      try {
        setIsCompressing(true);
        compressedDataUrl = await compressAndEncodeReceipt(selectedReceiptFile, 1200, 0.8);
      } catch (err: any) {
        setUploadError('Failed to process image. Please try a different photo.');
        setIsSubmittingReceipt(false);
        setIsCompressing(false);
        return;
      } finally {
        setIsCompressing(false);
      }
    }

    // Optimistic addition
    const tempId = `temp-${Date.now()}`;
    const optimisticReceipt: ReceiptSubmission = {
      id: tempId,
      customerId: profile.id,
      membershipNo: profile.membershipNo,
      customerName: profile.fullName,
      plotId: tempPlotId,
      plotNumber: tempPlotNumber,
      blockName: tempBlockName,
      paymentType: formPaymentType,
      feeType: formFeeType,
      installmentNumber: formPaymentType === 'installment' ? formInstallmentNo : undefined,
      amount: tempAmount,
      depositoryBank: formBankName,
      transactionRef: tempTxnRef,
      paymentDate: formDate,
      uploadedAt: new Date().toISOString(),
      receiptFileUrl: compressedDataUrl,
      receiptFileName: formFileName || 'deposit_receipt.jpg',
      status: 'pending',
      paymentKind: formPaymentKind,
      replacesReceiptId: replacesReceipt ? replacesReceipt.id : undefined,
    };

    setReceipts((prev) => [optimisticReceipt, ...prev.filter((r) => r.id !== tempId)]);
    setBottomNotice({
      id: tempId,
      type: 'sending',
      message: `Uploading ${isReupload ? 'replacement ' : ''}receipt for Plot ${tempPlotNumber} (${uploadBillLabel} - ${formatPKR(tempAmount)})...`,
    });

    try {
      const res = await runLane1({
        screen: 'member-submitted-receipts',
        isSave: true,
        fn: async () =>
          submitPaymentReceipt(profile.id, {
            plotId: tempPlotId,
            paymentType: formPaymentType,
            installmentNumber: formPaymentType === 'installment' ? formInstallmentNo : undefined,
            amount: tempAmount,
            depositoryBank: formBankName,
            transactionRef: tempTxnRef,
            paymentDate: formDate,
            receiptFileUrl: compressedDataUrl,
            receiptFileName: formFileName || 'deposit_receipt.jpg',
            notes: formNotes.trim() || undefined,
            paymentKind: formPaymentKind,
            replacesReceiptId: replacesReceipt ? replacesReceipt.id : undefined,
          }),
      });

      if (res.ok && res.receipt) {
        setShowUploadModal(false);
        setReplacesReceipt(null);
        setReceipts((prev) =>
          prev.map((r) => (r.id === tempId ? { ...res.receipt!, status: 'pending' as const } : r))
        );
        setBottomNotice({
          id: res.receipt.id,
          type: 'success',
          message: `${isReupload ? 'Replacement receipt' : 'Receipt'} for Plot ${tempPlotNumber} (${uploadBillLabel}) submitted successfully! Awaiting admin verification.`,
        });
        loadReceiptsData(true);
      } else {
        const rawErr = `${res.message || ''} ${res.error || ''}`.toLowerCase();
        const isExec =
          rawErr.includes('disallowed_executable_content') ||
          rawErr.includes('program content') ||
          rawErr.includes('disallowed executable');
        const errMsg = isExec
          ? DISALLOWED_EXECUTABLE_MESSAGE
          : toSafeErrorMessage(res.message || 'Failed to submit receipt. Please try again.');
        setShowUploadModal(true);
        setUploadError(errMsg);
        setReceipts((prev) => prev.filter((r) => r.id !== tempId));
        setBottomNotice({
          id: tempId,
          type: 'error',
          message: errMsg,
        });
      }
    } catch (err: any) {
      if (err?.message !== 'REQUEST_SUPERSEDED') {
        const rawErr = (err?.message || '').toLowerCase();
        const isExec =
          rawErr.includes('disallowed_executable_content') ||
          rawErr.includes('program content') ||
          rawErr.includes('disallowed executable');
        const errMsg = isExec
          ? DISALLOWED_EXECUTABLE_MESSAGE
          : toSafeErrorMessage(err?.message || 'Something went wrong. Please try again.');
        setShowUploadModal(true);
        setUploadError(errMsg);
        setReceipts((prev) => prev.filter((r) => r.id !== tempId));
        setBottomNotice({
          id: tempId,
          type: 'error',
          message: errMsg,
        });
      }
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  // Group receipts by plot
  interface PlotReceiptGroup {
    plotId: string;
    plotNumber: string;
    blockName: string;
    plotSize?: string;
    plotCategory?: string;
    receipts: ReceiptSubmission[];
  }

  const groupedReceipts: PlotReceiptGroup[] = useMemo(() => {
    const groupsMap = new Map<string, PlotReceiptGroup>();

    // First create groups for all plots that the member owns
    for (const opt of availablePlotOptions) {
      const key = opt.id;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          plotId: opt.id,
          plotNumber: opt.plotNumber,
          blockName: opt.blockName,
          plotSize: opt.size,
          plotCategory: opt.category,
          receipts: [],
        });
      }
    }

    // Distribute receipts into plot groups
    for (const r of receipts) {
      const key = r.plotId || r.plotNumber;
      let group = groupsMap.get(r.plotId) || groupsMap.get(r.plotNumber);
      if (!group) {
        // Receipt has a plot not currently in availablePlotOptions
        group = {
          plotId: r.plotId || r.plotNumber,
          plotNumber: r.plotNumber || '—',
          blockName: r.blockName || '',
          receipts: [],
        };
        groupsMap.set(key, group);
      }
      group.receipts.push(r);
    }

    // Return groups, prioritizing those that actually have receipts
    const result = Array.from(groupsMap.values());
    // Filter to only plots that have receipts uploaded
    const plotsWithReceipts = result.filter((g) => g.receipts.length > 0);
    // Sort receipts inside each group newest first
    for (const g of plotsWithReceipts) {
      g.receipts.sort((a, b) => {
        const dateA = a.uploadedAt || a.paymentDate || '';
        const dateB = b.uploadedAt || b.paymentDate || '';
        return dateB.localeCompare(dateA);
      });
    }

    return plotsWithReceipts;
  }, [receipts, availablePlotOptions]);

  const modalBillLabel = useMemo(() => {
    if (replacesReceipt) {
      const isBiannual = isBiannualReceiptItem(replacesReceipt);
      if (isBiannual) {
        return `Bi-Annual #${replacesReceipt.installmentNumber || 1}`;
      }
      if (replacesReceipt.paymentType === 'installment') {
        if (replacesReceipt.feeType === 'plot_downpayment') return 'Down Payment';
        if (replacesReceipt.feeType === 'plot_possession') return 'Possession';
        return `Installment #${replacesReceipt.installmentNumber || 1}`;
      }
      return 'Full Payment Settlement';
    }
    if (formPaymentType === 'one_time') return 'Full Balance Settlement';
    if (formFeeType === 'plot_downpayment') return 'Down Payment';
    if (formFeeType === 'plot_possession') return 'Possession';
    if (isBiannualReceiptItem({ feeType: formFeeType })) return `Bi-Annual #${formInstallmentNo}`;
    return `Monthly #${formInstallmentNo}`;
  }, [replacesReceipt, formPaymentType, formFeeType, formInstallmentNo, isBiannualReceiptItem]);

  const totalReceiptsCount = receipts.length;
  const verifiedCount = receipts.filter((r) => r.status === 'verified').length;
  const pendingCount = receipts.filter((r) => r.status === 'pending').length;
  const declinedCount = receipts.filter((r) => r.status === 'rejected').length;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <MemberHeader
        title="Submitted Receipts"
        subtitle="Review and track your uploaded bank deposit receipts and official society verified member slips"
      />

      <main className="px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
        {/* Top Control Bar with Quick Stats & Upload Button */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/[0.08] p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/society-members/payments"
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-black/10 hover:bg-black/5 text-[#6B7462] hover:text-[#151914] transition-colors shrink-0"
              title="Back to Payments &amp; Installment Schedule"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-lg sm:text-xl text-[#151914]">
                  Uploaded Receipts Ledger
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20">
                  {totalReceiptsCount} Total {totalReceiptsCount === 1 ? 'Submission' : 'Submissions'}
                </span>
              </div>
              <p className="text-xs text-[#6B7462]">
                Grouped by plot file. Review approval statuses, download verified A4 slips, or re-upload declined receipts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Quick Status Badges */}
            {verifiedCount > 0 && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{verifiedCount} Verified</span>
              </span>
            )}

            {pendingCount > 0 && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{pendingCount} Pending</span>
              </span>
            )}

            {declinedCount > 0 && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{declinedCount} Declined</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => openUploadModal()}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold bg-[#43612B] hover:bg-[#365222] text-white flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New Receipt</span>
            </button>
          </div>
        </div>

        {/* Content: Grouped by Plot */}
        {loadingReceipts && receipts.length === 0 ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-black/[0.08] p-6 shadow-xs animate-pulse space-y-4"
              >
                <div className="h-6 w-48 bg-slate-200 rounded-lg" />
                <div className="space-y-3">
                  <div className="h-16 bg-slate-100 rounded-2xl" />
                  <div className="h-16 bg-slate-100 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : groupedReceipts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/[0.08] p-10 sm:p-14 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF9F7] border border-black/[0.06] text-[#43612B] flex items-center justify-center mx-auto">
              <Receipt className="w-8 h-8 opacity-60" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-[#151914]">
                No payment receipts submitted yet
              </h3>
              <p className="text-xs text-[#6B7462] max-w-md mx-auto leading-relaxed">
                When you deposit an installment or booking charges at the bank, click &ldquo;Upload New Receipt&rdquo; to submit your deposit slip for official verification.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openUploadModal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#43612B] hover:bg-[#365222] text-white shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Your First Receipt</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedReceipts.map((group) => {
              const heading = `Plot ${group.plotNumber}${group.blockName ? ` (${group.blockName})` : ''}`;

              return (
                <div
                  key={group.plotId}
                  className="bg-white rounded-2xl sm:rounded-3xl border border-black/[0.08] shadow-xs overflow-hidden"
                >
                  {/* Plot Card Heading */}
                  <div className="p-4 sm:p-6 bg-[#FAF9F7] border-b border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center text-[#43612B] shrink-0 shadow-2xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-bold text-base sm:text-lg text-[#151914]">
                            {heading}
                          </h3>
                          {group.plotSize && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-black/[0.08] text-[#4A5347]">
                              {group.plotSize}
                            </span>
                          )}
                          {group.plotCategory && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-black/[0.08] text-[#4A5347]">
                              {group.plotCategory}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B7462]">
                          {group.receipts.length} {group.receipts.length === 1 ? 'receipt submission' : 'receipt submissions'} for this plot
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openUploadModal(group.plotId)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#43612B] hover:bg-[#EAF0E7] bg-white border border-[#43612B]/30 shadow-2xs hover:shadow-xs transition-all cursor-pointer self-start sm:self-center"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload For This Plot</span>
                    </button>
                  </div>

                  {/* List of Receipts for this Plot */}
                  <div className="divide-y divide-black/[0.06] p-2 sm:p-4">
                    {group.receipts.map((sub) => {
                      const isDeclined = sub.status === 'rejected';
                      const isVerified = sub.status === 'verified';
                      const isPending = sub.status === 'pending';

                      return (
                        <div
                          key={sub.id}
                          className="py-4 px-2 sm:px-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-black/[0.01] rounded-2xl transition-colors"
                        >
                          {/* Receipt Details */}
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs sm:text-sm text-[#151914]">
                                {(sub as any).paymentKind === 'balloon'
                                  ? 'Balloon Payment'
                                  : isBiannualReceiptItem(sub)
                                  ? `Bi-Annual #${sub.installmentNumber || 1}`
                                  : sub.paymentType === 'installment'
                                  ? `Installment #${sub.installmentNumber || 1}`
                                  : 'Full Payment Settlement'}
                              </span>

                              <span className="text-xs text-[#6B7462]">&bull;</span>
                              <span className="font-bold text-sm sm:text-base text-[#151914]">
                                {formatPKR(sub.amount)}
                              </span>

                              {/* Status Badge */}
                              {isVerified ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Verified</span>
                                </span>
                              ) : isDeclined ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Declined</span>
                                </span>
                              ) : sub.status === 'cancelled' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                                  <XCircle className="w-3 h-3 text-slate-500" />
                                  <span>Cancelled</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending Admin Verification</span>
                                </span>
                              )}
                            </div>

                            {/* Bank and Transaction Ref */}
                            <div className="text-xs text-[#6B7462] flex items-center gap-2 sm:gap-3 flex-wrap">
                              <span>
                                Bank: <strong className="text-[#151914]">{sub.depositoryBank || sub.bankName || 'N/A'}</strong>
                              </span>
                              <span>&bull;</span>
                              <span>
                                Ref / Challan: <strong className="font-mono text-[#151914]">{sub.transactionRef}</strong>
                              </span>
                              <span>&bull;</span>
                              <span>
                                Deposit Date: <strong className="text-[#151914]">{sub.paymentDate ? String(sub.paymentDate).split('T')[0] : '—'}</strong>
                              </span>
                              {sub.uploadedAt && (
                                <>
                                  <span>&bull;</span>
                                  <span>
                                    Uploaded: {String(sub.uploadedAt).split('T')[0]}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Declined Reason - Shown in Red */}
                            {isDeclined && sub.rejectionReason && (
                              <div className="text-xs text-rose-800 bg-rose-50 p-2.5 sm:p-3 rounded-xl border border-rose-200 font-medium space-y-0.5">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-900">
                                  Reason for Decline:
                                </div>
                                <p className="leading-relaxed text-rose-950">
                                  &ldquo;{sub.rejectionReason}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center gap-2 self-start lg:self-center shrink-0 w-full sm:w-auto">
                            {isVerified && sub.slip ? (
                              <button
                                type="button"
                                onClick={() => setActiveSlipSubmission(sub)}
                                className="w-full sm:w-auto min-h-[44px] justify-center px-4 py-2.5 rounded-xl text-xs font-bold bg-[#43612B] hover:bg-[#365222] text-white flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                <span>View Official Member Slip</span>
                              </button>
                            ) : isDeclined ? (
                              (() => {
                                const rep = getReplacementForReceipt(sub.id);
                                if (rep?.status === 'pending') {
                                  return (
                                    <span className="w-full sm:w-auto min-h-[44px] flex items-center justify-center text-xs text-amber-800 font-semibold px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
                                      <Clock className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
                                      Replacement Under Review
                                    </span>
                                  );
                                }
                                if (rep?.status === 'verified') {
                                  return (
                                    <span className="w-full sm:w-auto min-h-[44px] flex items-center justify-center text-xs text-emerald-800 font-semibold px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                                      Replaced &amp; Verified
                                    </span>
                                  );
                                }
                                if (rep?.status === 'rejected') {
                                  return null;
                                }
                                return (
                                  <button
                                    type="button"
                                    onClick={() => openReuploadModal(sub)}
                                    className="w-full sm:w-auto min-h-[44px] justify-center px-4 py-2 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Re-upload Receipt</span>
                                  </button>
                                );
                              })()
                            ) : isPending ? (
                              <span className="w-full sm:w-auto min-h-[44px] flex items-center justify-center text-xs text-amber-800 font-semibold px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
                                {sub.replacesReceiptId ? 'Replacement Under Review' : 'Under Committee Review'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
                    {replacesReceipt ? 'Re-upload Payment Deposit Receipt' : 'Upload Payment Deposit Receipt'}
                  </h3>
                  <p className="text-xs text-[#6B7462]">
                    {replacesReceipt
                      ? `Re-uploading deposit slip for ${modalBillLabel} (Replacing Ref: ${replacesReceipt.transactionRef})`
                      : 'Submit your bank slip for administrative verification and A4 slip generation.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setReplacesReceipt(null);
                }}
                className="p-1.5 rounded-lg hover:bg-black/5 text-[#6B7462] hover:text-[#151914] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            {balloonError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{balloonError}</span>
              </div>
            )}

            <form onSubmit={handleReceiptSubmit} className="space-y-4">
              {/* Re-upload Context Notice (Rule 2) */}
              {replacesReceipt && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Re-uploading for Declined Bill: {modalBillLabel}</span>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    Previous Slip: <span className="font-mono font-bold">{replacesReceipt.transactionRef}</span> ({replacesReceipt.depositoryBank || replacesReceipt.bankName || 'Bank'}) on {replacesReceipt.paymentDate ? String(replacesReceipt.paymentDate).split('T')[0] : '—'}
                  </p>
                  {replacesReceipt.rejectionReason && (
                    <p className="text-[11px] text-rose-900 font-medium">
                      Decline Reason: &ldquo;{replacesReceipt.rejectionReason}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Plot File Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                  Select Plot File <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formPlotId}
                  disabled={Boolean(replacesReceipt)}
                  onChange={(e) => handlePlotSelectionChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl bg-white text-[#151914] ${
                    replacesReceipt ? 'bg-[#FAF9F7] text-[#4A5347] cursor-not-allowed' : 'focus:ring-2 focus:ring-[#43612B] cursor-pointer'
                  }`}
                  required
                >
                  {availablePlotOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      Plot {opt.plotNumber} ({opt.blockName}){opt.size ? ` - ${opt.size}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Type and Regular/Balloon choice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    Payment Type
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formPaymentType === 'one_time' ? 'Full Payment Settlement' : 'Installment Payment'}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl bg-[#FAF9F7] text-[#4A5347] font-semibold cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    Payment Mode
                  </label>
                  {formPaymentType === 'one_time' ? (
                    <input
                      type="text"
                      readOnly
                      value="Full Outstanding Settlement"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl bg-[#FAF9F7] text-[#4A5347] font-semibold cursor-not-allowed"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormPaymentKind('regular');
                          setBalloonError(null);
                          if (replacesReceipt) {
                            setFormAmount(String(replacesReceipt.amount));
                            return;
                          }
                          const sched = schedules.find((s) => s.plotId === formPlotId);
                          const nextBill = getNextUnpaidBill(sched);
                          if (nextBill) {
                            setFormFeeType(nextBill.feeType || 'plot_installment');
                            setFormInstallmentNo(getResolvedReceiptInstallmentNo(nextBill, sched));
                            const outstanding = Math.max(0, (Number(nextBill.amount) || 0) - (Number(nextBill.paidAmount) || 0));
                            setFormAmount(String(outstanding));
                          }
                        }}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          formPaymentKind === 'regular'
                            ? 'bg-[#43612B] text-white border-[#43612B]'
                            : 'bg-white text-[#4A5347] border-black/10 hover:bg-black/5'
                        }`}
                      >
                        Regular
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormPaymentKind('balloon');
                          setBalloonError(null);
                        }}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          formPaymentKind === 'balloon'
                            ? 'bg-[#43612B] text-white border-[#43612B]'
                            : 'bg-white text-[#4A5347] border-black/10 hover:bg-black/5'
                        }`}
                      >
                        Balloon / Bulk
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Installment number & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    {formPaymentType === 'one_time'
                      ? 'Reference'
                      : replacesReceipt
                      ? 'Target Bill'
                      : formFeeType === 'plot_downpayment'
                      ? 'Down Payment Bill'
                      : formFeeType === 'plot_possession'
                      ? 'Possession Bill'
                      : isBiannualReceiptItem({ feeType: formFeeType })
                      ? 'Bi-Annual Bill'
                      : 'Monthly Installment Bill'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      formPaymentType === 'one_time'
                        ? 'Full Balance Settlement'
                        : modalBillLabel
                    }
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl bg-[#FAF9F7] text-[#4A5347] font-semibold cursor-not-allowed"
                  />
                </div>

                {/* Target Bill Breakdown Notice */}
                {formPaymentType === 'installment' && formPaymentKind === 'regular' && (() => {
                  if (replacesReceipt) {
                    return (
                      <div className="sm:col-span-2 p-3.5 rounded-2xl border text-xs bg-rose-50/70 border-rose-200 text-rose-950">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-xs sm:text-sm">
                            Re-upload Target Bill: {modalBillLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300">
                            Declined Slip Replacement
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#6B7462]">
                          <div>
                            Bill Amount: <span className="font-semibold text-[#151914]">{formatPKR(Number(replacesReceipt.amount))}</span>
                          </div>
                          <div>
                            Original Ref: <span className="font-mono font-bold text-[#151914]">{replacesReceipt.transactionRef}</span>
                          </div>
                          <div>
                            Bank: <span className="font-semibold text-[#151914]">{replacesReceipt.depositoryBank || replacesReceipt.bankName || 'Bank'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  const sched = schedules.find((s) => s.plotId === formPlotId);
                  const nextBill = getNextUnpaidBill(sched);
                  if (!nextBill) return null;
                  const currentUnpaidOnNextBill = Math.max(0, (Number(nextBill.amount) || 0) - (Number(nextBill.paidAmount) || 0));
                  const isPartial = Number(nextBill.paidAmount || 0) > 0 && Number(nextBill.paidAmount || 0) < Number(nextBill.amount || 0);
                  const billLabel =
                    nextBill.feeType === 'plot_downpayment'
                      ? 'Down Payment'
                      : nextBill.feeType === 'plot_possession'
                      ? 'Possession'
                      : isBiannualReceiptItem(nextBill)
                      ? `Bi-Annual #${getResolvedReceiptInstallmentNo(nextBill, sched)}`
                      : `Monthly #${nextBill.installmentNumber || 1}`;

                  return (
                    <div className={`sm:col-span-2 p-3.5 rounded-2xl border text-xs ${
                      isPartial
                        ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                        : 'bg-[#FAF9F5] border-[#43612B]/20 text-[#151914]'
                    }`}>
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-xs sm:text-sm">
                          Target Bill: {billLabel}
                        </span>
                        {isPartial ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                            Partially Paid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF0E7] text-[#43612B]">
                            Next Due
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#6B7462]">
                        <div>
                          Due Date: <span className="font-semibold text-[#151914]">{nextBill.dueDate ? String(nextBill.dueDate).split('T')[0] : '—'}</span>
                        </div>
                        <div>
                          Total Bill: <span className="font-semibold text-[#151914]">{formatPKR(Number(nextBill.amount))}</span>
                        </div>
                        {isPartial && (
                          <div>
                            Paid: <span className="font-semibold text-emerald-800">{formatPKR(Number(nextBill.paidAmount || 0))}</span>
                          </div>
                        )}
                        <div>
                          Remaining Due: <span className="font-bold text-[#43612B]">{formatPKR(currentUnpaidOnNextBill)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    Amount (PKR) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      step="any"
                      readOnly={formPaymentType === 'one_time' || formPaymentKind === 'regular'}
                      value={formAmount}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        setFormAmount(e.target.value);
                        if (balloonError) setBalloonError(null);
                      }}
                      placeholder="0"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl font-bold ${
                        formPaymentType === 'one_time' || formPaymentKind === 'regular'
                          ? 'bg-[#FAF9F7] text-[#43612B] border-black/10 cursor-not-allowed'
                          : 'bg-white text-[#151914] border-black/10 focus:ring-2 focus:ring-[#43612B]'
                      }`}
                    />
                    {(formPaymentType === 'one_time' || formPaymentKind === 'regular') && (
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-[#6B7462] flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#6B7462]" />
                        <span>Fixed Bill</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank & Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    Depository Bank <span className="text-rose-600">*</span>
                  </label>
                  <BankCombobox
                    value={formBankName}
                    onChange={setFormBankName}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                    Bank Ref / Challan # <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTxnRef}
                    onChange={(e) => setFormTxnRef(e.target.value)}
                    placeholder="e.g. MEZN-98234190"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914] font-mono"
                  />
                </div>
              </div>

              {/* Deposit Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                  Deposit Date <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-black/10 rounded-xl focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914]"
                />
              </div>

              {/* File Attachment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                  Bank Deposit Slip Image <span className="text-rose-600">*</span>
                </label>
                <div className="border-2 border-dashed border-black/10 hover:border-[#43612B]/40 rounded-2xl p-4 text-center transition-colors bg-[#FAF9F7]">
                  <input
                    type="file"
                    accept="image/*"
                    id="slip-image-upload"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="slip-image-upload" className="cursor-pointer block space-y-2">
                    <Upload className="w-6 h-6 text-[#43612B] mx-auto" />
                    <span className="text-xs font-bold text-[#151914] block">
                      {formFileName ? formFileName : 'Click to select or capture deposit slip'}
                    </span>
                    <span className="text-[11px] text-[#6B7462] block">
                      Clear JPEG or PNG photo of the stamped bank challan
                    </span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#151914] uppercase tracking-wider block">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Any deposit details or branch information..."
                  className="w-full px-3.5 py-2 text-xs border border-black/10 rounded-xl focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914] resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 border-t border-black/[0.06] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isSubmittingReceipt}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#6B7462] hover:bg-black/5 disabled:opacity-40 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingReceipt || isCompressing}
                  className="min-w-[155px] justify-center px-5 py-2.5 rounded-xl text-xs font-bold bg-[#43612B] hover:bg-[#365222] text-white shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
                >
                  {isSubmittingReceipt || isCompressing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isCompressing ? 'Processing Image…' : 'Uploading…'}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Submit Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* OFFICIAL TWO-PART A4 SLIP MODAL                                */}
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

      {/* Floating Bottom Notice */}
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
          <span className="text-[#151914]">{bottomNotice.message}</span>
        </div>
      )}
    </div>
  );
}

export default function SubmittedReceiptsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#6B7462] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#43612B]" />
          <span>Loading Submitted Receipts...</span>
        </div>
      }
    >
      <SubmittedReceiptsContent />
    </Suspense>
  );
}
