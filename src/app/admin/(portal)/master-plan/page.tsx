'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Map as MapIcon,
  LayoutGrid,
  AlertTriangle
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { getAdminMasterPlanBlocks, getAdminBlockPlots, BlockSummary } from '@/lib/dal/adminPlots';
import { AdminSession } from '@/lib/mock/types';
import InteractiveOverviewMap from '@/components/admin/master-plan/InteractiveOverviewMap';
import { loadBlockMapConfig } from '@/lib/map/blockRegistry';

import { getBlockTheme } from '@/lib/map/regionData';
import { AdminMasterPlanSkeleton } from '@/components/ui/skeleton';
import { getCache, setCache, reconcileItems } from '@/lib/dal/apiCache';

export default function MasterPlanPage() {
  const router = useRouter();
  const getInit = () => {
    if (typeof window === 'undefined') return null;
    const s = getActiveAdminSession();
    if (!s) return null;
    return getCache<BlockSummary[]>(`/master-plan:${s.adminId}`, true);
  };
  const init = getInit();

  const [session, setSession] = useState<AdminSession | null>(() => {
    if (typeof window === 'undefined') return null;
    return getActiveAdminSession();
  });
  const [blocks, setBlocks] = useState<BlockSummary[]>(init || []);
  const [loading, setLoading] = useState<boolean>(!init);
  const [viewMode, setViewMode] = useState<'map' | 'cards'>('map');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const hasPrefetchedRef = React.useRef(false);

  const loadBlocks = useCallback(async (s: AdminSession) => {
    try {
      const res = await getAdminMasterPlanBlocks(s);
      if (res.ok) {
        setBlocks((prev) => reconcileItems(prev, res.blocks, (b) => b.id));
        setCache(`/master-plan:${s.adminId}`, res.blocks);
      }
    } catch {
      console.error('request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const s = getActiveAdminSession();
    if (s) {
      setSession(s);
      if (s.role === 'super_admin' || s.permissions?.can_view_master_plan) {
        loadBlocks(s);
      } else {
        setLoading(false);
      }
    }
  }, [loadBlocks]);

  // Sequential prefetching of allowed blocks after overview image has fired load event
  useEffect(() => {
    if (!imageLoaded || !session || hasPrefetchedRef.current) return;
    const isSuper = session.role === 'super_admin';
    const canAccess = isSuper || Boolean(session.permissions?.can_view_master_plan);
    if (!canAccess) return;

    hasPrefetchedRef.current = true;

    const PREFETCH_BLOCK_ORDER = [
      'elite',
      'commercial',
      'royal',
      'overseas',
      'abbott',
      'npf-phase-1',
    ];

    const allowedBlocks = isSuper
      ? PREFETCH_BLOCK_ORDER
      : PREFETCH_BLOCK_ORDER.filter((id) => session.assignedBlocks?.includes(id));

    const adminId = session.adminId || 'admin';

    (async () => {
      for (const blockId of allowedBlocks) {
        try {
          const res = await getAdminBlockPlots(session, blockId);
          if (res.ok && res.block && res.plots) {
            setCache(`/master-plan/${blockId}:${adminId}`, { block: res.block, plots: res.plots });
          }
          const config = await loadBlockMapConfig(blockId);
          if (config?.imageSrc && typeof window !== 'undefined') {
            const img = new window.Image();
            img.src = config.imageSrc;
          }
        } catch {
          // non-blocking sequential prefetch
        }
      }
    })();
  }, [imageLoaded, session]);

  // Real-time multi-window sync
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('prime-view-sync');
    channel.onmessage = () => {
      const s = getActiveAdminSession();
      if (s && (s.role === 'super_admin' || s.permissions?.can_view_master_plan)) {
        loadBlocks(s);
      }
    };
    return () => {
      channel.close();
    };
  }, [loadBlocks]);

  if (!session) {
    return <AdminMasterPlanSkeleton />;
  }

  const isSuper = session.role === 'super_admin';
  const canAccess = isSuper || Boolean(session.permissions?.can_view_master_plan);

  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Master Plan</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your administrative account does not have permission to view the society master plan. Contact administration to adjust your privileges.
        </p>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner - Light Indigo/Emerald Modern Executive Theme */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-emerald-50/70 border-2 border-indigo-200/90 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-slate-900">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            
            
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          {/* View Mode Toggle Pill */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-2xs">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Traced Map</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards ({blocks.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-slate-700 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Scope: <strong className="text-slate-900">{isSuper ? 'Society-Wide' : session.assignedBlocks.join(', ').toUpperCase()}</strong></span>
          </div>
        </div>
      </div>

      {/* Level 1 View: Interactive Traced Overview Map vs Summary Cards */}
      {viewMode === 'map' ? (
        <InteractiveOverviewMap session={session} blocks={blocks} onImageLoad={() => setImageLoaded(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blocks.map((block) => {
          const availPct = block.totalCount > 0 ? (block.availableCount / block.totalCount) * 100 : 0;
          const resPct = block.totalCount > 0 ? (block.reservedCount / block.totalCount) * 100 : 0;
          const bookPct = block.totalCount > 0 ? (block.bookedCount / block.totalCount) * 100 : 0;
          const theme = getBlockTheme(block.id);

          return (
            <div
              key={block.id}
              style={theme.cardBorderStyle}
              className="bg-white border-2 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3
                      style={theme.titleStyle}
                      className="font-serif font-bold text-lg transition-colors"
                    >
                      {block.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-700" />
                      <span>{block.id.toUpperCase()} SECTOR</span>
                    </div>
                  </div>
                  <span
                    style={theme.badgeStyle}
                    className="text-xs font-mono font-bold border px-2.5 py-1 rounded-xl"
                  >
                    {block.totalCount} Plots
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed font-medium">
                  {block.description}
                </p>



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
                      className="bg-red-500 hover:opacity-90 transition-all"
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
                  <div className="bg-red-50/70 border border-red-200 p-2 rounded-xl">
                    <div className="text-red-800 font-bold text-xs">{block.bookedCount}</div>
                    <div className="text-red-700 font-medium mt-0.5 flex items-center justify-center gap-0.5">
                      <Building2 className="w-2.5 h-2.5 text-red-600" />
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
                style={theme.btnStyle}
                className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Enter Plot Grid</span>
              </Link>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
