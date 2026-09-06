'use client';

import React, { useEffect } from 'react';
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
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function MemberDashboardPage() {
  const { profile, plots, fetchDashboardData, isLoading } = useMemberStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Aggregate stats strictly for display cards
  const totalProperties = plots.length;
  const totalInvestment = plots.reduce(
    (sum, p) => sum + p.paymentSummary.totalAmount,
    0
  );
  const totalPaid = plots.reduce(
    (sum, p) => sum + p.paymentSummary.paidAmount,
    0
  );

  // Compute upcoming/overdue payments count and nearest due date
  let upcomingCount = 0;
  let hasOverdue = false;
  let nearestDueDate: string | undefined = undefined;

  for (const plot of plots) {
    if (plot.paymentSummary.installmentProgress) {
      const prog = plot.paymentSummary.installmentProgress;
      if (prog.hasOverdue) hasOverdue = true;
      if (prog.nextDueDate) {
        upcomingCount += prog.totalCount - prog.paidCount;
        if (!nearestDueDate || prog.nextDueDate < nearestDueDate) {
          nearestDueDate = prog.nextDueDate;
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
        subtitle={`Welcome back, ${profile?.fullName || 'Member'}`}
      />

      <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Welcome Hero Banner */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#43612B]">
              Member Overview
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#151914] tracking-tight">
              Hello, {profile?.fullName || 'Valued Member'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20 flex items-center gap-1.5 shadow-xs">
              <CheckCircle className="w-4 h-4 text-[#43612B]" />
              <span>Allotted File Holder</span>
            </span>
          </div>
        </div>

        {/* ── KPI Stat Cards (Tremor Style) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Properties"
            value={`${totalProperties} ${totalProperties === 1 ? 'Plot' : 'Plots'}`}
            subtitle={totalProperties > 0 ? 'Active files' : 'No properties yet'}
            icon={Home}
            badge={{
              text: totalProperties > 0 ? 'Verified' : 'Pending',
              variant: totalProperties > 0 ? 'success' : 'neutral',
            }}
          />

          <StatCard
            title="Total Investment"
            value={formatPKR(totalInvestment)}
            subtitle="Combined value"
            icon={Wallet}
          />

          <StatCard
            title="Total Paid"
            value={formatPKR(totalPaid)}
            subtitle={`${totalInvestment > 0 ? Math.round((totalPaid / totalInvestment) * 100) : 0}% settled`}
            icon={CheckCircle}
            badge={{
              text: 'Settled',
              variant: 'success',
            }}
          />

          <StatCard
            title="Upcoming Due"
            value={nearestDueDate || 'None'}
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
          />
        </div>

        {/* ── Quick Access Links ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/society-members/properties"
            className="bg-white p-5 rounded-2xl border border-black/[0.08] hover:border-[#43612B] hover:shadow-md transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] group-hover:bg-[#EAF0E7] text-[#43612B] flex items-center justify-center transition-colors">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#151914]">My Properties</h4>
                <p className="text-[11px] text-[#6B7462]">Inspect file allotments &amp; details</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#6B7462] group-hover:text-[#43612B] group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/society-members/payments"
            className="bg-white p-5 rounded-2xl border border-black/[0.08] hover:border-[#43612B] hover:shadow-md transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] group-hover:bg-[#EAF0E7] text-[#43612B] flex items-center justify-center transition-colors">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#151914]">Payments &amp; Ledger</h4>
                <p className="text-[11px] text-[#6B7462]">Independent plot schedules</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#6B7462] group-hover:text-[#43612B] group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/society-members/documents"
            className="bg-white p-5 rounded-2xl border border-black/[0.08] hover:border-[#43612B] hover:shadow-md transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] group-hover:bg-[#EAF0E7] text-[#43612B] flex items-center justify-center transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#151914]">Official Documents</h4>
                <p className="text-[11px] text-[#6B7462]">Agreements &amp; payment receipts</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#6B7462] group-hover:text-[#43612B] group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* ── Properties Section or Empty State (Exception 5.1) ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#151914]">
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

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-black/[0.08] p-8 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#43612B]/20 border-t-[#43612B] rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#6B7462]">Loading your property records...</p>
            </div>
          ) : plots.length === 0 ? (
            /* Friendly Empty State for Zero Plots (Exception 5.1) */
            <div className="bg-white rounded-3xl border border-black/[0.08] p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF9F5] border border-black/[0.06] text-[#6B7462] flex items-center justify-center mx-auto">
                <Home className="w-8 h-8 opacity-40" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="font-display font-bold text-lg text-[#151914]">
                  No Properties Linked Yet
                </h4>
                <p className="text-xs text-[#6B7462] leading-relaxed">
                  No property files are currently associated with your member credentials.
                  If you recently booked a plot, file allotment is usually completed within 1-2 business days.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://wa.me/923005615600"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[#43612B] hover:bg-[#365222] text-white font-bold text-xs tracking-wide transition-colors"
                >
                  Contact Admin Desk
                </a>
                <Link
                  href="/society-members"
                  className="px-5 py-2.5 rounded-xl bg-[#FAF9F5] hover:bg-black/5 text-[#151914] font-semibold text-xs border border-black/[0.08] transition-colors"
                >
                  View Society Bylaws
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
