'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/data/site';
import {
  LayoutDashboard,
  Home,
  CreditCard,
  History,
  User,
  LogOut,
  ChevronRight,
  ArrowLeft,
  X,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUnreadReceiptsCount } from '@/lib/dal/receipts';

interface MemberSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: '/society-members/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/society-members/properties', label: 'My Properties', icon: Home },
  { href: '/society-members/payments', label: 'Payments', icon: CreditCard },
  { href: '/society-members/payments/receipts', label: 'Submitted Receipts', icon: Receipt },
  { href: '/society-members/payments/history', label: 'Payment History', icon: History },
  { href: '/society-members/strikes', label: 'Compliance & Strikes', icon: ShieldAlert },
  { href: '/society-members/profile', label: 'Profile', icon: User },
];

export const MemberSidebar: React.FC<MemberSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshUnreadCount = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const isCurrentPage = pathname === '/society-members/payments/receipts';
    if (isCurrentPage) {
      localStorage.setItem('pv_receipts_last_opened', new Date().toISOString());
      setUnreadCount(0);
      return;
    }

    let lastOpened = localStorage.getItem('pv_receipts_last_opened');
    if (!lastOpened) {
      lastOpened = new Date().toISOString();
      localStorage.setItem('pv_receipts_last_opened', lastOpened);
      setUnreadCount(0);
      return;
    }

    try {
      const count = await getUnreadReceiptsCount(lastOpened);
      setUnreadCount(count);
    } catch {
      // non-blocking
    }
  }, [pathname]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Real-time synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('prime-view-sync');

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (
        data.type === 'RECEIPT_SUBMITTED' ||
        data.type === 'RECEIPT_VERIFIED' ||
        data.type === 'RECEIPT_CANCELLED' ||
        data.type === 'RECEIPT_REJECTED'
      ) {
        refreshUnreadCount();
      } else if (data.type === 'RECEIPTS_OPENED') {
        setUnreadCount(0);
      }
    };

    const intervalId = setInterval(() => {
      refreshUnreadCount();
    }, 30000);

    return () => {
      channel.close();
      clearInterval(intervalId);
    };
  }, [refreshUnreadCount]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#FAF9F7] text-[#151914] flex flex-col border-r border-black/[0.08] transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Top Brand Header */}
        <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            {/* Logo Container with high-contrast white background */}
            <div className="relative w-12 h-12 rounded-2xl bg-white p-1 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-black/[0.08] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src={siteConfig.logoPath}
                alt="Prime View Emblem"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg tracking-tight text-[#151914] leading-tight">
                Prime View
              </h2>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#43612B] mt-0.5">
                Member Portal
              </p>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#6B7462] hover:text-[#151914] hover:bg-black/5 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/society-members/payments'
                ? pathname === '/society-members/payments'
                : pathname === item.href || (item.href !== '/society-members/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${isActive
                    ? 'bg-[#43612B] text-white shadow-[0_4px_16px_rgba(67,97,43,0.3)]'
                    : 'text-[#4A5347] hover:bg-black/5 hover:text-[#151914]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#43612B]'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.href === '/society-members/payments/receipts' && unreadCount > 0 && !isActive && (
                    <span
                      id="submitted-receipts-unread-badge"
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-700 text-white min-w-[18px] text-center shadow-xs"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-90" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-black/[0.06] space-y-2">
          <Link
            href="/society-members"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#6B7462] hover:bg-black/5 hover:text-[#151914] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#43612B]" />
            <span>Back to Society Site</span>
          </Link>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-center cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};
