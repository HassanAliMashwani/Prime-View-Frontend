'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/data/site';
import {
  User,
  ShieldCheck,
  ShieldAlert,
  Layers,
  KeyRound,
  CheckCircle2,
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
  Camera,
  Phone,
  Save,
  Trash2,
  RotateCcw,
  Sparkles,
  Crown,
  Globe,
  Briefcase,
  UserPlus,
  Compass,
} from 'lucide-react';
import {
  getActiveAdminSession,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  AdminSession,
  AdminProfileDetails,
} from '@/lib/dal/adminAuth';
import { toast } from '@/lib/toast';
import { getCache, setCache } from '@/lib/dal/apiCache';
import { runLane1 } from '@/lib/requestLanes';

const BLOCK_COLORS: Record<string, string> = {
  abbott: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  royal: 'bg-amber-50 text-amber-800 border-amber-200',
  overseas: 'bg-sky-50 text-sky-800 border-sky-200',
  elite: 'bg-purple-50 text-purple-800 border-purple-200',
  commercial: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'npf-phase-1': 'bg-teal-50 text-teal-800 border-teal-200',
  'npf-phase-2': 'bg-cyan-50 text-cyan-800 border-cyan-200',
};

export default function AdminProfilePage() {
  const getInit = () => {
    if (typeof window === 'undefined') return null;
    const s = getActiveAdminSession();
    if (!s) return null;
    return getCache<AdminProfileDetails>(`/profile:${s.adminId}`, true);
  };
  const init = getInit();

  const [session, setSession] = useState<AdminSession | null>(() =>
    typeof window === 'undefined' ? null : getActiveAdminSession(),
  );
  const [details, setDetails] = useState<AdminProfileDetails | null>(init || null);
  const [loading, setLoading] = useState(!init);

  // Editable Profile fields state
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Profile Picture state
  const [avatar, setAvatar] = useState<string>('');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const s = getActiveAdminSession();
    if (s) {
      setSession(s);
      // Load saved avatar from localStorage if available
      try {
        const localAvatar = localStorage.getItem(`pv_admin_avatar_${s.adminId}`);
        if (localAvatar) {
          setAvatar(localAvatar);
        }
      } catch {}

      runLane1({
        screen: 'admin-profile',
        key: `/profile:${s.adminId}`,
        fn: async () => getAdminProfile(s),
      })
        .then((res) => {
          if (res.ok && res.admin) {
            setDetails(res.admin);
            setCache(`/profile:${s.adminId}`, res.admin);
            setEditFullName(res.admin.fullName || s.fullName || '');
            setEditEmail(res.admin.email || (s.username ? `${s.username}@primeview.pk` : ''));
            setEditPhone(res.admin.phone || s.phone || '');
            if (res.admin.avatarUrl) {
              setAvatar(res.admin.avatarUrl);
              try {
                localStorage.setItem(`pv_admin_avatar_${s.adminId}`, res.admin.avatarUrl);
              } catch {}
            }
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Update input defaults when details or session changes
  useEffect(() => {
    if (details) {
      setEditFullName(details.fullName || '');
      setEditEmail(details.email || '');
      setEditPhone(details.phone || '');
      if (details.avatarUrl && !avatar) {
        setAvatar(details.avatarUrl);
      }
    } else if (session) {
      setEditFullName(session.fullName || '');
      setEditEmail(session.email || `${session.username}@primeview.pk`);
      setEditPhone(session.phone || '');
    }
  }, [details, session]);

  // Handle Profile Picture selection and optimization
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setAvatarSaving(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) return;

        // Resize & compress image using canvas to ensure fast load and reasonable size
        const img = new window.Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 320;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

            setAvatar(optimizedDataUrl);
            try {
              localStorage.setItem(`pv_admin_avatar_${session.adminId}`, optimizedDataUrl);
              if (session.username) {
                localStorage.setItem(`pv_admin_avatar_${session.username}`, optimizedDataUrl);
              }
            } catch {}

            // Save to backend
            const res = await runLane1({
              screen: 'admin-profile',
              isSave: true,
              fn: async () => updateAdminProfile(session, { avatarUrl: optimizedDataUrl }),
            });

            if (res.ok && res.admin) {
              setDetails(res.admin);
              setCache(`/profile:${session.adminId}`, res.admin);
              toast.success('Profile picture updated successfully.');
            } else {
              toast.error(res.error || 'Failed to save updated profile picture.');
            }
          }
          setAvatarSaving(false);
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Failed to process selected image.');
      setAvatarSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!session) return;
    setAvatarSaving(true);
    try {
      setAvatar('');
      try {
        localStorage.removeItem(`pv_admin_avatar_${session.adminId}`);
        if (session.username) {
          localStorage.removeItem(`pv_admin_avatar_${session.username}`);
        }
      } catch {}

      const res = await runLane1({
        screen: 'admin-profile',
        isSave: true,
        fn: async () => updateAdminProfile(session, { avatarUrl: '' }),
      });

      if (res.ok && res.admin) {
        setDetails(res.admin);
        setCache(`/profile:${session.adminId}`, res.admin);
        toast.success('Profile picture removed. Restored official emblem.');
      } else {
        toast.error(res.error || 'Failed to remove profile picture.');
      }
    } catch {
      toast.error('Failed to reset profile picture.');
    } finally {
      setAvatarSaving(false);
    }
  };

  // Handle Profile Details submission (Name, Email, Phone editable; Admin ID immutable)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = editFullName.trim();
    const trimmedEmail = editEmail.trim();
    const trimmedPhone = editPhone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      toast.error('Full name must be at least 2 characters.');
      return;
    }

    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      toast.error('Please provide a valid email address.');
      return;
    }

    if (!session) return;

    setProfileSaving(true);
    try {
      const res = await runLane1({
        screen: 'admin-profile',
        isSave: true,
        fn: async () =>
          updateAdminProfile(session, {
            fullName: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            avatarUrl: avatar || undefined,
          }),
      });

      if (res.ok && res.admin) {
        setDetails(res.admin);
        setCache(`/profile:${session.adminId}`, res.admin);
        toast.success(res.message || 'Profile details updated successfully.');
      } else {
        toast.error(res.error || 'Failed to update profile details.');
      }
    } catch {
      toast.error('An unexpected network error occurred.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleResetProfileForm = () => {
    setEditFullName(details?.fullName || session?.fullName || '');
    setEditEmail(details?.email || (session?.username ? `${session.username}@primeview.pk` : ''));
    setEditPhone(details?.phone || session?.phone || '');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    if (!session) return;

    setPasswordLoading(true);
    try {
      const res = await runLane1({
        screen: 'admin-profile',
        isSave: true,
        fn: async () => changeAdminPassword(session, currentPassword, newPassword),
      });
      if (res.ok) {
        toast.success(res.message || 'Your administrator password has been updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.error || 'Failed to update password.');
      }
    } catch {
      toast.error('An unexpected network error occurred.');
    } finally {
      setPasswordLoading(false);
    }
  };

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
  const phone = details?.phone || session.phone;
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
    { id: 'abbott', name: 'Abbott Block', desc: 'Main Commercial Hub & 1 Kanal Villas', icon: Building2, featured: true, tag: 'Flagship Hub' },
    { id: 'royal', name: 'Royal Block', desc: 'Premium Boulevard Residences', icon: Crown, featured: false, tag: 'Authorized' },
    { id: 'overseas', name: 'Overseas Block', desc: 'Expatriate Executive Sector', icon: Globe, featured: false, tag: 'Authorized' },
    { id: 'elite', name: 'Elite Block', desc: 'Luxury Parkside Enclave', icon: Sparkles, featured: false, tag: 'Authorized' },
    { id: 'commercial', name: 'Commercial Block', desc: 'Main Boulevard Commercial Hub', icon: Briefcase, featured: false, tag: 'Authorized' },
    { id: 'npf-phase-1', name: 'NPF Phase 1', desc: 'Co-operative Housing Division', icon: Layers, featured: false, tag: 'Authorized' },
    { id: 'npf-phase-2', name: 'NPF Phase 2', desc: 'Mixed-Use Development Expansion', icon: Compass, featured: false, tag: 'Authorized' },
  ];

  const permissionList = [
    { key: 'can_reserve', label: 'Plot Token Reservations', icon: BookmarkCheck, desc: 'Hold plot allocations with 24hr reservation tokens' },
    { key: 'can_book', label: 'Plot Bookings & Confirmation', icon: CheckCircle2, desc: 'Execute binding installment plan bookings' },
    { key: 'can_create_customer', label: 'Member Registration', icon: UserPlus, desc: 'Enroll new society members & file profiles' },
    { key: 'can_view_customers', label: 'Member Directory Access', icon: Users, desc: 'Inspect verified member records and accounts' },
    { key: 'can_verify_receipts', label: 'Payment Slip Verification', icon: FileCheck, desc: 'Authorize bank deposit slips and stamp payments' },
    { key: 'can_edit_content', label: 'Public Content CMS', icon: FileEdit, desc: 'Manage society notices, media, and marketing copy' },
    { key: 'can_view_sales_history', label: 'Sales Ledger Inspection', icon: ScrollText, desc: 'Review global transaction audit trail and KPI records' },
    { key: 'can_view_inventory', label: 'Inventory Overview Access', icon: Layers, desc: 'Audit plot availability matrices and block totals' },
    { key: 'can_view_master_plan', label: 'Master Plan CAD Grid', icon: Building2, desc: 'Interact with spatial plots and block layout' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Hero Profile Identity Card */}
      <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-4 sm:p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-50/70 via-teal-50/30 to-transparent rounded-full pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Editable Profile Picture Container */}
            <div className="relative group/avatar shrink-0">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white border-2 border-slate-200/90 shadow-md p-1.5 flex items-center justify-center overflow-hidden ring-4 ring-slate-100">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={fullName}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <Image
                    src={siteConfig.logoPath}
                    alt="Prime View Official Emblem"
                    width={80}
                    height={80}
                    className="object-contain"
                    priority
                  />
                )}
                {avatarSaving && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center rounded-3xl">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Camera Trigger Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarSaving}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[#10251E] hover:bg-[#18392C] text-[#D4AF37] border-2 border-white shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Change Profile Picture"
                aria-label="Upload custom profile picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileSelect}
              />
            </div>

            <div className="min-w-0">
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

                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarSaving}
                    className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                    title="Remove custom photo and reset to official emblem"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Reset Emblem</span>
                  </button>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                {fullName}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{email}</span>
                </div>
                {phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Executive Identity</span>
                </div>
              </div>
            </div>
          </div>

          {/* Authority Level & Jurisdiction: STRICTLY SUPER ADMIN ONLY (Removed for all Sub-Admins) */}
          {isSuper && (
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <div className="text-xs text-slate-500 font-medium">
                Authority Level:
                <strong className="block text-slate-900 font-serif text-sm mt-0.5">
                  Executive Society Portfolio
                </strong>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Jurisdiction:
                <strong className="block text-emerald-800 text-xs font-bold mt-0.5">
                  Society-wide (All 7 Blocks)
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* Read-Only System Identity 4-Grid (Administrative ID is strictly immutable) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 relative z-10">
          {/* Admin ID / System ID (Strictly Read-Only) */}
          <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#43612B]">
              <FileBadge className="w-3.5 h-3.5 text-emerald-700" />
              <span>Administrative ID</span>
            </div>
            <p className="font-mono font-bold text-sm text-[#151914]">
              {details?.id || session.adminId || 'admin-1'}
            </p>
            <p className="text-[10px] text-[#6B7462] flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-slate-400" />
              <span>Immutable administrative record</span>
            </p>
          </div>

          {/* Portal Handle (Read-Only) */}
          <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
              <User className="w-3.5 h-3.5 text-[#43612B]" />
              <span>Portal Handle</span>
            </div>
            <p className="font-mono font-bold text-sm text-[#151914]">
              @{username}
            </p>
            <p className="text-[10px] text-[#6B7462]">Auth login identifier</p>
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
              {loading && !details?.createdDate ? (
                <span className="inline-block w-24 h-4 bg-slate-200 animate-pulse rounded align-middle" />
              ) : (
                formattedDate
              )}
            </p>
            <p className="text-[10px] text-[#6B7462]">Original commission registry</p>
          </div>
        </div>
      </div>

      {/* ── ROW 1: PROFILE MANAGEMENT & SECURITY FORMS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 Cols): Edit Profile Details Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                    Edit Profile Details
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your full name, official contact email, and mobile phone number.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Self-Service</span>
              </span>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Row 1: Administrative ID (Immutable Read-Only) & Portal Handle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Administrative ID (Immutable)</span>
                  </label>
                  <input
                    type="text"
                    value={details?.id || session.adminId || 'admin-1'}
                    disabled
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-100/90 border border-slate-200/90 rounded-xl text-xs font-mono font-bold text-slate-500 cursor-not-allowed select-none"
                    title="Administrative identifier cannot be modified"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Official assigned ID (cannot be edited).</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Portal Handle (Immutable)</span>
                  </label>
                  <input
                    type="text"
                    value={`@${username}`}
                    disabled
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-100/90 border border-slate-200/90 rounded-xl text-xs font-mono font-bold text-slate-500 cursor-not-allowed select-none"
                    title="Portal login handle cannot be modified"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Primary authentication username.</p>
                </div>
              </div>

              {/* Row 2: Full Name (Editable) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Enter full name and department"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Displayed on vouchers, approval stamps, and executive audit trails.</p>
              </div>

              {/* Row 3: Email Address & Phone Number (Both Editable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. name@primeview.pk"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Contact email for system logs and notifications.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. 0300-1234567 or +92 300 1234567"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Official mobile phone number for verification.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetProfileForm}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard</span>
                </button>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2 bg-[#10251E] hover:bg-[#18392C] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{profileSaving ? 'Saving Changes...' : 'Save Profile Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1 Col): Security & Password Management */}
        <div className="lg:col-span-1">
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

      {/* ── ROW 2: SUPER ADMIN EXECUTIVE BENTO GRID (STRICTLY SUPER ADMIN ONLY) ── */}
      {isSuper && (
        <div className="space-y-6 pt-2">
          {/* Executive Bento Banner */}
          <div className="bg-gradient-to-br from-[#10251E] via-[#16352B] to-[#1F4A3C] text-white p-6 sm:p-7 rounded-3xl shadow-sm border border-[#D4AF37]/25 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-[#D4AF37]/15 via-transparent to-transparent pointer-events-none -mr-20 -mt-20" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center shadow-xs shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-serif font-bold text-lg sm:text-xl text-white tracking-tight">
                      Super Administrator Executive Governance
                    </h2>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#10251E]">
                      Charter V4
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
                    Constitutional jurisdiction across all 7 society blocks and unhindered operational authority over all 9 administrative systems.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-left">
                  <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">Jurisdiction</div>
                  <div className="font-serif font-bold text-sm text-white">7/7 Blocks Active</div>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-left">
                  <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">Privileges</div>
                  <div className="font-serif font-bold text-sm text-[#D4AF37]">9/9 Granted</div>
                </div>
              </div>
            </div>
          </div>

          {/* Master Bento Grid (Side-by-Side Bento Boxes) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
            {/* ── BENTO CARD 1: ASSIGNED SECTORS & JURISDICTION ── */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
              <div>
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                        Assigned Sectors &amp; Jurisdiction
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Authorized geographic sectors within your administrative charter.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full shrink-0">
                    All 7 Blocks
                  </span>
                </div>

                {/* Bento Grid of 7 Blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5">
                  {allBlocksList.map((block) => {
                    const Icon = block.icon;
                    const isFeatured = block.featured;
                    return (
                      <div
                        key={block.id}
                        className={`p-4 rounded-2xl border transition-all shadow-2xs group flex flex-col justify-between gap-3 ${
                          isFeatured
                            ? 'sm:col-span-2 bg-gradient-to-r from-emerald-50/80 via-white to-amber-50/50 border-emerald-300 hover:border-emerald-500'
                            : 'bg-slate-50/60 hover:bg-white border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isFeatured
                                  ? 'bg-emerald-800 text-[#D4AF37]'
                                  : 'bg-white text-slate-700 border border-slate-200 group-hover:text-emerald-700'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-serif font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors">
                                {block.name}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{block.desc}</p>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isFeatured
                                ? 'bg-[#10251E] text-[#D4AF37] border border-[#D4AF37]/40'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {block.tag}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bento Footer Scope Indicator */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Full Society Boundary Rights</span>
                </span>
                <span className="font-mono text-emerald-700 font-bold">100% Coverage</span>
              </div>
            </div>

            {/* ── BENTO CARD 2: SYSTEM PRIVILEGES & PERMISSIONS ── */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
              <div>
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                        System Privileges &amp; Permissions
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Assigned administrative operations and operational rights.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
                    9 Granted Modules
                  </span>
                </div>

                {/* Bento Grid of 9 Permissions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5">
                  {permissionList.map((perm) => {
                    const Icon = perm.icon;
                    const isGranted = isSuper || Boolean((permissions as Record<string, boolean | undefined>)[perm.key]);

                    return (
                      <div
                        key={perm.key}
                        className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 hover:shadow-2xs ${
                          isGranted
                            ? 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-emerald-300'
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
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
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

              {/* Bento Footer Permissions Indicator */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Unrestricted System Governance</span>
                </span>
                <span className="font-mono text-emerald-700 font-bold">9 Operations Granted</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
