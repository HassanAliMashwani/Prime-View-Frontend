'use client';

import React from 'react';
import { PLOT_STATUS_STYLES } from '@/lib/constants/plotStatusStyles';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

interface InventoryOverviewChartProps {
  currentAvailable?: number;
  currentReserved?: number;
  currentBooked?: number;
}

export default function InventoryOverviewChart({
  currentAvailable = 0,
  currentReserved = 0,
  currentBooked = 0,
}: InventoryOverviewChartProps) {
  const available = currentAvailable;
  const reserved = currentReserved;
  const booked = currentBooked;
  const total = available + reserved + booked;

  const availPct = total > 0 ? Number(((available / total) * 100).toFixed(1)) : 0;
  const resPct = total > 0 ? Number(((reserved / total) * 100).toFixed(1)) : 0;
  const bookPct = total > 0 ? Number(((booked / total) * 100).toFixed(1)) : 0;

  // Maximum value for proportional height bars
  const maxVal = Math.max(available, reserved, booked, 1);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
      {/* Header Row: Title & Live Indicator */}
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
            Real-time breakdown across all accessible inventory sectors.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-semibold text-slate-500">Total Active Plots</div>
          <div className="text-2xl font-bold font-mono text-slate-900">{total}</div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
              style={{ width: `${(available / maxVal) * 100}%` }}
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
              style={{ width: `${(reserved / maxVal) * 100}%` }}
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
              style={{ width: `${(booked / maxVal) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
