'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, ArrowRight, CheckCircle2, BookmarkCheck, Building2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { regionData } from '@/lib/map/regionData';
import { Region } from '@/lib/map/types';
import { AdminSession } from '@/lib/mock/types';
import { BlockSummary } from '@/lib/dal/adminPlots';
import { canAccessBlock } from '@/lib/dal/adminAuth';
import { hasBlockMap } from '@/lib/map/blockRegistry';

interface InteractiveOverviewMapProps {
  session: AdminSession | null;
  blocks: BlockSummary[];
  onImageLoad?: () => void;
}

export default function InteractiveOverviewMap({ session, blocks, onImageLoad }: InteractiveOverviewMapProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const getBlockSummary = (blockId: string) => {
    return blocks.find((b) => b.id === blockId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleRegionClick = (region: Region) => {
    if (!session || !canAccessBlock(session, region.blockId)) {
      return;
    }
    router.push(`/admin/master-plan/${region.blockId}`);
  };

  const getTooltipStyle = () => {
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1567;
    const containerHeight = typeof window !== 'undefined' ? window.innerHeight : 1343;
    const cardWidth = Math.min(288, Math.max(200, containerWidth - 24));
    const cardHeight = 240;

    let left = mousePos.x + 16;
    if (left + cardWidth > containerWidth - 12) {
      left = mousePos.x - cardWidth - 16;
    }
    left = Math.max(12, Math.min(left, containerWidth - cardWidth - 12));

    let top = mousePos.y - 24;
    if (top + cardHeight > containerHeight - 12) {
      top = mousePos.y - cardHeight - 12;
    }
    top = Math.max(12, Math.min(top, containerHeight - cardHeight - 12));

    return { left, top, maxWidth: `calc(100% - 24px)` };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredRegion(null)}
    >
      {/* Aspect Ratio Container (1567 x 1343) */}
      <div className="relative w-full pb-[85.71%]">
        {/* Base Map Image */}
        <Image
          src="/master-plan/Master Plan/Master Plan.png"
          alt="Prime View Master Plan Overview"
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-contain pointer-events-none"
          onLoad={() => onImageLoad?.()}
        />

        {/* SVG Interactive Overlay */}
        <svg
          viewBox="0 0 1567 1343"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          onPointerLeave={() => setHoveredRegion(null)}
        >
          <defs>
            {/* Out-of-scope hatch pattern */}
            <pattern id="outOfScopeHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="8" fill="#1e293b" fillOpacity="0.75" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1.5" />
            </pattern>
            {/* Cyan glow filter from masterPlan.html */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#22d3ee" floodOpacity="0.95" />
            </filter>
          </defs>

          {regionData.map((region) => {
            const isAccessible = session ? canAccessBlock(session, region.blockId) : true;
            const isHovered = hoveredRegion?.id === region.id;
            const summary = getBlockSummary(region.blockId as string);

            let fillColor = 'transparent';
            let fillOpacity = 0;
            let strokeColor = 'transparent';
            let strokeWidth = 0;
            let filter = 'none';

            if (!isAccessible) {
              fillColor = 'url(#outOfScopeHatch)';
              fillOpacity = 0.85;
              strokeColor = '#64748b';
              strokeWidth = 1;
            } else if (isHovered) {
              // Exact cyan glowing highlight from masterPlan.html
              fillColor = 'rgba(34, 211, 238, 0.22)';
              fillOpacity = 1;
              strokeColor = '#67e8f9';
              strokeWidth = 3.5;
              filter = 'url(#cyanGlow)';
            }

            return (
              <g
                key={region.id}
                id={`group-${region.blockId}`}
                data-region-group={region.blockId}
                className={isAccessible ? 'cursor-pointer transition-all duration-200' : 'cursor-not-allowed opacity-60'}
                onMouseEnter={() => setHoveredRegion(region)}
                onMouseLeave={() => setHoveredRegion((cur) => (cur?.id === region.id ? null : cur))}
                onClick={() => handleRegionClick(region)}
              >
                {/* Boundary Polygon / Path */}
                <path
                  id={`region-${region.blockId}`}
                  data-block-id={region.blockId}
                  d={region.mapPath}
                  fill={fillColor}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  filter={filter}
                  style={{ pointerEvents: 'all' }}
                  className="transition-all duration-200"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Card */}
        {hoveredRegion && (
          <div
            className="pointer-events-none fixed z-50 transition-all duration-75 ease-out"
            style={getTooltipStyle()}
          >
            {(() => {
              const isAccessible = session ? canAccessBlock(session, hoveredRegion.blockId) : true;
              const summary = getBlockSummary(hoveredRegion.blockId as string);

              if (!isAccessible) {
                return (
                  <div data-testid="map-hover-preview" className="w-64 rounded-2xl border border-slate-700 bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md">
                    <div className="flex items-center gap-2 text-rose-400">
                      <Lock className="h-4 w-4" />
                      <span className="font-bold text-xs">Restricted Scope</span>
                    </div>
                    <div className="mt-1 font-serif text-sm font-bold text-slate-100">
                      {hoveredRegion.name}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                      Outside your assigned administrative jurisdiction. Contact Super Admin for authorization.
                    </p>
                  </div>
                );
              }

              const officialTotal = summary?.totalCount ?? hoveredRegion.units;
              const reserved = summary?.reservedCount || 0;
              const booked = summary?.bookedCount || 0;
              const available = summary?.availableCount ?? Math.max(0, officialTotal - reserved - booked);

              return (
                <div data-testid="map-hover-preview" className="w-72 rounded-2xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: hoveredRegion.darkColor }}
                      />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        {hasBlockMap(hoveredRegion.blockId) ? 'Interactive Traced Map' : 'Sector Map'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-cyan-50 text-cyan-900 px-2 py-0.5 rounded-full border border-cyan-200 font-mono">
                      {officialTotal > 0 ? `${officialTotal} Total Properties` : 'Proposed Land'}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-slate-900">
                    {hoveredRegion.name}
                  </h4>

                  {officialTotal > 0 ? (
                    <div className="mt-3 grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                      <div className="bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-100">
                        <div className="text-[9px] font-mono font-bold text-emerald-700 uppercase">Avail</div>
                        <div className="text-sm font-bold text-emerald-900 font-mono">{available}</div>
                      </div>
                      <div className="bg-amber-50/80 p-1.5 rounded-lg border border-amber-100">
                        <div className="text-[9px] font-mono font-bold text-amber-700 uppercase">Rsvd</div>
                        <div className="text-sm font-bold text-amber-900 font-mono">{reserved}</div>
                      </div>
                      <div className="bg-rose-50/80 p-1.5 rounded-lg border border-rose-100">
                        <div className="text-[9px] font-mono font-bold text-rose-700 uppercase">Booked</div>
                        <div className="text-sm font-bold text-rose-900 font-mono">{booked}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <p className="text-[11px] font-medium text-slate-600">
                        Proposed Land — 0 Total Properties Yet. Expansion zone reserved for future phases.
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-center text-xs font-bold text-emerald-700 pt-2 border-t border-slate-100">
                    <span>Click to open block view</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
