'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MemberHeader } from '@/components/member-portal/MemberHeader';
import { useMemberStore } from '@/lib/store/useMemberStore';
import { updateProfile, changeCustomerPassword } from '@/lib/dal/customers';
import {
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  Users,
  FileBadge,
  Info,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  cnic: z.string().min(10, 'Please enter a valid CNIC format (e.g. 37405-1234567-1)'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid Pakistani phone number (e.g. 0300-1234567)'),
  mailingAddress: z.string().min(5, 'Mailing address must be at least 5 characters'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { profile, fetchProfile } = useMemberStore();
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Management state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordToast, setPasswordToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      cnic: '',
      email: '',
      phone: '',
      mailingAddress: '',
    },
  });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        cnic: profile.cnic,
        email: profile.email,
        phone: profile.phone,
        mailingAddress: profile.mailingAddress || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const res = await updateProfile(data);
      if (res.ok) {
        setToastMessage({
          type: 'success',
          text: 'Profile updated successfully. All changes are reflected across society records.',
        });
        await fetchProfile();
      } else {
        setToastMessage({
          type: 'error',
          text: res.error || 'Failed to update profile. Please try again.',
        });
      }
    } catch (e) {
      setToastMessage({
        type: 'error',
        text: 'An unexpected error occurred while saving your profile.',
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordToast(null);

    if (!profile?.id) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordToast({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordToast({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordToast({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changeCustomerPassword(profile.id, currentPassword, newPassword);
      if (res.ok) {
        setPasswordToast({
          type: 'success',
          text: 'Password successfully updated! Use your new password on your next login.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const errorMsg =
          res.error === 'CURRENT_PASSWORD_INCORRECT'
            ? 'The current password you entered is incorrect.'
            : res.error === 'PASSWORD_TOO_SHORT'
            ? 'New password must be at least 8 characters long.'
            : res.error || 'Failed to update password.';
        setPasswordToast({ type: 'error', text: errorMsg });
      }
    } catch (err) {
      setPasswordToast({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
      setPasswordLoading(false);
      setTimeout(() => {
        setPasswordToast(null);
      }, 6000);
    }
  };

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <MemberHeader
          title="Member Profile"
          subtitle="Manage contact records & verified account details"
        />
        <main className="p-6 sm:p-8 max-w-4xl w-full mx-auto space-y-6 select-none animate-pulse">
          <div className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-200/80 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-52 bg-slate-200/80 rounded-lg" />
                <div className="h-3.5 w-36 bg-slate-200/80 rounded-md" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="h-5 w-40 bg-slate-200/80 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-11 bg-slate-200/80 rounded-xl" />
              <div className="h-11 bg-slate-200/80 rounded-xl" />
              <div className="h-11 bg-slate-200/80 rounded-xl" />
              <div className="h-11 bg-slate-200/80 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <MemberHeader
        title="Member Profile"
        subtitle="Manage contact records &amp; verified account details"
      />

      <main className="p-6 sm:p-8 max-w-4xl w-full mx-auto space-y-8">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold animate-fade-in ${
              toastMessage.type === 'success'
                ? 'bg-[#EAF0E7] text-[#43612B] border-[#43612B]/20'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#43612B]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Read-Only System Identity Box (Section 2.8) */}
        <div className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-4 pb-5 border-b border-black/[0.06]">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center font-bold text-xl">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-xl text-[#151914]">
                  {profile?.fullName || 'Member Profile'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#EAF0E7] text-[#43612B] border border-[#43612B]/20">
                  {profile?.accountStatus || 'Active'}
                </span>
              </div>
              <p className="text-xs text-[#6B7462]">
                {profile?.fatherOrHusbandName
                  ? `S/O, D/O, W/O: ${profile.fatherOrHusbandName} • `
                  : ''}
                Registered Member &bull; Allotted File Holder
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Membership No */}
            <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#43612B]">
                <FileBadge className="w-3.5 h-3.5" />
                <span>Membership No</span>
              </div>
              <p className="font-mono font-bold text-sm text-[#151914]">
                {profile?.membershipNo || '—'}
              </p>
              <p className="text-[10px] text-[#6B7462]">Official society member ID</p>
            </div>

            {/* Customer ID */}
            <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
                <Lock className="w-3.5 h-3.5 text-[#43612B]" />
                <span>System ID</span>
              </div>
              <p className="font-mono font-bold text-sm text-[#151914]">
                {profile?.id || '—'}
              </p>
              <p className="text-[10px] text-[#6B7462]">Immutable ledger record</p>
            </div>

            {/* Account Status */}
            <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
                <Shield className="w-3.5 h-3.5 text-[#43612B]" />
                <span>Account Status</span>
              </div>
              <p className="font-bold text-sm text-emerald-700 capitalize">
                {profile?.accountStatus || 'Active'}
              </p>
              <p className="text-[10px] text-[#6B7462]">Verified society standing</p>
            </div>

            {/* Enrolled Date */}
            <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7462]">
                <Calendar className="w-3.5 h-3.5 text-[#43612B]" />
                <span>Enrolled Date</span>
              </div>
              <p className="font-medium text-sm text-[#151914]">
                {profile?.createdDate || '—'}
              </p>
              <p className="text-[10px] text-[#6B7462]">Original file registry</p>
            </div>
          </div>
        </div>

        {/* Next of Kin (NOK) Read-Only Reference Card (Section 2.8) */}
        <div className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#151914]">
                  Next of Kin (NOK) &bull; Legal Nominee
                </h3>
                <p className="text-xs text-[#6B7462]">
                  Registered nominee designated on physical booking form for estate and file rights.
                </p>
              </div>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/5 text-[#6B7462] border border-black/10">
              Read-Only Reference
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7462] block">
                Full Name of NOK
              </span>
              <p className="font-bold text-sm text-[#151914]">
                {profile?.nokName || 'Not Specified'}
              </p>
              <p className="text-[10px] text-[#6B7462]">Designated primary successor</p>
            </div>

            <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-black/[0.04] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7462] block">
                CNIC of NOK
              </span>
              <p className="font-mono font-bold text-sm text-[#151914]">
                {profile?.nokCnic || 'Not Specified'}
              </p>
              <p className="text-[10px] text-[#6B7462]">Verified national identity</p>
            </div>
          </div>

          <div className="bg-[#FAF9F7] rounded-xl p-3.5 border border-black/[0.05] flex items-start gap-2.5 text-xs text-[#6B7462]">
            <Info className="w-4 h-4 text-[#43612B] shrink-0 mt-0.5" />
            <span>
              Next of Kin modifications are statutory and require submitting a legal affidavit and physical identity verification at the society secretariat.
            </span>
          </div>
        </div>

        {/* Editable Fields Form (Section 2.8) */}
        <div className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h3 className="font-display font-bold text-lg text-[#151914]">
              Contact Particulars &amp; Mailing Address
            </h3>
            <p className="text-xs text-[#6B7462]">
              Keep your contact particulars and mailing address updated so official society notices, ballot notifications, and payment receipts reach you without delay.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="fullName"
                  className="text-xs font-bold text-[#151914] uppercase tracking-wider block"
                >
                  Full Legal Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  {...register('fullName')}
                  className="w-full px-4 py-3 text-xs sm:text-sm border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914]"
                />
                {errors.fullName && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* CNIC */}
              <div className="space-y-1.5">
                <label
                  htmlFor="cnic"
                  className="text-xs font-bold text-[#151914] uppercase tracking-wider block"
                >
                  CNIC / National Identity No.
                </label>
                <input
                  id="cnic"
                  type="text"
                  {...register('cnic')}
                  placeholder="37405-XXXXXXX-X"
                  className="w-full px-4 py-3 text-xs sm:text-sm border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914]"
                />
                {errors.cnic && (
                  <p className="text-[11px] text-red-600 font-medium">{errors.cnic.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-bold text-[#151914] uppercase tracking-wider block"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-3 text-xs sm:text-sm border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914]"
                />
                {errors.email && (
                  <p className="text-[11px] text-red-600 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label
                  htmlFor="phone"
                  className="text-xs font-bold text-[#151914] uppercase tracking-wider block"
                >
                  Primary Mobile / WhatsApp No.
                </label>
                <input
                  id="phone"
                  type="text"
                  {...register('phone')}
                  placeholder="0300-XXXXXXX"
                  className="w-full px-4 py-3 text-xs sm:text-sm border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914]"
                />
                {errors.phone && (
                  <p className="text-[11px] text-red-600 font-medium">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Mailing Address */}
            <div className="space-y-1.5">
              <label
                htmlFor="mailingAddress"
                className="text-xs font-bold text-[#151914] uppercase tracking-wider flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-[#43612B]" />
                <span>Physical Mailing Address</span>
              </label>
              <textarea
                id="mailingAddress"
                rows={3}
                {...register('mailingAddress')}
                placeholder="House #, Street #, Sector/Area, City"
                className="w-full px-4 py-3 text-xs sm:text-sm border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914] resize-none"
              />
              {errors.mailingAddress && (
                <p className="text-[11px] text-red-600 font-medium">
                  {errors.mailingAddress.message}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between">
              <span className="text-xs text-[#6B7462]">
                Changes are immediately synchronized across your member account.
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="px-6 py-2.5 rounded-xl bg-[#43612B] hover:bg-[#365222] disabled:opacity-40 text-white font-bold text-xs tracking-wide flex items-center gap-2 shadow-xs transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Password Management Card */}
        <div className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF0E7] text-[#43612B] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-[#151914]">
                  Portal Password &amp; Security
                </h3>
                <p className="text-xs text-[#6B7462]">
                  Change your portal account password. Minimum 8 characters required.
                </p>
              </div>
            </div>
          </div>

          {passwordToast && (
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold animate-fade-in ${
                passwordToast.type === 'success'
                  ? 'bg-[#EAF0E7] text-[#43612B] border-[#43612B]/20'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {passwordToast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#43612B]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{passwordToast.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="currentPassword"
                  className="text-xs font-bold text-[#151914] uppercase tracking-wider block"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 text-xs sm:text-sm border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7462] hover:text-[#151914] transition-colors p-1 rounded-lg focus:outline-none cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="newPassword"
                  className="text-xs font-bold text-[#151914] uppercase tracking-wider block"
                >
                  New Password (min 8 chars)
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    minLength={8}
                    className="w-full px-4 py-3 pr-11 text-xs sm:text-sm border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7462] hover:text-[#151914] transition-colors p-1 rounded-lg focus:outline-none cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="text-xs font-bold text-[#151914] uppercase tracking-wider block"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    minLength={8}
                    className="w-full px-4 py-3 pr-11 text-xs sm:text-sm border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#43612B] bg-white text-[#151914]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7462] hover:text-[#151914] transition-colors p-1 rounded-lg focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-[#6B7462]">
                Passwords must contain at least 8 characters to safeguard your property records.
              </span>
              <button
                type="submit"
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="px-6 py-2.5 rounded-xl bg-[#43612B] hover:bg-[#365222] disabled:opacity-40 text-white font-bold text-xs tracking-wide flex items-center gap-2 shadow-xs transition-all"
              >
                {passwordLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Society Compliance & Strike Record Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.08] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${
                (profile?.strikeCount || 0) > 0 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'bg-[#F2F5ED] text-[#43612B]'
              }`}>
                {(profile?.strikeCount || 0) > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#151914]">
                  Society Compliance & Standing Record
                </h3>
                <p className="text-xs text-[#6B7462]">
                  Official administrative standing and payment compliance tracking under society bylaws.
                </p>
              </div>
            </div>

            <div className="self-start sm:self-center">
              {(profile?.strikeCount || 0) > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{profile?.strikeCount} Administrative {profile?.strikeCount === 1 ? 'Strike' : 'Strikes'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Good Standing (0 Strikes)</span>
                </span>
              )}
            </div>
          </div>

          {(profile?.strikeCount || 0) === 0 ? (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Compliant Member Standing</p>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Your member profile is in full compliance with society bylaws, verification standards, and installment commitments. No disciplinary strikes or payment non-compliance warnings are on record.
                </p>
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
              {(() => {
                const recordedStrikes = (profile?.strikes && profile.strikes.length > 0)
                  ? profile.strikes
                  : (profile?.strikeHistory || []).map((sh) => ({
                      id: sh.id,
                      reason: sh.reason,
                      issuedAt: sh.assignedAt,
                      issuedByName: sh.assignedBy,
                    }));

                if (recordedStrikes.length === 0) return null;

                return (
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                      Recorded Strike History ({recordedStrikes.length})
                    </div>
                    <div className="space-y-2">
                      {recordedStrikes.map((s, idx) => (
                        <div
                          key={s.id || idx}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-mono font-bold text-[10px] border border-rose-300">
                                Strike #{idx + 1}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {s.reason}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>Issued: {new Date(s.issuedAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>By: {s.issuedByName || 'Administration'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <p className="text-[11px] text-slate-500 italic">
                To submit an administrative appeal or discuss strike resolution, please contact the Prime View Main Secretariat, Supply Road, Abbottabad.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
