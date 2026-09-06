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
      <div className="py-12 text-center text-[#8FAF7E] animate-pulse">
        Loading Society Master Plan...
      </div>
    );
  }

  const isSuper = session.role === 'super_admin';

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#11271E] to-[#173428] border border-[#244F3C] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Master Plan Level 1 • Society Sectors
            </span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-white">
            {isSuper
              ? 'All Society Blocks (8 Sectors)'
              : `Assigned Block Enclaves (${blocks.length} Sectors)`}
          </h2>
          <p className="text-xs text-[#A0B8AD] mt-1 max-w-2xl">
            Select a block to inspect real-time plot allocations, acquire locking privileges for direct bookings, or reserve plots with customizable token fees.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-[#0B1A14] border border-[#204736] px-3.5 py-2 rounded-xl text-[#A3C692]">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          <span>Scope: {isSuper ? 'Society-Wide' : session.assignedBlocks.join(', ').toUpperCase()}</span>
        </div>
      </div>

      {/* Block Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blocks.map((block) => {
          const availPct = block.totalCount > 0 ? (block.availableCount / block.totalCount) * 100 : 0;
          const resPct = block.totalCount > 0 ? (block.reservedCount / block.totalCount) * 100 : 0;
          const bookPct = block.totalCount > 0 ? (block.bookedCount / block.totalCount) * 100 : 0;

          return (
            <div
              key={block.id}
              className="bg-[#0F221A] border border-[#1F4433] hover:border-[#387B5B] rounded-2xl p-6 flex flex-col justify-between shadow-lg transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white group-hover:text-[#D4AF37] transition-colors">
                      {block.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-[#6D917F] font-mono mt-0.5">
                      <MapPin className="w-3 h-3 text-[#A3C692]" />
                      <span>{block.id.toUpperCase()} SECTOR</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#173327] text-[#D4AF37] border border-[#2B5742] px-2.5 py-1 rounded-lg">
                    {block.totalCount} Plots
                  </span>
                </div>

                <p className="text-xs text-[#A0B8AD] line-clamp-2 mb-4 leading-relaxed">
                  {block.description}
                </p>

                {/* Real Authentic Amenities Badges */}
                <div className="mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6D917F] mb-1.5">
                    Authentic Society Amenities:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {block.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="bg-[#18352A] border border-[#2C5743] text-[#CBE2BA] text-[10px] px-2 py-0.5 rounded-md font-medium"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress Distribution Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8FAF7E] mb-1.5">
                    <span>Inventory Status</span>
                    <span>{Math.round(availPct)}% Available</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#091510] flex overflow-hidden border border-[#1C3A2D]">
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
                      className="bg-slate-500 hover:opacity-90 transition-all"
                      title={`Booked: ${block.bookedCount}`}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown Chips */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] mb-5">
                  <div className="bg-[#132A20] border border-[#224436] p-2 rounded-lg">
                    <div className="text-emerald-400 font-bold text-xs">{block.availableCount}</div>
                    <div className="text-[#6D917F] mt-0.5 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Avail</span>
                    </div>
                  </div>
                  <div className="bg-[#132A20] border border-[#224436] p-2 rounded-lg">
                    <div className="text-amber-300 font-bold text-xs">{block.reservedCount}</div>
                    <div className="text-[#6D917F] mt-0.5 flex items-center justify-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>Res</span>
                    </div>
                  </div>
                  <div className="bg-[#132A20] border border-[#224436] p-2 rounded-lg">
                    <div className="text-slate-300 font-bold text-xs">{block.bookedCount}</div>
                    <div className="text-[#6D917F] mt-0.5 flex items-center justify-center gap-1">
                      <Building2 className="w-2.5 h-2.5 text-slate-400" />
                      <span>Book</span>
                    </div>
                  </div>
                  <div className="bg-[#132A20] border border-[#224436] p-2 rounded-lg">
                    <div className="text-indigo-300 font-bold text-xs">{block.amenityCount}</div>
                    <div className="text-[#6D917F] mt-0.5">Amenity</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/admin/master-plan/${block.id}`}
                className="w-full py-2.5 px-4 bg-[#1A3A2C] hover:bg-[#D4AF37] hover:text-[#0A1510] text-[#FAF9F7] text-xs font-bold uppercase tracking-wider rounded-xl border border-[#2C5743] hover:border-[#D4AF37] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Enter Plot Grid</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
