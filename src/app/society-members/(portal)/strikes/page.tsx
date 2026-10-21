'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { MemberHeader } from '@/components/member-portal/MemberHeader';
import { useMemberStore } from '@/lib/store/useMemberStore';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileBadge,
  User,
  Calendar,
  Building2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Info,
} from 'lucide-react';

export default function MemberStrikesPage() {
  const { profile, fetchProfile, isLoading } = useMemberStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (!profile && isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <MemberHeader
          title="Compliance & Strikes"
          subtitle="Society Compliance & Standing Record"
        />
        <main className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6 animate-pulse">
          <div className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="h-6 w-64 bg-slate-200/80 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200/80 rounded-md" />
            <div className="h-24 bg-slate-100 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  const strikeCount = profile?.strikeCount || 0;
  const recordedStrikes = (profile?.strikes && profile.strikes.length > 0)
    ? profile.strikes.map((s) => ({
        id: s.id,
        reason: s.reason,
        issuedAt: s.issuedAt,
        issuedByName: s.issuedByName || 'Administration',
        receiptId: (s as any).receiptId as string | undefined,
      }))
    : (profile?.strikeHistory || []).map((sh) => ({
        id: sh.id,
        reason: sh.reason,
        issuedAt: sh.assignedAt,
        issuedByName: sh.assignedBy || 'Administration',
        receiptId: sh.receiptId,
      }));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <MemberHeader
        title="Compliance & Strikes"
        subtitle="Society Compliance & Standing Record"
      />

      <main className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6">
        {/* Quick Identity Bar */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/[0.08] p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center font-bold text-lg border border-[#43612B]/20 shrink-0">
              {profile?.applicantPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.applicantPhotoUrl}
                  alt={profile.fullName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base sm:text-lg text-[#151914]">
                  {profile?.fullName || 'Society Member'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20">
                  {profile?.accountStatus || 'Active'}
                </span>
              </div>
              <p className="text-xs text-[#6B7462] flex items-center gap-2 mt-0.5">
                <span>Membership: <strong className="font-mono text-[#151914]">{profile?.membershipNo || '—'}</strong></span>
                <span>•</span>
                <span>CNIC: <strong className="font-mono text-[#151914]">{profile?.cnic || '—'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/society-members/profile"
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>View Profile</span>
            </Link>
          </div>
        </div>

        {/* Society Compliance & Strike Record Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-black/[0.08] shadow-xs space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-2xl ${
                  strikeCount > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-[#F2F5ED] text-[#43612B]'
                }`}
              >
                {strikeCount > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#151914]">
                  Society Compliance &amp; Standing Record
                </h3>
                <p className="text-xs text-[#6B7462]">
                  Official administrative standing and payment compliance tracking under society bylaws.
                </p>
              </div>
            </div>

            <div className="self-start sm:self-center">
              {strikeCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {strikeCount} Administrative {strikeCount === 1 ? 'Strike' : 'Strikes'}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Good Standing (0 Strikes)</span>
                </span>
              )}
            </div>
          </div>

          {strikeCount === 0 ? (
            <div className="p-4 sm:p-5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-emerald-950">Compliant Member Standing</p>
                <p className="text-emerald-800 text-xs leading-relaxed">
                  Your member profile is in full compliance with society bylaws, verification standards, and installment commitments. No disciplinary strikes or payment non-compliance warnings are on record.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-700 font-mono font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Official Status: Good Standing • Certified by Administration</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Active Compliance Advisory</p>
                  <p className="text-amber-900 text-[11px] leading-relaxed">
                    Under Prime View Housing Society bylaws, administrative strikes are issued for payment defaults, invalid receipt submissions, or regulatory compliance issues. Accumulating strikes can result in account suspension.
                  </p>
                </div>
              </div>

              {/* Strikes History Timeline */}
              {recordedStrikes.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center justify-between">
                    <span>Recorded Strike History ({recordedStrikes.length})</span>
                    <span className="text-[11px] text-slate-400 font-normal">Administration Disciplinary Ledger</span>
                  </div>
                  <div className="space-y-2.5">
                    {recordedStrikes.map((s, idx) => {
                      const strikeDate = s.issuedAt ? new Date(s.issuedAt) : null;
                      const formattedDate = strikeDate && !isNaN(strikeDate.getTime())
                        ? strikeDate.toLocaleDateString('en-PK', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Date on record';

                      return (
                        <div
                          key={s.id || idx}
                          className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-mono font-bold text-[11px] border border-rose-300">
                                Strike #{idx + 1}
                              </span>
                              <span className="font-semibold text-slate-900 text-sm">
                                {s.reason}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap font-mono">
                              <span className="font-medium text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded">
                                Issued by Administration
                              </span>
                              <span>•</span>
                              <span className="text-slate-600">
                                Date: {formattedDate}
                              </span>
                              {s.receiptId && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-500">
                                    Receipt Ref: {s.receiptId}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 italic">
                  To submit an administrative appeal or discuss strike resolution, please contact the Prime View Main Secretariat, Supply Road, Abbottabad.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
