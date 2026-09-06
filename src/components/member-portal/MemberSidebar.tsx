'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  CreditCard,
  History,
  FileText,
  User,
  LogOut,
  ChevronRight,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { siteConfig } from '@/data/site';

interface MemberSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: '/society-members/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/society-members/properties', label: 'My Properties', icon: Home },
  { href: '/society-members/payments', label: 'Payments', icon: CreditCard },
  { href: '/society-members/payments/history', label: 'Payment History', icon: History },
  { href: '/society-members/documents', label: 'Documents', icon: FileText },
  { href: '/society-members/profile', label: 'Profile', icon: User },
];

export const MemberSidebar: React.FC<MemberSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { logout } = useAuth();

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
                src="/logo-trimmed.png"
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
              className="lg:hidden p-1.5 rounded-lg text-[#6B7462] hover:text-[#151914] hover:bg-black/5 transition-colors"
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
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-90" />}
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
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Log Out</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-600/80">Exit</span>
          </button>
        </div>
      </aside>
    </>
  );
};
