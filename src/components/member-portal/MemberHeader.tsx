'use client';

import React from 'react';
import { Menu, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePortal } from './PortalContext';

interface MemberHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
}

export const MemberHeader: React.FC<MemberHeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
}) => {
  const { currentUser } = useAuth();
  const portal = usePortal();

  const handleOpenMenu = onOpenMobileMenu || portal.openMobileMenu;

  return (
    <header className="bg-[#FAF9F7] border-b border-black/[0.08] px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={handleOpenMenu}
          className="lg:hidden p-2 rounded-xl border border-black/10 bg-white text-[#151914] hover:bg-black/5 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-[#151914] leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#6B7462] font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF0E7] border border-[#43612B]/20 text-[#43612B] text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#43612B]" />
          <span>Verified Member File</span>
        </div>

        <div className="flex items-center gap-2.5 pl-2 border-l border-black/10">
          <div className="w-9 h-9 rounded-full bg-[#43612B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-[#151914] leading-tight">
              {currentUser?.fullName || 'Member'}
            </p>
            <p className="text-[10px] text-[#6B7462] font-mono">ID: {currentUser?.customerId}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
