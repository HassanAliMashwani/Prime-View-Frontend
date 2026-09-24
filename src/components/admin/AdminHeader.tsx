'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Radio, Menu, ShieldCheck } from 'lucide-react';
import { AdminSession } from '@/lib/mock/types';

interface AdminHeaderProps {
  session: AdminSession | null;
  title: string;
  subtitle?: string;
  onSyncEvent?: () => void;
  onOpenMobileMenu?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  session,
  title,
  subtitle,
  onSyncEvent,
  onOpenMobileMenu,
}) => {
  const [syncStatus, setSyncStatus] = useState<'connected' | 'event_received'>('connected');
  const [lastSyncMsg, setLastSyncMsg] = useState<string>('Live Sync Active');

  // Cross-tab Live Sync Listener
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('prime-view-sync');
      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.type) return;

        // Visual flash indicator
        setSyncStatus('event_received');
        const formattedType = String(data.type).replace(/_/g, ' ');
        const desc = data.plotId
          ? `${formattedType}: ${data.plotId}`
          : formattedType;
        setLastSyncMsg(desc);

        // Notify parent to re-fetch
        if (onSyncEvent) {
          onSyncEvent();
        }

        // Return to steady state after 3.5 seconds
        setTimeout(() => {
          setSyncStatus('connected');
          setLastSyncMsg('Live Sync Active');
        }, 3500);
      };
    } catch (e) {
      console.warn('BroadcastChannel error in AdminHeader:', e);
    }

    return () => {
      if (channel) {
        channel.close();
      }
    };
  }, [onSyncEvent]);

  return (
    <header className="bg-white border-b border-slate-200/90 px-4 sm:px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
        )}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <span>Prime View Management</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800">{title}</span>
          </div>
          <h1 className="text-xl font-bold font-serif text-[#10251E] mt-0.5 tracking-tight flex items-center gap-2">
            {title}
            {subtitle && (
              <span className="text-xs font-sans font-normal text-slate-500 ml-2 hidden sm:inline">
                — {subtitle}
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Right Controls: Live Sync Badge + Active Admin Info (No role-switching) */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live Sync Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
            syncStatus === 'event_received'
              ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
          title="Multi-admin cross-tab synchronized state"
        >
          <Radio
            className={`w-3.5 h-3.5 ${
              syncStatus === 'event_received' ? 'text-amber-600 animate-spin' : 'text-emerald-600'
            }`}
          />
          <span className="text-[11px] hidden sm:inline">{lastSyncMsg}</span>
          <span className="text-[11px] sm:hidden">Live</span>
        </div>

        {/* Active Admin Badge (Links to Profile) */}
        <Link
          href="/admin/profile"
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer group"
          title="Open Administrator Profile"
        >
          <ShieldCheck className={`w-4 h-4 ${session?.role === 'super_admin' ? 'text-[#D4AF37]' : 'text-blue-600'}`} />
          <div className="hidden md:block text-left">
            <div className="font-bold text-slate-900 group-hover:text-emerald-800 leading-tight transition-colors">
              {session?.fullName || session?.username || 'Administrator'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {session?.role === 'super_admin' ? 'Super Admin' : 'Sub-Admin'}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
};

