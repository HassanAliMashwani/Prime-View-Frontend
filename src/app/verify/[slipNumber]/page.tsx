'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { verifySlipPublic } from '@/lib/dal/receipts';
import { ReceiptStatus } from '@/lib/mock/types';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Building2,
  Calendar,
  Hash,
  Award,
  ArrowLeft,
  ExternalLink,
  User,
  CreditCard,
} from 'lucide-react';

export default function VerifySlipPage() {
  const params = useParams();
  const rawSlipNumber = (params?.slipNumber as string) || '';
  const slipNumber = decodeURIComponent(rawSlipNumber).trim();

  const [isLoading, setIsLoading] = useState(true);
  const [submission, setSubmission] = useState<{
    exists: boolean;
    status: ReceiptStatus | 'not_found';
    amount?: number;
    paymentDate?: string;
    customerContext?: string;
  } | null>(null);

  useEffect(() => {
    async function fetchVerify() {
      setIsLoading(true);
      try {
        const data = await verifySlipPublic(slipNumber);
        setSubmission(data);
      } catch (err) {
        console.error('Error verifying slip:', err);
        setSubmission({ exists: false, status: 'not_found' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchVerify();
  }, [slipNumber]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-0 right-10 w-[500px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base">
                Prime View Housing Society
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-wide">
                Govt Reg # 411/Abbottabad • Public Verification Registry
              </p>
            </div>
          </Link>

          <Link
            href="/society-members/login"
            className="text-xs font-medium px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-600 transition-all flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            Member Portal
          </Link>
        </div>
      </header>

      {/* Main Verification Card */}
      <main className="relative z-10 max-w-xl w-full mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        {isLoading ? (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
            <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Consulting Society Verification Ledger...</p>
          </div>
        ) : submission && submission.exists && submission.status === 'verified' ? (
          /* Genuine & Verified Record */
          <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-emerald-950/40 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Verification Ribbon */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-white shrink-0" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100 block">
                    Official Certification
                  </span>
                  <h1 className="text-base font-bold tracking-tight">
                    Genuine & Verified Society Record
                  </h1>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full text-xs font-mono font-medium backdrop-blur-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                VERIFIED
              </span>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Slip details */}
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-emerald-400" />
                    Verified Slip Number
                  </span>
                  <span className="font-mono font-bold text-white text-sm tracking-wider">
                    {slipNumber}
                  </span>
                </div>

                {submission.customerContext && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-400" />
                      Depositor
                    </span>
                    <span className="font-semibold text-sm text-slate-200">
                      {submission.customerContext}
                    </span>
                  </div>
                )}

                {submission.amount && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Amount
                    </span>
                    <span className="font-mono font-bold text-sm text-emerald-300">
                      PKR {Number(submission.amount).toLocaleString()}
                    </span>
                  </div>
                )}

                {submission.paymentDate && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      Payment Date
                    </span>
                    <span className="font-mono text-xs text-slate-200">
                      {new Date(submission.paymentDate).toLocaleDateString(
                        'en-PK',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                )}

                <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Clearing Authority:</span>
                  <span className="font-semibold text-slate-300">
                    Society Secretariat & Finance Desk
                  </span>
                </div>
              </div>

              {/* Privacy Protection Notice */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs text-blue-200/90 flex gap-3">
                <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-blue-300">Privacy & Financial Data Protection</p>
                  <p className="text-[11px] leading-relaxed text-blue-200/80">
                    In compliance with member privacy standards, individual customer identities, plot
                    allotment numbers, and full transaction details are masked or not displayed on this public
                    registry.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/society-members/login"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Sign In to Member Portal
                </Link>
                <Link
                  href="/"
                  className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Society Home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Unverified or Unrecognized Slip */
          <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 text-white flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-white shrink-0" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-100 block">
                    Security Advisory
                  </span>
                  <h1 className="text-base font-bold tracking-tight">
                    {submission && submission.exists && submission.status !== 'verified' ? 'Unverified / Pending Clearance' : 'Unrecognized Slip Number'}
                  </h1>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="text-center py-4">
                <p className="text-sm text-slate-300 mb-2">
                  Requested Reference: <span className="font-mono font-bold text-amber-300">{slipNumber || 'N/A'}</span>
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {submission && submission.exists && submission.status !== 'verified'
                    ? `This payment submission is currently marked as "${submission.status}". It has not yet been certified with an official clearance slip.`
                    : 'This slip number does not match any certified receipt in the Prime View Housing Society registry. Physical slips with unrecognized reference numbers may be invalid.'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-300">Need Assistance?</p>
                <p className="text-[11px] leading-relaxed">
                  Please visit the Prime View Main Secretariat, Supply Road, Abbottabad, or contact
                  the finance department at <span className="text-emerald-400 font-mono">+92-992-385000</span> for
                  manual verification.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/"
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Home
                </Link>
                <Link
                  href="/society-members/login"
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  Member Login
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 font-mono">
        © {new Date().getFullYear()} Prime View Housing Society • All Rights Reserved
      </footer>
    </div>
  );
}
