'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MemberHeader } from '@/components/member-portal/MemberHeader';
import { StatCard } from '@/components/member-portal/StatCard';
import { PlotCard } from '@/components/member-portal/PlotCard';
import { useMemberStore } from '@/lib/store/useMemberStore';
import {
  Home,
  Wallet,
  CheckCircle,
  Calendar,
  ArrowRight,
  CreditCard,
  History,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Bell,
  FileCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import { MemberDashboardSkeleton } from '@/components/ui/skeleton';
import { ReceiptSubmission } from '@/lib/mock/types';
import { getCustomerReceipts } from '@/lib/dal/receipts';
import { runLane1, runLane2 } from '@/lib/requestLanes';
import { warmMemberCache } from '@/lib/dal/cacheWarmer';

export default function MemberDashboardPage() {
  const { profile, plots, schedules, fetchDashboardData, isLoading, openTermsModal } = useMemberStore();
  const [receipts, setReceipts] = useState<ReceiptSubmission[]>([]);

  const loadReceipts = useCallback(async (isBackground = false) => {
    if (profile?.id) {
      try {
        const runner = isBackground
          ? (fn: (signal?: AbortSignal) => Promise<any>) => runLane2({ screen: 'member-dashboard-receipts', isRefresh: true, fn })
          : (fn: (signal?: AbortSignal) => Promise<any>) => runLane1({ screen: 'member-dashboard-receipts', fn });
        const data = await runner(async (signal) => getCustomerReceipts(profile.id, signal));
        if (Array.isArray(data)) {
          setReceipts(data);
        }
      } catch {
        // non-blocking
      }
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchDashboardData();
    loadReceipts();
    if (profile?.id) {
      warmMemberCache(profile.id);
    }
  }, [fetchDashboardData, loadReceipts, profile?.id]);

  // Real-time 30-second background refresh via Lane 2
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchDashboardData(true);
      loadReceipts(true);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchDashboardData, loadReceipts]);

  // A declined or cancelled receipt that has not been paid again still shows, with its reason.
  // If a bill has a newer receipt and that receipt is verified, do not show the older declined or cancelled receipt for that same bill on the member dashboard.
  const declinedReceipts = receipts.filter((r) => {
    if (r.status !== 'rejected' && r.status !== 'cancelled') return false;

    const rTime = new Date(r.uploadedAt || r.paymentDate || 0).getTime();

    const hasNewerVerifiedReceipt = receipts.some((other) => {
      if (other.status !== 'verified') return false;
      if (other.id === r.id) return false;

      const otherTime = new Date(other.uploadedAt || other.paymentDate || 0).getTime();
      if (otherTime < rTime) return false;

      // 1. Direct paymentRecordId match
      if (r.paymentRecordId && other.paymentRecordId && r.paymentRecordId === other.paymentRecordId) {
        return true;
      }

      // 2. Explicit replacement link
      if (other.replacesReceiptId && other.replacesReceiptId === r.id) {
        return true;
      }

      // 3. Same plot/booking, feeType, and installmentNumber
      const samePlot =
        (r.plotId && other.plotId && r.plotId === other.plotId) ||
        (r.bookingId && other.bookingId && r.bookingId === other.bookingId);
      if (
        samePlot &&
        r.feeType &&
        other.feeType &&
        r.feeType === other.feeType &&
        r.installmentNumber != null &&
        other.installmentNumber != null &&
        Number(r.installmentNumber) === Number(other.installmentNumber)
      ) {
        return true;
      }

      // 4. Balloon allocation coverage: if other covers r.paymentRecordId
      if (
        Array.isArray((other as any).allocations) &&
        r.paymentRecordId &&
        (other as any).allocations.some((a: any) => a.paymentRecordId === r.paymentRecordId)
      ) {
        return true;
      }

      return false;
    });

    if (hasNewerVerifiedReceipt) {
      return false;
    }

    // Also check if the underlying bill in schedules is already fully paid and has a verified receipt on that plot
    if (r.paymentRecordId) {
      for (const s of schedules) {
        const matchingBill = s.schedule?.find((item) => item.id === r.paymentRecordId);
        if (matchingBill && (matchingBill.status === 'paid' || Number(matchingBill.paidAmount) >= Number(matchingBill.amount))) {
          const hasAnyVerifiedOnPlot = receipts.some(
            (other) =>
              other.status === 'verified' &&
              (other.plotId === r.plotId || other.bookingId === r.bookingId) &&
              new Date(other.uploadedAt || other.paymentDate || 0).getTime() >= rTime
          );
          if (hasAnyVerifiedOnPlot) {
            return false;
          }
        }
      }
    }

    return true;
  });

  // Aggregate stats strictly for display cards: Total Value, Total Paid, and Remaining ignore held plots
  const isHeldPlot = (p: any) => p.hasPaymentPlan === false || p.billsCount === 0;
  const payablePlots = plots.filter((p) => !isHeldPlot(p));
  const totalProperties = plots.length;
  const totalInvestment = payablePlots.reduce(
    (sum, p) => sum + (p.paymentSummary?.totalAmount || 0),
    0
  );
  const totalPaid = payablePlots.reduce(
    (sum, p) => sum + (p.paymentSummary?.paidAmount || 0),
    0
  );
  const totalRemaining = Math.max(0, totalInvestment - totalPaid);

  // Compute upcoming/overdue payments count and nearest due date
  let upcomingCount = 0;
  let hasOverdue = false;
  let nearestDueDate: string | undefined = undefined;

  interface UpcomingAlert {
    plotNumber: string;
    plotId: string;
    dueDate: string;
    amount: number;
    totalAmount?: number;
    paidAmount?: number;
    installmentNumber: number;
    feeType?: string;
    displayNumber: number;
    isOverdue: boolean;
    isPartiallyPaid?: boolean;
  }

  let upcomingAlert: UpcomingAlert | null = null;
  const today = new Date().toISOString().split('T')[0];

  for (const plot of payablePlots) {
    if (plot.paymentSummary.installmentProgress) {
      const prog = plot.paymentSummary.installmentProgress;
      if (prog.hasOverdue) hasOverdue = true;
      if (prog.nextDueDate) {
        upcomingCount += prog.totalCount - prog.paidCount;
        const cleanDue = String(prog.nextDueDate).split('T')[0];
        if (!nearestDueDate || cleanDue < nearestDueDate) {
          nearestDueDate = cleanDue;
        }
      }
    }
  }

  for (const s of schedules) {
    if (s.paymentType === 'installment') {
      const eligibleTypes = ['plot_downpayment', 'plot_installment', 'plot_biannual', 'plot_possession'];
      const pendingItems = s.schedule
        .filter((item) => {
          if (!eligibleTypes.includes(item.feeType)) return false;
          const paid = Number(item.paidAmount || 0);
          const amt = Number(item.amount || 0);
          return paid < amt;
        })
        .sort((a, b) => {
          if (a.feeType === 'plot_downpayment' && b.feeType !== 'plot_downpayment') return -1;
          if (b.feeType === 'plot_downpayment' && a.feeType !== 'plot_downpayment') return 1;
          if (a.feeType === 'plot_possession' && b.feeType !== 'plot_possession') return 1;
          if (b.feeType === 'plot_possession' && a.feeType !== 'plot_possession') return -1;
          const cmp = String(a.dueDate || '').localeCompare(String(b.dueDate || ''));
          if (cmp !== 0) return cmp;
          return (a.installmentNumber || 0) - (b.installmentNumber || 0);
        });

      if (pendingItems.length > 0) {
        const nextItem = pendingItems[0];
        const remainingDue = Math.max(0, Number(nextItem.amount) - Number(nextItem.paidAmount || 0));
        const isItemOverdue = nextItem.status === 'overdue' || (Boolean(nextItem.dueDate) && String(nextItem.dueDate).split('T')[0] < today);

        if (
          !upcomingAlert ||
          (isItemOverdue && !upcomingAlert.isOverdue) ||
          (!upcomingAlert.isOverdue && nextItem.dueDate < upcomingAlert.dueDate)
        ) {
          const isBiannualItem = (item: any) =>
            item?.feeType === 'plot_biannual' ||
            String(item?.feeType || '').toLowerCase().includes('biannual') ||
            String(item?.label || '').toLowerCase().includes('bi-annual') ||
            String(item?.label || '').toLowerCase().includes('biannual');

          const isItemBiannual = isBiannualItem(nextItem);
          let displayNumber = nextItem.installmentNumber || 1;
          if (isItemBiannual) {
            const biannualRecords = s.schedule
              .filter(isBiannualItem)
              .sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')));
            const bIdx = biannualRecords.findIndex((item) => (item.id && item.id === nextItem.id) || item.dueDate === nextItem.dueDate);
            displayNumber = bIdx >= 0 ? bIdx + 1 : (nextItem.installmentNumber || 1);
          }

          const isItemPartial = (Number(nextItem.paidAmount || 0) > 0 && Number(nextItem.paidAmount || 0) < Number(nextItem.amount));

          upcomingAlert = {
            plotNumber: s.plotNumber,
            plotId: s.plotId,
            dueDate: String(nextItem.dueDate).split('T')[0],
            amount: remainingDue,
            totalAmount: Number(nextItem.amount),
            paidAmount: Number(nextItem.paidAmount || 0),
            installmentNumber: nextItem.installmentNumber || 1,
            feeType: isItemBiannual ? 'plot_biannual' : nextItem.feeType,
            displayNumber,
            isOverdue: isItemOverdue,
            isPartiallyPaid: isItemPartial,
          };
        }
      }
    }
  }

  const formatPKR = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <MemberHeader
        title="Member Dashboard"
        subtitle={profile?.fullName ? `Welcome back, ${profile.fullName}` : 'Welcome back'}
      />

      <main className="px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-3 sm:space-y-8">
        {/* Welcome Hero Banner */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#43612B]">
              Member Overview
            </span>
            <h2 className="font-display font-bold text-xl sm:text-3xl text-[#151914] tracking-tight">
              Hello, {profile?.fullName ? (
                profile.fullName
              ) : (
                <span className="inline-block w-40 h-7 bg-slate-200 animate-pulse rounded align-middle" />
              )}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20 flex items-center gap-1.5 shadow-xs">
              <CheckCircle className="w-4 h-4 text-[#43612B]" />
              <span>Allotted File Holder</span>
            </span>

            <button
              type="button"
              onClick={openTermsModal}
              title="Click to view and review society bylaws and terms agreement"
              className="px-3 py-1 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 text-[#151914] border border-black/10 flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-[#43612B]" />
              <span>{profile?.termsAccepted ? 'Review Terms Agreement' : 'Sign Terms Agreement'}</span>
            </button>
          </div>
        </div>

        {/* ── Active Strike Warning Banner ── */}
        {(profile?.strikeCount || 0) > 0 && (
          <div className="rounded-2xl p-3.5 sm:p-5 border bg-amber-50/95 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-600 text-white font-mono">
                    Compliance Warning • {profile?.strikeCount} {profile?.strikeCount === 1 ? 'Active Strike' : 'Active Strikes'}
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  You have <strong>{profile?.strikeCount} administrative compliance {profile?.strikeCount === 1 ? 'strike' : 'strikes'}</strong> on your member record. Please resolve overdue installments or check recent receipt submissions to maintain full portal access.
                </p>
              </div>
            </div>
            <Link
              href="/society-members/strikes"
              className="w-full sm:w-auto min-h-[44px] justify-center shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors whitespace-nowrap"
            >
              <span>View Strike Record</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ── Declined Receipts Red Notice ── */}
        {declinedReceipts.map((r) => {
          const matchedPlot = plots?.find((p) => p.id === r.plotId || p.plotNumber === r.plotNumber);
          const blockTitle = r.blockName || (matchedPlot as any)?.blockName || matchedPlot?.blockId || '';
          const plotLabel = `Plot ${r.plotNumber || matchedPlot?.plotNumber || '—'}${blockTitle ? ` (${blockTitle})` : ''}`;
          const isDeclinedBiannual =
            (r as any).feeType === 'plot_biannual' ||
            String((r as any).feeType || '').toLowerCase().includes('biannual') ||
            String((r as any).feeTitle || '').toLowerCase().includes('bi-annual') ||
            String((r as any).feeTitle || '').toLowerCase().includes('biannual');
          const installmentLabel =
            (r as any).paymentKind === 'balloon'
              ? 'Balloon Payment'
              : isDeclinedBiannual
              ? `Bi-Annual #${r.installmentNumber ?? 1}`
              : r.paymentType === 'installment'
              ? `Installment #${r.installmentNumber ?? 1}`
              : 'Full Payment';
          const amountLabel = formatPKR(r.amount);

          return (
            <div
              key={r.id}
              className="rounded-2xl p-3.5 sm:p-5 border bg-rose-50/95 border-rose-300 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-700 text-white font-mono">
                      {r.status === 'cancelled' ? 'Receipt Cancelled' : 'Receipt Declined'}
                    </span>
                    <span className="text-xs font-bold text-rose-950">
                      {plotLabel}
                    </span>
                    <span className="text-xs text-rose-300">&bull;</span>
                    <span className="text-xs font-semibold text-rose-900">
                      {installmentLabel}
                    </span>
                    <span className="text-xs text-rose-300">&bull;</span>
                    <span className="text-xs font-bold text-rose-900">
                      {amountLabel}
                    </span>
                  </div>
                  <p className="text-xs text-rose-900 leading-relaxed">
                    <strong>Reason:</strong> &ldquo;{r.rejectionReason || (r.status === 'cancelled' ? (r as any).cancellationReason || 'Receipt was cancelled by society administration.' : 'Deposit could not be verified by committee.')}&rdquo;
                  </p>
                </div>
              </div>

              <Link
                href={`/society-members/payments?plot=${r.plotId}&installment=${r.installmentNumber ?? 1}&upload=true`}
                className="w-full sm:w-auto min-h-[44px] justify-center shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white shadow-xs transition-colors whitespace-nowrap cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Re-upload Receipt</span>
              </Link>
            </div>
          );
        })}

        {/* ── Upcoming Installment Payment Alert Banner ── */}
        {upcomingAlert && (
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
                    {upcomingAlert.feeType === 'plot_downpayment'
                      ? (upcomingAlert.isOverdue ? 'Overdue Down Payment Alert' : 'Upcoming Down Payment Alert')
                      : upcomingAlert.feeType === 'plot_possession'
                      ? (upcomingAlert.isOverdue ? 'Overdue Possession Alert' : 'Upcoming Possession Alert')
                      : upcomingAlert.feeType === 'plot_biannual' || String(upcomingAlert.feeType || '').toLowerCase().includes('biannual')
                      ? (upcomingAlert.isOverdue ? 'Overdue Bi-Annual Alert' : 'Upcoming Bi-Annual Alert')
                      : (upcomingAlert.isOverdue ? 'Overdue Monthly Installment Alert' : 'Upcoming Monthly Installment Alert')}
                  </span>
                  {upcomingAlert.isPartiallyPaid && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                      Partially Paid
                    </span>
                  )}
                  <span className="text-xs font-bold">Plot {upcomingAlert.plotNumber}</span>
                </div>
                <p className="text-xs text-[#4A5347] leading-relaxed">
                  {upcomingAlert.feeType === 'plot_downpayment'
                    ? 'Down payment'
                    : upcomingAlert.feeType === 'plot_possession'
                    ? 'Possession fee'
                    : upcomingAlert.feeType === 'plot_biannual' || String(upcomingAlert.feeType || '').toLowerCase().includes('biannual')
                    ? `Bi-Annual #${upcomingAlert.displayNumber}`
                    : `Monthly #${upcomingAlert.displayNumber}`}{' '}
                  {upcomingAlert.isPartiallyPaid ? (
                    <>
                      has a remaining balance of <strong className="text-[#151914]">{formatPKR(upcomingAlert.amount)}</strong> due ({formatPKR(upcomingAlert.paidAmount || 0)} of {formatPKR(upcomingAlert.totalAmount || 0)} paid)
                    </>
                  ) : (
                    <>
                      of <strong className="text-[#151914]">{formatPKR(upcomingAlert.amount)}</strong>
                    </>
                  )}{' '}
                  {upcomingAlert.isOverdue ? 'was due on' : 'is due on'}{' '}
                  <strong className="text-[#151914]">{String(upcomingAlert.dueDate).split('T')[0]}</strong>. Upload your bank deposit receipt directly in the portal once paid to maintain good standing.
                </p>
              </div>
            </div>

            <Link
              href={`/society-members/payments?plot=${upcomingAlert.plotId}`}
              className={`w-full sm:w-auto min-h-[44px] justify-center shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                upcomingAlert.isOverdue
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                  : 'bg-[#43612B] hover:bg-[#365222] text-white shadow-[#43612B]/20'
              }`}
            >
              <span>Upload Receipt / Pay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ── KPI Stat Cards (2 by 2 on mobile, 4 in row on lg) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatCard
            title="Total Properties"
            value={isLoading && totalProperties === 0 ? <span className="inline-block w-14 h-6 bg-slate-200 animate-pulse rounded" /> : `${totalProperties} ${totalProperties === 1 ? 'Plot' : 'Plots'}`}
            subtitle={totalProperties > 0 ? 'Active files' : 'No properties yet'}
            icon={Home}
            badge={{
              text: totalProperties > 0 ? 'Verified' : 'Pending',
              variant: totalProperties > 0 ? 'success' : 'neutral',
            }}
          />

          <StatCard
            title="Total Value"
            value={isLoading && totalInvestment === 0 ? <span className="inline-block w-24 h-6 bg-slate-200 animate-pulse rounded" /> : formatPKR(totalInvestment)}
            subtitle="Combined value"
            icon={Wallet}
          />

          <StatCard
            title="Total Paid"
            value={isLoading && totalPaid === 0 ? <span className="inline-block w-24 h-6 bg-slate-200 animate-pulse rounded" /> : formatPKR(totalPaid)}
            subtitle={`${totalInvestment > 0 ? Math.round((totalPaid / totalInvestment) * 100) : 0}% settled`}
            icon={CheckCircle}
            badge={{
              text: 'Settled',
              variant: 'success',
            }}
          />

          <StatCard
            title="Upcoming Due"
            value={isLoading && !nearestDueDate ? <span className="inline-block w-20 h-6 bg-slate-200 animate-pulse rounded" /> : nearestDueDate ? nearestDueDate.split('T')[0] : 'None'}
            subtitle={
              hasOverdue
                ? 'Action Required'
                : upcomingCount > 0
                ? `${upcomingCount} pending`
                : 'All up to date'
            }
            icon={Calendar}
            badge={{
              text: hasOverdue ? 'Overdue' : upcomingCount > 0 ? 'Pending' : 'Clear',
              variant: hasOverdue ? 'danger' : upcomingCount > 0 ? 'warning' : 'success',
            }}
            className="bg-amber-50 border-amber-300"
            valueClassName="text-amber-800"
          />
        </div>

        {/* ── Quick Access Links (1 per row, 12px padding, 8px gap) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <Link
            href="/society-members/properties"
            className="bg-white p-3 sm:p-5 rounded-2xl border border-black/[0.08] hover:border-[#43612B] hover:shadow-md transition-all group flex items-center justify-between min-h-[44px]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAF9F5] group-hover:bg-[#EAF0E7] text-[#43612B] flex items-center justify-center transition-colors shrink-0">
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#151914]">My Properties</h4>
                <p className="text-[11px] text-[#6B7462]">Inspect file allotments &amp; details</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#6B7462] group-hover:text-[#43612B] group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          <Link
            href="/society-members/payments"
            className="bg-white p-3 sm:p-5 rounded-2xl border border-black/[0.08] hover:border-[#43612B] hover:shadow-md transition-all group flex items-center justify-between min-h-[44px]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAF9F5] group-hover:bg-[#EAF0E7] text-[#43612B] flex items-center justify-center transition-colors shrink-0">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#151914]">Payments &amp; Ledger</h4>
                <p className="text-[11px] text-[#6B7462]">Independent plot schedules</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#6B7462] group-hover:text-[#43612B] group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          <Link
            href="/society-members/payments/history"
            className="bg-white p-3 sm:p-5 rounded-2xl border border-black/[0.08] hover:border-[#43612B] hover:shadow-md transition-all group flex items-center justify-between min-h-[44px]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAF9F5] group-hover:bg-[#EAF0E7] text-[#43612B] flex items-center justify-center transition-colors shrink-0">
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#151914]">Payment History</h4>
                <p className="text-[11px] text-[#6B7462]">Past transactions &amp; status</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#6B7462] group-hover:text-[#43612B] group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
        </div>

        {/* ── Properties Section (Directly under links, no extra blank section) ── */}
        <div className="space-y-3 sm:space-y-4 pt-0 sm:pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base sm:text-lg text-[#151914]">
              Your Property Portfolio
            </h3>
            {plots.length > 0 && (
              <Link
                href="/society-members/properties"
                className="text-xs font-bold text-[#43612B] hover:underline"
              >
                View All Details &rarr;
              </Link>
            )}
          </div>

          {isLoading && plots.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl sm:rounded-3xl border border-black/[0.08] p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-36 bg-slate-200/80 rounded-md" />
                    <div className="h-6 w-20 bg-slate-200/80 rounded-full" />
                  </div>
                  <div className="h-3 w-full bg-slate-200/80 rounded-full" />
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                    <div className="h-8 bg-slate-200/80 rounded-lg" />
                    <div className="h-8 bg-slate-200/80 rounded-lg" />
                  </div>
                  <div className="h-10 w-full bg-slate-200/80 rounded-xl" />
                </div>
              ))}
            </div>
          ) : plots.length === 0 ? (
            /* Friendly Empty State for Zero Plots */
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/[0.08] p-6 sm:p-12 text-center space-y-3 sm:space-y-4 shadow-xs">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FAF9F5] border border-black/[0.06] text-[#6B7462] flex items-center justify-center mx-auto">
                <Home className="w-7 h-7 sm:w-8 sm:h-8 opacity-40" />
              </div>
              <div className="max-w-md mx-auto space-y-1 sm:space-y-1.5">
                <h4 className="font-display font-bold text-base sm:text-lg text-[#151914]">
                  No Properties Linked Yet
                </h4>
                <p className="text-xs text-[#6B7462] leading-relaxed">
                  No property files are currently associated with your member credentials.
                  If you recently booked a plot, file allotment is usually completed within 1-2 business days.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                <a
                  href="https://wa.me/923005615600"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#43612B] hover:bg-[#365222] text-white font-bold text-xs tracking-wide transition-colors"
                >
                  Contact Admin Desk
                </a>
                <Link
                  href="/society-members"
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#FAF9F5] hover:bg-black/5 text-[#151914] font-semibold text-xs border border-black/[0.08] transition-colors"
                >
                  View Society Bylaws
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
              {plots.map((plot) => (
                <PlotCard key={plot.id} plot={plot} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
