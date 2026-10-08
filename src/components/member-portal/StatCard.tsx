'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  };
}

const badgeVariants = {
  success: 'bg-[#EAF0E7] text-[#43612B] border-[#43612B]/20',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-black/5 text-[#6B7462] border-black/10',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.08] p-3.5 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between overflow-hidden min-w-0">
      <div>
        {/* Top Row: Title + Icon (Always perfectly aligned) */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7462] truncate">
            {title}
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#FAF9F5] border border-black/[0.06] flex items-center justify-center text-[#43612B] shrink-0">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        {/* Primary Value (Full width, never pushes the icon) */}
        <div className="mt-1 sm:mt-2 mb-0.5 sm:mb-1">
          <div className="text-base sm:text-2xl xl:text-[25px] font-bold font-display text-[#151914] tracking-tight truncate leading-tight tabular-nums">
            {value}
          </div>
        </div>
      </div>

      {/* Bottom Row: Context Subtitle + Badge on one line (Hugs content, equal heights) */}
      <div className="mt-2 pt-2 sm:mt-3 sm:pt-2.5 border-t border-black/[0.05] flex items-center justify-between gap-1.5 text-xs min-w-0">
        <span
          className="text-[#6B7462] font-medium text-[10px] sm:text-xs truncate min-w-0"
          title={subtitle}
        >
          {subtitle || '\u00A0'}
        </span>
        {badge ? (
          <span
            className={`px-2 py-0.5 sm:px-2.5 rounded-full text-[10px] sm:text-[11px] font-semibold border whitespace-nowrap shrink-0 ${
              badgeVariants[badge.variant || 'neutral']
            }`}
          >
            {badge.text}
          </span>
        ) : (
          <span className="text-[10px] sm:text-[11px] py-0.5 invisible select-none" aria-hidden="true">
            &nbsp;
          </span>
        )}
      </div>
    </div>
  );
};
