'use client';

import React, { useState, useMemo } from 'react';

type TimeRange = '6_months' | '1_year' | 'all_time';

interface ChartPoint {
  label: string;
  available: number;
  reserved: number;
  booked: number;
}

interface InventoryOverviewChartProps {
  currentAvailable?: number;
  currentReserved?: number;
  currentBooked?: number;
}

const DATA_6_MONTHS: ChartPoint[] = [
  { label: 'Jan', available: 138, reserved: 52, booked: 31 },
  { label: 'Feb', available: 122, reserved: 64, booked: 32 },
  { label: 'Mar', available: 160, reserved: 52, booked: 29 },
  { label: 'Apr', available: 118, reserved: 53, booked: 33 },
  { label: 'May', available: 126, reserved: 62, booked: 40 },
  { label: 'Jun', available: 160, reserved: 78, booked: 48 },
];

const DATA_1_YEAR: ChartPoint[] = [
  { label: 'Jul', available: 175, reserved: 32, booked: 18 },
  { label: 'Aug', available: 168, reserved: 38, booked: 22 },
  { label: 'Sep', available: 155, reserved: 44, booked: 25 },
  { label: 'Oct', available: 142, reserved: 48, booked: 28 },
  { label: 'Nov', available: 132, reserved: 54, booked: 30 },
  { label: 'Dec', available: 146, reserved: 50, booked: 32 },
  { label: 'Jan', available: 138, reserved: 52, booked: 31 },
  { label: 'Feb', available: 122, reserved: 64, booked: 32 },
  { label: 'Mar', available: 160, reserved: 52, booked: 29 },
  { label: 'Apr', available: 118, reserved: 53, booked: 33 },
  { label: 'May', available: 126, reserved: 62, booked: 40 },
  { label: 'Jun', available: 160, reserved: 78, booked: 48 },
];

const DATA_ALL_TIME: ChartPoint[] = [
  { label: '2022', available: 195, reserved: 24, booked: 8 },
  { label: '2023 H1', available: 180, reserved: 36, booked: 16 },
  { label: '2023 H2', available: 165, reserved: 46, booked: 24 },
  { label: '2024 H1', available: 152, reserved: 54, booked: 32 },
  { label: '2024 H2', available: 140, reserved: 62, booked: 38 },
  { label: '2025', available: 130, reserved: 68, booked: 42 },
  { label: '2026', available: 160, reserved: 78, booked: 48 },
];

/**
 * Generate smooth cubic Bezier curve path string through given 2D coordinates.
 */
function generateSmoothSpline(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
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
  const linePath = generateSmoothSpline(points);
  if (!linePath) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x.toFixed(2)},${baseY.toFixed(2)} L ${first.x.toFixed(2)},${baseY.toFixed(2)} Z`;
}

export default function InventoryOverviewChart({
  currentAvailable,
  currentReserved,
  currentBooked,
}: InventoryOverviewChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('6_months');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Raw dataset based on selected period
  const rawData = useMemo(() => {
    if (timeRange === '6_months') return [...DATA_6_MONTHS];
    if (timeRange === '1_year') return [...DATA_1_YEAR];
    return [...DATA_ALL_TIME];
  }, [timeRange]);

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

  // Maximum value tick
  const maxY = 200;
  const yTicks = [200, 150, 100, 50, 0];

  // Convert raw data to SVG coordinates
  const pointsAvailable = useMemo(() => {
    return rawData.map((pt, i) => ({
      x: paddingLeft + (i / (rawData.length - 1)) * chartWidth,
      y: baseY - (Math.min(pt.available, maxY) / maxY) * chartHeight,
    }));
  }, [rawData, chartWidth, chartHeight, baseY]);

  const pointsReserved = useMemo(() => {
    return rawData.map((pt, i) => ({
      x: paddingLeft + (i / (rawData.length - 1)) * chartWidth,
      y: baseY - (Math.min(pt.reserved, maxY) / maxY) * chartHeight,
    }));
  }, [rawData, chartWidth, chartHeight, baseY]);

  const pointsBooked = useMemo(() => {
    return rawData.map((pt, i) => ({
      x: paddingLeft + (i / (rawData.length - 1)) * chartWidth,
      y: baseY - (Math.min(pt.booked, maxY) / maxY) * chartHeight,
    }));
  }, [rawData, chartWidth, chartHeight, baseY]);

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

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
      {/* Header Row: Title & Time Range Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
        <h3 className="font-serif font-bold text-2xl text-slate-900 tracking-tight">
          Inventory Overview
        </h3>

        {/* Filter Buttons */}
        <div className="inline-flex items-center p-1 bg-slate-100/70 border border-slate-200/80 rounded-xl self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setTimeRange('6_months')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeRange === '6_months'
                ? 'bg-[#103b31] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            6 Months
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('1_year')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeRange === '1_year'
                ? 'bg-[#103b31] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            1 Year
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('all_time')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeRange === 'all_time'
                ? 'bg-[#103b31] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Legend Row: Exactly matching the provided reference image */}
      <div className="flex items-center justify-center gap-6 sm:gap-10 my-4 text-xs font-medium text-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#059669] shadow-2xs" />
          <span className="text-slate-700 font-semibold">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#d97706] shadow-2xs" />
          <span className="text-slate-700 font-semibold">Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#0f3b32] shadow-2xs" />
          <span className="text-slate-700 font-semibold">Booked</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Soft Translucent Linear Gradients for Area Fills */}
            <linearGradient id="availableAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
            </linearGradient>

            <linearGradient id="reservedAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
            </linearGradient>

            <linearGradient id="bookedAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f3b32" stopOpacity="0.16" />
              <stop offset="70%" stopColor="#1e293b" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines and Y-Axis Ticks */}
          {yTicks.map((tick) => {
            const y = baseY - (tick / maxY) * chartHeight;
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
          <path d={areaPathBooked} fill="url(#bookedAreaGrad)" />
          <path d={areaPathReserved} fill="url(#reservedAreaGrad)" />
          <path d={areaPathAvailable} fill="url(#availableAreaGrad)" />

          {/* Smooth Curved Lines */}
          <path
            d={linePathBooked}
            fill="none"
            stroke="#0f3b32"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={linePathReserved}
            fill="none"
            stroke="#d97706"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={linePathAvailable}
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots on Available Points */}
          {pointsAvailable.map((pt, i) => (
            <circle
              key={`dot-avail-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={hoveredIndex === i ? 5.5 : 3.8}
              fill="#059669"
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
              fill="#d97706"
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
              fill="#0f3b32"
              stroke="#ffffff"
              strokeWidth="1.5"
              className="transition-all duration-150"
            />
          ))}

          {/* X-Axis Month Labels */}
          {rawData.map((item, i) => {
            const x = paddingLeft + (i / (rawData.length - 1)) * chartWidth;
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
            const step = chartWidth / (rawData.length - 1);
            const colWidth = step;
            const colX = paddingLeft + i * step - colWidth / 2;

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
            className="absolute pointer-events-none transition-all duration-100 transform -translate-x-1/2 bg-slate-900 text-white rounded-xl py-2 px-3 shadow-xl text-xs z-10 border border-slate-800"
            style={{
              left: `${(activeX / svgWidth) * 100}%`,
              top: '8px',
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
  );
}
