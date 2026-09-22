'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Lock, 
  BookmarkCheck, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Building2,
  AlertTriangle,
  User
} from 'lucide-react';
import { Plot } from '@/lib/mock/types';
import { PLOT_STATUS_STYLES, SPECIAL_PLOT_STYLES, getPlotStyle } from '@/lib/constants/plotStatusStyles';

import { getBlockMapConfig } from '@/lib/map/blockRegistry';
import { TracedPlotArea } from '@/lib/map/types';

interface InteractiveBlockMapProps {
  blockId: string;
  plots: Plot[];
  selectedPlot: Plot | null;
  onSelectPlot: (plot: Plot) => void;
  searchFilter?: string;
  statusFilter?: 'all' | 'available' | 'reserved' | 'booked' | 'allotted' | 'disputed' | 'adjustment';
  categoryFilter?: 'all' | 'residential' | 'commercial' | 'farm_house' | 'amenity';
  focusPlotId?: string | null;
}

export default function InteractiveBlockMap({
  blockId,
  plots,
  selectedPlot,
  onSelectPlot,
  searchFilter = '',
  statusFilter = 'all',
  categoryFilter = 'all',
  focusPlotId = null,
}: InteractiveBlockMapProps) {
  const config = getBlockMapConfig(blockId);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan State
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover Tooltip State
  const [hoveredArea, setHoveredArea] = useState<TracedPlotArea | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [groupedToast, setGroupedToast] = useState<string | null>(null);
  const [highlightedAreaSlug, setHighlightedAreaSlug] = useState<string | null>(null);

  // Track handled focusPlotId so auto-focus runs only once and does not fight modal close
  const handledFocusPlotRef = useRef<string | null>(null);

  // Auto pan/zoom and focus when focusPlotId is provided
  useEffect(() => {
    if (!focusPlotId || !config || plots.length === 0) return;
    if (handledFocusPlotRef.current === focusPlotId) return;

    const targetPlot = plots.find((p) => p.id === focusPlotId);
    if (!targetPlot) return;
    handledFocusPlotRef.current = focusPlotId;

    // Find area matching plotNumber
    const targetArea = config.areas.find(
      (a) =>
        a.plotNumber &&
        (a.plotNumber.toLowerCase() === targetPlot.plotNumber.toLowerCase() ||
          a.plotNumber.toLowerCase() === targetPlot.plotNumber.replace(/^[a-z]+-/i, '').toLowerCase())
    );

    if (!targetArea) return;

    // Compute centroid of polygon points
    const xs = targetArea.points.map((pt) => pt.x);
    const ys = targetArea.points.map((pt) => pt.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const containerWidth = containerRef.current?.clientWidth || 1000;
    const containerHeight = containerRef.current?.clientHeight || 750;

    const scaleFactorX = containerWidth / config.naturalWidth;
    const scaleFactorY = containerHeight / config.naturalHeight;

    const targetScale = 1.85;
    const targetPanX = (containerWidth / 2) - (centerX * scaleFactorX * targetScale);
    const targetPanY = (containerHeight / 2) - (centerY * scaleFactorY * targetScale);

    setScale(targetScale);
    setPan({ x: targetPanX, y: targetPanY });
    setHighlightedAreaSlug(targetArea.slug);
    onSelectPlot(targetPlot);

    const timer = setTimeout(() => {
      setHighlightedAreaSlug(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [focusPlotId, config, plots, onSelectPlot]);

  // Quick lookup map: plotNumber -> Plot
  const plotLookup = useMemo(() => {
    const map = new Map<string, Plot>();
    plots.forEach((p) => {
      map.set(p.plotNumber.toLowerCase(), p);
      // Also map without prefixes if present (e.g. 'el-233' -> '233')
      const stripped = p.plotNumber.replace(/^[a-z]+-/i, '').toLowerCase();
      if (stripped !== p.plotNumber.toLowerCase()) {
        map.set(stripped, p);
      }
    });
    return map;
  }, [plots]);

  if (!config) {
    return null;
  }

  const { naturalWidth, naturalHeight, imageSrc, blockName, areas } = config;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.35, 3.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.35, 0.8));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleAreaClick = (area: TracedPlotArea) => {
    if (area.isGroupedRange) {
      const msg = area.slug.includes('parkWithChalets')
        ? 'Chalet Block area — plots 170–232, not yet individually mapped.'
        : area.slug.includes('commercial')
        ? 'Commercial retail strip — plots 59–65, 4 Marla each.'
        : `Grouped region (${area.rangeSpan || 'range'}) — not individually actionable.`;
      setGroupedToast(msg);
      setTimeout(() => setGroupedToast(null), 4000);
      return;
    }

    if (!area.plotNumber) return;

    const plot = plotLookup.get(area.plotNumber.toLowerCase());
    if (plot) {
      onSelectPlot(plot);
    } else {
      setGroupedToast(`Plot ${area.plotNumber} is not registered in active society inventory.`);
      setTimeout(() => setGroupedToast(null), 3500);
    }
  };

  return (
    <div className="relative w-full rounded-3xl border border-slate-200/90 bg-slate-950 overflow-hidden shadow-2xl select-none">
      {/* Map Header Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Map Legend & Pills */}
        <div className="flex flex-col gap-2 pointer-events-auto items-start">
          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3 text-[11px] text-slate-300 shadow-lg">
            <div className="flex items-center gap-1.5 font-bold font-serif text-slate-100 pr-2 border-r border-slate-700">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{blockName} Traced Map</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: PLOT_STATUS_STYLES.available.fill }} />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: PLOT_STATUS_STYLES.reserved.fill }} />
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: PLOT_STATUS_STYLES.booked.fill }} />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-slate-600 shadow-xs" style={{ backgroundColor: PLOT_STATUS_STYLES.allotted.fill }} />
              <span>Allotted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full border shadow-xs"
                style={{
                  borderColor: PLOT_STATUS_STYLES.disputed.stroke,
                  background: `repeating-linear-gradient(45deg, ${PLOT_STATUS_STYLES.disputed.stroke}, ${PLOT_STATUS_STYLES.disputed.stroke} 2px, #ffffff 2px, #ffffff 4px)`,
                }}
              />
              <span className="font-bold text-red-400">Disputed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-slate-700 shadow-xs" style={{ backgroundColor: SPECIAL_PLOT_STYLES.commercialAvailable.fill }} />
              <span>Commercial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: SPECIAL_PLOT_STYLES.amenity.fill }} />
              <span>Amenity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shadow-xs animate-pulse" style={{ backgroundColor: SPECIAL_PLOT_STYLES.adjustment.fill }} />
              <span className="font-bold text-blue-400">Adjustment</span>
            </div>
            <div className="pl-2 border-l border-slate-700 text-[10.5px] text-amber-300 font-medium">
              Color scale is not applicable to amenities
            </div>
          </div>

          {/* D1 Pill directly under Traced Map */}
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 text-[11px] font-medium text-amber-300 shadow-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Color scale is not applicable to amenities</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-lg">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono text-[10px] text-slate-400 font-bold border-l border-slate-800">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>

      {/* Grouped Area Toast Notification */}
      {groupedToast && (
        <div data-testid="grouped-toast" className="absolute top-18 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-amber-500/50 text-amber-200 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{groupedToast}</span>
        </div>
      )}

      {/* Main Interactive Map Canvas */}
      <div
        ref={containerRef}
        className={`relative w-full pb-[80.52%] overflow-hidden cursor-grab ${
          isPanning ? 'cursor-grabbing' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setHoveredArea(null);
        }}
      >
        <div
          className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          }}
        >
          {/* Base PNG Map Layer */}
          <Image
            src={imageSrc}
            alt={blockName}
            fill
            priority
            sizes="(max-width: 2048px) 100vw, 2048px"
            className="object-contain pointer-events-none select-none"
          />

          {/* Scalable SVG Polygon Overlay */}
          <svg
            viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            onPointerLeave={() => setHoveredArea(null)}
          >
            <defs>
              {/* Disputed Striped Pattern: alternating red and white stripes */}
              <pattern
                id="disputedHatch"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="10" height="10" fill={PLOT_STATUS_STYLES.disputed.stroke} />
                <line x1="0" y1="0" x2="0" y2="10" stroke="#ffffff" strokeWidth="3.5" />
              </pattern>
            </defs>

            {areas.map((area, idx) => {
              const pointsStr = area.points.map((pt) => `${pt.x},${pt.y}`).join(' ');
              const isGrouped = area.isGroupedRange;
              const plot = area.plotNumber ? plotLookup.get(area.plotNumber.toLowerCase()) : null;
              const isSelected = selectedPlot && plot && selectedPlot.id === plot.id;
              const isHovered = hoveredArea?.slug === area.slug;

              // Filter checks: strictly hide non-matching plots when a filter is active
              let matchesFilter = true;
              const hasFilterActive = statusFilter !== 'all' || categoryFilter !== 'all' || Boolean(searchFilter && searchFilter.trim());

              if (searchFilter && searchFilter.trim()) {
                const q = searchFilter.toLowerCase().trim();
                const matchesNum = area.plotNumber ? area.plotNumber.toLowerCase().includes(q) : false;
                const matchesSize = plot?.size ? plot.size.toLowerCase().includes(q) : false;
                const matchesAmenity = plot?.amenityName ? plot.amenityName.toLowerCase().includes(q) : false;
                if (!matchesNum && !matchesSize && !matchesAmenity) matchesFilter = false;
              }

              if (statusFilter !== 'all') {
                if (!plot) {
                  matchesFilter = false;
                } else if (statusFilter === 'adjustment') {
                  if (!plot.isAdjustment) matchesFilter = false;
                } else if (statusFilter === 'disputed') {
                  const isDisputed = Boolean(
                    plot.isDisputed || (plot.activeReservationCount && plot.activeReservationCount > 1)
                  );
                  if (!isDisputed) matchesFilter = false;
                } else if (statusFilter === 'available') {
                  if (plot.status !== 'available' || plot.category === 'amenity' || plot.isAdjustment) {
                    matchesFilter = false;
                  }
                } else if (plot.status !== statusFilter) {
                  matchesFilter = false;
                }
              }

              if (categoryFilter !== 'all') {
                if (!plot || plot.category !== categoryFilter) {
                  matchesFilter = false;
                }
              }

              // When any filter is active, completely omit non-matching plots so ONLY matching plots are rendered
              if (hasFilterActive && !matchesFilter) {
                return null;
              }

              // Styling calculation
              let fillColor = PLOT_STATUS_STYLES.available.fill; // available green default
              let fillOpacity = 0.38;
              let strokeColor = PLOT_STATUS_STYLES.available.stroke;
              let strokeWidth = 1.8;
              let isPulsing = false;

              if (isGrouped) {
                fillColor = '#38bdf8';
                fillOpacity = isHovered ? 0.45 : 0.2;
                strokeColor = '#0284c7';
                strokeWidth = 2.5;
              } else if (plot) {
                const isDisputed = Boolean(
                  plot.status === 'disputed' || plot.isDisputed || (plot.activeReservationCount && plot.activeReservationCount > 1)
                );
                const isLocked = Boolean(plot.lockedBy);
                const isReserving = Boolean(
                  (plot.reservingUsers && plot.reservingUsers.length > 0) || plot.reservingByName
                );

                if (plot.isAdjustment) {
                  const style = SPECIAL_PLOT_STYLES.adjustment;
                  fillColor = style.fill;
                  fillOpacity = isHovered ? 0.88 : 0.65;
                  strokeColor = style.stroke;
                  strokeWidth = 3;
                  isPulsing = true;
                } else if (isLocked) {
                  const style = PLOT_STATUS_STYLES.booked;
                  fillColor = style.fill;
                  fillOpacity = 0.65;
                  strokeColor = style.stroke;
                  strokeWidth = 3;
                  isPulsing = true;
                } else if (isDisputed) {
                  const style = PLOT_STATUS_STYLES.disputed;
                  fillColor = style.fill;
                  fillOpacity = isHovered ? 1.0 : 0.9;
                  strokeColor = style.stroke;
                  strokeWidth = 3.5;
                  isPulsing = true;
                } else if (isReserving && plot.status !== 'reserved' && plot.status !== 'booked' && plot.status !== 'allotted') {
                  const style = PLOT_STATUS_STYLES.reserved;
                  fillColor = style.fill;
                  fillOpacity = 0.65;
                  strokeColor = style.stroke;
                  strokeWidth = 3;
                  isPulsing = true;
                } else if (plot.category === 'amenity') {
                  const style = SPECIAL_PLOT_STYLES.amenity;
                  fillColor = style.fill;
                  fillOpacity = isHovered ? 0.6 : 0.35;
                  strokeColor = style.stroke;
                  strokeWidth = 2;
                } else if (plot.category === 'commercial' && plot.status === 'available') {
                  const style = SPECIAL_PLOT_STYLES.commercialAvailable;
                  fillColor = style.fill;
                  fillOpacity = isHovered ? 0.95 : 0.85;
                  strokeColor = style.stroke;
                  strokeWidth = 2.5;
                } else {
                  const style = getPlotStyle(plot);
                  fillColor = style.fill;
                  strokeColor = style.stroke;
                  if (plot.status === 'allotted') {
                    fillOpacity = isHovered ? 0.95 : 0.88;
                    strokeWidth = 2.2;
                  } else if (plot.status === 'booked') {
                    fillOpacity = isHovered ? 0.78 : 0.55;
                    strokeWidth = 2.2;
                  } else if (plot.status === 'reserved') {
                    fillOpacity = isHovered ? 0.75 : 0.55;
                    strokeWidth = 2;
                  } else {
                    fillOpacity = isHovered ? 0.75 : 0.42;
                    strokeWidth = 2;
                  }
                }
              } else {
                // Not registered fallback
                fillColor = '#64748b';
                fillOpacity = 0.25;
                strokeColor = '#475569';
                strokeWidth = 1;
              }

              if (isSelected) {
                strokeColor = '#ffffff';
                strokeWidth = 4;
                fillOpacity = Math.min(fillOpacity + 0.3, 0.9);
              }


              const isHighlighted = highlightedAreaSlug === area.slug;
              if (isHighlighted) {
                strokeColor = '#facc15';
                strokeWidth = 4.5;
                fillOpacity = Math.max(fillOpacity, 0.85);
                isPulsing = true;
              }

              return (
                <polygon
                  key={`${area.slug}-${idx}`}
                  data-slug={area.slug}
                  data-plot-number={area.plotNumber || ''}
                  data-grouped={isGrouped ? 'true' : 'false'}
                  data-disputed={plot && (plot.isDisputed || (plot.activeReservationCount ?? 0) > 1) ? 'true' : 'false'}
                  data-highlighted={isHighlighted ? 'true' : 'false'}
                  points={pointsStr}
                  fill={fillColor}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isGrouped ? '6,4' : undefined}
                  className={`cursor-pointer transition-all duration-150 ${
                    isPulsing ? 'animate-pulse' : ''
                  }`}
                  onMouseEnter={() => setHoveredArea(area)}
                  onMouseLeave={() => setHoveredArea((cur) => (cur?.slug === area.slug ? null : cur))}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAreaClick(area);
                  }}
                />
              );
            })}
          </svg>
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredArea && (
          <div
            className="pointer-events-none absolute z-40 transition-all duration-75 ease-out"
            style={{
              left: Math.min(Math.max(mousePos.x + 12, 12), 700),
              top: Math.min(Math.max(mousePos.y - 30, 12), 480),
            }}
          >
            {(() => {
              if (hoveredArea.isGroupedRange) {
                return (
                  <div className="w-64 rounded-2xl border border-sky-500/40 bg-slate-900/95 p-3 text-white shadow-2xl backdrop-blur-md">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-sky-400">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Grouped Area ({hoveredArea.rangeSpan})</span>
                    </div>
                    <div className="mt-1 font-serif text-sm font-bold text-slate-100">
                      {hoveredArea.slug.includes('parkWithChalets')
                        ? 'Chalet Block Reserve Strip'
                        : 'Commercial Retail Strip'}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                      Visual placeholder area covering unplotted span {hoveredArea.rangeSpan}. Click for information.
                    </p>
                  </div>
                );
              }

              const plot = hoveredArea.plotNumber
                ? plotLookup.get(hoveredArea.plotNumber.toLowerCase())
                : null;

              if (!plot) {
                return (
                  <div className="w-56 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 text-white shadow-2xl backdrop-blur-md">
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Unregistered Plot</div>
                    <div className="font-bold text-sm text-slate-200">Plot {hoveredArea.plotNumber}</div>
                    <div className="text-xs text-slate-400 mt-1">Size: {hoveredArea.sizeLabel}</div>
                  </div>
                );
              }

              const isDisputed = Boolean(
                plot.isDisputed || (plot.activeReservationCount && plot.activeReservationCount > 1)
              );
              const isLocked = Boolean(plot.lockedBy);
              const isReserving = Boolean(
                (plot.reservingUsers && plot.reservingUsers.length > 0) || plot.reservingByName
              );
              const isAmenity = plot.category === 'amenity';



              return (
                <div className="w-68 rounded-2xl border border-slate-700 bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono font-bold text-base text-white">
                      Plot {plot.plotNumber}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                        plot.isAdjustment
                          ? 'bg-blue-950 text-blue-300 border-blue-500 font-bold lowercase'
                          : isLocked
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : isDisputed
                          ? 'bg-rose-950 text-rose-200 border-rose-600 animate-pulse font-bold'
                          : isReserving
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : isAmenity
                          ? 'bg-purple-950 text-purple-300 border-purple-700'
                          : plot.status === 'allotted'
                          ? 'bg-slate-950 text-white border-slate-700'
                          : plot.status === 'booked'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : plot.status === 'reserved'
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      }`}
                    >
                      {plot.isAdjustment
                        ? 'adjustment'
                        : isLocked
                        ? 'Locked'
                        : isDisputed
                        ? `Disputed (${plot.activeReservationCount})`
                        : isReserving
                        ? 'Reserving'
                        : isAmenity
                        ? 'Amenity'
                        : plot.status === 'allotted'
                        ? 'Allotted'
                        : plot.status === 'booked'
                        ? 'Booked'
                        : String(plot.status).replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Adjustment Notice */}
                  {plot.isAdjustment && (
                    <div className="mb-2 p-1.5 rounded-lg bg-blue-950/90 border border-blue-500 text-[10px] text-blue-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                      <span className="font-bold lowercase">
                        adjustment: {plot.adjustmentReason || 'boundary review'}
                      </span>
                    </div>
                  )}

                  {/* Disputed Conflict Warning */}
                  {isDisputed && (
                    <div className="mb-2 p-1.5 rounded-lg bg-rose-950/80 border border-rose-500 text-[10px] text-rose-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="font-bold">
                        {plot.activeReservationCount} competing reservations — needs resolution.
                      </span>
                    </div>
                  )}

                  {isLocked && (
                    <div className="mb-2 p-1.5 rounded-lg bg-rose-900/50 border border-rose-700/50 text-[10px] text-rose-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Being booked by {plot.lockedByName?.split(' ')[0] || 'Admin'}</span>
                    </div>
                  )}

                  {isReserving && !isLocked && (
                    <div className="mb-2 p-1.5 rounded-lg bg-amber-900/50 border border-amber-700/50 text-[10px] text-amber-200 flex items-center gap-1.5">
                      <BookmarkCheck className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>
                        Being reserved by{' '}
                        {plot.reservingUsers && plot.reservingUsers.length > 0
                          ? plot.reservingUsers.map((u) => u.adminName.split(' ')[0]).join(', ')
                          : plot.reservingByName?.split(' ')[0] || 'Admin'}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-slate-300 mt-1">
                    {isAmenity ? (
                      <div className="font-semibold text-purple-300">{plot.amenityName}</div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="capitalize">{plot.size} • {String(plot.category).replace(/_/g, ' ')}</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {plot.price > 0 ? `PKR ${(plot.price / 1000000).toFixed(1)}M` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Click to {isAmenity ? 'view utility details' : 'open action drawer'}</span>
                    <span className="font-mono">ID: {plot.id}</span>
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
