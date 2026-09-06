'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { adminLogin } from '@/lib/dal/adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both administrative username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminLogin(username, password);
      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        setError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin(u, p);
      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        setError(res.error || 'Authentication failed.');
      }
    } catch {
      setError('Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,#E2ECE6_0%,transparent_65%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10251E] to-[#18392C] border border-[#234F3D] shadow-xl text-[#D4AF37] font-serif font-bold text-3xl mb-4">
            PV
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#10251E] tracking-tight">
            PRIME VIEW
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#2E6B4B] font-semibold mt-1">
            Administrative Management Core • Phase 2
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-[#10251E]" />
            <span className="text-sm font-semibold text-[#10251E]">
              Official Administration Sign In
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, marketing, police"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#10251E] focus:ring-1 focus:ring-[#10251E] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#10251E] focus:ring-1 focus:ring-[#10251E] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#10251E] hover:bg-[#18392C] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In To Portal'}</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-5 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2.5 text-center">
              Quick Switch Demo Roles
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'password123')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-left transition-colors text-xs"
              >
                <div>
                  <span className="font-bold text-[#10251E]">Super Administrator</span>
                  <div className="text-[11px] text-slate-500">admin • Society-wide (All 8 Blocks)</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('marketing', 'password123')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-left transition-colors text-xs"
              >
                <div>
                  <span className="font-bold text-[#10251E]">Marketing Sub-Admin</span>
                  <div className="text-[11px] text-slate-500">marketing • Abbott + Royal Blocks</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('police', 'password123')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-left transition-colors text-xs"
              >
                <div>
                  <span className="font-bold text-[#10251E]">Police Sub-Admin</span>
                  <div className="text-[11px] text-slate-500">police • Overseas + Elite + Chalet</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
