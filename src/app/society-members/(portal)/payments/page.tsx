'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MemberHeader } from '@/components/member-portal/MemberHeader';
import { PaymentScheduleTable } from '@/components/member-portal/PaymentScheduleTable';
import { useMemberStore } from '@/lib/store/useMemberStore';
import { PlotPaymentSchedule } from '@/lib/dal/payments';
import {
  CreditCard,
  CheckCircle2,
  Layers,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Calendar,
  AlertCircle,
  Building2,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';

function PaymentsContent() {
  const searchParams = useSearchParams();
  const initialPlotParam = searchParams.get('plot');

  const { schedules, fetchPayments, isLoading } = useMemberStore();
  const [activeTab, setActiveTab] = useState<'installment' | 'one_time'>('installment');
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (schedules.length > 0) {
      if (initialPlotParam) {
        const matchingSchedule = schedules.find((s) => s.plotId === initialPlotParam);
        if (matchingSchedule) {
          setActiveTab(matchingSchedule.paymentType);
          setSelectedPlotId(matchingSchedule.plotId);
          return;
        }
      }
      // If no initial plot requested, determine default tab:
      const hasInstallments = schedules.some((s) => s.paymentType === 'installment');
      if (!hasInstallments) {
        setActiveTab('one_time');
      }
    }
  }, [schedules, initialPlotParam]);

  const installmentPlots = schedules.filter((s) => s.paymentType === 'installment');
  const oneTimePlots = schedules.filter((s) => s.paymentType === 'one_time');

  const currentTabPlots = activeTab === 'installment' ? installmentPlots : oneTimePlots;
  const activeSchedule: PlotPaymentSchedule | undefined = schedules.find(
    (s) => s.plotId === selectedPlotId
  );

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

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <MemberHeader
        title="Payments & Ledger"
        subtitle="Independent plot payment schedules & installment terms"
      />

      <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Payment Independence Rule Banner */}
        <div className="bg-[#FAF9F7] rounded-2xl border border-black/[0.08] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#151914] uppercase tracking-wider">
                Independent Account Discipline
              </h4>
              <p className="text-xs text-[#6B7462] leading-relaxed">
                In strict accordance with society financial bylaws, every plot operates on an isolated ledger. Overpayments or adjustments on one plot never offset or merge with another plot.
              </p>
            </div>
          </div>
          <Link
            href="/society-members/payments/history"
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-black/5 text-[#151914] border border-black/10 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Transaction History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-black/[0.08] p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#43612B]/20 border-t-[#43612B] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#6B7462]">Loading ledger schedules...</p>
          </div>
        ) : schedules.length === 0 ? (
          /* Single unified empty state for zero-plot accounts (Bilal Ahmed) before tabs render */
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
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
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
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  activeTab === 'one_time'
                    ? 'bg-[#43612B] text-white shadow-[0_4px_16px_rgba(67,97,43,0.25)]'
                    : 'bg-white text-[#6B7462] hover:text-[#151914] border border-black/[0.08] hover:bg-black/5'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>One-Time</span>
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
              /* Tab with 0 plots of this specific type */
              <div className="bg-white rounded-3xl border border-black/[0.08] p-10 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-[#FAF9F5] text-[#6B7462] flex items-center justify-center mx-auto">
                  <CreditCard className="w-6 h-6 opacity-40" />
                </div>
                <h4 className="font-display font-bold text-base text-[#151914]">
                  No {activeTab === 'installment' ? 'Installment' : 'One-Time'} Payment Plots
                </h4>
                <p className="text-xs text-[#6B7462] max-w-md mx-auto">
                  {activeTab === 'installment'
                    ? 'No properties on your membership are currently operating under installment terms. Check the One-Time tab for lump-sum properties.'
                    : 'No properties on your membership are registered under one-time settlement. Check the Installment tab for active payment plans.'}
                </p>
              </div>
            ) : !selectedPlotId || !activeSchedule ? (
              /* Step 2: Plot List for Selected Tab (Never auto-skipped, even for single plot) */
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
              /* Step 3: Per-Plot Ledger View (3 Distinct Sections) */
              <div className="space-y-6">
                {/* Back to List Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedPlotId(null)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-[#43612B] bg-[#EAF0E7] hover:bg-[#d8e4d3] transition-colors border border-[#43612B]/20"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to {activeTab === 'installment' ? 'Installment' : 'One-Time'} Plots</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs text-[#6B7462]">
                    <Building2 className="w-3.5 h-3.5 text-[#43612B]" />
                    <span>
                      {activeSchedule.blockName} &bull; Plot {activeSchedule.plotNumber} ({activeSchedule.size})
                    </span>
                  </div>
                </div>

                {/* ── Plot Price Account Breakdown & Schedule ── */}
                <div className="space-y-6">
                  {/* Financial Summary Card for THIS PLOT ONLY */}
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
                            ? '24-Month Installment Terms'
                            : 'One-Time Lump Sum Settlement'}
                        </span>
                      </div>
                    </div>

                    {/* Isolated Plot Balances */}
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
                    /* One-Time Payment Detail Card (Section 2.5) */
                    <div className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 space-y-6 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-lg text-[#151914]">
                            One-Time Payment Settlement Complete
                          </h4>
                          <p className="text-xs text-[#6B7462]">
                            This plot file was settled via lump sum bank draft. No recurring installments remain.
                          </p>
                        </div>
                      </div>

                      <div className="divide-y divide-black/[0.06] text-xs">
                        <div className="py-3 flex justify-between">
                          <span className="text-[#6B7462]">Settlement Date</span>
                          <span className="font-bold text-[#151914]">
                            {activeSchedule.schedule[0]?.paidDate || activeSchedule.schedule[0]?.dueDate}
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
