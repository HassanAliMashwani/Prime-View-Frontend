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
  const percentPaid = isInstallment && progress && progress.totalCount > 0
    ? Math.round((progress.paidCount / progress.totalCount) * 100)
    : plot.paymentSummary.totalAmount > 0
    ? Math.round((plot.paymentSummary.paidAmount / plot.paymentSummary.totalAmount) * 100)
    : 0;
  const clampedPercent = Math.min(100, Math.max(0, percentPaid));

  return (
    <div className="bg-white rounded-2xl border border-black/[0.08] p-3.5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] transition-all min-w-0">
      {/* Header Badges & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-black/[0.06]">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center font-bold text-sm shrink-0">
            {plot.plotNumber}
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base sm:text-lg text-[#151914] leading-tight">
              Plot {plot.plotNumber}
            </h3>
            <p className="text-xs text-[#6B7462] flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-medium mt-0.5">
              <span className="inline-flex items-center gap-1 font-semibold text-[#151914]">
                <MapPin className="w-3.5 h-3.5 text-[#43612B] shrink-0" />
                {getBlockDisplayName(plot.blockId)}
              </span>
              <span>&bull;</span>
              <span>{plot.size}</span>
              <span>&bull;</span>
              <span className="text-[#43612B] font-semibold">{formatCategory(plot.category)}</span>
            </p>
          </div>
        </div>

        {/* Badges: Left-aligned wrapping on phone, right-aligned on desktop */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Status Badge */}
          <span className="px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="capitalize">{plot.status}</span>
          </span>

          {/* Payment Type Badge */}
          <span className="px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#FAF9F5] text-[#151914] border border-black/[0.08]">
            {isInstallment ? 'Installment Plan' : 'Full Payment'}
          </span>
        </div>
      </div>

      {/* Financial Overview Grid: 3 figures in 1 row on mobile (>=380px) and desktop; 2 on row 1 + Remaining on row 2 when narrower */}
      <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4 py-2.5 sm:py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7462] truncate">
            Total Value
          </p>
          <p className="font-display font-bold text-base text-[#151914] mt-0.5 tabular-nums truncate">
            {formattedPrice}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7462] truncate">
            Total Paid
          </p>
          <p className="font-display font-bold text-base text-[#43612B] mt-0.5 tabular-nums truncate">
            {formattedPaid}
          </p>
        </div>
        <div className="min-w-0 col-span-2 min-[380px]:col-span-1 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7462] truncate">
            Remaining
          </p>
          <p className="font-display font-bold text-base text-[#151914] mt-0.5 tabular-nums truncate">
            {formattedRemaining}
          </p>
        </div>
      </div>

      {/* Dynamic Payment Progress Bar */}
      <div className="py-2.5 px-3 sm:py-3 sm:px-4 rounded-xl bg-[#FAF9F7] border border-black/[0.06] space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-[#151914] truncate mr-2">
            {isInstallment && progress
              ? `Installments Paid: ${progress.paidCount} of ${progress.totalCount}`
              : `Progress: ${formattedPaid} of ${formattedPrice}`}
          </span>
          <span className="text-[#43612B] font-mono shrink-0">{clampedPercent}% Completed</span>
        </div>

        {/* Progress track */}
        <div className="w-full h-2 sm:h-2.5 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#43612B] rounded-full transition-all duration-500"
            style={{ width: `${clampedPercent}%` }}
          />
        </div>

        {/* Overdue alert or status text */}
        <div className="flex items-center justify-between text-[11px] pt-0.5 text-[#6B7462]">
          {isInstallment && progress ? (
            progress.hasOverdue ? (
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Installment Overdue
              </span>
            ) : (
              <span>Next Due: {progress.nextDueDate ? String(progress.nextDueDate).split('T')[0] : 'All Paid'}</span>
            )
          ) : (
            <span>
              {clampedPercent >= 100 ? 'Full Payment Settled' : 'Awaiting Settlement'}
            </span>
          )}
          <span>{isInstallment ? 'Monthly Terms' : 'One-Time Clearance'}</span>
        </div>
      </div>

      {/* Expandable Details Section */}
      {isExpanded && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-black/[0.06] space-y-2.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 bg-[#FAF9F5] p-3 rounded-xl border border-black/[0.04]">
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
              <span className="text-[#6B7462] block">Plot Category & Size:</span>
              <span className="font-medium text-[#151914]">{plot.size} ({formatCategory(plot.category)})</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons: 1 row when they fit (>=350px); otherwise Payments Schedule full width under View Details */}
      <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-black/[0.06] flex flex-col min-[350px]:flex-row min-[350px]:items-center justify-between gap-2 sm:gap-2.5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="min-h-[44px] px-2 flex items-center justify-center min-[350px]:justify-start gap-1.5 text-xs font-semibold text-[#6B7462] hover:text-[#151914] transition-colors w-full min-[350px]:w-auto"
        >
          <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <Link
          href={`/society-members/payments?plot=${plot.id}`}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-[#43612B] text-white hover:bg-[#365222] shadow-[0_2px_8px_rgba(67,97,43,0.25)] transition-all whitespace-nowrap w-full min-[350px]:w-auto"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payments Schedule</span>
        </Link>
      </div>
    </div>
  );
};
