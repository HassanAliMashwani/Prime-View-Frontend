'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, ArrowRight, CheckCircle2, BookmarkCheck, Building2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { regionData } from '@/lib/map/regionData';
import { Region } from '@/lib/map/types';
import { AdminSession } from '@/lib/mock/types';
import { BlockSummary } from '@/lib/dal/adminPlots';
import { canAccessBlock } from '@/lib/dal/adminAuth';

interface InteractiveOverviewMapProps {
  session: AdminSession | null;
  blocks: BlockSummary[];
}

export default function InteractiveOverviewMap({ session, blocks }: InteractiveOverviewMapProps) {
  const router = useRouter();
  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const getBlockSummary = (blockId: string) => {
    return blocks.find((b) => b.id === blockId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleRegionClick = (region: Region) => {
    if (!session || !canAccessBlock(session, region.blockId)) {
      return;
    }
    router.push(`/admin/master-plan/${region.blockId}`);
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-xl select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredRegion(null)}
    >
      {/* Aspect Ratio Container (847 x 712) */}
      <div className="relative w-full pb-[84.06%]">
        {/* Base Map Image */}
        <Image
          src="/master-plan/overview-map.png"
          alt="Prime View Master Plan Overview"
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-contain pointer-events-none"
        />

        {/* SVG Interactive Overlay */}
        <svg
          viewBox="0 0 847 712"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Out-of-scope hatch pattern */}
            <pattern id="outOfScopeHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="8" fill="#1e293b" fillOpacity="0.75" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1.5" />
            </pattern>
            {/* Chalet hatch pattern */}
            <pattern id="chaletHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#AFD9AA" fillOpacity="0.45" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#2d5a3d" strokeWidth="1" />
            </pattern>
          </defs>

          {regionData.map((region) => {
            const isAccessible = session ? canAccessBlock(session, region.blockId) : true;
            const isHovered = hoveredRegion?.id === region.id;
            const summary = getBlockSummary(region.blockId as string);

            let fillColor = region.fill;
            let fillOpacity = isHovered ? 0.65 : 0.28;
            let strokeColor = region.darkColor;
            let strokeWidth = isHovered ? 2.5 : 1.2;

            if (!isAccessible) {
              fillColor = 'url(#outOfScopeHatch)';
              fillOpacity = 0.85;
              strokeColor = '#64748b';
              strokeWidth = 1;
            } else if (region.hatch) {
              fillColor = 'url(#chaletHatch)';
              fillOpacity = isHovered ? 0.8 : 0.55;
            }

            return (
              <g
                key={region.id}
                id={`group-${region.blockId}`}
                data-region-group={region.blockId}
                className={isAccessible ? 'cursor-pointer transition-all duration-200' : 'cursor-not-allowed opacity-60'}
                onMouseEnter={() => setHoveredRegion(region)}
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
                  className="transition-all duration-200"
                />

                {/* Optional Leader Line */}
                {region.leaderLine && (
                  <path
                    d={region.leaderLine}
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                    fill="none"
                  />
                )}

              </g>
            );
          })}
        </svg>

        {/* Hover Floating Card */}
        {hoveredRegion && (
          <div
            className="pointer-events-none absolute z-30 transition-all duration-75 ease-out"
            style={{
              left: Math.min(Math.max(mousePos.x + 16, 16), 560),
              top: Math.min(Math.max(mousePos.y - 40, 16), 460),
            }}
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

              return (
                <div data-testid="map-hover-preview" className="w-72 rounded-2xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: hoveredRegion.darkColor }}
                      />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        {hoveredRegion.blockId === 'elite' ? 'Interactive Traced Map' : 'Sector Map'}
                      </span>
                    </div>
                    {hoveredRegion.blockId === 'elite' && (
                      <span className="text-[9px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                        Level 2 Traced
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif text-base font-bold text-slate-900">
                    {hoveredRegion.name}
                  </h4>

                  {summary ? (
                    <div className="mt-3 grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                      <div className="bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-100">
                        <div className="text-[9px] font-mono font-bold text-emerald-700 uppercase">Avail</div>
                        <div className="text-sm font-bold text-emerald-900 font-mono">{summary.availableCount}</div>
                      </div>
                      <div className="bg-amber-50/80 p-1.5 rounded-lg border border-amber-100">
                        <div className="text-[9px] font-mono font-bold text-amber-700 uppercase">Rsvd</div>
                        <div className="text-sm font-bold text-amber-900 font-mono">{summary.reservedCount}</div>
                      </div>
                      <div className="bg-rose-50/80 p-1.5 rounded-lg border border-rose-100">
                        <div className="text-[9px] font-mono font-bold text-rose-700 uppercase">Booked</div>
                        <div className="text-sm font-bold text-rose-900 font-mono">{summary.bookedCount}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                      {hoveredRegion.description}
                    </p>
                  )}

                  {summary?.disputedCount && summary.disputedCount > 0 ? (
                    <div className="mt-2.5 bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-950 px-2.5 py-1 rounded-xl text-center font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-2xs animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-fuchsia-600 shrink-0" />
                      <span>{summary.disputedCount} Disputed Plot{summary.disputedCount > 1 ? 's' : ''} (Competing Claims)</span>
                    </div>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-emerald-700 pt-2 border-t border-slate-100">
                    <span>Click to open block view</span>
                    <ArrowRight className="h-3.5 w-3.5" />
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
