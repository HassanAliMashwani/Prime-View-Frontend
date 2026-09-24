'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Map, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle 
} from 'lucide-react';
import { getInventoryStats, InventoryStats } from '@/lib/dal/inventory';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { AdminSession } from '@/lib/mock/types';

export default function InventoryOverviewPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<InventoryStats[]>([]);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    const s = getActiveAdminSession();
    if (s) {
      setSession(s);
    }
  }, []);

  const isSuper = session?.role === 'super_admin';
  const canAccess = isSuper || Boolean(session?.permissions?.can_view_inventory);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getInventoryStats(fromDate || undefined, toDate || undefined, undefined, session?.token);
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory stats');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, session?.token]);

  useEffect(() => {
    if (session && canAccess) {
      loadStats();
    }
  }, [session, canAccess, loadStats]);

  if (session && !canAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-3xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Inventory Overview</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your administrative account does not have permission to view inventory status. Contact a Super Administrator to adjust your privileges.
        </p>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const totalBooked = stats.reduce((sum, s) => sum + s.booked, 0);
  const totalAllotted = stats.reduce((sum, s) => sum + s.allotted, 0);
  const totalReserved = stats.reduce((sum, s) => sum + s.reserved, 0);
  const totalAvailable = stats.reduce((sum, s) => sum + s.available, 0);
  const totalDisputed = stats.reduce((sum, s) => sum + s.disputedTotal, 0);

  const totalSellable = totalBooked + totalAllotted + totalReserved + totalAvailable;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-serif">
            <Building2 className="w-6 h-6 text-emerald-700" />
            Inventory Status
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time & historical plot availability and allocation metrics
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <input 
              type="date" 
              className="bg-transparent border-none text-slate-800 text-sm focus:ring-0 w-36"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <span className="text-slate-400 text-xs font-medium">to</span>
            <input 
              type="date" 
              className="bg-transparent border-none text-slate-800 text-sm focus:ring-0 w-36"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button
            onClick={() => window.print()}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-emerald-50 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            title="Print Inventory"
          >
            <span className="hidden sm:inline text-xs font-bold px-1">Print</span>
          </button>
          <button
            onClick={loadStats}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors border border-slate-200 shadow-xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}

      {/* Aggregate Overview Cards (Mint, Cream/Yellow, Blue, Lavender) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available - Mint */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-900/10 border border-green-500/20 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-700" />
            </div>
            <h3 className="text-green-800 font-bold text-sm">Available</h3>
          </div>
          <div className="text-3xl font-bold text-green-700">{totalAvailable}</div>
          <p className="text-xs text-green-700/80 mt-2 font-medium">Ready to book</p>
        </div>

        {/* Reserved - Amber/Yellow */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="text-amber-800 font-bold text-sm">Reserved</h3>
          </div>
          <div className="text-3xl font-bold text-amber-700">{totalReserved}</div>
          <p className="text-xs text-amber-700/80 mt-2 font-medium">Held for 24 hours</p>
        </div>

        {/* Booked - Blue */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-900/10 border border-blue-500/20 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
            </div>
            <h3 className="text-blue-800 font-bold text-sm">Booked</h3>
          </div>
          <div className="text-3xl font-bold text-blue-700">{totalBooked}</div>
          <p className="text-xs text-blue-700/80 mt-2 font-medium">Installment plan active</p>
        </div>

        {/* Allotted - Purple */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/10 border border-purple-500/20 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Map className="w-5 h-5 text-purple-700" />
            </div>
            <h3 className="text-purple-800 font-bold text-sm">Allotted</h3>
          </div>
          <div className="text-3xl font-bold text-purple-700">{totalAllotted}</div>
          <p className="text-xs text-purple-700/80 mt-2 font-medium">Paid in full (One-time)</p>
        </div>
      </div>

      {/* Main Stats Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="py-4 px-6">Block</th>
                <th className="py-4 px-6 text-green-800">Available</th>
                <th className="py-4 px-6 text-amber-800">Reserved</th>
                <th className="py-4 px-6 text-blue-800">Booked</th>
                <th className="py-4 px-6 text-purple-800">Allotted</th>
                <th className="py-4 px-6 text-slate-700">Total (4 Core)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading && stats.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 w-32 bg-slate-200/80 rounded-md" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-200/80 rounded-md" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-200/80 rounded-md" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-200/80 rounded-md" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-200/80 rounded-md" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-16 bg-slate-200/80 rounded-md" /></td>
                  </tr>
                ))
              ) : stats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">No data available</td>
                </tr>
              ) : (
                stats.map((s) => (
                  <tr key={s.blockId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                          <Map className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="text-slate-800 font-semibold">{s.blockName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-green-700 font-semibold">{s.available}</td>
                    <td className="py-4 px-6 text-amber-700 font-semibold">{s.reserved}</td>
                    <td className="py-4 px-6 text-blue-700 font-semibold">{s.booked}</td>
                    <td className="py-4 px-6 text-purple-700 font-semibold">{s.allotted}</td>
                    <td className="py-4 px-6 text-slate-900 font-bold">
                      {s.available + s.reserved + s.booked + s.allotted}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && stats.length > 0 && (
              <tfoot className="bg-slate-50/80 border-t border-slate-200 text-sm">
                <tr>
                  <td className="py-4 px-6 text-slate-900 font-bold">Total</td>
                  <td className="py-4 px-6 text-green-700 font-bold">{totalAvailable}</td>
                  <td className="py-4 px-6 text-amber-700 font-bold">{totalReserved}</td>
                  <td className="py-4 px-6 text-blue-700 font-bold">{totalBooked}</td>
                  <td className="py-4 px-6 text-purple-700 font-bold">{totalAllotted}</td>
                  <td className="py-4 px-6 text-slate-900 font-bold">{totalSellable}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      
      {totalDisputed > 0 && (
        <div className="text-xs text-slate-500 mt-2 italic px-2">
          * + {totalDisputed} disputed plot(s) not included in the four counts (A-01 only today).
        </div>
      )}
    </div>
  );
}
