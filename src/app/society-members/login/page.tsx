'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

import { Shield, ArrowRight, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

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
      setErrorMessage('Something went wrong. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(identifier, password);
      if (res.ok) {
        router.push('/society-members/dashboard');
      } else {
        const msg = res.error;
        if (msg === 'Invalid credentials.' || msg === 'Account locked due to too many failed attempts.') {
          setErrorMessage(msg);
        } else {
          setErrorMessage('Something went wrong. Please try again.');
        }
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col justify-between selection:bg-[#43612B] selection:text-white">
      {/* Top Bar */}
      <div className="p-4 sm:p-6 max-w-6xl w-full mx-auto flex flex-col min-[380px]:flex-row items-start min-[380px]:items-center justify-between gap-2.5">
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
                Username
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Username"
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
        </div>
      </div>

      {/* Footer Note */}
      <div className="p-4 text-center text-xs text-[#6B7462]">
        Prime View Co-Operative Housing Society Ltd &bull; Member Access Portal
      </div>
    </div>
  );
}

