'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PLOT_STATUS_STYLES } from '@/lib/constants/plotStatusStyles';
import { CheckCircle2, Clock, ShieldCheck, TrendingUp, Loader2 } from 'lucide-react';
import { MonthlyHistoryPoint, getInventoryMonthlyHistory } from '@/lib/dal/inventory';

export type TimeRange = '6_months' | '1_year' | 'all_time';

export interface ChartPoint {
  label: string;
  available: number;
  reserved: number;
  booked: number;
  month?: string;
  year?: number;
}

interface InventoryOverviewChartProps {
  currentAvailable?: number;
  currentReserved?: number;
  currentBooked?: number;
  monthlyData?: ChartPoint[];
  timeRange?: TimeRange;
  onRangeChange?: (range: TimeRange) => void;
  isLoading?: boolean;
}

/**
 * Generate smooth cubic Bezier curve path string through given 2D coordinates.
 */
function generateSmoothSpline(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const tension = 0.22;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * Generate closed area under the spline curve down to the baseline.
 */
function generateAreaPath(points: { x: number; y: number }[], baseY: number): string {
  if (points.length === 0) return '';
  const linePath = generateSmoothSpline(points);
  if (!linePath) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x.toFixed(2)},${baseY.toFixed(2)} L ${first.x.toFixed(2)},${baseY.toFixed(2)} Z`;
}

export default function InventoryOverviewChart({
  currentAvailable = 0,
  currentReserved = 0,
  currentBooked = 0,
  monthlyData,
  timeRange: propTimeRange,
  onRangeChange,
  isLoading: propIsLoading = false,
}: InventoryOverviewChartProps) {
  const [internalRange, setInternalRange] = useState<TimeRange>('6_months');
  const [internalData, setInternalData] = useState<ChartPoint[]>([]);
  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeRange = propTimeRange || internalRange;
  const isControlled = Boolean(monthlyData && monthlyData.length > 0);

  // Self-fetch fallback if monthlyData is not passed
  useEffect(() => {
    if (!isControlled && !propIsLoading) {
      let isMounted = true;
      setInternalLoading(true);
      getInventoryMonthlyHistory(activeRange)
        .then((res) => {
          if (isMounted && res.ok) {
            setInternalData(res.monthly);
          }
        })
        .finally(() => {
          if (isMounted) setInternalLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [activeRange, isControlled, propIsLoading]);

  const rawData: ChartPoint[] = useMemo(() => {
    if (monthlyData && monthlyData.length > 0) return monthlyData;
    return internalData;
  }, [monthlyData, internalData]);

  const loading = propIsLoading || internalLoading;

  const handleRangeSelect = (range: TimeRange) => {
    if (onRangeChange) {
      onRangeChange(range);
    } else {
      setInternalRange(range);
    }
  };

  const available = currentAvailable;
  const reserved = currentReserved;
  const booked = currentBooked;
  const total = available + reserved + booked;

  const availPct = total > 0 ? Number(((available / total) * 100).toFixed(1)) : 0;
  const resPct = total > 0 ? Number(((reserved / total) * 100).toFixed(1)) : 0;
  const bookPct = total > 0 ? Number(((booked / total) * 100).toFixed(1)) : 0;

  // Maximum value for proportional height bars
  const maxBarVal = Math.max(available, reserved, booked, 1);

  // Chart dimensions in SVG coordinates
  const svgWidth = 720;
  const svgHeight = 280;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const baseY = paddingTop + chartHeight;

  // Dynamic maximum tick based on real monthly dataset
  const maxDataVal = useMemo(() => {
    if (rawData.length === 0) return 50;
    const peak = Math.max(
      ...rawData.flatMap((d) => [d.available, d.reserved, d.booked]),
      10
    );
    // Round up to nice 50 or 20 step
    if (peak <= 50) return Math.ceil(peak / 10) * 10;
    if (peak <= 200) return Math.ceil(peak / 25) * 25;
    return Math.ceil(peak / 50) * 50;
  }, [rawData]);

  const maxY = maxDataVal;
  const yTicks = useMemo(() => {
    const step = maxY / 4;
    return [maxY, Math.round(step * 3), Math.round(step * 2), Math.round(step), 0];
  }, [maxY]);

  // Convert raw data to SVG coordinates
  const pointsAvailable = useMemo(() => {
    if (rawData.length === 0) return [];
    const count = rawData.length;
    return rawData.map((pt, i) => ({
      x: paddingLeft + (count > 1 ? (i / (count - 1)) * chartWidth : chartWidth / 2),
      y: baseY - (Math.min(pt.available, maxY) / (maxY || 1)) * chartHeight,
    }));
  }, [rawData, chartWidth, chartHeight, baseY, maxY]);

  const pointsReserved = useMemo(() => {
    if (rawData.length === 0) return [];
    const count = rawData.length;
    return rawData.map((pt, i) => ({
      x: paddingLeft + (count > 1 ? (i / (count - 1)) * chartWidth : chartWidth / 2),
      y: baseY - (Math.min(pt.reserved, maxY) / (maxY || 1)) * chartHeight,
    }));
  }, [rawData, chartWidth, chartHeight, baseY, maxY]);

  const pointsBooked = useMemo(() => {
    if (rawData.length === 0) return [];
    const count = rawData.length;
    return rawData.map((pt, i) => ({
      x: paddingLeft + (count > 1 ? (i / (count - 1)) * chartWidth : chartWidth / 2),
      y: baseY - (Math.min(pt.booked, maxY) / (maxY || 1)) * chartHeight,
    }));
  }, [rawData, chartWidth, chartHeight, baseY, maxY]);

  // SVG Paths
  const linePathAvailable = useMemo(() => generateSmoothSpline(pointsAvailable), [pointsAvailable]);
  const areaPathAvailable = useMemo(() => generateAreaPath(pointsAvailable, baseY), [pointsAvailable, baseY]);

  const linePathReserved = useMemo(() => generateSmoothSpline(pointsReserved), [pointsReserved]);
  const areaPathReserved = useMemo(() => generateAreaPath(pointsReserved, baseY), [pointsReserved, baseY]);

  const linePathBooked = useMemo(() => generateSmoothSpline(pointsBooked), [pointsBooked]);
  const areaPathBooked = useMemo(() => generateAreaPath(pointsBooked, baseY), [pointsBooked, baseY]);

  // Hover item details
  const activeItem = hoveredIndex !== null && rawData[hoveredIndex] ? rawData[hoveredIndex] : null;
  const activeX = hoveredIndex !== null && pointsAvailable[hoveredIndex] ? pointsAvailable[hoveredIndex].x : null;
  const tooltipPercentX = activeX !== null ? (activeX / svgWidth) * 100 : 0;
  const tooltipTransform =
    tooltipPercentX > 70
      ? 'translate(-95%, 0)'
      : tooltipPercentX < 30
      ? 'translate(-5%, 0)'
      : 'translate(-50%, 0)';

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
      {/* Header Row: Title, Live Indicator & Range Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-serif font-bold text-2xl text-slate-900 tracking-tight">
              Inventory Overview
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Status
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status breakdown and historical monthly activity.
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Time Range Selector Buttons */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => handleRangeSelect('6_months')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRange === '6_months'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => handleRangeSelect('1_year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRange === '1_year'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              1 Year
            </button>
            <button
              type="button"
              onClick={() => handleRangeSelect('all_time')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRange === 'all_time'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              All Time
            </button>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs font-semibold text-slate-500">Total Active Plots</div>
            <div className="text-2xl font-bold font-mono text-slate-900">{total}</div>
          </div>
        </div>
      </div>

      {/* Segmented Distribution Bar */}
      <div className="space-y-2 mb-8">
        <div className="flex justify-between text-xs text-slate-600 font-medium">
          <span>Inventory Distribution</span>
          <span className="font-mono">{total} plots total</span>
        </div>
        <div className="w-full h-3.5 rounded-full bg-slate-100 flex overflow-hidden shadow-inner border border-slate-200/60">
          <div
            style={{ width: `${availPct}%`, backgroundColor: PLOT_STATUS_STYLES.available.stroke }}
            className="transition-all duration-500 hover:opacity-90 cursor-default"
            title={`Available: ${available} (${availPct}%)`}
          />
          <div
            style={{ width: `${resPct}%`, backgroundColor: PLOT_STATUS_STYLES.reserved.stroke }}
            className="transition-all duration-500 hover:opacity-90 cursor-default"
            title={`Reserved: ${reserved} (${resPct}%)`}
          />
          <div
            style={{ width: `${bookPct}%`, backgroundColor: PLOT_STATUS_STYLES.booked.fill }}
            className="transition-all duration-500 hover:opacity-90 cursor-default"
            title={`Booked: ${booked} (${bookPct}%)`}
          />
        </div>
      </div>

      {/* Live Status Cards & Proportional Height Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Available Plots Card */}
        <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-slate-800">{PLOT_STATUS_STYLES.available.label}</span>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800">
                {availPct}%
              </span>
            </div>
            <div className="text-3xl font-bold font-mono text-emerald-950 mt-1">{available}</div>
            <p className="text-xs text-slate-500 mt-1">Ready for immediate client booking and allocation</p>
          </div>
          <div className="w-full bg-emerald-100/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${(available / maxBarVal) * 100}%` }}
            />
          </div>
        </div>

        {/* Reserved Plots Card */}
        <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/70 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-slate-800">{PLOT_STATUS_STYLES.reserved.label}</span>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800">
                {resPct}%
              </span>
            </div>
            <div className="text-3xl font-bold font-mono text-amber-950 mt-1">{reserved}</div>
            <p className="text-xs text-slate-500 mt-1">Temporary token holds pending verification</p>
          </div>
          <div className="w-full bg-amber-100/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(reserved / maxBarVal) * 100}%` }}
            />
          </div>
        </div>

        {/* Booked Plots Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-slate-800">{PLOT_STATUS_STYLES.booked.label}</span>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                {bookPct}%
              </span>
            </div>
            <div className="text-3xl font-bold font-mono text-slate-900 mt-1">{booked}</div>
            <p className="text-xs text-slate-500 mt-1">Confirmed member allotments and contracts</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-slate-700 rounded-full transition-all duration-500"
              style={{ width: `${(booked / maxBarVal) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Monthly Timeline Curve Chart Canvas */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Monthly Activity & Inventory Trends</span>
            {loading && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Reserved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
              Booked
            </span>
          </div>
        </div>

        <div className="relative w-full select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="availableAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PLOT_STATUS_STYLES.available.stroke} stopOpacity="0.22" />
                <stop offset="60%" stopColor={PLOT_STATUS_STYLES.available.fill} stopOpacity="0.08" />
                <stop offset="100%" stopColor={PLOT_STATUS_STYLES.available.fill} stopOpacity="0.01" />
              </linearGradient>

              <linearGradient id="reservedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PLOT_STATUS_STYLES.reserved.stroke} stopOpacity="0.18" />
                <stop offset="60%" stopColor={PLOT_STATUS_STYLES.reserved.fill} stopOpacity="0.06" />
                <stop offset="100%" stopColor={PLOT_STATUS_STYLES.reserved.fill} stopOpacity="0.01" />
              </linearGradient>

              <linearGradient id="bookedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PLOT_STATUS_STYLES.booked.stroke} stopOpacity="0.16" />
                <stop offset="70%" stopColor={PLOT_STATUS_STYLES.booked.fill} stopOpacity="0.05" />
                <stop offset="100%" stopColor={PLOT_STATUS_STYLES.booked.fill} stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines and Y-Axis Ticks */}
            {yTicks.map((tick) => {
              const y = baseY - (tick / (maxY || 1)) * chartHeight;
              return (
                <g key={tick}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1.5"
                  />
                  <text
                    x={paddingLeft - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 font-sans text-[11px] font-medium"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Hover Crosshair Vertical Line */}
            {activeX !== null && (
              <line
                x1={activeX}
                y1={paddingTop - 10}
                x2={activeX}
                y2={baseY}
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Area Fills (Layered from Booked -> Reserved -> Available) */}
            {areaPathBooked && <path d={areaPathBooked} fill="url(#bookedAreaGrad)" />}
            {areaPathReserved && <path d={areaPathReserved} fill="url(#reservedAreaGrad)" />}
            {areaPathAvailable && <path d={areaPathAvailable} fill="url(#availableAreaGrad)" />}

            {/* Smooth Curved Lines */}
            {linePathBooked && (
              <path
                d={linePathBooked}
                fill="none"
                stroke={PLOT_STATUS_STYLES.booked.fill}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {linePathReserved && (
              <path
                d={linePathReserved}
                fill="none"
                stroke={PLOT_STATUS_STYLES.reserved.stroke}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {linePathAvailable && (
              <path
                d={linePathAvailable}
                fill="none"
                stroke={PLOT_STATUS_STYLES.available.stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Dots on Available Points */}
            {pointsAvailable.map((pt, i) => (
              <circle
                key={`dot-avail-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? 5.5 : 3.8}
                fill={PLOT_STATUS_STYLES.available.stroke}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="transition-all duration-150"
              />
            ))}

            {/* Dots on Reserved Points */}
            {pointsReserved.map((pt, i) => (
              <circle
                key={`dot-res-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? 5.5 : 3.8}
                fill={PLOT_STATUS_STYLES.reserved.stroke}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="transition-all duration-150"
              />
            ))}

            {/* Dots on Booked Points */}
            {pointsBooked.map((pt, i) => (
              <circle
                key={`dot-booked-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? 5.5 : 3.8}
                fill={PLOT_STATUS_STYLES.booked.fill}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="transition-all duration-150"
              />
            ))}

            {/* X-Axis Month Labels */}
            {rawData.map((item, i) => {
              const count = rawData.length;
              const x = paddingLeft + (count > 1 ? (i / (count - 1)) * chartWidth : chartWidth / 2);
              const isHovered = hoveredIndex === i;
              return (
                <text
                  key={`label-${i}`}
                  x={x}
                  y={baseY + 22}
                  textAnchor="middle"
                  className={`font-sans text-[12px] transition-colors ${
                    isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500 font-medium'
                  }`}
                >
                  {item.label}
                </text>
              );
            })}

            {/* Invisible Hover Detection Columns for smooth responsive mouse interaction */}
            {rawData.map((_, i) => {
              const count = rawData.length;
              const step = count > 1 ? chartWidth / (count - 1) : chartWidth;
              const colWidth = step;
              const colX = paddingLeft + (count > 1 ? i * step : 0) - colWidth / 2;

              return (
                <rect
                  key={`hit-${i}`}
                  x={colX}
                  y={paddingTop}
                  width={colWidth}
                  height={chartHeight + paddingBottom}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
              );
            })}
          </svg>

          {/* Rich Interactive Floating Tooltip */}
          {activeItem && hoveredIndex !== null && activeX !== null && (
            <div
              className="absolute pointer-events-none transition-all duration-100 bg-slate-900 text-white rounded-xl py-2 px-3 shadow-xl text-xs z-20 border border-slate-800"
              style={{
                left: `${tooltipPercentX}%`,
                top: '8px',
                transform: tooltipTransform,
              }}
            >
              <div className="font-bold text-[11px] text-slate-300 border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between gap-4">
                <span>{activeItem.label} Overview</span>
                <span className="font-mono text-slate-400">
                  Total: {activeItem.available + activeItem.reserved + activeItem.booked}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Available:
                  </span>
                  <span className="font-mono font-bold text-white">{activeItem.available}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Reserved:
                  </span>
                  <span className="font-mono font-bold text-white">{activeItem.reserved}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Booked:
                  </span>
                  <span className="font-mono font-bold text-white">{activeItem.booked}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
