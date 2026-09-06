'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Users, ChevronDown, CheckCircle2, Bell } from 'lucide-react';
import { AdminSession } from '@/lib/mock/types';
import { adminLogin } from '@/lib/dal/adminAuth';

interface AdminHeaderProps {
  session: AdminSession | null;
  title: string;
  subtitle?: string;
  onSyncEvent?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  session,
  title,
  subtitle,
  onSyncEvent,
}) => {
  const router = useRouter();
  const [syncStatus, setSyncStatus] = useState<'connected' | 'event_received'>('connected');
  const [lastSyncMsg, setLastSyncMsg] = useState<string>('BroadcastChannel Active');
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [switching, setSwitching] = useState<boolean>(false);

  // Cross-tab Live Sync Listener (Exception 5.5)
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
        const desc = data.plotId
          ? `${data.type.replace('_', ' ')}: ${data.plotId}`
          : `${data.type}`;
        setLastSyncMsg(desc);

        // Notify parent to re-fetch
        if (onSyncEvent) {
          onSyncEvent();
        }

        // Return to steady state after 3 seconds
        setTimeout(() => {
          setSyncStatus('connected');
          setLastSyncMsg('BroadcastChannel Active');
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

  const handleQuickSwitch = async (username: string) => {
    setSwitching(true);
    setShowRoleMenu(false);
    try {
      const res = await adminLogin(username, 'password123');
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="bg-[#10251E] border-b border-white/10 px-8 py-4 flex items-center justify-between shadow-md">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-[#A3C692]">
          <span>Prime View Management</span>
          <span>/</span>
          <span className="text-[#CBE2BA]">{title}</span>
        </div>
        <h1 className="text-xl font-bold font-serif text-white mt-0.5 tracking-tight flex items-center gap-2">
          {title}
          {subtitle && (
            <span className="text-xs font-sans font-normal text-[#A0B8AD] ml-2">
              — {subtitle}
            </span>
          )}
        </h1>
      </div>

      {/* Right Controls: Live Sync Badge + Quick Role Switcher */}
      <div className="flex items-center gap-4">
        {/* Live Sync Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
            syncStatus === 'event_received'
              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse'
              : 'bg-[#18352A] text-[#8FAF7E] border border-[#2B5443]'
          }`}
          title="Multi-admin cross-tab synchronized state"
        >
          <Radio
            className={`w-3.5 h-3.5 ${
              syncStatus === 'event_received' ? 'text-amber-400 animate-spin' : 'text-emerald-400'
            }`}
          />
          <span className="text-[11px]">{lastSyncMsg}</span>
        </div>

        {/* Quick Role Switcher for Concurrency Testing */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            disabled={switching}
            className="flex items-center gap-2 bg-[#1A3A2D] hover:bg-[#234A3B] border border-[#346550] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline text-[#D5E5DA]">
              Switch Role:{' '}
              <strong className="text-[#FAF9F7] font-semibold">
                {session?.role === 'super_admin' ? 'Super Admin' : session?.username}
              </strong>
            </span>
            <ChevronDown className="w-3 h-3 text-[#A0B8AD]" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0E2019] border border-[#2B5443] rounded-xl shadow-2xl py-2 z-50 text-xs">
              <div className="px-3 py-1.5 border-b border-[#1E3A2F] text-[10px] uppercase font-bold text-[#6D917F] tracking-wider">
                Simulate Concurrency (Switch Admin)
              </div>

              <button
                onClick={() => handleQuickSwitch('admin')}
                className={`w-full text-left px-3.5 py-2.5 hover:bg-[#18352A] flex items-center justify-between transition-colors ${
                  session?.username === 'admin' ? 'bg-[#18352A] text-[#D4AF37]' : 'text-white'
                }`}
              >
                <div>
                  <div className="font-semibold">Super Administrator (admin)</div>
                  <div className="text-[10px] text-[#8FAF7E]">Full access • All 8 Blocks</div>
                </div>
                {session?.username === 'admin' && (
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                )}
              </button>

              <button
                onClick={() => handleQuickSwitch('marketing')}
                className={`w-full text-left px-3.5 py-2.5 hover:bg-[#18352A] flex items-center justify-between transition-colors ${
                  session?.username === 'marketing' ? 'bg-[#18352A] text-[#D4AF37]' : 'text-white'
                }`}
              >
                <div>
                  <div className="font-semibold">Marketing Sub-Admin (marketing)</div>
                  <div className="text-[10px] text-[#8FAF7E]">Scope: Abbott + Royal Blocks</div>
                </div>
                {session?.username === 'marketing' && (
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                )}
              </button>

              <button
                onClick={() => handleQuickSwitch('police')}
                className={`w-full text-left px-3.5 py-2.5 hover:bg-[#18352A] flex items-center justify-between transition-colors ${
                  session?.username === 'police' ? 'bg-[#18352A] text-[#D4AF37]' : 'text-white'
                }`}
              >
                <div>
                  <div className="font-semibold">Police Sub-Admin (police)</div>
                  <div className="text-[10px] text-[#8FAF7E]">Scope: Overseas + Elite + Chalet</div>
                </div>
                {session?.username === 'police' && (
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
