'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { verifySlipPublic } from '@/lib/dal/receipts';
import { ReceiptStatus } from '@/lib/mock/types';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
  Building2,
  Calendar,
  Hash,
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
  const [fetchError, setFetchError] = useState(false);
  const [submission, setSubmission] = useState<{
    exists: boolean;
    status: 'verified' | 'pending' | 'rejected' | 'not_found';
    slipNumber?: string;
    memberDisplayName?: string;
    installmentNumber?: number | null;
    paymentDetails?: string;
    amount?: number;
    paymentDate?: string;
  } | null>(null);

  useEffect(() => {
    async function fetchVerify() {
      setIsLoading(true);
      setFetchError(false);
      try {
        const data = await verifySlipPublic(slipNumber);
        setSubmission(data);
      } catch (err) {
        console.error('Error verifying slip:', err);
        setFetchError(true);
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
                Govt Reg # 411/Abbottabad &bull; Public Verification Registry
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
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-8 space-y-4 backdrop-blur-xl shadow-2xl animate-pulse select-none">
            <div className="h-6 w-48 bg-slate-800 rounded-md mx-auto" />
            <div className="h-3 w-64 bg-slate-800/60 rounded-md mx-auto" />
            <div className="pt-4 space-y-3">
              <div className="h-12 w-full bg-slate-900 rounded-xl border border-slate-800/60" />
              <div className="h-12 w-full bg-slate-900 rounded-xl border border-slate-800/60" />
              <div className="h-12 w-full bg-slate-900 rounded-xl border border-slate-800/60" />
            </div>
          </div>
        ) : fetchError ? (
          /* Request Error */
          <div className="bg-slate-950/90 border border-rose-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-700 to-rose-800 px-6 py-4 text-white flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-white shrink-0" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-100 block">
                    Verification Error
                  </span>
                  <h1 className="text-base font-bold tracking-tight">Could Not Reach Registry</h1>
                </div>
              </div>
            </div>
            <div className="p-6 md:p-8 space-y-4">
              <p className="text-sm text-slate-300">
                Unable to reach the verification service. Please try again or contact the society office.
              </p>
              <Link
                href="/"
                className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Home
              </Link>
            </div>
          </div>
        ) : submission?.status === 'verified' ? (
          /* ── STATE 1: VERIFIED ─────────────────────────────────────────── */
          <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-emerald-950/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-white shrink-0" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100 block">
                    Official Certification
                  </span>
                  <h1 className="text-base font-bold tracking-tight">Genuine &amp; Verified Society Record</h1>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full text-xs font-mono font-medium backdrop-blur-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                VERIFIED
              </span>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-emerald-400" />
                    Verified Slip Number
                  </span>
                  <span className="font-mono font-bold text-white text-sm tracking-wider">{submission.slipNumber || slipNumber}</span>
                </div>
                {submission.memberDisplayName && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-400" />
                      Member Name
                    </span>
                    <span className="font-semibold text-sm text-slate-200">{submission.memberDisplayName}</span>
                  </div>
                )}
                {submission.paymentDetails && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Payment
                    </span>
                    <span className="font-semibold text-sm text-slate-200">
                      {submission.paymentDetails}
                    </span>
                  </div>
                )}
                {submission.amount !== undefined && submission.amount !== null && (
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
                      {new Date(submission.paymentDate).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Clearing Authority:</span>
                  <span className="font-semibold text-slate-300">Society Secretariat &amp; Finance Desk</span>
                </div>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs text-blue-200/90 flex gap-3">
                <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-blue-300">Privacy &amp; Financial Data Protection</p>
                  <p className="text-[11px] leading-relaxed text-blue-200/80">
                    In compliance with member privacy standards, individual customer identities, plot allotment
                    numbers, and full transaction details are masked or not displayed on this public registry.
                  </p>
                </div>
              </div>
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
        ) : submission?.status === 'pending' ? (
          /* ── STATE 2: PENDING ──────────────────────────────────────────── */
          <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 text-white flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5">
                <Clock className="w-6 h-6 text-white shrink-0" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-100 block">
                    Awaiting Clearance
                  </span>
                  <h1 className="text-base font-bold tracking-tight">Submitted — Awaiting Clearance</h1>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full text-xs font-mono font-medium backdrop-blur-sm">
                PENDING
              </span>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-amber-400" />
                    Slip Reference
                  </span>
                  <span className="font-mono font-bold text-white text-sm tracking-wider">{submission.slipNumber || slipNumber}</span>
                </div>
                {submission.memberDisplayName && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-400" />
                      Member Name
                    </span>
                    <span className="font-semibold text-sm text-slate-200">{submission.memberDisplayName}</span>
                  </div>
                )}
                {submission.paymentDetails && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      Payment
                    </span>
                    <span className="font-semibold text-sm text-slate-200">
                      {submission.paymentDetails}
                    </span>
                  </div>
                )}
                {submission.amount !== undefined && submission.amount !== null && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      Amount
                    </span>
                    <span className="font-mono font-bold text-sm text-amber-300">
                      PKR {Number(submission.amount).toLocaleString()}
                    </span>
                  </div>
                )}
                {submission.paymentDate && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      Payment Date
                    </span>
                    <span className="font-mono text-xs text-slate-200">
                      {new Date(submission.paymentDate).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  This payment submission has been received and is awaiting review by the finance desk. It has{' '}
                  <strong className="text-amber-300">not yet been cleared or approved</strong>. Do not treat this as an
                  approved payment.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-300">Need Assistance?</p>
                <p className="text-[11px] leading-relaxed">
                  Please visit the Prime View Main Secretariat, Supply Road, Abbottabad, or contact the finance
                  department at <span className="text-emerald-400 font-mono">+92-992-385000</span> for status updates.
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
        ) : submission?.status === 'rejected' ? (
          /* ── STATE 3: REJECTED ─────────────────────────────────────────── */
          <div className="bg-slate-950/90 border border-rose-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-700 to-rose-800 px-6 py-4 text-white flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5">
                <ShieldX className="w-6 h-6 text-white shrink-0" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-100 block">
                    Record Not Accepted
                  </span>
                  <h1 className="text-base font-bold tracking-tight">Not Accepted as a Society Record</h1>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full text-xs font-mono font-medium backdrop-blur-sm">
                <XCircle className="w-3.5 h-3.5 text-rose-300" />
                REJECTED
              </span>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-rose-400" />
                    Slip Reference
                  </span>
                  <span className="font-mono font-bold text-white text-sm tracking-wider">{submission.slipNumber || slipNumber}</span>
                </div>
                {submission.memberDisplayName && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-rose-400" />
                      Member Name
                    </span>
                    <span className="font-semibold text-sm text-slate-200">{submission.memberDisplayName}</span>
                  </div>
                )}
                {submission.paymentDetails && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-rose-400" />
                      Payment
                    </span>
                    <span className="font-semibold text-sm text-slate-200">
                      {submission.paymentDetails}
                    </span>
                  </div>
                )}
                {submission.amount !== undefined && submission.amount !== null && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-rose-400" />
                      Amount
                    </span>
                    <span className="font-mono font-bold text-sm text-rose-300">
                      PKR {Number(submission.amount).toLocaleString()}
                    </span>
                  </div>
                )}
                {submission.paymentDate && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-rose-400" />
                      Payment Date
                    </span>
                    <span className="font-mono text-xs text-slate-200">
                      {new Date(submission.paymentDate).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  This payment submission was reviewed and{' '}
                  <strong className="text-rose-300">not accepted</strong> as a valid society payment record. If you
                  believe this is in error, contact the finance desk with your original deposit evidence.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-300">Need Assistance?</p>
                <p className="text-[11px] leading-relaxed">
                  Please visit the Prime View Main Secretariat, Supply Road, Abbottabad, or contact the finance
                  department at <span className="text-emerald-400 font-mono">+92-992-385000</span> for manual
                  verification.
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

        ) : (
          /* ── STATE 4: NOT FOUND / UNRECOGNIZED ─────────────────────────── */
          <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 text-white flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-white shrink-0" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-100 block">
                    Security Advisory
                  </span>
                  <h1 className="text-base font-bold tracking-tight">Unrecognized Slip Number</h1>
                </div>
              </div>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div className="text-center py-4">
                <p className="text-sm text-slate-300 mb-2">
                  Requested Reference:{' '}
                  <span className="font-mono font-bold text-amber-300">{slipNumber || 'N/A'}</span>
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  This slip number does not match any receipt in the Prime View Housing Society registry. Physical
                  slips with unrecognized reference numbers may be invalid.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-300">Need Assistance?</p>
                <p className="text-[11px] leading-relaxed">
                  Please visit the Prime View Main Secretariat, Supply Road, Abbottabad, or contact the finance
                  department at <span className="text-emerald-400 font-mono">+92-992-385000</span> for manual
                  verification.
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
        &copy; {new Date().getFullYear()} Prime View Housing Society &bull; All Rights Reserved
      </footer>
    </div>
  );
}
