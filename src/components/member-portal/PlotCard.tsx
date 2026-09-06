'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EnrichedPlot } from '@/lib/dal/plots';
import {
  MapPin,
  Calendar,
  CreditCard,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

interface PlotCardProps {
  plot: EnrichedPlot;
}

const blockDisplayNames: Record<string, string> = {
  abbott: 'Abbott Block',
  royal: 'Royal Block',
  overseas: 'Overseas Block',
  elite: 'Elite Block',
  chalet: 'Chalet Block',
  commercial: 'Commercial Block',
  'npf-phase-1': 'NPF Phase 1',
  'npf-phase-2': 'NPF Phase 2',
};

const getBlockDisplayName = (id: string) =>
  blockDisplayNames[id.toLowerCase()] || `${id.replace('-', ' ')} Block`;

const formatCategory = (cat: string) => {
  if (cat === 'farm_house') return 'Farm House';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

export const PlotCard: React.FC<PlotCardProps> = ({ plot }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedPrice = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(plot.price);

  const formattedPaid = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(plot.paymentSummary.paidAmount);

  const formattedRemaining = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(plot.paymentSummary.remainingAmount);

  const isInstallment = plot.paymentSummary.paymentType === 'installment';
  const progress = plot.paymentSummary.installmentProgress;
  const percentPaid = Math.round(
    (plot.paymentSummary.paidAmount / plot.paymentSummary.totalAmount) * 100
  );

  return (
    <div className="bg-white rounded-2xl border border-black/[0.08] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] transition-all">
      {/* Header Badges & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center font-bold text-sm">
            {plot.plotNumber}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-[#151914]">
              Plot {plot.plotNumber}
            </h3>
            <p className="text-xs text-[#6B7462] flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#43612B]" />
              <span className="font-semibold text-[#151914]">{getBlockDisplayName(plot.blockId)}</span>
              <span>&bull;</span>
              <span>{plot.size}</span>
              <span>&bull;</span>
              <span className="text-[#43612B] font-semibold">{formatCategory(plot.category)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="capitalize">{plot.status}</span>
          </span>

          {/* Payment Type Badge */}
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF9F5] text-[#151914] border border-black/[0.08]">
            {isInstallment ? 'Installment Plan' : 'One-Time Payment'}
          </span>
        </div>
      </div>

      {/* Financial Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
            Total Value
          </p>
          <p className="font-display font-bold text-base text-[#151914] mt-0.5">
            {formattedPrice}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
            Total Paid
          </p>
          <p className="font-display font-bold text-base text-[#43612B] mt-0.5">
            {formattedPaid}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
            Remaining Balance
          </p>
          <p className="font-display font-bold text-base text-[#151914] mt-0.5">
            {formattedRemaining}
          </p>
        </div>
      </div>

      {/* Installment Progress Bar (if applicable) */}
      {isInstallment && progress && (
        <div className="py-3 px-4 rounded-xl bg-[#FAF9F7] border border-black/[0.06] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#151914]">
              Installments Paid: {progress.paidCount} of {progress.totalCount}
            </span>
            <span className="text-[#43612B]">{percentPaid}% Completed</span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2.5 bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#43612B] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, percentPaid))}%` }}
            />
          </div>

          {/* Overdue alert or next due date */}
          <div className="flex items-center justify-between text-[11px] pt-1 text-[#6B7462]">
            {progress.hasOverdue ? (
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Installment Overdue
              </span>
            ) : (
              <span>Next Due: {progress.nextDueDate || 'All Paid'}</span>
            )}
            <span>Monthly Terms</span>
          </div>
        </div>
      )}

      {/* Expandable Details Section */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-black/[0.06] space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3 bg-[#FAF9F5] p-3 rounded-xl border border-black/[0.04]">
            <div>
              <span className="text-[#6B7462] block">Booking Reference:</span>
              <span className="font-mono font-bold text-[#151914]">{plot.booking.id}</span>
            </div>
            <div>
              <span className="text-[#6B7462] block">Booking Date:</span>
              <span className="font-medium text-[#151914]">{plot.booking.bookingDate}</span>
            </div>
            <div>
              <span className="text-[#6B7462] block">Allotment Confirmation:</span>
              <span className="font-medium text-[#151914]">
                {plot.booking.confirmationDate || 'Pending Society Seal'}
              </span>
            </div>
            <div>
              <span className="text-[#6B7462] block">Plot Category &amp; Size:</span>
              <span className="font-medium text-[#151914]">{plot.size} ({formatCategory(plot.category)})</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-5 pt-4 border-t border-black/[0.06] flex items-center justify-between gap-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7462] hover:text-[#151914] transition-colors"
        >
          <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <Link
          href={`/society-members/payments?plot=${plot.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#43612B] text-white hover:bg-[#365222] shadow-[0_2px_8px_rgba(67,97,43,0.25)] transition-all"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payments Schedule</span>
        </Link>
      </div>
    </div>
  );
};
