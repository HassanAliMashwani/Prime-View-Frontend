'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Users, ChevronDown, CheckCircle2 } from 'lucide-react';
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

        // Return to steady state after 3.5 seconds
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
    <header className="bg-white border-b border-slate-200/90 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <span>Prime View Management</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800">{title}</span>
        </div>
        <h1 className="text-xl font-bold font-serif text-[#10251E] mt-0.5 tracking-tight flex items-center gap-2">
          {title}
          {subtitle && (
            <span className="text-xs font-sans font-normal text-slate-500 ml-2">
              — {subtitle}
            </span>
          )}
        </h1>
      </div>

      {/* Right Controls: Live Sync Badge + Quick Role Switcher */}
      <div className="flex items-center gap-4">
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
          <span className="text-[11px]">{lastSyncMsg}</span>
        </div>

        {/* Quick Role Switcher for Concurrency Testing */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            disabled={switching}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline text-slate-600">
              Switch Role:{' '}
              <strong className="text-[#10251E] font-bold">
                {session?.role === 'super_admin' ? 'Super Admin' : session?.username}
              </strong>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Simulate Concurrency (Switch Admin)
              </div>

              <button
                onClick={() => handleQuickSwitch('admin')}
                className={`w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/70 flex items-center justify-between transition-colors ${
                  session?.username === 'admin' ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-[#10251E]">Super Administrator (admin)</div>
                  <div className="text-[11px] text-slate-500">Full access • All 8 Blocks</div>
                </div>
                {session?.username === 'admin' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                )}
              </button>

              <button
                onClick={() => handleQuickSwitch('marketing')}
                className={`w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/70 flex items-center justify-between transition-colors ${
                  session?.username === 'marketing' ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-[#10251E]">Marketing Sub-Admin (marketing)</div>
                  <div className="text-[11px] text-slate-500">Scope: Abbott + Royal Blocks</div>
                </div>
                {session?.username === 'marketing' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                )}
              </button>

              <button
                onClick={() => handleQuickSwitch('police')}
                className={`w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/70 flex items-center justify-between transition-colors ${
                  session?.username === 'police' ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-[#10251E]">Police Sub-Admin (police)</div>
                  <div className="text-[11px] text-slate-500">Scope: Overseas + Elite + Chalet</div>
                </div>
                {session?.username === 'police' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
