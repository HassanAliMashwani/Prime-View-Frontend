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
    <div className="min-h-screen bg-[#091510] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,#18352A_0%,transparent_60%)] pointer-events-none opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,#1B2E24_0%,transparent_50%)] pointer-events-none opacity-40" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E3A2F] to-[#0D1F18] border border-[#2D5A46] shadow-xl text-[#D4AF37] font-serif font-bold text-3xl mb-4">
            PV
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#FAF9F7] tracking-tight">
            PRIME VIEW
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#A3C692] font-semibold mt-1">
            Administrative Management Core • Phase 2
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0F231B]/90 backdrop-blur-md border border-[#224436] rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#1E3A2F]">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-sm font-semibold text-white">
              Official Administration Sign In
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#B2CEB8] mb-1">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6D917F] absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, marketing, police"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#091712] border border-[#224436] rounded-lg text-sm text-white placeholder-[#4E6B5D] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B2CEB8] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6D917F] absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#091712] border border-[#224436] rounded-lg text-sm text-white placeholder-[#4E6B5D] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#E5C14E] hover:to-[#C49E31] text-[#0A1510] font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In To Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-5 border-t border-[#1E3A2F]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#8FAF7E] mb-2 text-center">
              Quick Switch Demo Roles
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'password123')}
                className="flex items-center justify-between p-2 rounded-lg bg-[#142920] hover:bg-[#1A382C] border border-[#264E3D] text-left transition-colors text-xs text-white"
              >
                <div>
                  <span className="font-semibold text-[#D4AF37]">Super Admin</span>
                  <div className="text-[10px] text-[#8FAF7E]">admin • Society-wide (All 8 Blocks)</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('marketing', 'password123')}
                className="flex items-center justify-between p-2 rounded-lg bg-[#142920] hover:bg-[#1A382C] border border-[#264E3D] text-left transition-colors text-xs text-white"
              >
                <div>
                  <span className="font-semibold text-[#CBE2BA]">Marketing Sub-Admin</span>
                  <div className="text-[10px] text-[#8FAF7E]">marketing • Abbott + Royal Blocks</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[#CBE2BA]" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('police', 'password123')}
                className="flex items-center justify-between p-2 rounded-lg bg-[#142920] hover:bg-[#1A382C] border border-[#264E3D] text-left transition-colors text-xs text-white"
              >
                <div>
                  <span className="font-semibold text-[#CBE2BA]">Police Sub-Admin</span>
                  <div className="text-[10px] text-[#8FAF7E]">police • Overseas + Elite + Chalet</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[#CBE2BA]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
