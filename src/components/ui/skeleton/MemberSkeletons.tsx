import React from 'react';
import { Skeleton, SkeletonText } from './Skeleton';

/**
 * Skeleton Loader for Member Portal Dashboard
 */
export const MemberDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 select-none">
      {/* Member Hero Identity Banner Skeleton */}
      <div className="bg-[#10251E] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28 rounded-full bg-white/10" />
              <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
            </div>
            <Skeleton className="h-9 w-64 rounded-xl bg-white/20" />
            <Skeleton className="h-4 w-48 rounded-md bg-white/10" />
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
            <Skeleton className="h-3.5 w-24 rounded-md bg-white/10" />
            <Skeleton className="h-7 w-32 rounded-lg bg-white/20" />
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-5 border border-black/[0.08] shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <Skeleton className="w-8 h-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-32 rounded-xl" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        ))}
      </div>

      {/* Properties Section Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-44 rounded-md" />
            <Skeleton className="h-3.5 w-60 rounded-md" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-black/[0.08] p-6 shadow-xs space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-36 rounded-md" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-3 w-12 rounded-md" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>

              {/* Specs grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                </div>
              </div>

              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader for Member Properties Page
 */
export const MemberPropertiesSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-3xl border border-black/[0.08] p-6 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton Loader for Member Payments & Schedule Ledger
 */
export const MemberPaymentsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-5 border border-black/[0.08] shadow-xs space-y-2.5"
          >
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <Skeleton className="h-8 w-36 rounded-xl" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        ))}
      </div>

      {/* Installment Table Skeleton */}
      <div className="bg-white rounded-3xl border border-black/[0.08] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-2.5 w-20 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader for Member Transaction History
 */
export const MemberHistorySkeleton: React.FC = () => {
  return (
    <div className="space-y-8 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-52 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      <div className="bg-white rounded-3xl border border-black/[0.08] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-xl" />
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Full Member Portal Layout Authenticating Skeleton
 * Exact 1:1 structural replacement for spinning wheel & "Verifying Member Session..."
 */
export const MemberAuthGuardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F7F5] flex select-none">
      {/* Sidebar Skeleton (desktop) */}
      <div className="hidden lg:flex w-64 border-r border-black/[0.08] bg-white flex-col h-screen p-5 justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-2.5 w-16 rounded-xs" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-black/[0.06] bg-[#FAF9F5] rounded-2xl space-y-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-black/[0.08] px-6 py-4 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3 w-32 rounded-md" />
            <Skeleton className="h-5 w-44 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="w-9 h-9 rounded-xl" />
          </div>
        </header>

        <main className="p-4 sm:p-8 flex-1">
          <MemberDashboardSkeleton />
        </main>
      </div>
    </div>
  );
};
