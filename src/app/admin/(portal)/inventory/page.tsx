'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Layers, 
  Building2, 
  Home, 
  Store, 
  Trees, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Map, 
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Percent
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { canAccessBlock } from '@/lib/dal/adminAuth';
import { AdminSession, Block, Plot, PlotCategory } from '@/lib/mock/types';
import { getAdminMasterPlanBlocks, getAdminAllPlots } from '@/lib/dal/adminPlots';
import InventoryOverviewChart from '@/components/admin/dashboard/InventoryOverviewChart';

interface BlockInventoryStats {
  block: Block;
  residential: { available: number; reserved: number; booked: number; total: number };
  commercial: { available: number; reserved: number; booked: number; total: number };
  farmHouse: { available: number; reserved: number; booked: number; total: number };
  amenitiesCount: number;
  adjustmentsCount: number;
  totalSellable: number;
  totalBooked: number;
  occupancyRate: number;
}

export default function InventoryOverviewPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [inventoryStats, setInventoryStats] = useState<BlockInventoryStats[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'residential' | 'commercial' | 'farm_house'>('all');
  const [search, setSearch] = useState<string>('');

  const loadData = useCallback(async (currentSession: AdminSession) => {
    const isSuper = currentSession.role === 'super_admin';

    try {
      const [blocksRes, plotsRes] = await Promise.all([
        getAdminMasterPlanBlocks(currentSession),
        getAdminAllPlots(currentSession)
      ]);

      if (!blocksRes.ok || !plotsRes.ok) {
        setLoading(false);
        return;
      }

      const visibleBlocks = blocksRes.blocks || [];
      const allPlots = plotsRes.plots || [];

      const stats: BlockInventoryStats[] = visibleBlocks.map((block) => {
        const blockPlots = allPlots.filter((p) => p.blockId.toLowerCase() === block.id.toLowerCase());

        const resPlots = blockPlots.filter((p) => p.category === 'residential');
        const comPlots = blockPlots.filter((p) => p.category === 'commercial');
        const fhPlots = blockPlots.filter((p) => p.category === 'farm_house');
        const amenityPlots = blockPlots.filter((p) => p.category === 'amenity');
        const adjPlots = blockPlots.filter((p) => Boolean(p.isAdjustment));

        const residential = {
          available: resPlots.filter((p) => p.status === 'available').length,
          reserved: resPlots.filter((p) => p.status === 'reserved').length,
          booked: resPlots.filter((p) => p.status === 'booked').length,
          total: resPlots.length,
        };

        const commercial = {
          available: comPlots.filter((p) => p.status === 'available').length,
          reserved: comPlots.filter((p) => p.status === 'reserved').length,
          booked: comPlots.filter((p) => p.status === 'booked').length,
          total: comPlots.length,
        };

        const farmHouse = {
          available: fhPlots.filter((p) => p.status === 'available').length,
          reserved: fhPlots.filter((p) => p.status === 'reserved').length,
          booked: fhPlots.filter((p) => p.status === 'booked').length,
          total: fhPlots.length,
        };

        const totalSellable = residential.total + commercial.total + farmHouse.total;
        const totalBooked = residential.booked + commercial.booked + farmHouse.booked;
        const occupancyRate = totalSellable > 0 ? Math.round((totalBooked / totalSellable) * 100) : 0;

        return {
          block: block as unknown as Block,
          residential,
          commercial,
          farmHouse,
          amenitiesCount: amenityPlots.length,
          adjustmentsCount: adjPlots.length,
          totalSellable,
          totalBooked,
          occupancyRate,
        };
      });

      setInventoryStats(stats);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);
    loadData(cur);

    // Auto-refresh inventory data every 30 seconds
    const intervalId = setInterval(() => {
      const latestSession = getActiveAdminSession();
      if (latestSession) {
        loadData(latestSession);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [router, loadData]);

  // Totals across visible blocks
  const grandTotals = inventoryStats.reduce(
    (acc, item) => {
      acc.totalPlots += item.totalSellable;
      acc.resTotal += item.residential.total;
      acc.resAvail += item.residential.available;
      acc.resBooked += item.residential.booked;
      acc.comTotal += item.commercial.total;
      acc.comAvail += item.commercial.available;
      acc.comBooked += item.commercial.booked;
      acc.fhTotal += item.farmHouse.total;
      acc.fhAvail += item.farmHouse.available;
      acc.fhBooked += item.farmHouse.booked;
      acc.amenityTotal += item.amenitiesCount;
      acc.adjTotal += item.adjustmentsCount;
      acc.totalSellable += item.totalSellable;
      acc.totalBooked += item.totalBooked;
      return acc;
    },
    {
      totalPlots: 0,
      resTotal: 0,
      resAvail: 0,
      resBooked: 0,
      comTotal: 0,
      comAvail: 0,
      comBooked: 0,
      fhTotal: 0,
      fhAvail: 0,
      fhBooked: 0,
      amenityTotal: 0,
      adjTotal: 0,
      totalSellable: 0,
      totalBooked: 0,
    }
  );

  const overallOccupancy =
    grandTotals.totalSellable > 0
      ? Math.round((grandTotals.totalBooked / grandTotals.totalSellable) * 100)
      : 0;

  // Filtered rows
  const filteredBlocks = inventoryStats.filter((item) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        item.block.name.toLowerCase().includes(q) ||
        item.block.id.toLowerCase().includes(q) ||
        item.block.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" />
        <span className="ml-3 text-sm font-medium text-slate-600">Loading society inventory...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-[#10251E] tracking-tight">
                Society Inventory Breakdown
              </h1>
              <p className="text-xs text-slate-500">
                Category-by-category status analysis across Residential, Commercial, and Farm Houses, block by block.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session?.role === 'super_admin' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Society Scope (8 Blocks)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assigned Blocks: {session?.assignedBlocks?.join(', ').toUpperCase()}</span>
            </span>
          )}
        </div>
      </div>

      {/* KPI Stat Cards by Category */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Residential KPI */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Residential</span>
            <Home className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-slate-900">{grandTotals.resTotal}</div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold">{grandTotals.resAvail} Avail</span>
            <span className="text-slate-400">•</span>
            <span className="text-rose-700 font-semibold">{grandTotals.resBooked} Booked</span>
          </div>
        </div>

        {/* Commercial KPI */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Commercial</span>
            <Store className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-slate-900">{grandTotals.comTotal}</div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold">{grandTotals.comAvail} Avail</span>
            <span className="text-slate-400">•</span>
            <span className="text-rose-700 font-semibold">{grandTotals.comBooked} Booked</span>
          </div>
        </div>

        {/* Farm House KPI */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Farm Houses</span>
            <Trees className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-slate-900">{grandTotals.fhTotal}</div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold">{grandTotals.fhAvail} Avail</span>
            <span className="text-slate-400">•</span>
            <span className="text-rose-700 font-semibold">{grandTotals.fhBooked} Booked</span>
          </div>
        </div>

        {/* Public Amenities KPI */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Public Amenities</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-slate-900">{grandTotals.amenityTotal}</div>
          <div className="mt-1 text-[11px] text-slate-500">Mosques, Schools, Parks & Utilities</div>
        </div>

        {/* Adjustment Freeze & Occupancy */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Adjustment</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-blue-700">{grandTotals.adjTotal}</div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Overall Occupancy:</span>
            <span className="font-bold text-slate-900">{overallOccupancy}%</span>
          </div>
        </div>
      </div>

      {/* Society Inventory Trend Overview */}
      <InventoryOverviewChart />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search block name or description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Showing {filteredBlocks.length} administrative sector{filteredBlocks.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Block Sector</th>
                <th className="py-3 px-4 text-center bg-blue-50/50 border-x border-slate-200/80">
                  Residential (Avail / Res / Booked)
                </th>
                <th className="py-3 px-4 text-center bg-indigo-50/50 border-r border-slate-200/80">
                  Commercial (Avail / Res / Booked)
                </th>
                <th className="py-3 px-4 text-center bg-amber-50/50 border-r border-slate-200/80">
                  Farm House (Avail / Res / Booked)
                </th>
                <th className="py-3 px-4 text-center">Amenities</th>
                <th className="py-3 px-4 text-center">Adjustment</th>
                <th className="py-3 px-4 text-center">Occupancy %</th>
                <th className="py-3 px-4 text-right">Master Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredBlocks.map((item) => {
                return (
                  <tr key={item.block.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Block Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{item.block.name}</div>
                      <div className="text-[11px] text-slate-500 max-w-xs truncate">
                        {item.block.description}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Total Sellable: {item.totalSellable} plots
                      </div>
                    </td>

                    {/* Residential */}
                    <td className="py-3.5 px-4 text-center bg-blue-50/20 border-x border-slate-100">
                      {item.residential.total === 0 ? (
                        <span className="text-slate-300 font-mono text-[11px]">—</span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold" title="Available">
                            {item.residential.available}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold" title="Reserved">
                            {item.residential.reserved}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold" title="Booked">
                            {item.residential.booked}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Commercial */}
                    <td className="py-3.5 px-4 text-center bg-indigo-50/20 border-r border-slate-100">
                      {item.commercial.total === 0 ? (
                        <span className="text-slate-300 font-mono text-[11px]">—</span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold" title="Available">
                            {item.commercial.available}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold" title="Reserved">
                            {item.commercial.reserved}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold" title="Booked">
                            {item.commercial.booked}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Farm House */}
                    <td className="py-3.5 px-4 text-center bg-amber-50/20 border-r border-slate-100">
                      {item.farmHouse.total === 0 ? (
                        <span className="text-slate-300 font-mono text-[11px]">—</span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold" title="Available">
                            {item.farmHouse.available}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold" title="Reserved">
                            {item.farmHouse.reserved}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold" title="Booked">
                            {item.farmHouse.booked}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Amenities */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-semibold text-[11px]">
                        {item.amenitiesCount}
                      </span>
                    </td>

                    {/* Adjustment */}
                    <td className="py-3.5 px-4 text-center">
                      {item.adjustmentsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300 font-bold text-[11px] inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                          <span>{item.adjustmentsCount}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[11px]">0</span>
                      )}
                    </td>

                    {/* Occupancy Rate */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-bold">
                        <span
                          className={`text-xs ${
                            item.occupancyRate >= 70
                              ? 'text-rose-700'
                              : item.occupancyRate >= 40
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {item.occupancyRate}%
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/master-plan/${item.block.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors"
                      >
                        <Map className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Map View</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {/* Grand Total Row (Super Admin or Combined Scope) */}
              <tr className="bg-slate-900 text-white font-bold text-xs">
                <td className="py-4 px-4">
                  <div>GRAND TOTAL (ALL ACCESSIBLE SECTORS)</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {grandTotals.totalSellable} sellable units + {grandTotals.amenityTotal} public utilities
                  </div>
                </td>

                {/* Residential Totals */}
                <td className="py-4 px-4 text-center bg-slate-800/80 border-x border-slate-700">
                  <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-emerald-400">{grandTotals.resAvail} Avail</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-amber-400">{grandTotals.resBooked} Booked</span>
                  </div>
                </td>

                {/* Commercial Totals */}
                <td className="py-4 px-4 text-center bg-slate-800/80 border-r border-slate-700">
                  <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-emerald-400">{grandTotals.comAvail} Avail</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-amber-400">{grandTotals.comBooked} Booked</span>
                  </div>
                </td>

                {/* Farm House Totals */}
                <td className="py-4 px-4 text-center bg-slate-800/80 border-r border-slate-700">
                  <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-emerald-400">{grandTotals.fhAvail} Avail</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-amber-400">{grandTotals.fhBooked} Booked</span>
                  </div>
                </td>

                {/* Amenities Total */}
                <td className="py-4 px-4 text-center">
                  <span className="text-purple-300 font-mono">{grandTotals.amenityTotal}</span>
                </td>

                {/* Adjustments Total */}
                <td className="py-4 px-4 text-center">
                  <span className="text-blue-300 font-mono">{grandTotals.adjTotal}</span>
                </td>

                {/* Overall Occupancy */}
                <td className="py-4 px-4 text-center">
                  <span className="text-amber-400 font-mono text-sm">{overallOccupancy}%</span>
                </td>

                <td className="py-4 px-4 text-right">
                  <Link
                    href="/admin/master-plan"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors"
                  >
                    <span>Overview Map</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
