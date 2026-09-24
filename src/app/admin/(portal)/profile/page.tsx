'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  ShieldCheck,
  ShieldAlert,
  Layers,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Building2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Calendar,
  FileCheck,
  BookmarkCheck,
  Users,
  FileEdit,
  ScrollText,
  FileBadge,
} from 'lucide-react';
import {
  getActiveAdminSession,
  getAdminProfile,
  changeAdminPassword,
  AdminSession,
  AdminProfileDetails,
} from '@/lib/dal/adminAuth';
import { AdminProfileSkeleton } from '@/components/ui/skeleton';
const BLOCK_COLORS: Record<string, string> = {
  abbott: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  royal: 'bg-amber-50 text-amber-800 border-amber-200',
  overseas: 'bg-sky-50 text-sky-800 border-sky-200',
  elite: 'bg-purple-50 text-purple-800 border-purple-200',
  chalet: 'bg-rose-50 text-rose-800 border-rose-200',
  commercial: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'npf-phase-1': 'bg-teal-50 text-teal-800 border-teal-200',
  'npf-phase-2': 'bg-cyan-50 text-cyan-800 border-cyan-200',
};

export default function AdminProfilePage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [details, setDetails] = useState<AdminProfileDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const s = getActiveAdminSession();
    if (s) {
      setSession(s);
      getAdminProfile(s)
        .then((res) => {
          if (res.ok && res.admin) {
            setDetails(res.admin);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!currentPassword) {
      setToast({ type: 'error', message: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 8) {
      setToast({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    if (!session) return;

    setPasswordLoading(true);
    try {
      const res = await changeAdminPassword(session, currentPassword, newPassword);
      if (res.ok) {
        setToast({
          type: 'success',
          message: res.message || 'Your administrator password has been updated successfully.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setToast({ type: 'error', message: res.error || 'Failed to update password.' });
      }
    } catch {
      setToast({ type: 'error', message: 'An unexpected network error occurred.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <AdminProfileSkeleton />;
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Session Required</h2>
        <p className="text-sm text-slate-600">Please sign in to view your administrative profile.</p>
        <Link
          href="/admin/login"
          className="inline-block px-5 py-2.5 bg-[#10251E] text-white rounded-xl font-bold text-xs"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  const isSuper = session.role === 'super_admin';
  const fullName = details?.fullName || session.fullName;
  const username = details?.username || session.username;
  const email = details?.email || `${username}@primeview.pk`;
  const assignedBlocks = details?.assignedBlocks || session.assignedBlocks || [];
  const permissions = details?.permissions || session.permissions || {};
  const formattedDate = details?.createdDate
    ? new Date(details.createdDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '01 Jan 2026';

  const allBlocksList = [
    { id: 'abbott', name: 'Abbott Block', desc: 'Main Commercial Hub & 1 Kanal Villas' },
    { id: 'royal', name: 'Royal Block', desc: 'Premium Boulevard Residences' },
    { id: 'overseas', name: 'Overseas Block', desc: 'Expatriate Executive Sector' },
    { id: 'elite', name: 'Elite Block', desc: 'Luxury Parkside Enclave' },
    { id: 'chalet', name: 'Chalet Block', desc: 'Scenic Hillside Terraces' },
    { id: 'civic', name: 'Civic Block', desc: 'Central Amenities & Commercial Plaza' },
    { id: 'executive', name: 'Executive Block', desc: 'Corporate & Administrative Sector' },
    { id: 'general', name: 'General Block', desc: 'Standard Residential Sector' },
  ];

  const permissionList = [
    { key: 'can_reserve', label: 'Plot Token Reservations', icon: BookmarkCheck, desc: 'Hold plot allocations with 24hr reservation tokens' },
    { key: 'can_book', label: 'Plot Bookings & Confirmation', icon: CheckCircle2, desc: 'Execute binding installment plan bookings' },
    { key: 'can_create_customer', label: 'Member Registration', icon: Users, desc: 'Enroll new society members & file profiles' },
    { key: 'can_view_customers', label: 'Member Directory Access', icon: User, desc: 'Inspect verified member records and accounts' },
    { key: 'can_verify_receipts', label: 'Payment Slip Verification', icon: FileCheck, desc: 'Authorize bank deposit slips and stamp payments' },
    { key: 'can_edit_content', label: 'Public Content CMS', icon: FileEdit, desc: 'Manage society notices, media, and marketing copy' },
    { key: 'can_view_sales_history', label: 'Sales Ledger Inspection', icon: ScrollText, desc: 'Review global transaction audit trail and KPI records' },
    { key: 'can_view_inventory', label: 'Inventory Overview Access', icon: Layers, desc: 'Audit plot availability matrices and block totals' },
    { key: 'can_view_master_plan', label: 'Master Plan CAD Grid', icon: Building2, desc: 'Interact with spatial plots and block layout' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <Link href="/admin/dashboard" className="hover:underline">Dashboard</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900">Admin Profile</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-bold text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Authenticated Session</span>
        </div>
      </div>

      {/* Hero Profile Identity Card */}
      <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-50/70 via-teal-50/30 to-transparent rounded-full pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Prime View Emblem Logo Container */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white border border-slate-200/90 shadow-md p-2 flex items-center justify-center shrink-0">
              <Image
                src="/logo-trimmed.png"
                alt="Prime View Official Emblem"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border shadow-2xs ${
                    isSuper
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-blue-100 text-blue-900 border-blue-300'
                  }`}
                >
                  {isSuper ? 'Super Administrator' : 'Administrator'}
                </span>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  @{username}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                {fullName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Executive Identity</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="text-xs text-slate-500 font-medium">
              Authority Level:
              <strong className="block text-slate-900 font-serif text-sm mt-0.5">
                {isSuper ? 'Executive Society Portfolio' : 'Assigned Sector Authority'}
              </strong>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Jurisdiction:
              <strong className="block text-emerald-800 text-xs font-bold mt-0.5">
                {isSuper ? 'Society-wide (All 8 Blocks)' : `${assignedBlocks.length} Assigned Blocks`}
              </strong>
            </div>
          </div>
        </div>

        {/* Read-Only System Identity 4-Grid (Exact match to Member Profile Section 2.8) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 relative z-10">
          {/* Admin ID / System ID */}
          <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#43612B]">
              <FileBadge className="w-3.5 h-3.5 text-emerald-700" />
              <span>Administrative ID</span>
            </div>
            <p className="font-mono font-bold text-sm text-[#151914]">
              {details?.id || session.adminId || 'admin-1'}
            </p>
            <p className="text-[10px] text-[#6B7462]">Official administrative record</p>
          </div>

          {/* Portal Handle */}
          <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
              <User className="w-3.5 h-3.5 text-[#43612B]" />
              <span>Portal Handle</span>
            </div>
            <p className="font-mono font-bold text-sm text-[#151914]">
              @{username}
            </p>
            <p className="text-[10px] text-[#6B7462]">Immutable auth identifier</p>
          </div>

          {/* Account Status */}
          <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#43612B]" />
              <span>Standing &amp; Status</span>
            </div>
            <p className="font-bold text-sm text-emerald-800 capitalize">
              {details?.status || 'Active'}
            </p>
            <p className="text-[10px] text-[#6B7462]">Verified executive authority</p>
          </div>

          {/* Appointed Date */}
          <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
              <Calendar className="w-3.5 h-3.5 text-[#43612B]" />
              <span>Charter Appointed</span>
            </div>
            <p className="font-medium text-sm text-[#151914]">
              {formattedDate}
            </p>
            <p className="text-[10px] text-[#6B7462]">Original commission registry</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Assigned Sectors & Authority (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Assigned Sectors Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                    Assigned Sectors & Jurisdiction
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized geographic sectors within your administrative charter.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                {isSuper ? 'All 8 Blocks' : `${assignedBlocks.length} Blocks`}
              </span>
            </div>

            {isSuper ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allBlocksList.map((block) => (
                    <div
                      key={block.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300 transition-all shadow-2xs group flex items-start justify-between"
                    >
                      <div>
                        <div className="font-serif font-bold text-sm text-slate-900 group-hover:text-emerald-800">
                          {block.name}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{block.desc}</p>
                      </div>
                      <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                        Authorized
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assignedBlocks.map((b: string) => {
                    const blockInfo = allBlocksList.find((item) => item.id === b.toLowerCase());
                    return (
                      <div
                        key={b}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-serif font-bold text-sm text-slate-900">
                            {blockInfo?.name || `${b.toUpperCase()} Block`}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {blockInfo?.desc || 'Assigned territory'}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md border ${
                            BLOCK_COLORS[b.toLowerCase()] || 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {b}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Operational Permissions Grid */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                  System Privileges & Permissions
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned administrative operations and operational rights.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {permissionList.map((perm) => {
                const Icon = perm.icon;
                const isGranted = isSuper || Boolean((permissions as Record<string, boolean | undefined>)[perm.key]);

                return (
                  <div
                    key={perm.key}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      isGranted
                        ? 'bg-slate-50/70 border-slate-200'
                        : 'bg-slate-50/30 border-dashed border-slate-200 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isGranted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {perm.label}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded leading-none shrink-0 ${
                            isGranted
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isGranted ? 'Granted' : 'Restricted'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{perm.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Security & Password Management (1 Col) */}
        <div className="space-y-8">
          {/* Security & Password Change Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-base text-slate-900 leading-tight">
                  Security Credentials
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update administrative sign-in password
                </p>
              </div>
            </div>

            {toast && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border ${
                  toast.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{toast.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (min 8 chars)
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 px-4 bg-[#10251E] hover:bg-[#18392C] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

