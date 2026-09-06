'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { MemberHeader } from '@/components/member-portal/MemberHeader';
import { PlotCard } from '@/components/member-portal/PlotCard';
import { useMemberStore } from '@/lib/store/useMemberStore';
import { Home, ShieldCheck, MapPin, Building2 } from 'lucide-react';

export default function PropertiesPage() {
  const { plots, fetchPlots, isLoading } = useMemberStore();

  useEffect(() => {
    fetchPlots();
  }, [fetchPlots]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <MemberHeader
        title="My Properties"
        subtitle="Verified allotment files &amp; plot portfolio"
      />

      <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Intro Box */}
        <div className="bg-white rounded-2xl border border-black/[0.08] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base sm:text-lg text-[#151914]">
              Allocated Property Files ({plots.length})
            </h3>
            <p className="text-xs text-[#6B7462]">
              All plots are allotted under the Co-operative Housing Society Act with verified society registry records.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-[#FAF9F5] border border-black/[0.08] text-xs font-semibold text-[#151914] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#43612B]" />
              <span>Hazara Division Allotments</span>
            </span>
          </div>
        </div>

        {/* Loading / Empty / Grid */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-black/[0.08] p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#43612B]/20 border-t-[#43612B] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#6B7462]">Retrieving property records...</p>
          </div>
        ) : plots.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/[0.08] p-10 sm:p-14 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF9F5] text-[#6B7462] flex items-center justify-center mx-auto">
              <Home className="w-8 h-8 opacity-40" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="font-display font-bold text-lg text-[#151914]">
                No Properties Registered
              </h4>
              <p className="text-xs text-[#6B7462] leading-relaxed">
                You do not have any property files registered to your account yet. Contact the society administrator to link your booking file.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/society-members"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#43612B] text-white font-bold text-xs tracking-wide hover:bg-[#365222] transition-colors"
              >
                Society Membership Rules
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plots.map((plot) => (
              <PlotCard key={plot.id} plot={plot} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
