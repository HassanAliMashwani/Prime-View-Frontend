'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MemberHeader } from '@/components/member-portal/MemberHeader';
import { useMemberStore } from '@/lib/store/useMemberStore';
import {
  History,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { MemberHistorySkeleton } from '@/components/ui/skeleton';

export default function PaymentHistoryPage() {
  const { transactions, plots, fetchPaymentHistory, fetchPlots, profile, isLoading } = useMemberStore();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    if (!isLoading) {
      setHasLoadedOnce(true);
    }
  }, [isLoading]);

  useEffect(() => {
    fetchPaymentHistory(selectedFilter);
    fetchPlots();
  }, [fetchPaymentHistory, fetchPlots, selectedFilter]);

  const formatPKR = (val: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(val);

  const formatPlotNumber = (plotNum: string, plotId?: string) => {
    if (!plotNum) return 'Plot —';
    const trimmed = plotNum.trim();
    if (trimmed.toLowerCase() === 'plot') {
      const match = plots.find((p) => p.id === plotId);
      if (match?.plotNumber && match.plotNumber.trim().toLowerCase() !== 'plot') {
        return formatPlotNumber(match.plotNumber);
      }
      if (plots.length === 1 && plots[0].plotNumber && plots[0].plotNumber.trim().toLowerCase() !== 'plot') {
        return formatPlotNumber(plots[0].plotNumber);
      }
      return 'Plot';
    }
    return trimmed.toLowerCase().startsWith('plot') ? trimmed : `Plot ${trimmed}`;
  };

  const formatStatus = (status: string) => {
    if (!status) return '';
    const clean = status.replace(/_/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  };

  // Client-side CSV Statement Generator (Section 2.6)
  const downloadStatement = () => {
    if (transactions.length === 0) return;

    const headers = ['Transaction ID', 'Date', 'Plot Number', 'Description', 'Amount (PKR)', 'Status', 'Reference'];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      formatPlotNumber(t.plotNumber, t.plotId),
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      formatStatus(t.status).toUpperCase(),
      t.transactionRef || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      `Prime View Housing Society - Official Account Statement\n` +
      `Member: ${profile?.fullName || 'Member'}\n` +
      `CNIC: ${profile?.cnic || 'N/A'}\n` +
      `Generated: ${new Date().toLocaleDateString()}\n\n` +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Prime_View_Statement_${profile?.fullName?.replace(/\s+/g, '_') || 'Member'}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <MemberHeader
        title="Payment History"
        subtitle="Consolidated society transaction ledger &amp; receipts"
      />

      <main className="px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-3 sm:space-y-6">
        {/* Top Control Bar */}
        <div className="bg-white rounded-2xl border border-black/[0.08] p-3.5 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/society-members/payments"
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-black/10 hover:bg-black/5 text-[#6B7462] hover:text-[#151914] transition-colors shrink-0"
              aria-label="Back to Payments"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base sm:text-lg text-[#151914] leading-tight truncate">
                Society Transaction Log
              </h3>
              <p className="text-xs text-[#6B7462] truncate">
                Official receipts issued by Prime View Accounts Wing.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Filter Dropdown (full width, 44px on phone) */}
            <div className="relative w-full sm:w-48">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full min-h-[44px] appearance-none pl-9 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-black/10 bg-[#FAF9F5] text-[#151914] focus:outline-none focus:ring-2 focus:ring-[#43612B] cursor-pointer"
              >
                <option value="all">All Properties</option>
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    Plot {p.plotNumber} ({p.size})
                  </option>
                ))}
              </select>
              <Filter className="w-4 h-4 text-[#6B7462] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Download Statement Button (full width, 44px on phone) */}
            <button
              onClick={downloadStatement}
              disabled={transactions.length === 0}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold bg-[#43612B] hover:bg-[#365222] disabled:opacity-40 text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Statement</span>
            </button>
          </div>
        </div>

        {/* Transactions Table / List */}
        {!hasLoadedOnce && isLoading && transactions.length === 0 ? (
          <MemberHistorySkeleton />
        ) : isLoading ? (
          <div className="bg-white rounded-2xl border border-black/[0.08] p-12 sm:p-16 text-center space-y-3 shadow-xs flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#43612B] animate-spin" />
            <p className="text-xs font-medium text-[#6B7462]">Loading transaction history...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/[0.08] p-8 sm:p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF9F5] text-[#6B7462] flex items-center justify-center mx-auto">
              <History className="w-7 h-7 opacity-40" />
            </div>
            <h4 className="font-display font-bold text-base text-[#151914]">
              No Transactions Found
            </h4>
            <p className="text-xs text-[#6B7462]">
              No confirmed payments have been recorded for the selected filter.
            </p>
          </div>
        ) : (
          /* On mobile, no outer card wrapper (receipt list is page content, 12px gap). Desktop keeps the card wrapper. */
          <div className="md:bg-white md:rounded-2xl md:border md:border-black/[0.08] md:overflow-hidden md:shadow-xs">
            {/* Mobile Stacked Cards (< 768px, each receipt is a clean top-level card) */}
            <div className="md:hidden space-y-3">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-black/[0.08] p-3.5 shadow-2xs space-y-2 text-xs min-w-0"
                >
                  {/* Line 1: Date & Status */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-black/[0.05]">
                    <div className="flex items-center gap-1.5 text-[#151914] font-medium text-xs">
                      <Calendar className="w-3.5 h-3.5 text-[#6B7462]" />
                      <span>{t.date ? String(t.date).split('T')[0] : '—'}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{formatStatus(t.status)}</span>
                    </span>
                  </div>

                  {/* Line 2: Plot & Amount */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-[#6B7462] block tracking-wider">Plot</span>
                      <span className="font-bold text-sm text-[#151914] truncate block">{formatPlotNumber(t.plotNumber, t.plotId)}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-[#6B7462] block tracking-wider">Amount</span>
                      <span className="font-bold text-base text-[#43612B] tabular-nums">{formatPKR(t.amount)}</span>
                    </div>
                  </div>

                  {/* Line 3: Description */}
                  <div className="border-t border-black/[0.05] pt-1.5 text-[#151914]">
                    <span className="text-[10px] uppercase font-bold text-[#6B7462] block tracking-wider">Description</span>
                    <span className="mt-0.5 block text-xs leading-relaxed break-words">{t.description}</span>
                  </div>

                  {/* Line 4: Receipt Ref */}
                  <div className="border-t border-black/[0.05] pt-1.5 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#6B7462] tracking-wider">Receipt Ref</span>
                    <span className="font-mono text-[11px] text-[#6B7462] font-semibold break-all">{t.transactionRef || 'TXN-PV-VERIFIED'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF9F5] border-b border-black/[0.06] text-[#6B7462] font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-4 px-5">Date</th>
                    <th className="py-4 px-5">Plot</th>
                    <th className="py-4 px-5">Description</th>
                    <th className="py-4 px-5">Amount</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Receipt Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="py-4 px-5 text-[#151914] font-medium flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#6B7462]" />
                        <span>{t.date ? String(t.date).split('T')[0] : '—'}</span>
                      </td>
                      <td className="py-4 px-5 font-bold text-[#151914]">
                        {formatPlotNumber(t.plotNumber, t.plotId)}
                      </td>
                      <td className="py-4 px-5 text-[#151914]">
                        {t.description}
                      </td>
                      <td className="py-4 px-5 font-bold text-[#43612B] tabular-nums">
                        {formatPKR(t.amount)}
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{formatStatus(t.status)}</span>
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono text-[11px] text-[#6B7462]">
                        {t.transactionRef || 'TXN-PV-VERIFIED'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
