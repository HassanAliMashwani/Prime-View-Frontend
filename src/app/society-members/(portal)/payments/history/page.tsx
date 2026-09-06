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
} from 'lucide-react';

export default function PaymentHistoryPage() {
  const { transactions, plots, fetchPayments, profile, isLoading } = useMemberStore();
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchPayments(selectedFilter);
  }, [fetchPayments, selectedFilter]);

  const formatPKR = (val: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(val);

  // Client-side CSV Statement Generator (Section 2.6)
  const downloadStatement = () => {
    if (transactions.length === 0) return;

    const headers = ['Transaction ID', 'Date', 'Plot Number', 'Description', 'Amount (PKR)', 'Status', 'Reference'];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      t.plotNumber,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.status.toUpperCase(),
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

      <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Control Bar */}
        <div className="bg-white rounded-2xl border border-black/[0.08] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/society-members/payments"
              className="p-2 rounded-xl border border-black/10 hover:bg-black/5 text-[#6B7462] hover:text-[#151914] transition-colors"
              aria-label="Back to Payments"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#151914]">
                Society Transaction Log
              </h3>
              <p className="text-xs text-[#6B7462]">
                Official receipts issued by Prime View Accounts Wing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Filter Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full sm:w-48 appearance-none pl-8 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-black/10 bg-[#FAF9F5] text-[#151914] focus:outline-none focus:ring-2 focus:ring-[#43612B]"
              >
                <option value="all">All Properties ({plots.length})</option>
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    Plot {p.plotNumber} ({p.size})
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-[#6B7462] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Download Statement Button */}
            <button
              onClick={downloadStatement}
              disabled={transactions.length === 0}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#43612B] hover:bg-[#365222] disabled:opacity-40 text-white flex items-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Statement</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-black/[0.08] p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#43612B]/20 border-t-[#43612B] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#6B7462]">Fetching transaction history...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/[0.08] p-12 text-center space-y-3">
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
          <div className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
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
                        <span>{t.date}</span>
                      </td>
                      <td className="py-4 px-5 font-bold text-[#151914]">
                        Plot {t.plotNumber}
                      </td>
                      <td className="py-4 px-5 text-[#151914]">
                        {t.description}
                      </td>
                      <td className="py-4 px-5 font-bold text-[#43612B]">
                        {formatPKR(t.amount)}
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="capitalize">{t.status}</span>
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
