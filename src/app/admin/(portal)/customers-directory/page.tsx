'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  KeyRound, 
  RotateCcw, 
  Ban, 
  Building2, 
  Eye, 
  Calendar, 
  CreditCard,
  Layers,
  Lock,
  RefreshCw,
  ExternalLink,
  UserCheck,
  FileText
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { AdminTableSkeleton } from '@/components/ui/skeleton';
import { 
  getCustomersDirectory, 
  assignCustomerStrike, 
  toggleCustomerSuspension, 
  resetCustomerPassword, 
  issuePortalCredentials, 
  CustomerDirectoryEntry 
} from '@/lib/dal/customers';
import { AdminSession } from '@/lib/mock/types';

import CustomerDocumentsManager from '@/components/admin/documents/CustomerDocumentsManager';

function CustomersDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCompleteCustId = searchParams?.get('completeCustomer');

  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [customers, setCustomers] = useState<CustomerDirectoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs_registration' | 'active' | 'suspended' | 'strikes'>('all');

  // Modals state
  const [dossierCustomer, setDossierCustomer] = useState<CustomerDirectoryEntry | null>(null);
  const [strikeCustomer, setStrikeCustomer] = useState<CustomerDirectoryEntry | null>(null);
  const [strikeReason, setStrikeReason] = useState<string>('');
  const [strikeSubmitting, setStrikeSubmitting] = useState<boolean>(false);

  const [suspensionCustomer, setSuspensionCustomer] = useState<CustomerDirectoryEntry | null>(null);
  const [suspensionReason, setSuspensionReason] = useState<string>('');
  const [suspensionSubmitting, setSuspensionSubmitting] = useState<boolean>(false);

  const [resetModalData, setResetModalData] = useState<{
    customer: CustomerDirectoryEntry;
    newPassword?: string;
  } | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState<boolean>(false);

  // Helper to redirect to Customer Booking page to complete registration (CR 07 §5)
  const openCompleteRegistration = (cust: CustomerDirectoryEntry) => {
    router.push(`/admin/customers?completeCustomer=${cust.id}`);
  };

  // Redirect to customers booking page if completeCustomer query param is present
  useEffect(() => {
    if (queryCompleteCustId) {
      router.push(`/admin/customers?completeCustomer=${queryCompleteCustId}`);
    }
  }, [queryCompleteCustId, router]);

  const loadData = useCallback(async (currentSession: AdminSession) => {
    try {
      const res = await getCustomersDirectory(currentSession);
      if (!res.ok) {
        setError(res.message || res.error || 'Failed to load customer directory.');
      } else {
        setCustomers(res.customers);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to load customer directory:', err);
      setError('An unexpected error occurred while loading the directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);
    loadData(cur);

    // Auto-refresh customer directory every 30 seconds
    const intervalId = setInterval(() => {
      const latestSession = getActiveAdminSession();
      if (latestSession) {
        loadData(latestSession);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [router, loadData]);
  // Flash feedback auto-clear
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle Assign Strike Submit
  const handleAssignStrike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !strikeCustomer) return;
    setStrikeSubmitting(true);

    const res = await assignCustomerStrike(session, {
      customerId: strikeCustomer.id,
      reason: strikeReason,
    });
    setStrikeSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', message: res.message || res.error || 'Failed to assign strike.' });
    } else {
      setFeedback({
        type: 'success',
        message: `Strike assigned successfully to ${strikeCustomer.fullName}. Total strikes: ${(strikeCustomer.strikeCount || 0) + 1}`,
      });
      setStrikeCustomer(null);
      setStrikeReason('');
      loadData(session);
    }
  };

  // Handle Suspension Toggle Submit
  const handleToggleSuspension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !suspensionCustomer) return;
    setSuspensionSubmitting(true);

    const targetAction = suspensionCustomer.accountStatus === 'suspended' ? 'activate' : 'suspend';
    const res = await toggleCustomerSuspension(session, suspensionCustomer.id, targetAction, suspensionReason);
    setSuspensionSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', message: res.message || res.error || 'Failed to update suspension status.' });
    } else {
      setFeedback({
        type: 'success',
        message:
          targetAction === 'suspend'
            ? `Customer portal for ${suspensionCustomer.fullName} has been suspended.`
            : `Customer portal for ${suspensionCustomer.fullName} has been reactivated.`,
      });
      setSuspensionCustomer(null);
      setSuspensionReason('');
      loadData(session);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (cust: CustomerDirectoryEntry) => {
    if (!session) return;
    setResetSubmitting(true);

    const res = await resetCustomerPassword(session, cust.id);
    setResetSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', message: res.message || res.error || 'Failed to reset password.' });
    } else {
      setResetModalData({
        customer: cust,
        newPassword: res.newPassword,
      });
      setFeedback({
        type: 'success',
        message: `Password reset successfully for ${cust.fullName}.`,
      });
    }
  };

  // Handle Issue Credentials (Change Request 05 §4 & Change Request 07 §5)
  const canIssueCredentials = session?.role === 'super_admin';

  const handleIssueCredentials = async (cust: CustomerDirectoryEntry) => {
    if (!session) return;
    setResetSubmitting(true);
    const res = await issuePortalCredentials(session, cust.id);
    setResetSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', message: res.message || res.error || 'Failed to issue portal credentials.' });
    } else {
      setResetModalData({
        customer: cust,
        newPassword: res.password,
      });
      setFeedback({
        type: 'success',
        message: `Customer portal credentials issued successfully for ${cust.fullName} (${cust.membershipNo}).`,
      });
      await loadData(session);
      if (dossierCustomer && dossierCustomer.id === cust.id) {
        setDossierCustomer({ ...dossierCustomer, credentialsPending: false });
      }
    }
  };

  // Filtered list
  const filteredCustomers = customers.filter((c) => {
    if (statusFilter === 'needs_registration' && c.registrationStatus !== 'minimal') return false;
    if (statusFilter === 'active' && (c.accountStatus !== 'active' || c.registrationStatus === 'minimal')) return false;
    if (statusFilter === 'suspended' && c.accountStatus !== 'suspended') return false;
    if (statusFilter === 'strikes' && (!c.strikeCount || c.strikeCount === 0)) return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = c.fullName.toLowerCase().includes(q);
      const matchMem = c.membershipNo.toLowerCase().includes(q);
      const matchCnic = c.cnic.includes(q);
      const matchPhone = c.phone.includes(q);
      const matchPlot = c.plots.some((p) => p.plotNumber.toLowerCase().includes(q) || p.blockName.toLowerCase().includes(q));
      if (!matchName && !matchMem && !matchCnic && !matchPhone && !matchPlot) return false;
    }
    return true;
  });

  // Metrics
  const totalCount = customers.length;
  const needsRegistrationCount = customers.filter((c) => c.registrationStatus === 'minimal').length;
  const activeCount = customers.filter((c) => c.accountStatus === 'active' && c.registrationStatus !== 'minimal').length;
  const suspendedCount = customers.filter((c) => c.accountStatus === 'suspended').length;
  const withStrikesCount = customers.filter((c) => (c.strikeCount || 0) > 0).length;

  if (loading) {
    return <AdminTableSkeleton rows={6} columns={6} />;
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
          <div className="flex items-center gap-3 font-bold text-base mb-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Access Restricted</span>
          </div>
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-[#10251E] tracking-tight">
                Customer Management Directory
              </h1>
              <p className="text-xs text-slate-500">
                Authorized society member roster, property allotments, installment ledger status, and compliance strike tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Action badge / Scope info */}
        <div className="flex items-center gap-2">
          {session?.role !== 'super_admin' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Block Scoped: {session?.assignedBlocks?.join(', ').toUpperCase()}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Society-Wide Access (All 8 Blocks)</span>
            </span>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-rose-50 text-rose-900 border border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Members</div>
          <div className="mt-1 text-2xl font-bold font-serif text-slate-900">{totalCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">In assigned scope</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Needs Registration</div>
          <div className="mt-1 text-2xl font-bold font-serif text-amber-800">{needsRegistrationCount}</div>
          <div className="mt-1 text-[11px] text-amber-600">Pending formalities</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Portals</div>
          <div className="mt-1 text-2xl font-bold font-serif text-emerald-800">{activeCount}</div>
          <div className="mt-1 text-[11px] text-emerald-600">Full portal access</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Suspended Accounts</div>
          <div className="mt-1 text-2xl font-bold font-serif text-rose-800">{suspendedCount}</div>
          <div className="mt-1 text-[11px] text-rose-600">Login blocked</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Members With Strikes</div>
          <div className="mt-1 text-2xl font-bold font-serif text-amber-800">{withStrikesCount}</div>
          <div className="mt-1 text-[11px] text-amber-600">Compliance holds active</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Membership #, CNIC, Plot..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Members ({customers.length})
          </button>
          <button
            onClick={() => setStatusFilter('needs_registration')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              statusFilter === 'needs_registration'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <span>Needs Registration</span>
            {needsRegistrationCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                statusFilter === 'needs_registration' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-900'
              }`}>
                {needsRegistrationCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              statusFilter === 'suspended'
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Suspended ({suspendedCount})
          </button>
          <button
            onClick={() => setStatusFilter('strikes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              statusFilter === 'strikes'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Has Strikes ({withStrikesCount})
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Member Info</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Allotted Properties</th>
                <th className="py-3.5 px-4">Installment Standing</th>
                <th className="py-3.5 px-4">Financial Ledger</th>
                <th className="py-3.5 px-4">Compliance Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found matching the search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const hasStrikes = c.strikeCount > 0;
                  const isSuspended = c.accountStatus === 'suspended';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-800 to-slate-900 text-[#D4AF37] font-bold flex items-center justify-center text-xs shrink-0 shadow-xs border border-emerald-700/50">
                            {c.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{c.fullName}</span>
                              {c.registrationStatus === 'minimal' && (
                                <span className="px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                                  NEEDS REG
                                </span>
                              )}
                              {isSuspended && (
                                <span className="px-1.5 py-0.5 rounded-sm bg-rose-100 text-rose-800 text-[10px] font-bold">
                                  SUSPENDED
                                </span>
                              )}
                            </div>
                            {c.registrationStatus === 'minimal' ? (
                              <div className="text-[11px] font-mono text-amber-700 font-bold">
                                PENDING REGISTRATION
                              </div>
                            ) : (
                              <div className="text-[11px] font-mono text-emerald-800 font-semibold">
                                {c.membershipNo}
                              </div>
                            )}
                            {c.city && (
                              <div className="text-[10px] text-slate-500 font-medium">
                                City: {c.city}
                              </div>
                            )}
                            {c.fatherOrHusbandName && (
                              <div className="text-[10px] text-slate-400">
                                S/O, D/O: {c.fatherOrHusbandName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{c.phone || 'Pending'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{c.email || 'Pending'}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          CNIC: {c.cnic}
                        </div>
                      </td>

                      {/* Allotted Properties */}
                      <td className="py-3.5 px-4">
                        {c.plots.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">No plots attached</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {c.plots.map((p) => (
                              <span
                                key={p.bookingId}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-[11px]"
                              >
                                <Building2 className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span>{p.blockName}: {p.plotNumber}</span>
                                <span className="text-[9px] text-indigo-600/80">({p.size})</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Installment Standing */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className="text-emerald-700">{c.installmentsPaidCount} Paid</span>
                            <span className="text-slate-500">{c.installmentsDueCount} Due</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1.5 rounded-full"
                              style={{
                                width: `${
                                  c.installmentsPaidCount + c.installmentsDueCount > 0
                                    ? Math.round(
                                        (c.installmentsPaidCount /
                                          (c.installmentsPaidCount + c.installmentsDueCount)) *
                                          100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Financial Ledger */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="text-slate-900 font-bold font-mono text-[11px]">
                          PKR {c.totalPaidAmount.toLocaleString()}
                        </div>
                        {c.totalOutstandingAmount > 0 && (
                          <div className="text-[10px] text-amber-700 font-medium">
                            Due: PKR {c.totalOutstandingAmount.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Compliance Status & Strikes */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          {c.registrationStatus === 'minimal' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-700" />
                              <span>Needs Registration</span>
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isSuspended
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {isSuspended ? (
                                <Ban className="w-3 h-3 text-rose-600" />
                              ) : (
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              )}
                              <span className="capitalize">{c.accountStatus}</span>
                            </span>
                          )}

                          {c.credentialsPending && c.registrationStatus !== 'minimal' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                              <KeyRound className="w-3 h-3 text-amber-700" />
                              <span>Credentials Pending</span>
                            </span>
                          )}

                          {hasStrikes ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>{c.strikeCount} Strike{c.strikeCount > 1 ? 's' : ''}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Clean Record</span>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {c.registrationStatus === 'minimal' && session?.role === 'super_admin' && (
                            <button
                              onClick={() => openCompleteRegistration(c)}
                              title="Complete Member Registration (Super Admin)"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition-colors cursor-pointer mr-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Complete Reg</span>
                            </button>
                          )}

                          <button
                            onClick={() => setDossierCustomer(c)}
                            title="View Full Customer Dossier"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setStrikeCustomer(c);
                              setStrikeReason('');
                            }}
                            title="Assign Compliance Strike"
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSuspensionCustomer(c);
                              setSuspensionReason('');
                            }}
                            title={isSuspended ? 'Reactivate Customer Portal' : 'Suspend Customer Portal'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSuspended
                                ? 'text-emerald-700 hover:bg-emerald-50'
                                : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                          >
                            {isSuspended ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>

                          {c.credentialsPending && canIssueCredentials && (
                            <button
                              onClick={() => handleIssueCredentials(c)}
                              title="Issue Customer Portal Credentials"
                              className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors font-bold"
                            >
                              <KeyRound className="w-4 h-4 text-amber-700" />
                            </button>
                          )}

                          <button
                            onClick={() => handleResetPassword(c)}
                            title="Reset Portal Password"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: CUSTOMER DOSSIER ── */}
      {dossierCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-900 text-[#D4AF37] font-bold flex items-center justify-center text-sm shadow-xs">
                  {dossierCustomer.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{dossierCustomer.fullName}</h3>
                  <div className="text-xs font-mono text-emerald-800 font-semibold">
                    Membership: {dossierCustomer.membershipNo} • Account: {dossierCustomer.accountStatus.toUpperCase()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDossierCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Member & NOK Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-700 mb-2">Member Information</div>
                  <div className="space-y-1 text-slate-600">
                    <div><span className="text-slate-400">CNIC:</span> {dossierCustomer.cnic}</div>
                    <div><span className="text-slate-400">Phone:</span> {dossierCustomer.phone}</div>
                    <div><span className="text-slate-400">Email:</span> {dossierCustomer.email}</div>
                    <div><span className="text-slate-400">Address:</span> {dossierCustomer.mailingAddress}</div>
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-700 mb-2">Next of Kin (NOK)</div>
                  <div className="space-y-1 text-slate-600">
                    <div><span className="text-slate-400">Name:</span> {dossierCustomer.nokName || 'Not recorded'}</div>
                    <div><span className="text-slate-400">CNIC:</span> {dossierCustomer.nokCnic || 'Not recorded'}</div>
                    <div><span className="text-slate-400">Registration Date:</span> {dossierCustomer.createdDate}</div>
                    <div><span className="text-slate-400">Last Login:</span> {dossierCustomer.lastLogin || 'Never logged in'}</div>
                  </div>
                </div>
              </div>

              {/* Property Portfolio */}
              <div>
                <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Allocated Properties ({dossierCustomer.plots.length})</span>
                  <span className="text-emerald-700 font-mono">
                    Total Volume: PKR {dossierCustomer.totalPaidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-2">
                  {dossierCustomer.plots.map((p) => (
                    <div
                      key={p.bookingId}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{p.blockName} • Plot {p.plotNumber}</div>
                          <div className="text-slate-500 text-[11px]">
                            {p.size} • {p.category.toUpperCase()} • Scheme: {p.paymentType === 'installment' ? '24-Month Installments' : 'Full Payment'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold font-mono text-slate-900">PKR {p.price.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">Booked: {p.bookingDate}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance & Strike Record */}
              <div>
                <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Compliance Strike History ({dossierCustomer.strikeCount})</span>
                  {dossierCustomer.strikeCount === 0 ? (
                    <span className="text-emerald-700 font-semibold">No strikes recorded</span>
                  ) : (
                    <span className="text-amber-700 font-semibold">{dossierCustomer.strikeCount} active strikes</span>
                  )}
                </div>

                {dossierCustomer.strikeHistory.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-center">
                    Member is in full compliance with society regulatory codes.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dossierCustomer.strikeHistory.map((s, idx) => (
                      <div
                        key={s.id || idx}
                        className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-amber-900">
                          <span>Strike #{idx + 1}</span>
                          <span className="text-[10px] text-amber-700 font-mono">
                            {new Date(s.assignedAt).toLocaleDateString()} {new Date(s.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-slate-700">{s.reason}</div>
                        <div className="text-[10px] text-slate-500">
                          Assigned by: {s.assignedBy} {s.receiptId ? `• Associated Receipt: ${s.receiptId}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Needs Registration Notice in Dossier */}
              {dossierCustomer.registrationStatus === 'minimal' ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Sub-Admin Quick Booking — Formalities Incomplete</div>
                      <div className="text-[11px] text-amber-800">
                        This member was booked under the 3-field Sub Admin quick flow. Statutory fees, formal membership number, and portal credentials remain pending.
                      </div>
                    </div>
                  </div>
                  {session?.role === 'super_admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        openCompleteRegistration(dossierCustomer);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      Complete Registration
                    </button>
                  )}
                </div>
              ) : dossierCustomer.credentialsPending ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Customer portal credentials have not yet been issued for this member.</span>
                  </div>
                  {canIssueCredentials && (
                    <button
                      type="button"
                      onClick={() => handleIssueCredentials(dossierCustomer)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      Issue Credentials Now
                    </button>
                  )}
                </div>
              ) : null}

              {/* Physical Booking Documents & Scans (Read-Only Mirror in Dossier) */}
              {session && (
                <div className="pt-2">
                  <CustomerDocumentsManager
                    session={session}
                    customerId={dossierCustomer.id}
                    customerName={dossierCustomer.fullName}
                    membershipNo={dossierCustomer.membershipNo}
                    readOnly={true}
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDossierCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ASSIGN STRIKE ── */}
      {strikeCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-2.5 text-amber-900 font-bold">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <span>Assign Compliance Strike</span>
              </div>
              <button
                onClick={() => setStrikeCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignStrike} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-800">{strikeCustomer.fullName}</div>
                <div className="text-slate-500 text-[11px] font-mono">
                  Membership: {strikeCustomer.membershipNo} • Current Strikes: {strikeCustomer.strikeCount}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Strike Infraction Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  placeholder="e.g. Repeated submission of fraudulent bank challan, dishonored cheque, or non-compliance notice..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-xs"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  This infraction will be recorded in the official audit trail and displayed in the member's portal.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStrikeCustomer(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={strikeSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {strikeSubmitting ? 'Recording Strike...' : 'Confirm Strike Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SUSPEND / REACTIVATE ── */}
      {suspensionCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className={`p-5 border-b border-slate-100 flex items-center justify-between ${
              suspensionCustomer.accountStatus === 'suspended' ? 'bg-emerald-50/50 text-emerald-900' : 'bg-rose-50/50 text-rose-900'
            }`}>
              <div className="flex items-center gap-2.5 font-bold">
                {suspensionCustomer.accountStatus === 'suspended' ? (
                  <RotateCcw className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Ban className="w-5 h-5 text-rose-600" />
                )}
                <span>
                  {suspensionCustomer.accountStatus === 'suspended'
                    ? 'Reactivate Customer Portal'
                    : 'Suspend Customer Portal'}
                </span>
              </div>
              <button
                onClick={() => setSuspensionCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleToggleSuspension} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-800">{suspensionCustomer.fullName}</div>
                <div className="text-slate-500 text-[11px] font-mono">
                  Membership: {suspensionCustomer.membershipNo} • Status: {suspensionCustomer.accountStatus.toUpperCase()}
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                {suspensionCustomer.accountStatus === 'suspended'
                  ? 'Reactivating this portal will restore member login credentials and allow new booking operations to resume.'
                  : 'Suspending this portal immediately locks member login and blocks all booking operations until reactivated.'}
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Administrative Reason (Audit Log)
                </label>
                <input
                  type="text"
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder={
                    suspensionCustomer.accountStatus === 'suspended'
                      ? 'e.g. Administrative clearance granted after fine settlement'
                      : 'e.g. Compliance strike hold or pending legal dispute'
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-600 focus:ring-1 focus:ring-slate-600 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSuspensionCustomer(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={suspensionSubmitting}
                  className={`px-4 py-1.5 rounded-xl font-bold text-white transition-colors ${
                    suspensionCustomer.accountStatus === 'suspended'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {suspensionSubmitting
                    ? 'Updating...'
                    : suspensionCustomer.accountStatus === 'suspended'
                    ? 'Confirm Reactivation'
                    : 'Confirm Suspension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PASSWORD RESET SUCCESS ── */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2.5 font-bold text-emerald-900">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <span>Portal Password Reset</span>
            </div>

            <p className="text-slate-600">
              A new administrative password has been generated for Member{' '}
              <strong className="text-slate-900">{resetModalData.customer.fullName}</strong> ({resetModalData.customer.membershipNo}):
            </p>

            <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-center text-sm font-bold tracking-wider select-all">
              {resetModalData.newPassword}
            </div>

            <p className="text-[11px] text-slate-400">
              Please relay these credentials directly to the customer. They will be prompted to update their password upon next login.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setResetModalData(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersDirectoryPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton rows={6} columns={6} />}>
      <CustomersDirectoryContent />
    </Suspense>
  );
}
