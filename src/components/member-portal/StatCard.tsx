'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
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
    <div className="bg-white rounded-2xl border border-black/[0.08] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between overflow-hidden">
      <div>
        {/* Top Row: Title + Icon (Always perfectly aligned) */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#6B7462] truncate">
            {title}
          </span>
          <div className="w-9 h-9 rounded-xl bg-[#FAF9F5] border border-black/[0.06] flex items-center justify-center text-[#43612B] shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {/* Primary Value (Full width, never pushes the icon) */}
        <div className="mt-2 mb-1">
          <div className="text-xl sm:text-2xl xl:text-[25px] font-bold font-display text-[#151914] tracking-tight truncate leading-tight">
            {value}
          </div>
        </div>
      </div>

      {/* Bottom Row: Context Subtitle + Badge (No wrapping or overlap) */}
      {(subtitle || badge) && (
        <div className="mt-3 pt-2.5 border-t border-black/[0.05] flex items-center justify-between gap-2 text-xs min-w-0">
          {subtitle && (
            <span
              className="text-[#6B7462] font-medium text-[11px] sm:text-xs truncate min-w-0"
              title={subtitle}
            >
              {subtitle}
            </span>
          )}
          {badge && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border whitespace-nowrap shrink-0 ${
                badgeVariants[badge.variant || 'neutral']
              }`}
            >
              {badge.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
