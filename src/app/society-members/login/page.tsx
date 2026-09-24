'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { siteConfig } from '@/data/site';

import { Shield, Lock, ArrowRight, AlertCircle, ArrowLeft, KeyRound, UserCheck, Eye, EyeOff } from 'lucide-react';

export default function MemberLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both your Username / Membership Number and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(identifier, password);
      if (res.ok) {
        router.push('/society-members/dashboard');
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo account quick-fill helpers for seamless live presentations
  const fillDemo = (demoId: string) => {
    if (demoId === 'tariq') {
      setIdentifier('PV-2024-001');
    } else if (demoId === 'ayesha') {
      setIdentifier('PV-2024-002');
    } else if (demoId === 'usman') {
      setIdentifier('PV-2024-003');
    } else if (demoId === 'bilal') {
      setIdentifier('PV-2024-004');
    }
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col justify-between selection:bg-[#43612B] selection:text-white">
      {/* Top Bar */}
      <div className="p-6 max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/society-members"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B7462] hover:text-[#151914] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#43612B]" />
          <span>Back to Eligibility Guidelines</span>
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#43612B]" />
          <span className="text-xs font-bold text-[#151914] uppercase tracking-wider">
            Secure Portal
          </span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-3xl border border-black/[0.08] shadow-[0_16px_50px_rgba(0,0,0,0.06)] p-8 sm:p-10 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-2 mb-1">
              <Image
                src="/logo-trimmed.png"
                alt="Prime View Logo"
                width={64}
                height={64}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#151914]">
              Member Portal
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7462] leading-relaxed">
              Sign in to view your society plot ledger, installment schedule, and verified receipts.
            </p>
          </div>

          {/* Inline Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="identifier"
                className="text-xs font-bold text-[#151914] uppercase tracking-wider block"
              >
                Username / Membership Number
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. PV-2024-001 or CNIC / Phone"
                className="w-full px-4 py-3 text-xs sm:text-sm border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914] placeholder-[#6B7462]/50 shadow-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-bold text-[#151914] uppercase tracking-wider block"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 text-xs sm:text-sm border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914] placeholder-[#6B7462]/50 shadow-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7462] hover:text-[#151914] transition-colors p-1 rounded-lg focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-6 rounded-xl bg-[#43612B] hover:bg-[#365222] disabled:opacity-50 text-white font-bold text-xs sm:text-sm tracking-wide shadow-[0_4px_16px_rgba(67,97,43,0.3)] transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Member Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Self-Registration & Forgot Password Restriction (Section 2.2) */}
          <div className="pt-2 text-center text-xs text-[#6B7462] space-y-1 border-t border-black/[0.06]">
            <p className="font-semibold text-[#151914]">
              Self-registration is disabled for society security.
            </p>
            <p>
              Forgot your credentials? Contact your society administrator or the main booking office.
            </p>
          </div>

          {/* Demo Account Helpers for Live Presentation */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/[0.06] space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#43612B]">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Demo Quick-Fill Accounts:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillDemo('tariq')}
                className="p-2 rounded-lg bg-white border border-black/[0.06] hover:border-[#43612B] text-left transition-colors"
              >
                <span className="font-bold block text-[#151914]">Tariq Mehmood</span>
                <span className="text-[#6B7462] text-[10px]">1 Plot (Full Payment)</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('ayesha')}
                className="p-2 rounded-lg bg-white border border-black/[0.06] hover:border-[#43612B] text-left transition-colors"
              >
                <span className="font-bold block text-[#151914]">Dr. Ayesha</span>
                <span className="text-[#6B7462] text-[10px]">1 Plot (Installment)</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('usman')}
                className="p-2 rounded-lg bg-white border border-black/[0.06] hover:border-[#43612B] text-left transition-colors"
              >
                <span className="font-bold block text-[#151914]">Malik Usman</span>
                <span className="text-[#6B7462] text-[10px]">2 Plots (Mixed)</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('bilal')}
                className="p-2 rounded-lg bg-white border border-black/[0.06] hover:border-[#43612B] text-left transition-colors"
              >
                <span className="font-bold block text-[#151914]">Bilal Ahmed</span>
                <span className="text-[#6B7462] text-[10px]">0 Plots (Empty State)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="p-4 text-center text-xs text-[#6B7462]">
        Prime View Co-Operative Housing Society Ltd &bull; Member Access Portal
      </div>
    </div>
  );
}
