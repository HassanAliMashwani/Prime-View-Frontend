'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getAdminMasterPlanBlocks, BlockSummary } from '@/lib/dal/adminPlots';
import { AdminSession } from '@/lib/mock/types';

const AMENITY_COLORS: Record<string, string> = {
  Hospital: 'bg-rose-50 text-rose-800 border-rose-200',
  'Community Mosque': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  School: 'bg-blue-50 text-blue-800 border-blue-200',
  Park: 'bg-green-50 text-green-800 border-green-200',
  'Filtration Plant': 'bg-cyan-50 text-cyan-800 border-cyan-200',
  'Community Centre': 'bg-purple-50 text-purple-800 border-purple-200',
  'Play Ground': 'bg-amber-50 text-amber-800 border-amber-200',
  'Grid Station': 'bg-amber-100 text-amber-900 border-amber-300',
  'Grave Yard': 'bg-slate-100 text-slate-800 border-slate-300',
};

const SECTOR_THEMES: Record<string, { badge: string; border: string; accent: string; bar: string; btn: string }> = {
  abbott: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    border: 'border-emerald-200 hover:border-emerald-500',
    accent: 'text-emerald-800',
    bar: 'bg-emerald-600',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  royal: {
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    border: 'border-amber-200 hover:border-amber-500',
    accent: 'text-amber-800',
    bar: 'bg-amber-600',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  overseas: {
    badge: 'bg-sky-100 text-sky-900 border-sky-300',
    border: 'border-sky-200 hover:border-sky-500',
    accent: 'text-sky-800',
    bar: 'bg-sky-600',
    btn: 'bg-sky-600 hover:bg-sky-700 text-white',
  },
  elite: {
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    border: 'border-purple-200 hover:border-purple-500',
    accent: 'text-purple-800',
    bar: 'bg-purple-600',
    btn: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  chalet: {
    badge: 'bg-rose-100 text-rose-900 border-rose-300',
    border: 'border-rose-200 hover:border-rose-500',
    accent: 'text-rose-800',
    bar: 'bg-rose-600',
    btn: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  commercial: {
    badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    border: 'border-indigo-200 hover:border-indigo-500',
    accent: 'text-indigo-800',
    bar: 'bg-indigo-600',
    btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  'npf-phase-1': {
    badge: 'bg-teal-100 text-teal-900 border-teal-300',
    border: 'border-teal-200 hover:border-teal-500',
    accent: 'text-teal-800',
    bar: 'bg-teal-600',
    btn: 'bg-teal-600 hover:bg-teal-700 text-white',
  },
  'npf-phase-2': {
    badge: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    border: 'border-cyan-200 hover:border-cyan-500',
    accent: 'text-cyan-800',
    bar: 'bg-cyan-600',
    btn: 'bg-cyan-600 hover:bg-cyan-700 text-white',
  },
};

export default function MasterPlanPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [blocks, setBlocks] = useState<BlockSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadBlocks = useCallback(async (s: AdminSession) => {
    try {
      const res = await getAdminMasterPlanBlocks(s);
      if (res.ok) {
        setBlocks(res.blocks);
      }
    } catch (err) {
      console.error('Failed to load blocks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const s = getActiveAdminSession();
    if (s) {
      setSession(s);
      loadBlocks(s);
    }
  }, [loadBlocks]);

  // Real-time multi-window sync
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('prime-view-sync');
    channel.onmessage = () => {
      const s = getActiveAdminSession();
      if (s) {
        loadBlocks(s);
      }
    };
    return () => {
      channel.close();
    };
  }, [loadBlocks]);

  if (loading || !session) {
    return (
      <div className="py-12 text-center text-emerald-800 animate-pulse font-medium">
        Loading Society Master Plan...
      </div>
    );
  }

  const isSuper = session.role === 'super_admin';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner - Light Indigo/Emerald Modern Executive Theme */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-emerald-50/70 border-2 border-indigo-200/90 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-slate-900">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100 border border-indigo-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Master Plan Level 1 • Society Sectors
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-slate-900">
            {isSuper
              ? 'All Society Blocks (8 Sectors)'
              : `Assigned Block Enclaves (${blocks.length} Sectors)`}
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Select a block to inspect real-time plot allocations, acquire locking privileges for direct bookings, or reserve plots with customizable token fees.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-700 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Scope: <strong className="text-slate-900">{isSuper ? 'Society-Wide' : session.assignedBlocks.join(', ').toUpperCase()}</strong></span>
        </div>
      </div>

      {/* Block Cards Grid - Each with Signature Sector Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blocks.map((block) => {
          const availPct = block.totalCount > 0 ? (block.availableCount / block.totalCount) * 100 : 0;
          const resPct = block.totalCount > 0 ? (block.reservedCount / block.totalCount) * 100 : 0;
          const bookPct = block.totalCount > 0 ? (block.bookedCount / block.totalCount) * 100 : 0;
          const theme = SECTOR_THEMES[block.id] || {
            badge: 'bg-slate-100 text-slate-800 border-slate-300',
            border: 'border-slate-200 hover:border-slate-400',
            accent: 'text-slate-800',
            bar: 'bg-slate-700',
          };

          return (
            <div
              key={block.id}
              className={`bg-white border-2 ${theme.border} rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className={`font-serif font-bold text-lg ${theme.accent} transition-colors`}>
                      {block.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-700" />
                      <span>{block.id.toUpperCase()} SECTOR</span>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-bold border px-2.5 py-1 rounded-xl ${theme.badge}`}>
                    {block.totalCount} Plots
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed font-medium">
                  {block.description}
                </p>

                {/* Individual Colorful Amenity Badges */}
                <div className="mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Authentic Society Amenities:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {block.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className={`border text-[10px] px-2.5 py-1 rounded-lg font-bold shadow-2xs ${
                          AMENITY_COLORS[amenity] || 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        ★ {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress Distribution Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-medium">
                    <span>Inventory Status</span>
                    <span className="font-bold text-slate-700">{Math.round(availPct)}% Available</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 flex overflow-hidden">
                    <div
                      style={{ width: `${availPct}%` }}
                      className="bg-emerald-500 hover:opacity-90 transition-all"
                      title={`Available: ${block.availableCount}`}
                    />
                    <div
                      style={{ width: `${resPct}%` }}
                      className="bg-amber-400 hover:opacity-90 transition-all"
                      title={`Reserved: ${block.reservedCount}`}
                    />
                    <div
                      style={{ width: `${bookPct}%` }}
                      className="bg-purple-500 hover:opacity-90 transition-all"
                      title={`Booked: ${block.bookedCount}`}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown Chips */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] mb-5">
                  <div className="bg-emerald-50/70 border border-emerald-200 p-2 rounded-xl">
                    <div className="text-emerald-800 font-bold text-xs">{block.availableCount}</div>
                    <div className="text-emerald-700 font-medium mt-0.5 flex items-center justify-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Avail</span>
                    </div>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-200 p-2 rounded-xl">
                    <div className="text-amber-800 font-bold text-xs">{block.reservedCount}</div>
                    <div className="text-amber-700 font-medium mt-0.5 flex items-center justify-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                      <span>Res</span>
                    </div>
                  </div>
                  <div className="bg-purple-50/70 border border-purple-200 p-2 rounded-xl">
                    <div className="text-purple-800 font-bold text-xs">{block.bookedCount}</div>
                    <div className="text-purple-700 font-medium mt-0.5 flex items-center justify-center gap-0.5">
                      <Building2 className="w-2.5 h-2.5 text-purple-600" />
                      <span>Book</span>
                    </div>
                  </div>
                  <div className="bg-indigo-50/70 border border-indigo-200 p-2 rounded-xl">
                    <div className="text-indigo-800 font-bold text-xs">{block.amenityCount}</div>
                    <div className="text-indigo-700 font-medium mt-0.5">Amenity</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/admin/master-plan/${block.id}`}
                className={`w-full py-2.5 px-4 ${theme.btn} text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs`}
              >
                <span>Enter Plot Grid</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
