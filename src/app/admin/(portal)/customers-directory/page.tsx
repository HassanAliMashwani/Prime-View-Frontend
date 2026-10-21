'use client';

import React, { useEffect, useState, useCallback, Suspense, useRef } from 'react';
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
  FileText,
  Trash2,
  Copy,
  Check,
  Clock,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { AdminTableSkeleton } from '@/components/ui/skeleton';
import { 
  getCustomersDirectory, 
  getAdminCustomerById,
  assignCustomerStrike, 
  toggleCustomerSuspension, 
  resetCustomerPassword, 
  issuePortalCredentials, 
  deleteCustomer,
  CustomerDirectoryEntry,
  CustomerDirectoryPlot
} from '@/lib/dal/customers';
import { AdminSession } from '@/lib/mock/types';
import { formatCnic } from '@/lib/utils/cnic';
import { AdminActionToast } from '@/components/admin/AdminActionToast';
import { toSafeErrorMessage } from '@/lib/safeError';
import { getCache, setCache, generateCacheKey, clearCachePrefix, reconcileItems } from '@/lib/dal/apiCache';
import { AdminTableShell } from '@/components/admin/table/AdminTableShell';
import { runLane1, runLane2, enqueueLane2 } from '@/lib/requestLanes';

import CustomerDocumentsManager from '@/components/admin/documents/CustomerDocumentsManager';
import { BookingAgreementModal, BookingAgreementData } from '@/components/admin/BookingAgreementModal';
import { sortLedgerBills } from '@/lib/utils/ledgerSort';

function formatFeeType(payment: any): string {
  if (payment.feeType === 'plot_downpayment') return 'Downpayment';
  if (payment.feeType === 'plot_possession') return 'Possession Fee';
  if (payment.feeType === 'plot_biannual') return `Bi-Annual #${payment.installmentNumber || ''}`;
  if (payment.feeType === 'plot_installment') return `Monthly #${payment.installmentNumber || ''}`;
  if (payment.feeType === 'plot_one_time') return 'Full Payment';
  return String(payment.feeType || 'Installment').replace(/_/g, ' ').toUpperCase();
}

const PAGE_SIZE = 10;

function CustomersDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCompleteCustId = searchParams?.get('completeCustomer');

  const [mounted, setMounted] = useState<boolean>(false);
  const [session, setSession] = useState<AdminSession | null>(() => (typeof window === 'undefined' ? null : getActiveAdminSession()));
  const isSuperAdmin = (session?.role || (typeof window !== 'undefined' ? getActiveAdminSession()?.role : undefined)) === 'super_admin';
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [customers, setCustomers] = useState<CustomerDirectoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const querySearch = searchParams?.get('search') || searchParams?.get('q') || '';
  const [search, setSearch] = useState<string>(querySearch);
  const [searchInput, setSearchInput] = useState<string>(querySearch);
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs_registration' | 'active' | 'suspended' | 'strikes'>(
    (searchParams?.get('statusFilter') as any) || 'all'
  );
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const reqIdRef = React.useRef(0);

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
  const [copied, setCopied] = useState<boolean>(false);

  // Delete modal state
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState<CustomerDirectoryEntry | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>('');
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);

  // Booking agreement modal state (View Agreement)
  const [agreementModalData, setAgreementModalData] = useState<BookingAgreementData | null>(null);

  const handleOpenAgreement = (cust: CustomerDirectoryEntry | any, plot: CustomerDirectoryPlot | any, bookingDetail?: any) => {
    const savedPlan = plot.installmentPlan || bookingDetail?.installmentPlan;
    const savedPrice = Number(savedPlan?.totalPayment || plot.price || bookingDetail?.plot?.price || 0);

    const agreementData: BookingAgreementData = {
      customer: {
        membershipNo: cust.membershipNo,
        fullName: cust.fullName,
        fatherOrHusbandName: cust.fatherOrHusbandName,
        cnic: cust.cnic,
        phone: cust.phone,
        email: cust.email,
        nokName: cust.nokName,
        mailingAddress: cust.mailingAddress || cust.address,
      },
      plot: {
        plotNumber: plot.plotNumber || bookingDetail?.plot?.plotNumber,
        blockId: plot.blockName || plot.blockId || bookingDetail?.plot?.blockId,
        size: plot.size || bookingDetail?.plot?.size,
        category: plot.category || bookingDetail?.plot?.category,
        price: savedPrice,
      },
      paymentType: plot.paymentType || bookingDetail?.paymentType || 'installment',
      paperRef: plot.paperInstallmentRef || bookingDetail?.paperInstallmentRef,
      bookingDate: plot.bookingDate || (bookingDetail?.bookingDate ? String(bookingDetail.bookingDate).split('T')[0] : undefined),
      installmentPlan: savedPlan,
    };

    setAgreementModalData(agreementData);
  };

  // Pagination state
  const [page, setPage] = useState<number>(parseInt(searchParams?.get('page') || '1', 10));

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    router.push(url.pathname + url.search);
  };

  // Helper to redirect to Customer Booking page to complete registration (CR 07 §5)
  const openCompleteRegistration = (cust: CustomerDirectoryEntry, plotId?: string) => {
    const matched = plotId
      ? cust.plots?.find((p) => p.plotId === plotId || (p as any).id === plotId || p.plotNumber === plotId)
      : cust.plots?.[0];
    const resolvedPlotId = matched?.plotId || (matched as any)?.id || plotId || cust.plots?.[0]?.plotId || (cust.plots?.[0] as any)?.id;
    if (!resolvedPlotId) return;
    const plotNum = matched?.plotNumber || '';
    const block = matched?.blockName || matched?.blockId || '';
    const size = matched?.size || '';
    const price = matched?.price !== undefined ? String(matched.price) : '';
    const name = cust.fullName || '';
    const cnic = cust.cnic || '';
    const phone = cust.phone || '';
    router.push(
      `/admin/customers?completeCustomer=${cust.id}&plotId=${resolvedPlotId}&plotNumber=${encodeURIComponent(plotNum)}&block=${encodeURIComponent(block)}&size=${encodeURIComponent(size)}&price=${encodeURIComponent(price)}&name=${encodeURIComponent(name)}&cnic=${encodeURIComponent(cnic)}&phone=${encodeURIComponent(phone)}`
    );
  };

  // Helper to redirect to Customer Booking page to set payment plan on held plot (Super Admin exclusivity)
  const openSetPaymentPlan = (cust: CustomerDirectoryEntry, plotId: string) => {
    const matched = cust.plots?.find((p) => p.plotId === plotId || (p as any).id === plotId || p.plotNumber === plotId);
    const resolvedPlotId = matched?.plotId || (matched as any)?.id || plotId;
    const plotNum = matched?.plotNumber || '';
    const block = matched?.blockName || matched?.blockId || '';
    const size = matched?.size || '';
    const price = matched?.price !== undefined ? String(matched.price) : '';
    const name = cust.fullName || '';
    const cnic = cust.cnic || '';
    const phone = cust.phone || '';
    router.push(
      `/admin/customers?setPlanCustomer=${cust.id}&plotId=${resolvedPlotId}&plotNumber=${encodeURIComponent(plotNum)}&block=${encodeURIComponent(block)}&size=${encodeURIComponent(size)}&price=${encodeURIComponent(price)}&name=${encodeURIComponent(name)}&cnic=${encodeURIComponent(cnic)}&phone=${encodeURIComponent(phone)}`
    );
  };

  // Detailed plot bills & installment ledger for dossier modal
  const [dossierCustomerDetail, setDossierCustomerDetail] = useState<any | null>(null);
  const [dossierLoadingDetail, setDossierLoadingDetail] = useState<boolean>(false);
  const [expandedPlotId, setExpandedPlotId] = useState<string | null>(null);

  useEffect(() => {
    if (!dossierCustomer) {
      setDossierCustomerDetail(null);
      setExpandedPlotId(null);
      return;
    }
    const curSession = session || getActiveAdminSession();
    if (!curSession) return;
    let isCurrent = true;
    setDossierLoadingDetail(true);
    getAdminCustomerById(curSession, dossierCustomer.id)
      .then((res) => {
        if (isCurrent && res.ok && res.data) {
          setDossierCustomerDetail(res.data);
        }
      })
      .finally(() => {
        if (isCurrent) setDossierLoadingDetail(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [dossierCustomer, session]);

  const openDossierWithPlot = (cust: CustomerDirectoryEntry, plotId?: string) => {
    setDossierCustomer(cust);
    setExpandedPlotId(plotId || null);
  };

  const statusFilterRef = useRef(statusFilter);
  useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);

  const handleStatusFilterChange = (newStatus: 'all' | 'needs_registration' | 'active' | 'suspended' | 'strikes') => {
    if (newStatus === statusFilter) return;
    setStatusFilter(newStatus);
    statusFilterRef.current = newStatus;
    setPage(1);
    const s = session || getActiveAdminSession();
    if (s) {
      const adminId = s.adminId || 'admin';
      const key = `/customers:v2:${adminId}:page=1:size=${PAGE_SIZE}:search=${search}:status=${newStatus}`;
      const cached = getCache<{ customers: CustomerDirectoryEntry[], total: number }>(key, true);
      if (cached) {
        setCustomers(cached.customers);
        setTotalRecords(cached.total);
        setLoading(false);
      } else {
        setLoading(true);
      }
      loadData(s, 1, search, newStatus, false);
    }
  };

  const loadData = useCallback(async (currentSession: AdminSession, pageParam = 1, searchParam = '', statusParam = 'all', background = false) => {
    const reqId = ++reqIdRef.current;
    const adminId = currentSession.adminId || 'admin';
    const key = `/customers:v2:${adminId}:page=${pageParam}:size=${PAGE_SIZE}:search=${searchParam}:status=${statusParam}`;

    if (!background) {
      const cached = getCache<{ customers: CustomerDirectoryEntry[], total: number }>(key, true);
      if (cached) {
        setCustomers(cached.customers);
        setTotalRecords(cached.total);
        setLoading(false);
      } else {
        setLoading(true);
      }
    }

    const fetcher = async (signal?: AbortSignal) => {
      return await getCustomersDirectory(currentSession, { page: pageParam, pageSize: PAGE_SIZE, search: searchParam, status: statusParam }, signal);
    };

    try {
      let res: any;
      if (background) {
        res = await runLane2({
          screen: 'customers-directory',
          key,
          isRefresh: true,
          fn: fetcher,
        });
      } else {
        res = await runLane1({
          screen: 'customers-directory',
          key,
          fn: fetcher,
        });
      }

      if (!res || reqId !== reqIdRef.current || statusParam !== statusFilterRef.current) return;
      if (res.error === 'REQUEST_ABORTED') return;
      if (!res.ok) {
        const errorMsg = toSafeErrorMessage(res.message || res.error || 'Failed to refresh customer directory.');
        setCustomers((prev) => {
          if (prev.length > 0) {
            setFeedback({ type: 'error', message: errorMsg });
            return prev;
          }
          setError(errorMsg);
          return [];
        });
      } else {
        if (res.customers.length === 0) {
          setCustomers([]);
        } else {
          setCustomers(res.customers);
        }
        setTotalRecords(res.total || 0);
        setCache(key, { customers: res.customers, total: res.total || 0 });
        setError(null);

        // Prefetch next page into cache if next page exists using Lane 2
        const totalPages = Math.ceil((res.total || 0) / PAGE_SIZE);
        if (pageParam < totalPages) {
          const nextPage = pageParam + 1;
          const nextKey = `/customers:v2:${adminId}:page=${nextPage}:size=${PAGE_SIZE}:search=${searchParam}:status=${statusParam}`;
          if (!getCache(nextKey, false)) {
            enqueueLane2(
              async (signal) => {
                const nextRes = await getCustomersDirectory(currentSession, { page: nextPage, pageSize: PAGE_SIZE, search: searchParam, status: statusParam }, signal);
                if (nextRes.ok) {
                  setCache(nextKey, { customers: nextRes.customers, total: nextRes.total || 0 });
                }
                return nextRes;
              },
              nextKey,
              'customers-directory'
            );
          }
        }
      }
    } catch (err: any) {
      if (err?.message === 'REQUEST_SUPERSEDED') return;
      if (reqId !== reqIdRef.current) return;
      console.error('request failed', err);
      const errorMsg = toSafeErrorMessage(err?.message || 'Failed to load customer directory.');
      setCustomers((prev) => {
        if (prev.length > 0) {
          setFeedback({ type: 'error', message: errorMsg });
          return prev;
        }
        setError(errorMsg);
        return [];
      });
    } finally {
      if (reqId === reqIdRef.current) {
        setHasLoadedOnce(true);
        if (!background) setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput);
        setPage(1);
        const s = session || getActiveAdminSession();
        if (s) {
          loadData(s, 1, searchInput, statusFilterRef.current, false);
        }
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput, search, session, loadData]);

  useEffect(() => {
    setMounted(true);
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);
    loadData(cur, page, search, statusFilter, false);

    const isFiltered = search !== '' || statusFilter !== 'all';
    
    // Auto-refresh customer directory every 30 seconds (only if not filtered) using Lane 2
    if (!isFiltered) {
      const intervalId = setInterval(() => {
        const latestSession = getActiveAdminSession();
        if (latestSession && reqIdRef.current) {
          loadData(latestSession, page, search, statusFilter, true);
        }
      }, 30000);
      return () => clearInterval(intervalId);
    }
  }, [router, loadData, page]);

  // Flash feedback auto-clear (8s)
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle Assign Strike Submit
  const handleAssignStrike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !strikeCustomer) return;
    setStrikeSubmitting(true);

    const res = await runLane1({
      screen: 'customers-directory',
      isSave: true,
      fn: async () => assignCustomerStrike(session, {
        customerId: strikeCustomer.id,
        reason: strikeReason,
      }),
    });
    setStrikeSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', message: toSafeErrorMessage(res.message || res.error || 'Failed to assign strike.') });
    } else {
      setFeedback({
        type: 'success',
        message: `Strike assigned successfully to ${strikeCustomer.fullName}. Total strikes: ${(strikeCustomer.strikeCount || 0) + 1}`,
      });
      setStrikeCustomer(null);
      setStrikeReason('');
      clearCachePrefix('GET:/customers');
      loadData(session, page, search, statusFilter, false);
    }
  };

  // Handle Suspension Toggle Submit
  const handleToggleSuspension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !suspensionCustomer) return;
    setSuspensionSubmitting(true);

    const targetAction = suspensionCustomer.accountStatus === 'suspended' ? 'activate' : 'suspend';
    const res = await runLane1({
      screen: 'customers-directory',
      isSave: true,
      fn: async () => toggleCustomerSuspension(session, suspensionCustomer.id, targetAction, suspensionReason),
    });
    setSuspensionSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', message: toSafeErrorMessage(res.message || res.error || 'Failed to update suspension status.') });
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
      clearCachePrefix('GET:/customers');
      loadData(session, page, search, statusFilter, false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (cust: CustomerDirectoryEntry) => {
    if (!session) return;
    setResetSubmitting(true);

    const res = await runLane1({
      screen: 'customers-directory',
      isSave: true,
      fn: async () => resetCustomerPassword(session, cust.id),
    });
    setResetSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', message: toSafeErrorMessage(res.message || res.error || 'Failed to reset password.') });
    } else if (!res.newPassword) {
      setFeedback({ type: 'error', message: 'Password reset returned empty credentials.' });
    } else {
      setCopied(false);
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
  const hasCustomerAccess = session?.role === 'super_admin' || Boolean(
    session?.permissions?.can_create_customer && session?.permissions?.can_view_customers
  );
  const canIssueCredentials = hasCustomerAccess;

  const handleIssueCredentials = async (cust: CustomerDirectoryEntry) => {
    if (!session) return;
    setResetSubmitting(true);
    const res = await runLane1({
      screen: 'customers-directory',
      isSave: true,
      fn: async () => issuePortalCredentials(session, cust.id),
    });
    setResetSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', message: res.message || res.error || 'Failed to issue portal credentials.' });
    } else if (!res.password) {
      setFeedback({ type: 'error', message: 'Credential issuance returned empty credentials.' });
    } else {
      setCopied(false);
      setResetModalData({
        customer: cust,
        newPassword: res.password,
      });
      setFeedback({
        type: 'success',
        message: `Customer portal credentials issued successfully for ${cust.fullName} (${cust.membershipNo}).`,
      });
      await loadData(session, page, search, statusFilter, false);
      if (dossierCustomer && dossierCustomer.id === cust.id) {
        setDossierCustomer({ ...dossierCustomer, credentialsPending: false });
      }
    }
  };

  // Browser filter removed (filtering is done server-side)

  // Pagination logic
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = customers;
  const from = totalRecords === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, totalRecords);

  if (session && !hasCustomerAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Customer Directory</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your administrative account does not have permission to view the customer directory. Contact administration to adjust your privileges.
        </p>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (error && customers.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
          <div className="flex items-center gap-3 font-bold text-base mb-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Access Restricted</span>
          </div>
          <p className="text-sm text-rose-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => {
              if (session) {
                setLoading(true);
                loadData(session);
              }
            }}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const needsRegistrationCount = (customers || []).filter(
    (c) => c.registrationStatus === 'minimal'
  ).length;
  const activeCount = (customers || []).filter(
    (c) => c.accountStatus === 'active'
  ).length;
  const withStrikesCount = (customers || []).filter(
    (c) => (c.strikeCount ?? 0) > 0
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 -mt-3 md:-mt-5 lg:-mt-6">
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
          {!mounted || !session ? null : session.role !== 'super_admin' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Block Scoped: {session?.assignedBlocks?.join(', ').toUpperCase()}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Society-Wide Access (All 7 Blocks)</span>
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards removed as pagination applies server side */}

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          {loading && Boolean(searchInput.trim()) ? (
            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute left-3 top-2.5" />
          ) : (
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          )}
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by Name, Membership #, CNIC, Plot..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            id="filter-all"
            type="button"
            onClick={() => handleStatusFilterChange('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Members
          </button>
          <button
            id="filter-needs-reg"
            type="button"
            onClick={() => handleStatusFilterChange('needs_registration')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'needs_registration'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
            }`}
          >
            Needs Registration
          </button>
          <button
            id="filter-active"
            type="button"
            onClick={() => handleStatusFilterChange('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Active
          </button>
          <button
            id="filter-suspended"
            type="button"
            onClick={() => handleStatusFilterChange('suspended')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'suspended'
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Suspended
          </button>
          <button
            id="filter-strikes"
            type="button"
            onClick={() => handleStatusFilterChange('strikes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'strikes'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Has Strikes
          </button>
        </div>
      </div>

      {/* Mobile Stacked Cards (< 768px) */}
      <div className="md:hidden space-y-3">
        {loading && customers.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 animate-pulse">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
          ))
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            No customers found matching the search or filter criteria.
          </div>
        ) : (
          pageRows.map((c) => {
            const hasStrikes = c.strikeCount > 0;
            const isSuspended = c.accountStatus === 'suspended';

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                {/* 1. Member Info */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    {(() => {
                      const memberAvatar = c.applicantPhotoUrl || null;
                      if (memberAvatar) {
                        return (
                          <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200/90 shadow-xs shrink-0 ring-1 ring-slate-900/5 bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={memberAvatar}
                              alt={c.fullName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        );
                      }
                      return (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-800 to-slate-900 text-[#D4AF37] font-bold flex items-center justify-center text-xs shrink-0 shadow-xs border border-emerald-700/50">
                          {c.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      );
                    })()}
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
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
                </div>

                {/* 2. Contact Details */}
                <div className="space-y-1 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contact Details</div>
                  <div className="flex items-center gap-1.5 text-slate-700 font-mono text-xs">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.phone || 'Pending'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.email || 'Pending'}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    CNIC: {c.cnic}
                  </div>
                </div>

                {/* 3. Allotted Properties */}
                <div className="space-y-1 text-xs border-t border-slate-100 pt-2.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Allotted Properties</div>
                  {c.plots.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No plots attached</span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {c.plots.map((p) => {
                        const isHeld = p.hasPaymentPlan === false || (p.billsCount !== undefined && p.billsCount === 0);
                        return (
                          <div
                            key={p.bookingId || p.plotId}
                            className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition-all ${
                              isHeld
                                ? 'bg-amber-50/80 border-amber-200'
                                : 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Building2 className={`w-3.5 h-3.5 ${isHeld ? 'text-amber-600' : 'text-indigo-600'} shrink-0`} />
                              <div className="font-semibold text-xs text-slate-800 truncate">
                                <span>{p.blockName}: {p.plotNumber}</span>
                                <span className={`ml-1 text-[10px] ${isHeld ? 'text-amber-700' : 'text-indigo-600/80'}`}>({p.size})</span>
                              </div>
                              {isHeld ? (
                                <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-950 uppercase shrink-0">
                                  Held
                                </span>
                              ) : (
                                <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-900 uppercase shrink-0">
                                  Active
                                </span>
                              )}
                            </div>

                            {/* Dedicated payment button per plot */}
                            <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
                              {isHeld ? (
                                c.registrationStatus === 'minimal' ? (
                                  <button
                                    type="button"
                                    onClick={() => openCompleteRegistration(c, p.plotId || (p as any).id)}
                                    title="Complete registration to configure payment plan"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                  >
                                    <CreditCard className="w-3 h-3" />
                                    <span>Set payment plan</span>
                                  </button>
                                ) : (isSuperAdmin || (session?.role === 'sub_admin' && Boolean(session?.permissions?.can_book) && Array.isArray(session?.assignedBlocks) && session.assignedBlocks.includes(p.blockId))) ? (
                                  <button
                                    type="button"
                                    onClick={() => openSetPaymentPlan(c, p.plotId || (p as any).id)}
                                    title="Set Payment Plan"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                  >
                                    <CreditCard className="w-3 h-3" />
                                    <span>Set payment plan</span>
                                  </button>
                                ) : (
                                  <span
                                    title="Plan pending assignment"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-medium text-[10px] border border-slate-200"
                                  >
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>Plan Pending</span>
                                  </span>
                                )
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openDossierWithPlot(c, p.plotId || (p as any).id)}
                                  title="View payment plan and schedule details"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                >
                                  <FileText className="w-3 h-3 text-indigo-600" />
                                  <span>View payment plan</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Compliance Status */}
                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
                  {c.registrationStatus === 'minimal' ? (
                    hasCustomerAccess ? (
                      <button
                        type="button"
                        onClick={() => openCompleteRegistration(c, c.plots?.[0]?.plotId || (c.plots?.[0] as any)?.id)}
                        title="Needs registration — Click to Complete Registration"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        <span>Needs registration</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        <span>Needs registration</span>
                      </span>
                    )
                  ) : !c.credentialsPending ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Portal issued</span>
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold" title={c.strikeHistory?.[0]?.reason}>
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{c.strikeHistory?.[0]?.reason || `${c.strikeCount} Strike${c.strikeCount > 1 ? 's' : ''}`}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Clean Record</span>
                  )}
                </div>

                {/* 7. Actions */}
                <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-2.5 flex-wrap">
                  {c.registrationStatus === 'minimal' && hasCustomerAccess && (
                    <button
                      onClick={() => openCompleteRegistration(c, c.plots?.[0]?.plotId || (c.plots?.[0] as any)?.id)}
                      title="Complete Member Registration"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer mr-auto"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Complete Registration</span>
                    </button>
                  )}


                  <button
                    onClick={() => setDossierCustomer(c)}
                    title="View Full Customer Dossier"
                    className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setStrikeCustomer(c);
                      setStrikeReason('');
                    }}
                    title="Assign Compliance Strike"
                    className="p-2 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setSuspensionCustomer(c);
                      setSuspensionReason('');
                    }}
                    title={isSuspended ? 'Reactivate Customer Portal' : 'Suspend Customer Portal'}
                    className={`p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer ${
                      isSuspended
                        ? 'text-emerald-700 hover:bg-emerald-50'
                        : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    {isSuspended ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </button>

                  {c.registrationStatus !== 'minimal' && Boolean(c.membershipNo && c.membershipNo !== 'PENDING') && c.credentialsPending && canIssueCredentials && (
                    <button
                      onClick={() => handleIssueCredentials(c)}
                      title="Issue Customer Portal Credentials"
                      className="p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors font-bold min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-amber-700" />
                    </button>
                  )}

                  <button
                    onClick={() => handleResetPassword(c)}
                    title="Reset Portal Password"
                    className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>

                  {session?.role === 'super_admin' && (
                    <button
                      onClick={() => {
                        setDeleteCustomerTarget(c);
                        setDeleteConfirmInput('');
                      }}
                      title="Delete Member"
                      className="p-2 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customers Table (Desktop >= 768px) */}
      <div className="hidden md:block">
        <AdminTableShell page={page} pageSize={PAGE_SIZE} total={totalRecords} onPageChange={handlePageChange} loading={loading} minWidthClass="min-w-[860px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4 bg-slate-50 min-w-[220px]">Member Info</th>
              <th className="py-3.5 px-4 bg-slate-50 min-w-[190px]">Contact Details</th>
              <th className="py-3.5 px-4 bg-slate-50 min-w-[280px]">Allotted Properties</th>
              <th className="py-3.5 px-4 bg-slate-50 min-w-[140px]">Compliance Status</th>
              <th className="py-3.5 px-4 text-right bg-slate-50 min-w-[70px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading && customers.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 px-4 min-w-[220px]"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                  <td className="py-3.5 px-4 min-w-[190px]"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                  <td className="py-3.5 px-4 min-w-[280px]"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                  <td className="py-3.5 px-4 min-w-[140px]"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                  <td className="py-3.5 px-4 text-right min-w-[70px]"><div className="h-6 w-12 bg-slate-200 rounded ml-auto" /></td>
                </tr>
              ))
            ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No customers found matching the search or filter criteria.
                  </td>
                </tr>
              ) : (
                pageRows.map((c) => {
                  const hasStrikes = c.strikeCount > 0;
                  const isSuspended = c.accountStatus === 'suspended';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Member Info */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const memberAvatar = c.applicantPhotoUrl || null;
                            if (memberAvatar) {
                              return (
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200/90 shadow-xs shrink-0 ring-1 ring-slate-900/5 bg-white">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={memberAvatar}
                                    alt={c.fullName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              );
                            }
                            return (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-slate-900 text-[#D4AF37] font-bold flex items-center justify-center text-xs shrink-0 shadow-xs border border-emerald-700/50">
                                {c.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                            );
                          })()}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5 whitespace-nowrap">
                              <span>{c.fullName}</span>
                              {c.registrationStatus === 'minimal' && (
                                <span className="px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300 shrink-0">
                                  NEEDS REG
                                </span>
                              )}
                              {isSuspended && (
                                <span className="px-1.5 py-0.5 rounded-sm bg-rose-100 text-rose-800 text-[10px] font-bold shrink-0">
                                  SUSPENDED
                                </span>
                              )}
                            </div>
                            {c.registrationStatus === 'minimal' ? (
                              <div className="text-[11px] font-mono text-amber-700 font-bold whitespace-nowrap mt-0.5">
                                PENDING REGISTRATION
                              </div>
                            ) : (
                              <div className="text-[11px] font-mono text-emerald-800 font-semibold whitespace-nowrap mt-0.5">
                                {c.membershipNo}
                              </div>
                            )}
                            {c.city && (
                              <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap mt-0.5">
                                City: {c.city}
                              </div>
                            )}
                            {c.fatherOrHusbandName && (
                              <div className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
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
                          <div className="flex flex-col gap-1.5 min-w-[280px] max-w-sm">
                            {c.plots.map((p) => {
                              const isHeld = p.hasPaymentPlan === false || (p.billsCount !== undefined && p.billsCount === 0);
                              return (
                                <div
                                  key={p.bookingId || p.plotId}
                                  className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${
                                    isHeld
                                      ? 'bg-amber-50/80 border-amber-200 hover:border-amber-300'
                                      : 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Building2 className={`w-3.5 h-3.5 ${isHeld ? 'text-amber-600' : 'text-indigo-600'} shrink-0`} />
                                    <span className="font-semibold text-[11px] text-slate-800 truncate">
                                      {p.blockName}: {p.plotNumber}
                                    </span>
                                    <span className={`text-[10px] shrink-0 ${isHeld ? 'text-amber-700' : 'text-indigo-600/80'}`}>
                                      ({p.size})
                                    </span>
                                    {isHeld ? (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-950 uppercase shrink-0">
                                        Held
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-900 uppercase shrink-0">
                                        Active
                                      </span>
                                    )}
                                  </div>

                                  {/* Dedicated payment button per plot */}
                                  <div className="shrink-0 flex items-center gap-1.5">
                                    {isHeld ? (
                                      c.registrationStatus === 'minimal' ? (
                                        <button
                                          type="button"
                                          onClick={() => openCompleteRegistration(c, p.plotId || (p as any).id)}
                                          title="Complete registration to configure payment plan"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer transition-colors whitespace-nowrap"
                                        >
                                          <CreditCard className="w-2.5 h-2.5" />
                                          <span>Set payment plan</span>
                                        </button>
                                      ) : isSuperAdmin || (session?.role === 'sub_admin' && Boolean(session?.permissions?.can_book) && Array.isArray(session?.assignedBlocks) && session.assignedBlocks.includes(p.blockId)) ? (
                                        <button
                                          type="button"
                                          onClick={() => openSetPaymentPlan(c, p.plotId || (p as any).id)}
                                          title="Set Payment Plan"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer transition-colors whitespace-nowrap"
                                        >
                                          <CreditCard className="w-2.5 h-2.5" />
                                          <span>Set payment plan</span>
                                        </button>
                                      ) : (
                                        <span
                                          title="Only Super Admin or authorized Sub-Admin can assign payment plans"
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium text-[9px] border border-slate-200"
                                        >
                                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                                          <span>Plan Pending</span>
                                        </span>
                                      )
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => openDossierWithPlot(c, p.plotId || (p as any).id)}
                                        title="View payment plan and schedule details"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded font-bold text-[10px] shadow-xs cursor-pointer transition-colors whitespace-nowrap"
                                      >
                                        <FileText className="w-2.5 h-2.5 text-indigo-600" />
                                        <span>View payment plan</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Compliance Status & Strikes */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          {c.registrationStatus === 'minimal' ? (
                            hasCustomerAccess ? (
                              <button
                                type="button"
                                onClick={() => openCompleteRegistration(c, c.plots?.[0]?.plotId || (c.plots?.[0] as any)?.id)}
                                title="Needs registration — Click to Complete Registration"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors cursor-pointer"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-700" />
                                <span>Needs registration</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-700" />
                                <span>Needs registration</span>
                              </span>
                            )
                          ) : !c.credentialsPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Portal issued</span>
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold max-w-[200px]" title={c.strikeHistory?.[0]?.reason}>
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="truncate">{c.strikeHistory?.[0]?.reason || `${c.strikeCount} Strike${c.strikeCount > 1 ? 's' : ''}`}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Clean Record</span>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {c.registrationStatus === 'minimal' && hasCustomerAccess && (
                            <button
                              onClick={() => openCompleteRegistration(c, c.plots?.[0]?.plotId || (c.plots?.[0] as any)?.id)}
                              title="Complete Member Registration"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer mr-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Complete Registration</span>
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

                          {c.registrationStatus !== 'minimal' && Boolean(c.membershipNo && c.membershipNo !== 'PENDING') && c.credentialsPending && canIssueCredentials && (
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
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {session?.role === 'super_admin' && (
                            <button
                              onClick={() => {
                                setDeleteCustomerTarget(c);
                                setDeleteConfirmInput('');
                              }}
                              title="Delete Member"
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
        </AdminTableShell>
      </div>

      {/* ── MODAL: CUSTOMER DOSSIER ── */}
      {dossierCustomer && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDossierCustomer(null);
          }}
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                {(() => {
                  const memberAvatar = dossierCustomer.applicantPhotoUrl || null;
                  if (memberAvatar) {
                    return (
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200/90 shadow-xs shrink-0 ring-1 ring-slate-900/5 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={memberAvatar}
                          alt={dossierCustomer.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  }
                  return (
                    <div className="w-10 h-10 rounded-xl bg-emerald-900 text-[#D4AF37] font-bold flex items-center justify-center text-sm shadow-xs">
                      {dossierCustomer.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span>{dossierCustomer.fullName}</span>
                    {dossierCustomer.registrationStatus === 'minimal' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                        Needs registration
                      </span>
                    ) : !dossierCustomer.credentialsPending ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Portal issued
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Credentials Pending
                      </span>
                    )}
                  </h3>
                  <div className="text-xs font-mono text-emerald-800 font-semibold">
                    Membership: {dossierCustomer.membershipNo} • Account: {dossierCustomer.accountStatus.toUpperCase()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDossierCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto text-xs flex-1 min-h-0">
              {/* Member & NOK Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
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
                    <div><span className="text-slate-400">Name:</span> {dossierCustomer.nokName || (dossierCustomerDetail as any)?.nokName || 'Not recorded'}</div>
                    <div><span className="text-slate-400">CNIC:</span> {(dossierCustomer.nokCnic || (dossierCustomerDetail as any)?.nokCnic) ? formatCnic(dossierCustomer.nokCnic || (dossierCustomerDetail as any)?.nokCnic) : 'Not recorded'}</div>
                    <div><span className="text-slate-400">Registration Date:</span> {dossierCustomer.createdDate || (dossierCustomerDetail as any)?.createdDate}</div>
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
                <div className="space-y-3">
                  {dossierCustomer.plots.map((p) => {
                    const isHeld = p.hasPaymentPlan === false || p.billsCount === 0;
                    const isSuperAdmin = (session?.role || getActiveAdminSession()?.role) === 'super_admin';
                    const plotKey = p.plotId || (p as any).id || p.bookingId;
                    const booking = dossierCustomerDetail?.bookings?.find(
                      (b: any) => b.id === p.bookingId || b.plotId === p.plotId || b.plot?.plotNumber === p.plotNumber
                    );
                    const payments: any[] = sortLedgerBills(booking?.payments || []);
                    const isExpanded = expandedPlotId === plotKey || expandedPlotId === p.plotId || expandedPlotId === p.bookingId;
                    const plotPaid = payments.reduce((sum: number, pay: any) => sum + (Number(pay.paidAmount) || 0), 0);
                    const plotRemaining = Math.max(0, p.price - plotPaid);
                    const paidBillsCount = payments.filter((pay: any) => pay.status === 'paid').length;
                    const dueBillsCount = payments.filter((pay: any) => pay.status === 'pending' || pay.status === 'overdue').length;

                    return (
                      <div
                        key={p.bookingId}
                        className={`p-3.5 sm:p-4 rounded-xl border space-y-3 transition-all ${
                          isHeld ? 'bg-amber-50/70 border-amber-300 shadow-xs' : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                              <span>{p.blockName} • Plot {p.plotNumber}</span>
                              {isHeld ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-400 uppercase tracking-wide">
                                  HELD • PENDING PLAN
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 uppercase tracking-wide">
                                  PLAN ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              {p.size} • {p.category.toUpperCase()} • Scheme:{' '}
                              <strong className={isHeld ? 'text-amber-800' : 'text-slate-700'}>
                                {isHeld ? 'Awaiting Super Admin Assignment' : p.paymentType === 'installment' ? 'Installments' : 'Full Payment'}
                              </strong>
                            </div>
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <div className="font-bold font-mono text-slate-900 text-sm">PKR {p.price.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">Booked: {p.bookingDate}</div>
                            {p.bookingId && (dossierCustomer.registrationStatus !== 'minimal' || !isHeld) && (
                              <div className="pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAgreement({ ...dossierCustomer, ...dossierCustomerDetail }, p, booking)}
                                  title="View Official Booking Agreement"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <FileText className="w-3 h-3 text-amber-700" />
                                  <span>View Agreement</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Set Payment Plan Action Row for Super Admin or Sub-Admin on Registered Member */}
                        {isHeld && dossierCustomer.registrationStatus !== 'minimal' && (isSuperAdmin || (session?.role === 'sub_admin' && Boolean(session?.permissions?.can_book) && Array.isArray(session?.assignedBlocks) && session.assignedBlocks.includes(p.blockId))) && (
                          <div className="pt-2.5 border-t border-amber-200/90 flex items-center justify-between gap-3 flex-wrap bg-amber-100/50 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
                            <div className="flex items-center gap-1.5 text-amber-900 text-xs font-semibold">
                              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Held plot with zero bills. Payment plan configuration required.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setDossierCustomer(null);
                                openSetPaymentPlan(dossierCustomer, p.plotId || (p as any).id);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Set payment plan</span>
                            </button>
                          </div>
                        )}

                        {/* Complete Registration Action Row for Minimal Member */}
                        {isHeld && dossierCustomer.registrationStatus === 'minimal' && (
                          <div className="pt-2.5 border-t border-amber-200/90 flex items-center justify-between gap-3 flex-wrap bg-amber-100/50 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
                            <div className="flex items-center gap-1.5 text-amber-900 text-xs font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Initial registration required before setting payment plan.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setDossierCustomer(null);
                                openCompleteRegistration(dossierCustomer, p.plotId || (p as any).id);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Set payment plan</span>
                            </button>
                          </div>
                        )}

                        {/* Active Plot Ledger Controls */}
                        {!isHeld && (
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 text-xs flex-wrap">
                              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{p.paymentType === 'installment' ? 'Installment Schedule Assigned' : 'Full Payment'}</span>
                              </div>
                              {payments.length > 0 && (
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                  {paidBillsCount} Paid / {payments.length} Total
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setExpandedPlotId(isExpanded ? null : plotKey)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{isExpanded ? 'Hide Installment Ledger' : 'View Installment Ledger'}</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Expanded Installment Ledger for this specific plot */}
                        {!isHeld && isExpanded && (
                          <div className="mt-2.5 pt-3 border-t border-slate-200 space-y-3 bg-slate-50/70 -mx-3.5 -mb-3.5 sm:-mx-4 sm:-mb-4 p-3.5 sm:p-4 rounded-b-xl">
                            {dossierLoadingDetail ? (
                              <div className="p-4 flex items-center justify-center gap-2 text-slate-500 text-xs">
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                <span>Loading plot installment ledger...</span>
                              </div>
                            ) : payments.length === 0 ? (
                              <div className="p-3 text-center text-slate-500 italic text-xs bg-white border border-slate-200 rounded-lg">
                                Installment schedule records are currently being finalized by accounts.
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Plot Price</span>
                                    <span className="font-mono font-bold text-slate-900 text-xs">PKR {p.price.toLocaleString()}</span>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Paid</span>
                                    <span className="font-mono font-bold text-emerald-700 text-xs">PKR {plotPaid.toLocaleString()}</span>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Remaining Due</span>
                                    <span className="font-mono font-bold text-amber-800 text-xs">PKR {plotRemaining.toLocaleString()}</span>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Installments</span>
                                    <span className="font-mono font-bold text-slate-700 text-xs">{paidBillsCount} Paid • {dueBillsCount} Due</span>
                                  </div>
                                </div>

                                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-2xs">
                                  <table className="w-full text-[11px] text-left">
                                    <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                                      <tr>
                                        <th className="py-2 px-2.5">Installment / Fee</th>
                                        <th className="py-2 px-2.5">Due Date</th>
                                        <th className="py-2 px-2.5 text-right">Amount</th>
                                        <th className="py-2 px-2.5 text-right">Paid</th>
                                        <th className="py-2 px-2.5 text-center">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {payments.map((pay: any, idx: number) => {
                                        const isPaid = pay.status === 'paid';
                                        const isOverdue = pay.status === 'overdue';
                                        const label = formatFeeType(pay);
                                        return (
                                          <tr key={pay.id || idx} className="hover:bg-slate-50/80">
                                            <td className="py-1.5 px-2.5 font-medium text-slate-800">
                                              {label}
                                            </td>
                                            <td className="py-1.5 px-2.5 font-mono text-slate-600">
                                              {pay.dueDate ? String(pay.dueDate).split('T')[0] : '—'}
                                            </td>
                                            <td className="py-1.5 px-2.5 font-mono text-slate-900 font-semibold text-right">
                                              PKR {Number(pay.amount).toLocaleString()}
                                            </td>
                                            <td className="py-1.5 px-2.5 font-mono text-emerald-700 font-semibold text-right">
                                              PKR {Number(pay.paidAmount || 0).toLocaleString()}
                                            </td>
                                            <td className="py-1.5 px-2.5 text-center">
                                              <span
                                                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                  isPaid
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                    : isOverdue
                                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                                }`}
                                              >
                                                {pay.status || 'pending'}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                      <div className="font-bold text-xs">Admin Quick Booking — Formalities Incomplete</div>
                      <div className="text-[11px] text-amber-800">
                        This member was booked under the 3-field Admin quick flow. Formal membership number and portal credentials remain pending.
                      </div>
                    </div>
                  </div>
                  {hasCustomerAccess && (
                    <button
                      type="button"
                      onClick={() => {
                        openCompleteRegistration(dossierCustomer, expandedPlotId || dossierCustomer.plots?.[0]?.plotId || (dossierCustomer.plots?.[0] as any)?.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      Complete Registration
                    </button>
                  )}
                </div>
              ) : (Boolean(dossierCustomer.membershipNo && dossierCustomer.membershipNo !== 'PENDING') && dossierCustomer.credentialsPending) ? (
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

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              {session?.role === 'super_admin' ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteCustomerTarget(dossierCustomer);
                    setDeleteConfirmInput('');
                  }}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Member</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setDossierCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
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
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[100dvh] overflow-y-auto">
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
                  className="px-4 py-1.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors min-w-[170px] flex items-center justify-center gap-1.5"
                >
                  {strikeSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <span>Confirm Strike Assignment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SUSPEND / REACTIVATE ── */}
      {suspensionCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[100dvh] overflow-y-auto">
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
                  className={`px-4 py-1.5 rounded-xl font-bold text-white transition-colors min-w-[160px] flex items-center justify-center gap-1.5 ${
                    suspensionCustomer.accountStatus === 'suspended'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {suspensionSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Saving…</span>
                    </>
                  ) : suspensionCustomer.accountStatus === 'suspended' ? (
                    <span>Confirm Reactivation</span>
                  ) : (
                    <span>Confirm Suspension</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PASSWORD RESET / CREDENTIALS SUCCESS ── */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 space-y-4 text-xs max-h-[100dvh] overflow-y-auto">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <div className="flex items-center gap-2 text-emerald-900">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <span>Portal Credentials</span>
              </div>
              <button
                onClick={() => setResetModalData(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              Administrative credentials generated for Member{' '}
              <strong className="text-slate-900">{resetModalData.customer.fullName}</strong>:
            </p>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Username:</span>
                <span className="font-mono font-bold text-slate-900 select-all">
                  {resetModalData.customer.membershipNo}
                </span>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 font-medium mb-1">Password:</div>
                <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-center text-sm font-bold tracking-wider select-all break-all">
                  {resetModalData.newPassword}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const text = `Username: ${resetModalData.customer.membershipNo}\nPassword: ${resetModalData.newPassword}`;
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Credentials</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setResetModalData(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

            <p className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 p-2.5 rounded-xl leading-relaxed">
              There is no default password. This password is shown once. Give it to the member. They should change it after login.
            </p>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM DELETE MEMBER ── */}
      {deleteCustomerTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden text-xs max-h-[100dvh] overflow-y-auto">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/60 text-rose-900 font-bold">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <span className="text-sm">Delete Member Account</span>
              </div>
              <button
                onClick={() => setDeleteCustomerTarget(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-slate-600 leading-relaxed">
                Warning: This action will permanently remove <strong className="text-slate-900">{deleteCustomerTarget.fullName}</strong> and their account records from Prime View.
              </p>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold">Required Conditions:</div>
                <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                  <li>Member must not hold any active booked or allotted plots.</li>
                  <li>Member must have zero payment ledger history (no paid installments or verified receipts).</li>
                </ul>
              </div>

              {(() => {
                const requiredConfirm = (deleteCustomerTarget.membershipNo && deleteCustomerTarget.membershipNo !== 'PENDING')
                  ? deleteCustomerTarget.membershipNo
                  : (deleteCustomerTarget.fullName || 'DELETE');
                const isConfirmed = deleteConfirmInput.trim().toLowerCase() === requiredConfirm.trim().toLowerCase();

                return (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        To confirm, please type {(deleteCustomerTarget.membershipNo && deleteCustomerTarget.membershipNo !== 'PENDING') ? 'membership number' : 'member name'}{' '}
                        <span className="font-mono font-bold text-slate-900">{requiredConfirm}</span>:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmInput}
                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                        placeholder={requiredConfirm}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-hidden focus:border-rose-600 focus:ring-1 focus:ring-rose-600 text-xs"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setDeleteCustomerTarget(null)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!isConfirmed || deleteSubmitting}
                        onClick={async () => {
                          if (!session || !deleteCustomerTarget) return;
                          setDeleteSubmitting(true);
                          const target = deleteCustomerTarget;
                          const res = await runLane1({
                            screen: 'customers-directory',
                            isSave: true,
                            fn: async () => deleteCustomer(session, target.id),
                          });
                          setDeleteSubmitting(false);
                          setDeleteCustomerTarget(null);
                          if (!res.ok) {
                            setFeedback({ type: 'error', message: toSafeErrorMessage(res.message || res.error || 'Failed to delete member.') });
                          } else {
                            setFeedback({ type: 'success', message: `Member ${target.fullName} deleted successfully.` });
                            if (dossierCustomer?.id === target.id) {
                              setDossierCustomer(null);
                            }
                            loadData(session, page, search, statusFilter, false);
                          }
                        }}
                        className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer min-w-[130px] flex items-center justify-center gap-1.5"
                      >
                        {deleteSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                            <span>Deleting…</span>
                          </>
                        ) : (
                          <span>Delete Member</span>
                        )}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Booking Agreement Modal (Printable Official Agreement Document) */}
      <BookingAgreementModal
        open={Boolean(agreementModalData)}
        onClose={() => setAgreementModalData(null)}
        data={agreementModalData}
      />

      {/* Action Toast Feedback */}
      <AdminActionToast feedback={feedback} onClose={() => setFeedback(null)} />
    </div>
  );
}

export default function CustomersDirectoryPage() {
  return (
    <Suspense fallback={null}>
      <CustomersDirectoryContent />
    </Suspense>
  );
}
