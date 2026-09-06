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
      {/* Header Banner - Executive Luxury Forest Green */}
      <div className="bg-gradient-to-r from-[#10251E] to-[#183B2B] border border-[#23503B] rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Master Plan Level 1 • Society Sectors
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
            {isSuper
              ? 'All Society Blocks (8 Sectors)'
              : `Assigned Block Enclaves (${blocks.length} Sectors)`}
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
            Select a block to inspect real-time plot allocations, acquire locking privileges for direct bookings, or reserve plots with customizable token fees.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white/10 border border-white/20 px-4 py-2.5 rounded-xl text-emerald-100">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          <span>Scope: <strong>{isSuper ? 'Society-Wide' : session.assignedBlocks.join(', ').toUpperCase()}</strong></span>
        </div>
      </div>

      {/* Block Cards Grid - Crisp White Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blocks.map((block) => {
          const availPct = block.totalCount > 0 ? (block.availableCount / block.totalCount) * 100 : 0;
          const resPct = block.totalCount > 0 ? (block.reservedCount / block.totalCount) * 100 : 0;
          const bookPct = block.totalCount > 0 ? (block.bookedCount / block.totalCount) * 100 : 0;

          return (
            <div
              key={block.id}
              className="bg-white border border-slate-200/90 hover:border-emerald-500 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {block.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-700" />
                      <span>{block.id.toUpperCase()} SECTOR</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-xl">
                    {block.totalCount} Plots
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {block.description}
                </p>

                {/* Real Authentic Amenities Badges */}
                <div className="mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Authentic Society Amenities:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {block.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] px-2 py-0.5 rounded-lg font-semibold"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress Distribution Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-medium">
                    <span>Inventory Status</span>
                    <span>{Math.round(availPct)}% Available</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 flex overflow-hidden">
                    <div
                      style={{ width: `${availPct}%` }}
                      className="bg-emerald-600 hover:opacity-90 transition-all"
                      title={`Available: ${block.availableCount}`}
                    />
                    <div
                      style={{ width: `${resPct}%` }}
                      className="bg-amber-500 hover:opacity-90 transition-all"
                      title={`Reserved: ${block.reservedCount}`}
                    />
                    <div
                      style={{ width: `${bookPct}%` }}
                      className="bg-slate-400 hover:opacity-90 transition-all"
                      title={`Booked: ${block.bookedCount}`}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown Chips */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] mb-5">
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                    <div className="text-emerald-700 font-bold text-xs">{block.availableCount}</div>
                    <div className="text-slate-500 font-medium mt-0.5 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Avail</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                    <div className="text-amber-700 font-bold text-xs">{block.reservedCount}</div>
                    <div className="text-slate-500 font-medium mt-0.5 flex items-center justify-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                      <span>Res</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                    <div className="text-slate-700 font-bold text-xs">{block.bookedCount}</div>
                    <div className="text-slate-500 font-medium mt-0.5 flex items-center justify-center gap-1">
                      <Building2 className="w-2.5 h-2.5 text-slate-500" />
                      <span>Book</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                    <div className="text-indigo-700 font-bold text-xs">{block.amenityCount}</div>
                    <div className="text-slate-500 font-medium mt-0.5">Amenity</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/admin/master-plan/${block.id}`}
                className="w-full py-2.5 px-4 bg-[#10251E] hover:bg-[#18392C] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Enter Plot Grid</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
