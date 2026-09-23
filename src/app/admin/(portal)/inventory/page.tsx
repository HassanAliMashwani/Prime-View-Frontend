'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Map, 
  RefreshCw,
  Search,
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
      const data = await getInventoryStats(fromDate || undefined, toDate || undefined);
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory stats');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    if (session && canAccess) {
      loadStats();
    }
  }, [session, canAccess, loadStats]);

  if (session && !canAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Inventory Overview</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your administrative account does not have permission to view inventory status. Contact a Super Administrator to adjust your privileges.
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-400" />
            Inventory Status
          </h1>
          <p className="text-brand-300/70 text-sm mt-1">
            Real-time & historical plot availability and allocation metrics
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-brand-900/50 border border-brand-800 rounded-lg p-1">
            <input 
              type="date" 
              className="bg-transparent border-none text-white text-sm focus:ring-0 w-36"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <span className="text-brand-400">to</span>
            <input 
              type="date" 
              className="bg-transparent border-none text-white text-sm focus:ring-0 w-36"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button
            onClick={() => window.print()}
            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            title="Print Inventory"
          >
            <span className="hidden sm:inline text-sm font-medium">Print</span>
          </button>
          <button
            onClick={loadStats}
            disabled={loading}
            className="p-2 bg-brand-800 text-brand-300 rounded-lg hover:bg-brand-700 hover:text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500/10 to-green-900/20 border border-green-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-green-100 font-medium">Available</h3>
          </div>
          <div className="text-3xl font-bold text-green-400">{totalAvailable}</div>
          <p className="text-xs text-green-300/60 mt-2">Ready to book</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-900/20 border border-yellow-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-yellow-100 font-medium">Reserved</h3>
          </div>
          <div className="text-3xl font-bold text-yellow-400">{totalReserved}</div>
          <p className="text-xs text-yellow-300/60 mt-2">Held for 24 hours</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-900/20 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-blue-100 font-medium">Booked</h3>
          </div>
          <div className="text-3xl font-bold text-blue-400">{totalBooked}</div>
          <p className="text-xs text-blue-300/60 mt-2">Installment plan active</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/20 border border-purple-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Map className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-purple-100 font-medium">Allotted</h3>
          </div>
          <div className="text-3xl font-bold text-purple-400">{totalAllotted}</div>
          <p className="text-xs text-purple-300/60 mt-2">Paid in full (One-time)</p>
        </div>
      </div>

      {/* Main Stats Table */}
      <div className="bg-brand-900/50 border border-brand-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-950/50 border-b border-brand-800 text-brand-400 text-sm">
              <tr>
                <th className="py-4 px-6 font-semibold">Block</th>
                <th className="py-4 px-6 font-semibold">Available</th>
                <th className="py-4 px-6 font-semibold">Reserved</th>
                <th className="py-4 px-6 font-semibold">Booked</th>
                <th className="py-4 px-6 font-semibold">Allotted</th>
                <th className="py-4 px-6 font-semibold">Total (4 Core)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800/50">
              {loading && stats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-400">Loading...</td>
                </tr>
              ) : stats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-400">No data available</td>
                </tr>
              ) : (
                stats.map((s) => (
                  <tr key={s.blockId} className="hover:bg-brand-800/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-800/50 flex items-center justify-center border border-brand-700/50">
                          <Map className="w-4 h-4 text-brand-300" />
                        </div>
                        <span className="text-white font-medium">{s.blockName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-green-300 font-medium">{s.available}</td>
                    <td className="py-4 px-6 text-yellow-300 font-medium">{s.reserved}</td>
                    <td className="py-4 px-6 text-blue-300 font-medium">{s.booked}</td>
                    <td className="py-4 px-6 text-purple-300 font-medium">{s.allotted}</td>
                    <td className="py-4 px-6 text-white font-semibold">
                      {s.available + s.reserved + s.booked + s.allotted}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && stats.length > 0 && (
              <tfoot className="bg-brand-950/50 border-t border-brand-800">
                <tr>
                  <td className="py-4 px-6 text-white font-semibold">Total</td>
                  <td className="py-4 px-6 text-green-400 font-bold">{totalAvailable}</td>
                  <td className="py-4 px-6 text-yellow-400 font-bold">{totalReserved}</td>
                  <td className="py-4 px-6 text-blue-400 font-bold">{totalBooked}</td>
                  <td className="py-4 px-6 text-purple-400 font-bold">{totalAllotted}</td>
                  <td className="py-4 px-6 text-white font-bold">{totalSellable}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      
      {totalDisputed > 0 && (
        <div className="text-sm text-brand-400 mt-2 italic px-2">
          * + {totalDisputed} disputed plot(s) not included in the four counts (A-01 only today).
        </div>
      )}
    </div>
  );
}
