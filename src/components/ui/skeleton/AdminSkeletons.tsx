import React from 'react';
import { Skeleton, SkeletonText } from './Skeleton';

/**
 * Skeleton Loader for Admin Dashboard
 * Exact 1:1 structural replacement for "Loading Administrative Metrics..."
 */
export const AdminDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 select-none">
      {/* Top Banner / System Status placeholder */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-7 w-36 rounded-full" />
      </div>

      {/* Aggregate Overview Cards (4 Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          'border-purple-200/60 bg-purple-50/30',
          'border-emerald-200/60 bg-emerald-50/30',
          'border-amber-200/60 bg-amber-50/30',
          'border-blue-200/60 bg-blue-50/30',
        ].map((bg, idx) => (
          <div
            key={idx}
            className={`border rounded-3xl p-5 shadow-xs relative overflow-hidden space-y-3 ${bg}`}
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="w-9 h-9 rounded-2xl" />
            </div>
            <Skeleton className="h-9 w-20 rounded-xl" />
            <Skeleton className="h-3 w-32 rounded-md" />
          </div>
        ))}
      </div>

      {/* Inventory Overview Trend Chart Skeleton */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-3.5 w-64 rounded-md" />
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 border border-slate-200/80 rounded-xl">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>

        {/* Legend pills placeholder */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-3.5 w-24 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-3.5 w-24 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-3.5 w-24 rounded-md" />
          </div>
        </div>

        {/* Simulated chart wave area */}
        <div className="h-64 sm:h-72 w-full bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-6 flex flex-col justify-end space-y-4">
          <div className="flex items-end justify-between gap-2 h-44 w-full">
            {[45, 60, 52, 75, 68, 85, 92, 78, 65, 88, 95, 70].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton
                  className="w-full rounded-t-lg bg-slate-200/90"
                  style={{ height: `${h}%` }}
                />
                <Skeleton className="h-2.5 w-6 rounded-xs" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accessible Blocks Overview (8 Sectors Grid Skeleton) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-56 rounded-md" />
            <Skeleton className="h-3 w-72 rounded-md" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>

              {/* Progress bar */}
              <Skeleton className="h-2.5 w-full rounded-full" />

              {/* Stats line */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <Skeleton className="h-7 w-full rounded-lg" />
                <Skeleton className="h-7 w-full rounded-lg" />
                <Skeleton className="h-7 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader for Admin Profile Page
 */
export const AdminProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 select-none">
      {/* Breadcrumb & active session */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40 rounded-md" />
        <Skeleton className="h-6 w-48 rounded-full" />
      </div>

      {/* Hero Profile Identity Card Skeleton */}
      <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl shrink-0" />
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-36 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-8 w-64 rounded-lg" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0 md:border-l md:border-slate-100 md:pl-6">
          <Skeleton className="h-3.5 w-28 rounded-md" />
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-3.5 w-20 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      </div>

      {/* 4-Card Metadata Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-2.5 w-32 rounded-xs" />
          </div>
        ))}
      </div>

      {/* 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Administrative Particulars Card Skeleton */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-56 rounded-md" />
                <Skeleton className="h-3 w-72 rounded-md" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2">
                  <Skeleton className="h-3 w-28 rounded-md" />
                  <Skeleton className="h-5 w-44 rounded-md" />
                  <Skeleton className="h-2.5 w-32 rounded-xs" />
                </div>
              ))}
            </div>
          </div>
          {/* Assigned Sectors Skeleton */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-48 rounded-md" />
                  <Skeleton className="h-3 w-64 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <Skeleton className="h-12 w-full rounded-2xl" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-40 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* System Privileges Skeleton */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-52 rounded-md" />
                <Skeleton className="h-3 w-64 rounded-md" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column skeleton: Security Credentials & Context */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-48 rounded-md" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-32 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-28 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-3">
            <Skeleton className="h-4 w-40 rounded-md border-b border-slate-100 pb-2" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader for Administrative Table Views
 * (Sub-admins, Reservations, Inventory, Receipts, Customer Directory, Sales History, Audit Log)
 */
export const AdminTableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 6,
  columns = 5,
}) => {
  return (
    <div className="space-y-6 select-none">
      {/* Top action row with search and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3 w-60 rounded-md" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>

        {/* Table structure */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="p-4">
                    <Skeleton className="h-3.5 w-20 rounded-md" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} className="hover:bg-slate-50/40">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-28 rounded-md" />
                        <Skeleton className="h-2.5 w-20 rounded-md" />
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: columns - 1 }).map((_, c) => (
                    <td key={c} className="p-4">
                      <Skeleton
                        className={`h-4 rounded-md ${
                          c === columns - 2 ? 'w-16' : 'w-24'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader for Master Plan Overview & Block Grid
 */
export const AdminMasterPlanSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      {/* Top Header & block selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-60 rounded-lg" />
          <Skeleton className="h-3.5 w-80 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Main Canvas Container Skeleton */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <Skeleton className="h-5 w-44 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* Large CAD / Map Canvas shimmer */}
        <div className="w-full h-96 sm:h-[480px] bg-slate-900/90 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center space-y-3">
          <div className="absolute inset-0 bg-radial from-slate-800/40 via-transparent to-transparent pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center animate-pulse">
            <Skeleton className="w-8 h-8 rounded-lg bg-slate-700" />
          </div>
          <Skeleton className="h-4 w-48 rounded-md bg-slate-800" />
        </div>
      </div>

      {/* Sector Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-lg" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Full Admin Portal Layout Authenticating Skeleton
 * Replaces full screen blank / text jump while session is verifying
 */
export const AdminPortalLayoutSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex select-none">
      {/* Sidebar Skeleton (hidden on small) */}
      <div className="hidden lg:flex w-64 border-r border-slate-200/90 bg-white flex-col h-screen p-4 justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-2">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-2.5 w-16 rounded-xs" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-2xl space-y-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
      </div>

      {/* Main Area Skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/90 px-6 py-4 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-32 rounded-md" />
            <Skeleton className="h-6 w-44 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </header>

        <main className="p-4 sm:p-8 flex-1">
          <AdminDashboardSkeleton />
        </main>
      </div>
    </div>
  );
};
