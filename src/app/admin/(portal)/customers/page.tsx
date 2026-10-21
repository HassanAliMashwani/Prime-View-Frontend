'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { siteConfig } from '@/data/site';
import {
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  X,
  CreditCard,
  Building,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  Key,
  Copy,
  Check,
  Calendar,
  Lock,
  FileCheck,
  FolderOpen,
  HelpCircle,
  Clock,
  RotateCcw,
  Camera,
  UserCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AdminSession, PaymentType, Plot, Customer, InstallmentPlanConfig } from '@/lib/mock/types';
import { generateFrontendSchedule, FrontendScheduleRow } from '@/lib/utils/installmentSchedule';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import {
  searchCustomers,
  verifyPlotRegistered,
  createCustomerWithBooking,
  createMinimalBooking,
  addBookingToCustomer,
  resetCustomerPassword,
  completeMemberRegistration,
  CustomerDisambiguation,
  CreateCustomerWithBookingInput,
  setRegisteredPlotsCache,
  getAdminCustomerById,
  setPaymentPlanForHeldPlot,
  PickerMember,
  searchMembersForPicker,
} from '@/lib/dal/customers';
import LiveMemberPicker from '@/components/admin/customers/LiveMemberPicker';
import LiveCnicMemberPicker from '@/components/admin/customers/LiveCnicMemberPicker';
import { releaseLock, releaseLockSync, getAdminAllPlots, updatePlotPrice, getAdminPlotDetails, acquireLock } from '@/lib/dal/adminPlots';
import { compressAndEncodeReceipt } from '@/lib/utils/imageCompression';
import { AdminCustomerRegistrationSkeleton } from '@/components/ui/skeleton';
import { BookingAgreementModal } from '@/components/admin/BookingAgreementModal';
import { nextFifthAfter, calculateInstallmentDueDates, formatDueOnFifth } from '@/lib/utils/installmentDates';
import { runLane1 } from '@/lib/requestLanes';
import { AdminActionToast } from '@/components/admin/AdminActionToast';
import { toSafeErrorMessage } from '@/lib/safeError';
import { formatCnic, isValidCnic } from '@/lib/utils/cnic';
import { formatPhone, isValidPhone } from '@/lib/utils/phone';

function toPlainNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.floor(val);
  const clean = String(val).replace(/[^0-9.]/g, '');
  const parsed = Number(clean);
  return isNaN(parsed) ? 0 : Math.floor(parsed);
}

function PlotSelector({
  value,
  onChange,
  onSelectPlot,
  onErrorClear,
  session
}: {
  value: string;
  onChange: (plotId: string) => void;
  onSelectPlot?: (plot: Plot) => void;
  onErrorClear?: () => void;
  session: AdminSession | null;
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.length >= 2 && session) {
      setLoading(true);
      runLane1({
        screen: 'plot-selector',
        fn: async (signal) => getAdminAllPlots(session, debouncedSearch, signal),
      }).then(res => {
        if (res.ok && res.plots) {
          const availableOnly = res.plots.filter((p: Plot) => {
            if (p.status !== 'available') return false;
            if (p.category === 'amenity') return false;
            if (p.isAdjustment) return false;
            if (session.role !== 'super_admin' && !session.assignedBlocks?.includes(p.blockId)) return false;
            return true;
          });
          setResults(availableOnly);
        }
        setLoading(false);
      }).catch((err) => {
        if (err?.message !== 'REQUEST_SUPERSEDED') {
          setLoading(false);
        }
      });
    } else {
      setResults([]);
    }
  }, [debouncedSearch, session]);

  return (
    <div className="flex flex-col gap-2">
      <input 
        type="text" 
        placeholder="Search by plot number or size (min 2 chars)..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 bg-slate-50"
      />
      <select
        value={value}
        onChange={(e) => {
           const selected = results.find(p => p.id === e.target.value);
           onChange(e.target.value);
           if (selected && onSelectPlot) onSelectPlot(selected);
           if (onErrorClear) onErrorClear();
        }}
        required
        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 bg-white"
      >
        <option value="">{loading ? 'Searching...' : (results.length > 0 ? '-- Select Available Plot --' : '-- Type to search plots --')}</option>
        {results.map((p) => (
          <option key={p.id} value={p.id}>
            {p.blockId.toUpperCase()} • Plot {p.plotNumber} ({p.size}) — {p.price > 0 ? `PKR ${p.price.toLocaleString()}` : 'Price not set'}
          </option>
        ))}
      </select>
    </div>
  );
}

function CustomersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query parameters from Master Plan redirect or Customer Directory
  const queryPlotId = searchParams.get('plotId') || '';
  const queryLockToken = searchParams.get('lockToken') || '';
  const queryReturnBlock = searchParams.get('returnBlock') || '';
  const queryReservationId = searchParams.get('reservationId') || '';
  const queryCustomerName = searchParams.get('customerName') || searchParams.get('name') || '';
  const queryCustomerPhone = searchParams.get('customerPhone') || searchParams.get('phone') || '';
  const queryCustomerEmail = searchParams.get('customerEmail') || searchParams.get('email') || '';
  const queryCustomerId = searchParams.get('customerId') || searchParams.get('memberId') || '';
  const queryTab = searchParams.get('tab') || '';
  const queryCompleteCustomer = searchParams.get('completeCustomer') || searchParams.get('completeCustomerId') || searchParams.get('memberId') || '';
  const querySetPlanCustomer = searchParams.get('setPlanCustomer') || '';
  const queryPlotNumber = searchParams.get('plotNumber') || '';
  const queryBlock = searchParams.get('block') || searchParams.get('blockName') || searchParams.get('blockId') || '';
  const querySize = searchParams.get('size') || searchParams.get('plotSize') || '';
  const queryPrice = searchParams.get('price') || searchParams.get('plotPrice') || '';
  const queryCustomerCnic = searchParams.get('cnic') || searchParams.get('customerCnic') || '';
  const isSetPlanMode = Boolean(querySetPlanCustomer && queryPlotId);

  const initPriceNum = queryPrice ? Number(queryPrice) : 0;
  const initialPlot = (queryPlotId && (queryPlotNumber || queryPrice || queryBlock || querySize))
    ? ({
        id: queryPlotId,
        plotNumber: queryPlotNumber || queryPlotId,
        price: initPriceNum,
        blockId: queryBlock || '',
        size: querySize || '',
        category: 'residential' as any,
        status: 'available' as any,
      } as Plot)
    : null;

  // Track whether authoritative plot price has arrived from database (save button stays disabled until then)
  const [dbPriceArrived, setDbPriceArrived] = useState<boolean>(!queryPlotId);
  const [plotLockHolder, setPlotLockHolder] = useState<string | null>(null);

  // Set Payment Plan Mode State (Super Admin Exclusivity)
  const [setPlanCustomer, setSetPlanCustomer] = useState<Customer | null>(null);
  const [setPlanPlot, setSetPlanPlot] = useState<Plot | null>(initialPlot);
  const [setPlanPrice, setSetPlanPrice] = useState<number>(initPriceNum);
  const [setPlanPaymentType, setSetPlanPaymentType] = useState<PaymentType>('installment');
  const [setPlanYears, setSetPlanYears] = useState<number>(1);
  const [setPlanPaperRef, setSetPlanPaperRef] = useState<string>('');
  const [setPlanSubmitting, setSetPlanSubmitting] = useState<boolean>(false);

  const [session, setSession] = useState<AdminSession | null>(() => (typeof window === 'undefined' ? null : getActiveAdminSession()));
  const sessionRef = useRef<AdminSession | null>(session);
  const [loading, setLoading] = useState(false);
  const [completeTargetCustomer, setCompleteTargetCustomer] = useState<Customer | null>(null);
  const [memberCity, setMemberCity] = useState<string>('');

  // Active Tab: 'path_a' (New Customer), 'path_b' (Existing Customer)
  const [activeTab, setActiveTab] = useState<'path_a' | 'path_b'>(
    queryCustomerId || queryTab === 'path_b' ? 'path_b' : 'path_a'
  );

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Available plots list for plot picker
  const [availablePlots, setAvailablePlots] = useState<Plot[]>([]);

  // Master Plan Redirect State
  const [lockedPlot, setLockedPlot] = useState<Plot | null>(initialPlot);
  const [isLockedFromMap, setIsLockedFromMap] = useState<boolean>(false);
  const [plotLoading, setPlotLoading] = useState<boolean>(Boolean(queryPlotId && !querySetPlanCustomer && !initialPlot));
  const isCommittedRef = useRef(false);
  const releaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ----------------------------------------------------
  // INSTALLMENT SCHEDULE CONFIG STATE (Item 6)
  // ----------------------------------------------------
  // Path A Installment State
  const [yearsA, setYearsA] = useState<number>(1);
  const [totalPaymentA, setTotalPaymentA] = useState<number>(initPriceNum);

  // Path B Installment State
  const [yearsB, setYearsB] = useState<number>(1);
  const [totalPaymentB, setTotalPaymentB] = useState<number>(initPriceNum);

  // ----------------------------------------------------
  // PATH A: NEW CUSTOMER FORM STATE
  // ----------------------------------------------------
  const [pathAForm, setPathAForm] = useState<CreateCustomerWithBookingInput>({
    plotId: queryPlotId,
    paymentType: 'installment',
    paperInstallmentRef: '',
    membershipNo: `PV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    fullName: queryCustomerName,
    fatherOrHusbandName: '',
    cnic: queryCustomerCnic ? formatCnic(queryCustomerCnic) : '',
    phone: queryCustomerPhone ? formatPhone(queryCustomerPhone) : '',
    email: queryCustomerEmail,
    mailingAddress: '',
    nokName: '',
    nokCnic: '',
    applicantPhotoUrl: '/media/placeholder-applicant.jpg',
    cnicCopyUrl: '/media/placeholder-cnic.jpg',
    nokCnicCopyUrl: '/media/placeholder-nok.jpg',
    portalPassword: '',
    lockToken: queryLockToken || undefined,
  });
  const [pathASubmitting, setPathASubmitting] = useState(false);
  const [pathASuccess, setPathASuccess] = useState(false);
  const [pathAPlotError, setPathAPlotError] = useState<string | null>(null);
  const [selectedPlotA, setSelectedPlotA] = useState<Plot | null>(initialPlot);

  // ----------------------------------------------------
  // PATH B: EXISTING CUSTOMER STATE
  // ----------------------------------------------------
  const [searchQuery, setSearchQuery] = useState(queryCustomerName || queryCustomerPhone || '');
  const [searchResults, setSearchResults] = useState<CustomerDisambiguation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected customer for disambiguation
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDisambiguation | null>(null);
  const [isCustomerConfirmed, setIsCustomerConfirmed] = useState(false);

  // Path B booking fields
  const [pathBPlotId, setPathBPlotId] = useState(queryPlotId);
  const [pathBPaymentType, setPathBPaymentType] = useState<PaymentType>('installment');
  const [pathBPaperRef, setPathBPaperRef] = useState('');
  const [selectedPlotB, setSelectedPlotB] = useState<Plot | null>(null);
  const [pathBPlotError, setPathBPlotError] = useState<string | null>(null);
  const [pathBSubmitting, setPathBSubmitting] = useState(false);
  const [pathBSuccess, setPathBSuccess] = useState(false);

  // ----------------------------------------------------
  // ADMIN 3-FIELD QUICK BOOKING STATE (CR 07 §5)
  // ----------------------------------------------------
  const [subAdminPlotId, setSubAdminPlotId] = useState(queryPlotId || '');
  const [subAdminForm, setSubAdminForm] = useState({
    customerName: queryCustomerName || '',
    cnic: queryCustomerCnic ? formatCnic(queryCustomerCnic) : '',
    city: '',
    nokCnic: '',
    customerId: queryCustomerId || '',
    price: queryPrice || '',
  });
  const [subAdminSelectedMember, setSubAdminSelectedMember] = useState<PickerMember | null>(null);
  const [pathASelectedMember, setPathASelectedMember] = useState<PickerMember | null>(null);
  const pathBSearchAbortRef = useRef<AbortController | null>(null);
  const [pathBHighlightedIndex, setPathBHighlightedIndex] = useState<number>(-1);
  const [subAdminSubmitting, setSubAdminSubmitting] = useState(false);
  const [subAdminPlotError, setSubAdminPlotError] = useState<string | null>(null);
  const [subAdminFieldErrors, setSubAdminFieldErrors] = useState<{
    plot?: string;
    customerName?: string;
    cnic?: string;
    city?: string;
    nokCnic?: string;
    price?: string;
  }>({});

  const [pathAFieldErrors, setPathAFieldErrors] = useState<{
    plot?: string;
    fullName?: string;
    fatherOrHusbandName?: string;
    cnic?: string;
    phone?: string;
    email?: string;
    city?: string;
    mailingAddress?: string;
    portalPassword?: string;
    nokName?: string;
    nokCnic?: string;
    price?: string;
  }>({});

  const [pathBFieldErrors, setPathBFieldErrors] = useState<{
    customer?: string;
    plot?: string;
    price?: string;
  }>({});

  // ----------------------------------------------------
  // SECTION 5: PHYSICAL DOCUMENT ATTACHMENTS STATE
  // ----------------------------------------------------
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [docFiles, setDocFiles] = useState<{
    photo?: { name: string; sizeKb: number; dataUrl: string };
    cnic?: { name: string; sizeKb: number; dataUrl: string; isPdf?: boolean };
    nokCnic?: { name: string; sizeKb: number; dataUrl: string; isPdf?: boolean };
  }>({});
  const [docUploading, setDocUploading] = useState<'photo' | 'cnic' | 'nokCnic' | null>(null);

  // ----------------------------------------------------
  // SUCCESS MODALS (Credentials & Printable Agreement)
  // ----------------------------------------------------
  const [credentialsModal, setCredentialsModal] = useState<{
    open: boolean;
    username: string;
    password: string;
    customerName: string;
    membershipNo: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const copyCredsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyCredsTimeoutRef.current) clearTimeout(copyCredsTimeoutRef.current);
    };
  }, []);

  const [agreementModal, setAgreementModal] = useState<{
    open: boolean;
    customer: Partial<Customer>;
    plot: Plot;
    paymentType: PaymentType;
    paperRef?: string;
    bookingDate: string;
    installmentPlan?: InstallmentPlanConfig;
  } | null>(null);

  // ----------------------------------------------------
  // RESET CUSTOMER PASSWORD MODAL STATE
  // ----------------------------------------------------
  const [resetModalCustomer, setResetModalCustomer] = useState<CustomerDisambiguation | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [selectingCustomerId, setSelectingCustomerId] = useState<string | null>(null);

  // Drop sensitive parameters from address bar on first paint so member CNIC is not retained in browser history
  // Drop query parameters from address bar on first paint after fields are populated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      const paramsToRemove = ['cnic', 'name', 'price', 'plotNumber', 'phone', 'block', 'size', 'customerName', 'customerPhone', 'customerCnic', 'plotPrice'];
      let modified = false;
      for (const p of paramsToRemove) {
        if (url.searchParams.has(p)) {
          url.searchParams.delete(p);
          modified = true;
        }
      }
      if (modified) {
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    } catch {
      // guard
    }
  }, []);

  // Load active session and plots
  const loadInitialData = useCallback(() => {
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);

    const applyPlot = (p: Plot, customTotal?: number) => {
      const cleanPrice = toPlainNumber(p.price);
      const cleanCustom = customTotal !== undefined ? toPlainNumber(customTotal) : undefined;
      const normalizedPlot = { ...p, price: cleanPrice };
      setSelectedPlotA(normalizedPlot);
      setSelectedPlotB(normalizedPlot);
      setLockedPlot(normalizedPlot);
      setIsLockedFromMap(true);
      setRegisteredPlotsCache([normalizedPlot]);
      const tot = cleanCustom ?? cleanPrice;
      setTotalPaymentA(tot);
      setTotalPaymentB(tot);
      setSubAdminForm((prev) => ({ ...prev, price: cleanPrice > 0 ? String(cleanPrice) : '' }));
      setPathAPlotError(null);
      setPathBPlotError(null);
      setDbPriceArrived(true);
    };

    const loadPlotById = async (id: string, customTotal?: number) => {
      setPlotLoading(true);
      setPathAPlotError(null);
      setPathBPlotError(null);
      try {
        const res = await getAdminPlotDetails(cur, id);
        setPlotLoading(false);
        if (res.ok && res.plot) {
          applyPlot(res.plot, customTotal);
          if (res.plot.lockedBy && res.plot.lockedBy !== cur.adminId) {
            setPlotLockHolder((res.plot as any).lockedByName || 'Another Officer');
          } else {
            setPlotLockHolder(null);
            if (!queryLockToken) {
              acquireLock(cur, id).then((lRes) => {
                if (!lRes.ok && lRes.lockedByName) {
                  setPlotLockHolder(lRes.lockedByName);
                } else if (lRes.ok && lRes.lockToken) {
                  setPlotLockHolder(null);
                  setPathAForm((prev) => ({ ...prev, lockToken: lRes.lockToken }));
                }
              }).catch(() => {});
            }
          }
        } else {
          setDbPriceArrived(true);
          if ((res as any).lockedByName || res.error === 'PLOT_LOCKED') {
            setPlotLockHolder((res as any).lockedByName || 'Another Officer');
          } else {
            const errMsg = res.error === 'OUT_OF_SCOPE'
              ? 'Plot is outside your assigned administrative block scope.'
              : (res.error || 'Failed to load plot details from master plan.');
            setPathAPlotError(errMsg);
            setPathBPlotError(errMsg);
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setPlotLoading(false);
        setDbPriceArrived(true);
        setPathAPlotError('Failed to load plot details from master plan.');
        setPathBPlotError('Failed to load plot details from master plan.');
      }
    };

    // Handle plot locking from Master Plan redirect or Confirm Booking
    if (queryPlotId && !querySetPlanCustomer && !queryCompleteCustomer && cur) {
      setPathAForm((prev) => ({
        ...prev,
        plotId: queryPlotId,
        lockToken: queryLockToken || undefined,
        fullName: queryCustomerName || prev.fullName,
        phone: queryCustomerPhone || prev.phone,
        email: queryCustomerEmail || prev.email,
      }));
      setPathBPlotId(queryPlotId);
      setSubAdminPlotId(queryPlotId);

      loadPlotById(queryPlotId);
    }

    // Handle customer preselection from query param
    if (queryCustomerId && cur) {
      setActiveTab('path_b');
      setSearchQuery(queryCustomerId);
      runLane1({
        screen: 'customer-booking',
        fn: async (signal) => getAdminCustomerById(cur, queryCustomerId, signal),
      }).then((res) => {
        if (res.ok && res.data) {
          const cust = res.data;
          const bookings = cust.bookings || [];
          setSelectedCustomer({
            id: cust.id,
            membershipNo: cust.membershipNo || '',
            fullName: cust.fullName || '',
            fatherOrHusbandName: cust.fatherOrHusbandName || '',
            cnic: cust.cnic ? formatCnic(cust.cnic) : '',
            phone: cust.phone || '',
            email: cust.email || '',
            mailingAddress: cust.mailingAddress || '',
            accountStatus: cust.accountStatus || 'active',
            propertiesCount: bookings.length,
            bookings,
          });
          setIsCustomerConfirmed(true);
        }
      });
    }

    // Handle Set Payment Plan for held plot on registered member (Super Admin Exclusivity)
    if (querySetPlanCustomer && queryPlotId && cur) {
      if (cur.role !== 'super_admin') {
        router.replace('/admin/customers-directory');
        return;
      }

      runLane1({
        screen: 'customer-booking',
        key: `set-plan:${querySetPlanCustomer}:${queryPlotId}`,
        fn: async (signal) => {
          const [custRes, plotRes] = await Promise.all([
            getAdminCustomerById(cur, querySetPlanCustomer, signal),
            getAdminPlotDetails(cur, queryPlotId, signal),
          ]);
          return { custRes, plotRes };
        },
      }).then(async ({ custRes, plotRes }) => {
        if (custRes.ok && custRes.data) {
          const cust = custRes.data;
          if (cust.registrationStatus === 'minimal') {
            setCompleteTargetCustomer(cust);
          } else {
            setSetPlanCustomer(cust);
          }
          setActiveTab('path_a');

          // Match by UUID or plotNumber or find the member's unbilled held booking
          let targetBooking = cust.bookings?.find((b: any) =>
            b.plotId === queryPlotId ||
            b.plot?.id === queryPlotId ||
            b.plot?.plotNumber === queryPlotId ||
            String(b.plot?.plotNumber).toLowerCase() === String(queryPlotId).toLowerCase()
          );

          if (!targetBooking && cust.bookings?.length) {
            targetBooking = cust.bookings.find((b: any) =>
              (!b.payments || b.payments.length === 0)
            ) || cust.bookings[0];
          }

          let targetPlot = (plotRes.ok && plotRes.plot) ? plotRes.plot : targetBooking?.plot;
          const targetPlotId = targetBooking?.plotId || targetPlot?.id || queryPlotId;
          if (!targetPlot && targetPlotId) {
            const extraPlotRes = await getAdminPlotDetails(cur, targetPlotId);
            if (extraPlotRes.ok && extraPlotRes.plot) {
              targetPlot = extraPlotRes.plot;
            }
          }

          // Authoritative price comes strictly from the server/database
          const serverPrice = (targetPlot?.price !== undefined && targetPlot?.price !== null)
            ? toPlainNumber(targetPlot.price)
            : undefined;

          const customTotal = (targetBooking?.installmentPlan?.totalPayment && Number(targetBooking.installmentPlan.totalPayment) > 0)
            ? toPlainNumber(targetBooking.installmentPlan.totalPayment)
            : serverPrice;

          const effectivePlot = targetPlot || initialPlot;

          if (effectivePlot) {
            applyPlot(effectivePlot, customTotal);
          } else if (targetPlotId) {
            await loadPlotById(targetPlotId, customTotal);
          }

          if (effectivePlot) {
            const cleanPrice = serverPrice !== undefined ? serverPrice : toPlainNumber(effectivePlot.price);
            const cleanTotal = customTotal !== undefined ? customTotal : cleanPrice;
            const normalizedTarget = { ...(targetPlot || effectivePlot), price: cleanPrice };
            setSetPlanPlot(normalizedTarget);
            setSetPlanPrice(cleanTotal);
            setSelectedPlotA(normalizedTarget);
            setSelectedPlotB(normalizedTarget);
            setTotalPaymentA(cleanTotal);
            setTotalPaymentB(cleanTotal);
            setPlotLoading(false);
          }

          if (targetBooking?.installmentPlan?.planYears) {
            const py = Number(targetBooking.installmentPlan.planYears);
            if (!isNaN(py) && py > 0) {
              setYearsA(py);
              setYearsB(py);
              setSetPlanYears(py);
            }
          }

          const currentCity = cust.city || cust.mailingAddress || '';
          setMemberCity(currentCity);

          // Populate all existing member details into Path A form
          setPathAForm((prev) => ({
            ...prev,
            plotId: targetPlotId,
            fullName: cust.fullName || '',
            cnic: cust.cnic ? formatCnic(cust.cnic) : '',
            phone: cust.phone || '',
            email: cust.email || '',
            mailingAddress: cust.mailingAddress || currentCity,
            membershipNo: cust.membershipNo || '',
            fatherOrHusbandName: (cust.fatherOrHusbandName && cust.fatherOrHusbandName !== 'Pending Information') ? cust.fatherOrHusbandName : '',
            nokName: cust.nokName || '',
            nokCnic: cust.nokCnic ? formatCnic(cust.nokCnic) : '',
            portalPassword: '',
            paymentType: (targetBooking?.paymentType as PaymentType) || 'installment',
            paperInstallmentRef: targetBooking?.paperInstallmentRef || '',
            applicantPhotoUrl: cust.applicantPhotoUrl || prev.applicantPhotoUrl,
            cnicCopyUrl: cust.cnicCopyUrl || prev.cnicCopyUrl,
            nokCnicCopyUrl: cust.nokCnicCopyUrl || prev.nokCnicCopyUrl,
          }));

          // Populate document files if URLs exist on profile
          setDocFiles({
            photo: cust.applicantPhotoUrl ? { name: 'applicant-photo.jpg', sizeKb: 100, dataUrl: cust.applicantPhotoUrl } : undefined,
            cnic: cust.cnicCopyUrl ? { name: 'cnic-copy.jpg', sizeKb: 100, dataUrl: cust.cnicCopyUrl } : undefined,
            nokCnic: cust.nokCnicCopyUrl ? { name: 'nok-cnic-copy.jpg', sizeKb: 100, dataUrl: cust.nokCnicCopyUrl } : undefined,
          });

          // Populate Sub Admin form
          setSubAdminForm((prev) => ({
            ...prev,
            customerName: cust.fullName || '',
            cnic: cust.cnic ? formatCnic(cust.cnic) : '',
            city: currentCity,
            customerId: cust.id,
          }));

          // Also populate Path B
          const bookings = (cust.bookings || []).map((b: any) => ({
            plotId: b.plotId || b.plot?.id,
            plotNumber: b.plot?.plotNumber || '',
            blockId: b.plot?.blockId || '',
            category: b.plot?.category || '',
            size: b.plot?.size || '',
            price: Number(b.plot?.price || 0),
            paymentType: b.paymentType || 'installment',
            status: b.status,
            bookingDate: b.bookingDate,
            hasPaymentPlan: Boolean(b.installmentPlan || (b.payments && b.payments.length > 0)),
            billsCount: b.payments?.length || 0,
          }));

          setSelectedCustomer({
            id: cust.id,
            membershipNo: cust.membershipNo || '',
            fullName: cust.fullName || '',
            fatherOrHusbandName: cust.fatherOrHusbandName || '',
            cnic: cust.cnic ? formatCnic(cust.cnic) : '',
            phone: cust.phone || '',
            email: cust.email || '',
            mailingAddress: cust.mailingAddress || '',
            accountStatus: cust.accountStatus || 'active',
            propertiesCount: bookings.length,
            bookings,
          });
          setIsCustomerConfirmed(true);
        }
      }).catch(() => {});
    }

    // Handle Complete Registration for quick-booked member (CR 07 §5)
    if (queryCompleteCustomer && cur) {
      runLane1({
        screen: 'customer-booking',
        fn: async (signal) => getAdminCustomerById(cur, queryCompleteCustomer, signal),
      }).then(async (res) => {
        if (res.ok && res.data) {
          const cust = res.data;
          setCompleteTargetCustomer(cust);
          setActiveTab('path_a');

          // Find the target booking & plot locked to queryPlotId
          let targetBooking = queryPlotId
            ? cust.bookings?.find((b: any) => b.plotId === queryPlotId || b.plot?.id === queryPlotId)
            : cust.bookings?.[0];

          if (!targetBooking && cust.bookings?.length > 0) {
            targetBooking = cust.bookings[0];
          }

          let targetPlot = targetBooking?.plot;
          const targetPlotId = queryPlotId || targetBooking?.plotId || targetPlot?.id;
          const customTotal = targetBooking?.installmentPlan?.totalPayment
            ? Number(targetBooking.installmentPlan.totalPayment)
            : undefined;

          if (targetPlot && targetPlot.price && targetPlot.plotNumber && targetPlot.blockId) {
            applyPlot(targetPlot, customTotal);
            if (targetPlot.lockedBy && targetPlot.lockedBy !== cur.adminId) {
              setPlotLockHolder((targetPlot as any).lockedByName || 'Another Officer');
            } else {
              setPlotLockHolder(null);
              if (!queryLockToken && targetPlotId) {
                acquireLock(cur, targetPlotId).then((lRes) => {
                  if (!lRes.ok && lRes.lockedByName) {
                    setPlotLockHolder(lRes.lockedByName);
                  } else if (lRes.ok && lRes.lockToken) {
                    setPlotLockHolder(null);
                    setPathAForm((prev) => ({ ...prev, lockToken: lRes.lockToken }));
                  }
                }).catch(() => {});
              }
            }
          } else if (targetPlotId) {
            await loadPlotById(targetPlotId, customTotal);
          }

          const currentCity = cust.city || cust.mailingAddress || '';
          setMemberCity(currentCity);

          setPathAForm((prev) => ({
            ...prev,
            plotId: queryPlotId || targetPlotId || prev.plotId,
            fullName: cust.fullName || '',
            cnic: cust.cnic ? formatCnic(cust.cnic) : '',
            phone: cust.phone || '',
            email: cust.email || '',
            mailingAddress: cust.mailingAddress || currentCity,
            membershipNo: cust.membershipNo || '',
            fatherOrHusbandName: (cust.fatherOrHusbandName && cust.fatherOrHusbandName !== 'Pending Information') ? cust.fatherOrHusbandName : '',
            nokName: cust.nokName || '',
            nokCnic: cust.nokCnic ? formatCnic(cust.nokCnic) : '',
            portalPassword: '',
            paymentType: (targetBooking?.paymentType as PaymentType) || 'installment',
            applicantPhotoUrl: undefined,
            cnicCopyUrl: undefined,
            nokCnicCopyUrl: undefined,
          }));
        }
      }).catch(() => {});
    }

    setLoading(false);
  }, [router, queryPlotId, queryLockToken, queryCustomerId, queryCompleteCustomer, querySetPlanCustomer, queryCustomerName, queryCustomerPhone, queryCustomerEmail, queryPlotNumber, queryPrice, queryCustomerCnic]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Keep sessionRef in sync
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Flash feedback timer
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 6000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // ----------------------------------------------------
  // MULTI-TIER LOCK RELEASE DEFENSE (Item 3)
  // ----------------------------------------------------
  // Tier 1: Cancel Button & Return to Master Plan / Customer Directory
  const handleCancelLockAndReturn = async () => {
    if (completeTargetCustomer) {
      router.push('/admin/customers-directory?statusFilter=needs_registration');
      return;
    }
    if (releaseTimeoutRef.current) {
      clearTimeout(releaseTimeoutRef.current);
      releaseTimeoutRef.current = null;
    }
    if (queryPlotId && session) {
      isCommittedRef.current = true;
      await runLane1({
        screen: 'customer-booking',
        isSave: true,
        fn: async () => releaseLock(session, queryPlotId),
      }).catch(() => {});
    }
    if (queryReturnBlock) {
      router.push(`/admin/master-plan/${queryReturnBlock}`);
    } else if (selectedPlotA?.blockId || lockedPlot?.blockId) {
      router.push(`/admin/master-plan/${selectedPlotA?.blockId || lockedPlot?.blockId}`);
    } else {
      router.push('/admin/master-plan');
    }
  };

  // Tier 2: React Component Unmount Cleanup
  // Guarded against React 18/19 StrictMode mount-unmount-remount cycles in dev:
  // The initial unmount during page load must NOT release the lock.
  useEffect(() => {
    if (releaseTimeoutRef.current) {
      clearTimeout(releaseTimeoutRef.current);
      releaseTimeoutRef.current = null;
    }

    return () => {
      if (!isCommittedRef.current && queryLockToken && queryPlotId && sessionRef.current) {
        releaseTimeoutRef.current = setTimeout(() => {
          if (!isCommittedRef.current && sessionRef.current) {
            releaseLock(sessionRef.current, queryPlotId);
          }
        }, 1000);
      }
    };
  }, [queryLockToken, queryPlotId]);

  // Tier 3: Browser Back / Forward button (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (!isCommittedRef.current && queryLockToken && queryPlotId && sessionRef.current) {
        releaseLockSync(queryPlotId, sessionRef.current.adminId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [queryLockToken, queryPlotId]);

  // Tier 4: Tab Close / Page Refresh / Window Navigate (pagehide and beforeunload)
  useEffect(() => {
    const handleUnload = () => {
      if (!isCommittedRef.current && queryLockToken && queryPlotId && sessionRef.current) {
        releaseLockSync(queryPlotId, sessionRef.current.adminId);
      }
    };
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [queryLockToken, queryPlotId]);

  // ----------------------------------------------------
  // INSTALLMENT CALCULATION HELPER (Item 6)
  // ----------------------------------------------------
  const calculatePlan = (plotPrice: number, downpayment: number, years: number, paidAfterEvery: number) => {
    const safeYears = Math.max(0.5, Number(years) || 1);
    const safeFreq = Math.max(1, Number(paidAfterEvery) || 1);
    const totalMonths = Math.max(1, Math.round(safeYears * 12));
    const numberOfInstallments = Math.max(1, Math.floor(totalMonths / safeFreq));
    const safeDownpayment = Math.min(plotPrice, Math.max(0, Number(downpayment) || 0));
    const financed = Math.max(0, plotPrice - safeDownpayment);
    const baseInstallment = Math.floor(financed / numberOfInstallments);
    const remainder = financed - (baseInstallment * numberOfInstallments);
    const finalInstallment = baseInstallment + remainder;

    const firstDueDate = nextFifthAfter(new Date());
    const dueDates = calculateInstallmentDueDates(new Date(), numberOfInstallments, safeFreq);

    return {
      totalPayment: plotPrice,
      downpayment: safeDownpayment,
      years: safeYears,
      paidAfterEvery: safeFreq,
      numberOfInstallments,
      financed,
      baseInstallment,
      finalInstallment,
      remainder,
      firstDueDate,
      firstDueFormatted: formatDueOnFifth(firstDueDate),
      dueDates,
    };
  };

  // ----------------------------------------------------
  // SECTION 5: PHYSICAL DOCUMENT ATTACHMENT HANDLERS
  // ----------------------------------------------------
  const handleFileUpload = async (type: 'photo' | 'cnic' | 'nokCnic', file: File) => {
    try {
      setDocUploading(type);
      const dataUrl = await compressAndEncodeReceipt(file, 1000, 0.75);
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      setDocFiles((prev) => ({
        ...prev,
        [type]: { name: file.name, sizeKb, dataUrl, isPdf },
      }));

      if (type === 'photo') {
        setPathAForm((prev) => ({ ...prev, applicantPhotoUrl: dataUrl }));
      } else if (type === 'cnic') {
        setPathAForm((prev) => ({ ...prev, cnicCopyUrl: dataUrl }));
      } else if (type === 'nokCnic') {
        setPathAForm((prev) => ({ ...prev, nokCnicCopyUrl: dataUrl }));
      }
    } catch {
      console.error('request failed');
    } finally {
      setDocUploading(null);
    }
  };

  const handleRemoveFile = (type: 'photo' | 'cnic' | 'nokCnic') => {
    setDocFiles((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
    if (type === 'photo') {
      setPathAForm((prev) => ({ ...prev, applicantPhotoUrl: '/media/placeholder-applicant.jpg' }));
    } else if (type === 'cnic') {
      setPathAForm((prev) => ({ ...prev, cnicCopyUrl: '/media/placeholder-cnic.jpg' }));
    } else if (type === 'nokCnic') {
      setPathAForm((prev) => ({ ...prev, nokCnicCopyUrl: '/media/placeholder-nok.jpg' }));
    }
  };

  // ----------------------------------------------------
  // PLOT VERIFICATION HELPER (Section 2.2.1)
  // ----------------------------------------------------
  const handleVerifyPlotA = (plotId: string) => {
    setPathAPlotError(null);
    setPathAForm((prev) => ({ ...prev, plotId }));
    if (!plotId.trim()) {
      setSelectedPlotA(null);
      return;
    }

    const { exists, plot } = verifyPlotRegistered(plotId.trim());
    if (!exists || !plot) {
      setPathAPlotError('This plot is not registered on the master plan map. Kindly register the plot before proceeding.');
      setSelectedPlotA(null);
      return;
    }

    if (plot.category === 'amenity') {
      setPathAPlotError('Amenity utility plots cannot be booked or sold.');
      setSelectedPlotA(null);
      return;
    }

    if (plot.status === 'booked') {
      setPathAPlotError('This plot has already been committed to another owner.');
      setSelectedPlotA(null);
      return;
    }

    if (session && session.role !== 'super_admin' && !session.assignedBlocks.includes(plot.blockId)) {
      setPathAPlotError(`Plot ${plot.plotNumber} (${plot.blockId}) is outside your assigned administrative block scope.`);
      setSelectedPlotA(null);
      return;
    }

    const cleanPrice = toPlainNumber(plot.price);
    const normalizedPlot = { ...plot, price: cleanPrice };
    setSelectedPlotA(normalizedPlot);
    setTotalPaymentA(cleanPrice);
  };

  const handleVerifyPlotB = (plotId: string) => {
    setPathBPlotError(null);
    setPathBPlotId(plotId);
    if (!plotId.trim()) {
      setSelectedPlotB(null);
      setTotalPaymentB(0);
      return;
    }

    const { exists, plot } = verifyPlotRegistered(plotId.trim());
    if (!exists || !plot) {
      setPathBPlotError('This plot is not registered on the master plan map. Kindly register the plot before proceeding.');
      setSelectedPlotB(null);
      setTotalPaymentB(0);
      return;
    }

    if (plot.category === 'amenity') {
      setPathBPlotError('Amenity utility plots cannot be booked or sold.');
      setSelectedPlotB(null);
      setTotalPaymentB(0);
      return;
    }

    if (plot.status === 'booked') {
      setPathBPlotError('This plot has already been committed to another owner.');
      setSelectedPlotB(null);
      setTotalPaymentB(0);
      return;
    }

    if (session && session.role !== 'super_admin' && !session.assignedBlocks.includes(plot.blockId)) {
      setPathBPlotError(`Plot ${plot.plotNumber} (${plot.blockId}) is outside your assigned administrative block scope.`);
      setSelectedPlotB(null);
      setTotalPaymentB(0);
      return;
    }

    const cleanPrice = toPlainNumber(plot.price);
    const normalizedPlot = { ...plot, price: cleanPrice };
    setSelectedPlotB(normalizedPlot);
    setTotalPaymentB(cleanPrice);
  };

  const scrollToField = (fieldId: string) => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in el && typeof (el as any).focus === 'function') {
        (el as any).focus();
      } else {
        const inputEl = el.querySelector('input, select, textarea, button') as HTMLElement | null;
        if (inputEl && typeof inputEl.focus === 'function') {
          inputEl.focus();
        }
      }
    }
  };

  const handleMapPathAError = (errMsg: string) => {
    setPathASubmitting(false);
    const msg = errMsg || 'Failed to complete booking.';
    const lower = msg.toLowerCase();
    let failedField = '';
    if (lower.includes('cnic') && (lower.includes('nok') || lower.includes('kin') || lower.includes('nominee'))) {
      setPathAFieldErrors((prev) => ({ ...prev, nokCnic: msg }));
      failedField = 'pathA_nokCnic';
    } else if (lower.includes('cnic')) {
      setPathAFieldErrors((prev) => ({ ...prev, cnic: msg }));
      failedField = 'pathA_cnic';
    } else if (lower.includes('phone') || lower.includes('mobile')) {
      setPathAFieldErrors((prev) => ({ ...prev, phone: msg }));
      failedField = 'pathA_phone';
    } else if (lower.includes('email')) {
      setPathAFieldErrors((prev) => ({ ...prev, email: msg }));
      failedField = 'pathA_email';
    } else if (lower.includes('price')) {
      setPathAFieldErrors((prev) => ({ ...prev, price: msg }));
      failedField = 'pathA_price';
    } else if (lower.includes('password')) {
      setPathAFieldErrors((prev) => ({ ...prev, portalPassword: msg }));
      failedField = 'pathA_portalPassword';
    } else if (lower.includes('nominee') || lower.includes('nok')) {
      setPathAFieldErrors((prev) => ({ ...prev, nokName: msg }));
      failedField = 'pathA_nokName';
    } else if (lower.includes('plot') || lower.includes('lock') || lower.includes('block')) {
      setPathAFieldErrors((prev) => ({ ...prev, plot: msg }));
      setPathAPlotError(msg);
      failedField = 'pathA_plot';
    } else if (lower.includes('city')) {
      setPathAFieldErrors((prev) => ({ ...prev, city: msg }));
      failedField = 'pathA_city';
    } else if (lower.includes('address')) {
      setPathAFieldErrors((prev) => ({ ...prev, mailingAddress: msg }));
      failedField = 'pathA_mailingAddress';
    } else if (lower.includes('name')) {
      setPathAFieldErrors((prev) => ({ ...prev, fullName: msg }));
      failedField = 'pathA_fullName';
    } else {
      setPathAFieldErrors((prev) => ({ ...prev, fullName: msg }));
      failedField = 'pathA_fullName';
      setFeedback({ type: 'error', message: msg });
    }
    if (failedField) {
      setTimeout(() => scrollToField(failedField), 50);
    }
  };

  // ----------------------------------------------------
  // SUBMIT PATH A (NEW CUSTOMER)
  // ----------------------------------------------------
  const handleSubmitPathA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setPathAPlotError(null);
    setPathAFieldErrors({});

    // Prerequisite verification: use selectedPlotA, lockedPlot or load once with getAdminPlotDetails
    // Prerequisite verification: use plot already loaded on the form
    let plot = (selectedPlotA && selectedPlotA.id === pathAForm.plotId)
      ? selectedPlotA
      : (lockedPlot && lockedPlot.id === pathAForm.plotId ? lockedPlot : selectedPlotA);

    const errors: {
      plot?: string;
      fullName?: string;
      fatherOrHusbandName?: string;
      cnic?: string;
      phone?: string;
      email?: string;
      city?: string;
      mailingAddress?: string;
      portalPassword?: string;
      nokName?: string;
      nokCnic?: string;
      price?: string;
    } = {};

    if (!plot) {
      errors.plot = 'Plot details could not be loaded. Please select a plot.';
    } else if (plot.category === 'amenity') {
      errors.plot = 'Amenity utility plots cannot be booked or sold.';
    } else if (session.role !== 'super_admin' && !session.assignedBlocks.includes(plot.blockId)) {
      errors.plot = `Plot ${plot.plotNumber} (${plot.blockId}) is outside your assigned administrative block scope.`;
    }

    if (!pathAForm.fullName || !pathAForm.fullName.trim()) {
      errors.fullName = 'Please enter applicant full name.';
    }

    if (!setPlanCustomer && (!pathAForm.fatherOrHusbandName || !pathAForm.fatherOrHusbandName.trim())) {
      errors.fatherOrHusbandName = 'Please enter father or husband name.';
    }

    if (!pathAForm.cnic || !pathAForm.cnic.trim()) {
      errors.cnic = 'Please enter applicant 13-digit CNIC.';
    } else if (!isValidCnic(pathAForm.cnic)) {
      errors.cnic = 'Applicant CNIC must be exactly 13 digits in 00000-0000000-0 format.';
    }

    const cleanPhoneDigits = pathAForm.phone ? pathAForm.phone.replace(/\D/g, '') : '';
    if (!cleanPhoneDigits) {
      errors.phone = 'Please enter applicant mobile phone number.';
    } else if (cleanPhoneDigits.length > 11) {
      errors.phone = 'Phone number cannot be greater than 11 digits.';
    } else if (cleanPhoneDigits.length < 10) {
      errors.phone = 'Please enter a valid 11-digit phone number (e.g. 0300-1234567).';
    }

    if (!setPlanCustomer) {
      if (!pathAForm.email || !pathAForm.email.trim()) {
        errors.email = 'Please enter applicant email address.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pathAForm.email.trim())) {
        errors.email = 'Please enter a valid email address (e.g. name@domain.com).';
      }

      if (!pathAForm.mailingAddress || !pathAForm.mailingAddress.trim()) {
        errors.mailingAddress = 'Please enter permanent / mailing address.';
      }
    }

    if (!memberCity || !memberCity.trim()) {
      errors.city = 'Please enter applicant city.';
    }

    const isNokCnicUnchanged = Boolean(
      (completeTargetCustomer &&
        pathAForm.nokCnic === (completeTargetCustomer.nokCnic ? formatCnic(completeTargetCustomer.nokCnic) : '')) ||
      (setPlanCustomer &&
        pathAForm.nokCnic === (setPlanCustomer.nokCnic ? formatCnic(setPlanCustomer.nokCnic) : ''))
    );
    if (!setPlanCustomer) {
      if (!pathAForm.nokName || !pathAForm.nokName.trim()) {
        errors.nokName = 'Please enter nominee full name.';
      }
      if (!isNokCnicUnchanged && (!pathAForm.nokCnic || !isValidCnic(pathAForm.nokCnic))) {
        errors.nokCnic = 'Nominee CNIC must be exactly 13 digits in 00000-0000000-0 format.';
      }
    }

    // Portal Credentials Gate: Super Admin or Sub-Admin with granted Customer box
    const canIssueCreds = session.role === 'super_admin' || Boolean(session.permissions?.can_create_customer && session.permissions?.can_view_customers);

    // Initial password required when issuing credentials
    if (canIssueCreds && !setPlanCustomer && !pathASelectedMember) {
      if (!pathAForm.portalPassword || !pathAForm.portalPassword.trim()) {
        errors.portalPassword = 'Initial customer portal password is required (minimum 8 characters).';
      } else if (pathAForm.portalPassword.trim().length < 8) {
        errors.portalPassword = 'Initial customer portal password must be at least 8 characters long.';
      }
    }

    const canEditPriceA = Boolean(
      session.role === 'super_admin' ||
      (session.role === 'sub_admin' &&
        (session.permissions?.can_book || (session.permissions?.can_create_customer && session.permissions?.can_view_customers)) &&
        Array.isArray(session.assignedBlocks) &&
        session.assignedBlocks.includes(plot?.blockId || ''))
    );

    const serverAuthoritativePrice = plot ? toPlainNumber(plot.price) : 0;
    const finalPriceA = (canEditPriceA && totalPaymentA > 0)
      ? toPlainNumber(totalPaymentA)
      : serverAuthoritativePrice;

    if (!finalPriceA || isNaN(finalPriceA) || finalPriceA <= 0) {
      errors.price = 'Total Payment (Plot Price) must be a valid positive amount greater than zero.';
    } else if (finalPriceA % 10 !== 0 || !Number.isInteger(finalPriceA)) {
      errors.price = 'Plot price must end in 0 (e.g. 2,500,000). Please enter a price ending in 0.';
    }

    if (Object.keys(errors).length > 0) {
      setPathAFieldErrors(errors);
      if (errors.plot) setPathAPlotError(errors.plot);
      const orderedFields = [
        'fullName',
        'fatherOrHusbandName',
        'cnic',
        'phone',
        'email',
        'mailingAddress',
        'city',
        'portalPassword',
        'nokName',
        'nokCnic',
        'plot',
        'price',
      ];
      for (const field of orderedFields) {
        if ((errors as any)[field]) {
          setTimeout(() => scrollToField(`pathA_${field}`), 50);
          break;
        }
      }
      return;
    }

    if (!plot) return;

    // Build installment plan config if installment type
    let installmentPlan: any = undefined;
    if (pathAForm.paymentType === 'installment') {
      const totalRows = yearsA * 12;
      const biannualCount = yearsA * 2;
      const monthlyCount = totalRows - 1 - biannualCount - 1;
      installmentPlan = {
        totalPayment: finalPriceA,
        planYears: yearsA,
        years: yearsA,
        downpayment: Math.floor(finalPriceA * 0.25),
        monthlyInstallmentCount: monthlyCount,
        biannualInstallmentCount: biannualCount,
        numberOfInstallments: monthlyCount + biannualCount,
      };
    }

    // If setting payment plan for a held plot on an existing registered member (Super Admin exclusivity):
    if (setPlanCustomer) {
      setPathASubmitting(true);
      setPathASuccess(false);
      const realPlotId = setPlanPlot?.id ||
        (setPlanCustomer as any).bookings?.find((b: any) =>
          b.plotId === queryPlotId ||
          b.plot?.id === queryPlotId ||
          b.plot?.plotNumber === queryPlotId ||
          String(b.plot?.plotNumber) === String(queryPlotId) ||
          (!b.payments || b.payments.length === 0)
        )?.plotId ||
        pathAForm.plotId ||
        queryPlotId;

      const res = await runLane1({
        screen: 'customer-booking',
        isSave: true,
        fn: async () => setPaymentPlanForHeldPlot(session, setPlanCustomer.id, realPlotId, {
          paymentType: pathAForm.paymentType,
          installmentPlan,
          paperInstallmentRef: pathAForm.paperInstallmentRef?.trim() || undefined,
          plotPrice: finalPriceA,
        }),
      });

      if (!res.ok) {
        if (res.error === 'BOOKING_NOT_FOUND' || res.message?.includes('No held booking')) {
          const attachRes = await runLane1({
            screen: 'customer-booking',
            isSave: true,
            fn: async () => addBookingToCustomer(session, {
              customerId: setPlanCustomer.id,
              plotId: realPlotId,
              paymentType: pathAForm.paymentType,
              paperInstallmentRef: pathAForm.paperInstallmentRef,
              lockToken: queryLockToken || undefined,
              reservationId: queryReservationId || undefined,
              installmentPlan,
              plotPrice: finalPriceA,
            }),
          });

          if (!attachRes.ok) {
            handleMapPathAError(attachRes.message || attachRes.error || 'Failed to attach plot to member.');
            return;
          }
        } else {
          handleMapPathAError(res.message || res.error || 'Failed to assign payment plan.');
          return;
        }
      }

      setPathASubmitting(false);
      setPathASuccess(true);
      isCommittedRef.current = true;
      setFeedback({
        type: 'success',
        message: `Official payment plan assigned to Plot ${plot.plotNumber} for ${setPlanCustomer.fullName}!`,
      });

      if (plot) {
        setAgreementModal({
          open: false,
          customer: setPlanCustomer,
          plot: { ...plot, price: finalPriceA },
          paymentType: pathAForm.paymentType,
          paperRef: pathAForm.paperInstallmentRef,
          bookingDate: new Date().toLocaleDateString('en-GB'),
          installmentPlan,
        });
      }

      setTimeout(() => {
        router.push('/admin/customers-directory');
      }, 1200);
      return;
    }

    // If completing registration for a quick-booked member (CR 07 §5):
    if (completeTargetCustomer) {
      setPathASubmitting(true);
      setPathASuccess(false);
      const res = await runLane1({
        screen: 'customer-booking',
        isSave: true,
        fn: async () => completeMemberRegistration(session, {
          customerId: completeTargetCustomer.id,
          cnic: pathAForm.cnic ? formatCnic(pathAForm.cnic) : undefined,
          plotId: pathAForm.plotId || queryPlotId,
          city: memberCity,
          membershipNo: pathAForm.membershipNo,
          fatherOrHusbandName: pathAForm.fatherOrHusbandName,
          phone: pathAForm.phone,
          email: pathAForm.email,
          mailingAddress: pathAForm.mailingAddress,
          nokName: pathAForm.nokName,
          nokCnic: pathAForm.nokCnic ? formatCnic(pathAForm.nokCnic) : pathAForm.nokCnic,
          applicantPhotoUrl: pathAForm.applicantPhotoUrl?.includes('placeholder') ? undefined : pathAForm.applicantPhotoUrl,
          cnicCopyUrl: pathAForm.cnicCopyUrl?.includes('placeholder') ? undefined : pathAForm.cnicCopyUrl,
          nokCnicCopyUrl: pathAForm.nokCnicCopyUrl?.includes('placeholder') ? undefined : pathAForm.nokCnicCopyUrl,
          portalPassword: pathAForm.portalPassword,
          paymentType: pathAForm.paymentType,
          paperInstallmentRef: pathAForm.paperInstallmentRef,
          installmentPlan,
          plotPrice: finalPriceA,
        }),
      });

      if (!res.ok) {
        handleMapPathAError(res.message || res.error || 'Failed to complete registration.');
        return;
      }

      setPathASubmitting(false);
      setPathASuccess(true);
      isCommittedRef.current = true;
      setFeedback({
        type: 'success',
        message: `Member registration completed successfully for ${res.customer?.fullName} on Plot ${plot.plotNumber}!`,
      });

      // Show credentials modal immediately
      setCredentialsModal({
        open: true,
        username: res.credentials?.username || res.customer?.membershipNo || pathAForm.membershipNo,
        password: res.credentials?.password || pathAForm.portalPassword || '',
        customerName: res.customer?.fullName || pathAForm.fullName,
        membershipNo: res.customer?.membershipNo || pathAForm.membershipNo,
      });

      if (res.customer && plot) {
        setAgreementModal({
          open: false,
          customer: res.customer,
          plot: (res as any).plot || { ...plot, price: finalPriceA },
          paymentType: pathAForm.paymentType,
          paperRef: pathAForm.paperInstallmentRef,
          bookingDate: new Date().toLocaleDateString('en-GB'),
          installmentPlan,
        });
      }

      // Background non-blocking load without freezing the UI or credentials modal
      setTimeout(() => {
        loadInitialData();
      }, 50);
      return;
    }

    // If a saved complete member was selected from LiveMemberPicker, attach plot to that member
    if (pathASelectedMember) {
      if (pathASelectedMember.registrationStatus === 'minimal') {
        setFeedback({
          type: 'error',
          message: 'Selected member has a pending minimal registration. Complete registration on their existing file first before adding another plot.',
        });
        return;
      }

      setPathASubmitting(true);
      setPathASuccess(false);
      const res = await runLane1({
        screen: 'customer-booking',
        isSave: true,
        fn: async () => addBookingToCustomer(session, {
          customerId: pathASelectedMember.id,
          plotId: pathAForm.plotId || queryPlotId,
          paymentType: pathAForm.paymentType,
          paperInstallmentRef: pathAForm.paperInstallmentRef,
          lockToken: queryLockToken || undefined,
          reservationId: queryReservationId || undefined,
          installmentPlan,
          plotPrice: finalPriceA,
        }),
      });

      if (!res.ok) {
        handleMapPathAError(res.message || res.error || 'Failed to attach plot to member.');
        return;
      }

      setPathASubmitting(false);
      setPathASuccess(true);
      isCommittedRef.current = true;
      setFeedback({
        type: 'success',
        message: `Plot ${plot.plotNumber} successfully added to member ${pathASelectedMember.fullName} (${pathASelectedMember.membershipNo})!`,
      });

      if (plot) {
        setAgreementModal({
          open: false,
          customer: { ...pathASelectedMember, id: pathASelectedMember.id } as any,
          plot: (res as any).plot || { ...plot, price: finalPriceA },
          paymentType: pathAForm.paymentType,
          paperRef: pathAForm.paperInstallmentRef,
          bookingDate: new Date().toLocaleDateString('en-GB'),
          installmentPlan,
        });
      }
      loadInitialData();
      return;
    }

    setPathASubmitting(true);
    setPathASuccess(false);
    const res = await runLane1({
      screen: 'customer-booking',
      isSave: true,
      fn: async () => createCustomerWithBooking(session, {
        ...pathAForm,
        customerId: undefined,
        cnic: formatCnic(pathAForm.cnic),
        nokCnic: formatCnic(pathAForm.nokCnic),
        lockToken: queryLockToken || undefined,
        reservationId: queryReservationId || undefined,
        installmentPlan,
        portalPassword: canIssueCreds ? pathAForm.portalPassword : '',
        plotPrice: finalPriceA,
      }),
    });

    if (!res.ok) {
      // NOTE: Form values are preserved on failure per specification!
      handleMapPathAError(res.message || res.error || 'Failed to complete booking.');
      return;
    }

    // Mark committed to avoid unmount lock release
    setPathASubmitting(false);
    setPathASuccess(true);
    isCommittedRef.current = true;

    setFeedback({
      type: 'success',
      message: `Booking successfully created for ${res.customer?.fullName} on Plot ${plot.plotNumber}!`,
    });



    // Show Credentials Modal ONLY if credentials were not withheld
    if (res.credentials && res.customer && !res.customer.credentialsPending) {
      setCredentialsModal({
        open: true,
        username: res.credentials.username,
        password: res.credentials.password,
        customerName: res.customer.fullName,
        membershipNo: res.customer.membershipNo,
      });
    } else if (res.customer?.credentialsPending) {
      setFeedback({
        type: 'success',
        message: `Booking created for ${res.customer.fullName}. Portal credentials can be issued later by an authorized administrator.`,
      });
    }

    // Set Agreement Modal data ready
    if (res.customer && plot) {
      setAgreementModal({
        open: false,
        customer: res.customer,
        plot: (res as any).plot || { ...plot, price: finalPriceA },
        paymentType: pathAForm.paymentType,
        paperRef: pathAForm.paperInstallmentRef,
        bookingDate: new Date().toLocaleDateString('en-GB'),
        installmentPlan,
      });
    }

    // Reset Form so there is no stale data in it
    setPathAForm({
      plotId: '',
      paymentType: 'installment',
      paperInstallmentRef: '',
      membershipNo: `PV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      fullName: '',
      fatherOrHusbandName: '',
      cnic: '',
      phone: '',
      email: '',
      mailingAddress: '',
      nokName: '',
      nokCnic: '',
      applicantPhotoUrl: '/media/placeholder-applicant.jpg',
      cnicCopyUrl: '/media/placeholder-cnic.jpg',
      nokCnicCopyUrl: '/media/placeholder-nok.jpg',
      portalPassword: '',
    });
    setSelectedPlotA(null);
    setLockedPlot(null);
    setIsLockedFromMap(false);
    setDocFiles({});
    setPathASelectedMember(null);
    setMemberCity('');
    loadInitialData();
  };

  // ----------------------------------------------------
  // SEARCH PATH B CUSTOMERS & LIVE PICKER HOOK
  // ----------------------------------------------------
  const handleSelectCustomer = async (cust: CustomerDisambiguation) => {
    setPathBFieldErrors((prev) => ({ ...prev, customer: undefined }));
    setSelectingCustomerId(cust.id);
    setSelectedCustomer(cust);
    setIsCustomerConfirmed(false);
    if (session) {
      try {
        const res = await getAdminCustomerById(session, cust.id);
        if (res.ok && res.data) {
          const bookings = res.data.bookings || [];
          setSelectedCustomer({
            ...cust,
            city: (cust as any).city || res.data.city,
            propertiesCount: bookings.length,
            bookings,
          });
        }
      } finally {
        setSelectingCustomerId(null);
      }
    } else {
      setSelectingCustomerId(null);
    }
  };

  // Path B Live debounced search (~250ms)
  useEffect(() => {
    if (!searchQuery.trim() || selectedCustomer) {
      if (!selectedCustomer) {
        setSearchResults([]);
      }
      setIsSearching(false);
      if (pathBSearchAbortRef.current) {
        pathBSearchAbortRef.current.abort();
        pathBSearchAbortRef.current = null;
      }
      return;
    }

    setIsSearching(true);
    setPathBHighlightedIndex(-1);

    if (pathBSearchAbortRef.current) {
      pathBSearchAbortRef.current.abort();
    }
    const controller = new AbortController();
    pathBSearchAbortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        if (!session) return;
        const res = await searchMembersForPicker(session, searchQuery, controller.signal);
        if (!controller.signal.aborted) {
          if (res.ok && res.members) {
            const mapped: CustomerDisambiguation[] = res.members.slice(0, 8).map((m) => ({
              id: m.id,
              fullName: m.fullName,
              membershipNo: m.membershipNo || '',
              cnic: m.cnic,
              phone: m.phone || '',
              propertiesCount: m.plotCount,
              accountStatus: 'active',
              registrationStatus: (m.registrationStatus === 'minimal' ? 'minimal' : 'complete') as 'minimal' | 'complete',
              city: m.city,
            }));
            setSearchResults(mapped);
          } else {
            setSearchResults([]);
          }
          setIsSearching(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setIsSearching(false);
          setSearchResults([]);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, selectedCustomer, session]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await searchMembersForPicker(session, searchQuery);
      if (res && res.ok && res.members) {
        const mapped: CustomerDisambiguation[] = res.members.slice(0, 8).map((m) => ({
          id: m.id,
          fullName: m.fullName,
          membershipNo: m.membershipNo || '',
          cnic: m.cnic,
          phone: m.phone || '',
          propertiesCount: m.plotCount,
          accountStatus: 'active',
          registrationStatus: (m.registrationStatus === 'minimal' ? 'minimal' : 'complete') as 'minimal' | 'complete',
          city: m.city,
        }));
        setSearchResults(mapped);
      }
    } catch (err: any) {
      // non-blocking
    } finally {
      setIsSearching(false);
    }
  };

  // ----------------------------------------------------
  // SUBMIT PATH B (EXISTING CUSTOMER)
  // ----------------------------------------------------
  const handleSubmitPathB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setPathBPlotError(null);
    setPathBFieldErrors({});

    const errors: { customer?: string; plot?: string; price?: string } = {};

    if (!selectedCustomer) {
      errors.customer = 'Please search and select an existing customer record.';
    } else if (!isCustomerConfirmed) {
      errors.customer = 'Please click "Confirm & Proceed to Plot Attachment" to confirm customer identity.';
    }

    // Prerequisite verification: use selectedPlotB, lockedPlot or load once with getAdminPlotDetails
    // Prerequisite verification: use plot already loaded on the form
    let plot = (selectedPlotB && selectedPlotB.id === pathBPlotId)
      ? selectedPlotB
      : (lockedPlot && lockedPlot.id === pathBPlotId ? lockedPlot : selectedPlotB);

    if (!plot) {
      errors.plot = 'Please select a plot to attach to this customer.';
    } else if (plot.category === 'amenity') {
      errors.plot = 'Amenity utility plots cannot be booked or sold.';
    } else if (session.role !== 'super_admin' && !session.assignedBlocks.includes(plot.blockId)) {
      errors.plot = `Plot ${plot.plotNumber} (${plot.blockId}) is outside your assigned administrative block scope.`;
    }

    const canEditPriceB = Boolean(
      session.role === 'super_admin' ||
      (session.role === 'sub_admin' &&
        (session.permissions?.can_book || (session.permissions?.can_create_customer && session.permissions?.can_view_customers)) &&
        Array.isArray(session.assignedBlocks) &&
        session.assignedBlocks.includes(plot?.blockId || ''))
    );

    const finalPriceB = (canEditPriceB && totalPaymentB > 0) ? toPlainNumber(totalPaymentB) : (plot ? toPlainNumber(plot.price) : 0);

    if (!finalPriceB || isNaN(finalPriceB) || finalPriceB <= 0) {
      errors.price = 'Total Payment (Plot Price) must be a valid positive amount greater than zero.';
    } else if (finalPriceB % 10 !== 0 || !Number.isInteger(finalPriceB)) {
      errors.price = 'Plot price must end in 0 (e.g. 2,500,000). Please enter a price ending in 0.';
    }

    if (Object.keys(errors).length > 0) {
      setPathBFieldErrors(errors);
      if (errors.plot) setPathBPlotError(errors.plot);
      const orderedFields = ['customer', 'plot', 'price'];
      for (const field of orderedFields) {
        if ((errors as any)[field]) {
          if (field === 'customer') {
            if (selectedCustomer && !isCustomerConfirmed) {
              setTimeout(() => scrollToField('pathB_confirm_btn'), 50);
            } else {
              setTimeout(() => scrollToField('pathB_customer'), 50);
            }
          } else {
            setTimeout(() => scrollToField(`pathB_${field}`), 50);
          }
          break;
        }
      }
      return;
    }

    if (!plot || !selectedCustomer) return;

    // Build installment plan config if installment type
    let installmentPlan: any = undefined;
    if (pathBPaymentType === 'installment') {
      const totalRows = yearsB * 12;
      const biannualCount = yearsB * 2;
      const monthlyCount = totalRows - 1 - biannualCount - 1;
      installmentPlan = {
        totalPayment: finalPriceB,
        planYears: yearsB,
        years: yearsB,
        downpayment: Math.floor(finalPriceB * 0.25),
        monthlyInstallmentCount: monthlyCount,
        biannualInstallmentCount: biannualCount,
        numberOfInstallments: monthlyCount + biannualCount,
      };
    }

    setPathBSubmitting(true);
    setPathBSuccess(false);
    let res: any;
    if (querySetPlanCustomer || setPlanCustomer) {
      const targetCustId = selectedCustomer.id || querySetPlanCustomer;
      res = await runLane1({
        screen: 'customer-booking',
        isSave: true,
        fn: async () => setPaymentPlanForHeldPlot(session, targetCustId, pathBPlotId, {
          paymentType: pathBPaymentType,
          installmentPlan,
          paperInstallmentRef: pathBPaperRef?.trim() || undefined,
          plotPrice: finalPriceB,
        }),
      });
      if (!res.ok && (res.error === 'BOOKING_NOT_FOUND' || res.message?.includes('No held booking'))) {
        res = await runLane1({
          screen: 'customer-booking',
          isSave: true,
          fn: async () => addBookingToCustomer(session, {
            customerId: targetCustId,
            plotId: pathBPlotId,
            paymentType: pathBPaymentType,
            paperInstallmentRef: pathBPaperRef,
            lockToken: queryLockToken || undefined,
            reservationId: queryReservationId || undefined,
            installmentPlan,
            plotPrice: finalPriceB,
          }),
        });
      }
    } else {
      res = await runLane1({
        screen: 'customer-booking',
        isSave: true,
        fn: async () => addBookingToCustomer(session, {
          customerId: selectedCustomer.id,
          plotId: pathBPlotId,
          paymentType: pathBPaymentType,
          paperInstallmentRef: pathBPaperRef,
          lockToken: queryLockToken || undefined,
          reservationId: queryReservationId || undefined,
          installmentPlan,
          plotPrice: finalPriceB,
        }),
      });
    }

    if (!res.ok) {
      // NOTE: Form values are preserved on failure per specification!
      setPathBSubmitting(false);
      const msg = res.message || res.error || 'Failed to attach booking.';
      const lower = msg.toLowerCase();
      let failedField = '';
      if (lower.includes('price')) {
        setPathBFieldErrors((prev) => ({ ...prev, price: msg }));
        failedField = 'pathB_price';
      } else if (lower.includes('plot') || lower.includes('lock') || lower.includes('block')) {
        setPathBFieldErrors((prev) => ({ ...prev, plot: msg }));
        setPathBPlotError(msg);
        failedField = 'pathB_plot';
      } else if (lower.includes('customer') || lower.includes('member')) {
        setPathBFieldErrors((prev) => ({ ...prev, customer: msg }));
        failedField = 'pathB_customer';
      } else {
        setPathBFieldErrors((prev) => ({ ...prev, customer: msg }));
        failedField = 'pathB_customer';
        setFeedback({ type: 'error', message: msg });
      }
      if (failedField) {
        setTimeout(() => scrollToField(failedField), 50);
      }
      return;
    }

    // Mark committed to avoid unmount lock release
    setPathBSubmitting(false);
    setPathBSuccess(true);
    isCommittedRef.current = true;

    setFeedback({
      type: 'success',
      message: `Additional plot ${plot.plotNumber} successfully booked for ${selectedCustomer.fullName}!`,
    });



    // Open Printable Agreement Modal
    setAgreementModal({
      open: true,
      customer: selectedCustomer as any,
      plot: res.plot || { ...plot, price: finalPriceB },
      paymentType: pathBPaymentType,
      paperRef: pathBPaperRef,
      bookingDate: new Date().toLocaleDateString('en-GB'),
      installmentPlan,
    });

    // Reset Path B selection if not query mode
    if (!queryPlotId) {
      setSelectedCustomer(null);
      setIsCustomerConfirmed(false);
      setPathBPlotId('');
      setSelectedPlotB(null);
    }
    loadInitialData();
  };

  // ----------------------------------------------------
  // SUBMIT ADMIN QUICK BOOKING (CR 07 §5)
  // ----------------------------------------------------
  const handleSubmitSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSubAdminPlotError(null);
    setSubAdminFieldErrors({});

    const errors: { plot?: string; customerName?: string; cnic?: string; city?: string; nokCnic?: string; price?: string } = {};

    const targetPlotId = lockedPlot ? lockedPlot.id : subAdminPlotId;
    if (!targetPlotId) {
      errors.plot = 'Please select an available plot to book.';
    }

    // Prerequisite verification: use plot already loaded on the form
    let plot = (lockedPlot && lockedPlot.id === targetPlotId)
      ? lockedPlot
      : (selectedPlotA && selectedPlotA.id === targetPlotId ? selectedPlotA : lockedPlot);

    if (targetPlotId && !plot) {
      errors.plot = 'Plot details could not be loaded. Please re-select the plot.';
    } else if (plot) {
      if (plot.category === 'amenity') {
        errors.plot = 'Amenity utility plots cannot be booked or sold.';
      } else if (session.role !== 'super_admin' && !session.assignedBlocks.includes(plot.blockId)) {
        errors.plot = `Plot ${plot.plotNumber} (${plot.blockId}) is outside your assigned administrative block scope.`;
      }
    }

    if (!subAdminForm.customerName || !subAdminForm.customerName.trim()) {
      errors.customerName = 'Please enter the customer full name.';
    }

    if (!subAdminForm.cnic || !subAdminForm.cnic.trim()) {
      errors.cnic = 'Please enter customer CNIC.';
    } else if (!isValidCnic(subAdminForm.cnic)) {
      errors.cnic = 'CNIC must be exactly 13 digits in 00000-0000000-0 format.';
    }

    const effectiveCity = subAdminSelectedMember?.city || subAdminForm.city;
    if (!effectiveCity || !effectiveCity.trim()) {
      errors.city = 'Please enter the customer city.';
    }

    const effectiveNokCnic = subAdminSelectedMember?.nokCnic || subAdminForm.nokCnic;
    if (!effectiveNokCnic || !effectiveNokCnic.trim()) {
      errors.nokCnic = 'Please enter Next of Kin CNIC.';
    } else if (!isValidCnic(effectiveNokCnic)) {
      errors.nokCnic = 'Next of Kin CNIC must be exactly 13 digits in 00000-0000000-0 format.';
    }

    const parsedSubAdminPrice = toPlainNumber(subAdminForm.price);
    if (!parsedSubAdminPrice || parsedSubAdminPrice <= 0) {
      errors.price = 'Plot price must be greater than 0.';
    } else if (parsedSubAdminPrice % 10 !== 0 || !Number.isInteger(parsedSubAdminPrice)) {
      errors.price = 'Plot price must end in 0 (e.g. 2,500,000). Please enter a price ending in 0.';
    }

    if (Object.keys(errors).length > 0) {
      setSubAdminFieldErrors(errors);
      if (errors.plot) setSubAdminPlotError(errors.plot);
      const orderedFields = ['plot', 'customerName', 'cnic', 'city', 'nokCnic', 'price'];
      for (const field of orderedFields) {
        if ((errors as any)[field]) {
          setTimeout(() => scrollToField(`subAdmin_${field}`), 50);
          break;
        }
      }
      return;
    }

    if (!plot) return;

    setSubAdminSubmitting(true);
    const res = await runLane1({
      screen: 'customer-booking',
      isSave: true,
      fn: async () => createMinimalBooking(session, {
        plotId: plot!.id,
        customerName: subAdminForm.customerName,
        cnic: subAdminForm.cnic,
        city: effectiveCity,
        nokCnic: effectiveNokCnic,
        lockToken: queryLockToken || undefined,
        reservationId: queryReservationId || undefined,
        customerId: subAdminSelectedMember?.id || subAdminForm.customerId || undefined,
        plotPrice: parsedSubAdminPrice,
      }),
    });
    setSubAdminSubmitting(false);

    if (!res.ok) {
      const msg = res.message || res.error || 'Failed to complete quick booking.';
      const lower = msg.toLowerCase();
      let failedField = '';
      if (lower.includes('cnic') && (lower.includes('nok') || lower.includes('kin') || lower.includes('nominee'))) {
        setSubAdminFieldErrors((prev) => ({ ...prev, nokCnic: msg }));
        failedField = 'subAdmin_nokCnic';
      } else if (lower.includes('cnic')) {
        setSubAdminFieldErrors((prev) => ({ ...prev, cnic: msg }));
        failedField = 'subAdmin_cnic';
      } else if (lower.includes('price')) {
        setSubAdminFieldErrors((prev) => ({ ...prev, price: msg }));
        failedField = 'subAdmin_price';
      } else if (lower.includes('city')) {
        setSubAdminFieldErrors((prev) => ({ ...prev, city: msg }));
        failedField = 'subAdmin_city';
      } else if (lower.includes('name')) {
        setSubAdminFieldErrors((prev) => ({ ...prev, customerName: msg }));
        failedField = 'subAdmin_customerName';
      } else if (lower.includes('plot') || lower.includes('lock') || lower.includes('block')) {
        setSubAdminFieldErrors((prev) => ({ ...prev, plot: msg }));
        setSubAdminPlotError(msg);
        failedField = 'subAdmin_plot';
      } else {
        setSubAdminFieldErrors((prev) => ({ ...prev, customerName: msg }));
        failedField = 'subAdmin_customerName';
        setFeedback({ type: 'error', message: msg });
      }
      if (failedField) {
        setTimeout(() => scrollToField(failedField), 50);
      }
      return;
    }

    isCommittedRef.current = true;
    setFeedback({
      type: 'success',
      message: `Quick booking successfully created for ${res.customer?.fullName} on Plot ${plot.plotNumber} (Booked - Pending Formalities)!`,
    });

    setSubAdminForm({ customerName: '', cnic: '', city: '', nokCnic: '', customerId: '', price: '' });
    setSubAdminSelectedMember(null);
    if (!queryPlotId) {
      setSubAdminPlotId('');
    }
    loadInitialData();
  };

  // ----------------------------------------------------
  // RESET CUSTOMER PASSWORD HANDLER
  // ----------------------------------------------------
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !resetModalCustomer) return;

    setResetPasswordError(null);
    setIsResettingPassword(true);

    try {
      const res = await runLane1({
        screen: 'customer-booking',
        isSave: true,
        fn: async () => resetCustomerPassword(
          session,
          resetModalCustomer.id,
          resetNewPassword.trim() || undefined
        ),
      });

      if (res.ok && res.newPassword) {
        const customerRef = resetModalCustomer;
        setResetModalCustomer(null);
        setResetNewPassword('');
        setAgreementModal(null);
        setCredentialsModal({
          open: true,
          username: customerRef.membershipNo,
          password: res.newPassword,
          customerName: customerRef.fullName,
          membershipNo: customerRef.membershipNo,
        });
        setFeedback({
          type: 'success',
          message: `Portal password reset successfully for Member ${customerRef.fullName} (${customerRef.membershipNo}).`,
        });
      } else {
        setResetPasswordError(toSafeErrorMessage(res.message || res.error || 'Failed to reset password.'));
      }
    } catch {
      setResetPasswordError('An unexpected error occurred while resetting password.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!session) {
    return null;
  }

  // Permission Guard - Box 2: Create Customer Account and View Customer Directory
  const hasCustomerAccess = session?.role === 'super_admin' || Boolean(session?.permissions?.can_create_customer && session?.permissions?.can_view_customers);
  if (!hasCustomerAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Customer Registration</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your administrative account does not have permission to create customer records or view the customer directory. Contact administration to adjust your privileges.
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

  // Set Payment Plan Submit Handler (Super Admin Exclusivity)
  const handleSetPaymentPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setPlanSubmitting) return;

    const cur = session || getActiveAdminSession();
    if (!cur || cur.role !== 'super_admin') {
      setFeedback({ type: 'error', message: 'Only the Super Admin can set payment plans.' });
      return;
    }

    if (!setPlanCustomer || !queryPlotId) {
      setFeedback({ type: 'error', message: 'Target member or plot not found.' });
      return;
    }

    const authoritativePrice = (setPlanPlot?.price && toPlainNumber(setPlanPlot.price) > 0)
      ? toPlainNumber(setPlanPlot.price)
      : setPlanPrice;

    if (authoritativePrice <= 0 || isNaN(authoritativePrice)) {
      setFeedback({ type: 'error', message: 'Please enter a valid plot price (PKR).' });
      return;
    }

    let installmentPlan: any = undefined;
    if (setPlanPaymentType === 'installment') {
      const totalRows = setPlanYears * 12;
      const biannualCount = setPlanYears * 2;
      const monthlyCount = totalRows - 1 - biannualCount - 1;
      installmentPlan = {
        totalPayment: authoritativePrice,
        planYears: setPlanYears,
        years: setPlanYears,
        downpayment: Math.floor(authoritativePrice * 0.25),
        monthlyInstallmentCount: monthlyCount,
        biannualInstallmentCount: biannualCount,
        numberOfInstallments: monthlyCount + biannualCount,
      };
    }

    setSetPlanSubmitting(true);
    try {
      const realPlotId = setPlanPlot?.id ||
        (setPlanCustomer as any).bookings?.find((b: any) =>
          b.plotId === queryPlotId ||
          b.plot?.id === queryPlotId ||
          b.plot?.plotNumber === queryPlotId ||
          String(b.plot?.plotNumber) === String(queryPlotId) ||
          (!b.payments || b.payments.length === 0)
        )?.plotId ||
        queryPlotId;

      const res = await runLane1({
        screen: 'customer-booking',
        isSave: true,
        fn: async () => setPaymentPlanForHeldPlot(cur, setPlanCustomer.id, realPlotId, {
          paymentType: setPlanPaymentType,
          installmentPlan,
          paperInstallmentRef: setPlanPaperRef.trim() || undefined,
          plotPrice: authoritativePrice,
        }),
      });

      if (!res.ok) {
        setFeedback({ type: 'error', message: res.message || res.error || 'Failed to assign payment plan.' });
        setSetPlanSubmitting(false);
        return;
      }

      setFeedback({
        type: 'success',
        message: `Official payment plan assigned to Plot ${setPlanPlot?.plotNumber || queryPlotId} for ${setPlanCustomer.fullName}!`,
      });

      const updatedPlot = (res as any).plot || (setPlanPlot ? { ...setPlanPlot, price: setPlanPrice } : { plotNumber: queryPlotId, blockId: '', size: '', price: setPlanPrice, category: 'residential' });
      setAgreementModal({
        open: true,
        customer: setPlanCustomer,
        plot: updatedPlot,
        paymentType: setPlanPaymentType,
        paperRef: setPlanPaperRef.trim() || undefined,
        bookingDate: new Date().toLocaleDateString('en-GB'),
        installmentPlan,
      });

      setSetPlanSubmitting(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error assigning payment plan.' });
      setSetPlanSubmitting(false);
    }
  };

  // Calculations for Set Payment Plan Mode
  const planSet = (setPlanPrice > 0 && setPlanPaymentType === 'installment')
    ? generateFrontendSchedule({ plotPriceRupees: setPlanPrice, planYears: setPlanYears })
    : null;

  const canIssueCredentials = session?.role === 'super_admin' || Boolean(session?.permissions?.can_create_customer && session?.permissions?.can_view_customers);

  const canEditPriceA = Boolean(
    session?.role === 'super_admin' ||
    (session?.role === 'sub_admin' &&
      (session?.permissions?.can_book || (session?.permissions?.can_create_customer && session?.permissions?.can_view_customers)) &&
      Array.isArray(session?.assignedBlocks) &&
      selectedPlotA &&
      session.assignedBlocks.includes(selectedPlotA.blockId))
  );

  const canEditPriceB = Boolean(
    session?.role === 'super_admin' ||
    (session?.role === 'sub_admin' &&
      (session?.permissions?.can_book || (session?.permissions?.can_create_customer && session?.permissions?.can_view_customers)) &&
      Array.isArray(session?.assignedBlocks) &&
      selectedPlotB &&
      session.assignedBlocks.includes(selectedPlotB.blockId))
  );

  // Calculations for Path A
  const effectivePriceA = (canEditPriceA && totalPaymentA > 0) ? totalPaymentA : (selectedPlotA?.price || 0);
  const planA = (selectedPlotA && pathAForm.paymentType === 'installment')
    ? generateFrontendSchedule({ plotPriceRupees: effectivePriceA, planYears: yearsA })
    : null;

  // Calculations for Path B
  const effectivePriceB = (canEditPriceB && totalPaymentB > 0) ? totalPaymentB : (selectedPlotB?.price || 0);
  const planB = (selectedPlotB && pathBPaymentType === 'installment')
    ? generateFrontendSchedule({ plotPriceRupees: effectivePriceB, planYears: yearsB })
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Action Toast Feedback Popup */}
      <AdminActionToast feedback={feedback} onClose={() => setFeedback(null)} />

      {/* Master Plan Active Soft Lock Banner (Item 3) */}
      {isLockedFromMap && lockedPlot && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-serif font-bold text-emerald-950">
                  Master Plan 10-Minute Lock Active
                </h3>
                <span className="font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
                  Plot {lockedPlot.plotNumber} • Sector {lockedPlot.blockId.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Lock token held for {session?.fullName}. You can book this plot as a <strong>New Customer (Path A)</strong> or switch to <strong>Existing Customer (Path B)</strong> — the locked plot remains held in both.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCancelLockAndReturn}
              className="px-4 py-2 bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-700 hover:text-rose-800 font-bold text-xs rounded-xl border border-rose-200 hover:border-rose-300 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel & Release Lock</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin 3-Field Quick Booking Flow (CR 07 §5) */}
      {session?.role === 'sub_admin' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-serif tracking-tight">
                Quick Plot Booking (Admin)
              </h1>
              <p className="text-xs text-slate-500">
                Streamlined 3-field quick booking flow. Payment schedule and member credentials will be finalized upon formal member registration.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitSubAdmin} noValidate className="space-y-5">
            {/* Target Plot Display / Selector */}
            <div id="subAdmin_plot">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Target Plot *
              </label>
              {lockedPlot ? (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-emerald-700" />
                    <div>
                      <div className="font-bold text-sm text-emerald-950 font-mono">
                        Sector {lockedPlot.blockId.toUpperCase()} • Plot {lockedPlot.plotNumber}
                      </div>
                      <div className="text-xs text-emerald-800 font-mono mt-0.5">
                        Size: {lockedPlot.size} • Price: PKR {lockedPlot.price.toLocaleString()} • Category: {lockedPlot.category.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-950 font-bold px-3 py-1 rounded-full border border-emerald-400 font-mono">
                    Locked For Booking
                  </span>
                </div>
              ) : (
                <PlotSelector
                  value={subAdminPlotId}
                  onChange={(val) => {
                    setSubAdminPlotId(val);
                    setSubAdminFieldErrors((prev) => ({ ...prev, plot: undefined }));
                  }}
                  onSelectPlot={(p) => {
                    setRegisteredPlotsCache([p]);
                    const clean = toPlainNumber(p.price);
                    setSubAdminForm((prev) => ({ ...prev, price: clean > 0 ? String(clean) : '' }));
                    setSubAdminFieldErrors((prev) => ({ ...prev, plot: undefined, price: undefined }));
                  }}
                  onErrorClear={() => {
                    setSubAdminPlotError(null);
                    setSubAdminFieldErrors((prev) => ({ ...prev, plot: undefined }));
                  }}
                  session={session}
                />
              )}
              {(subAdminFieldErrors.plot || subAdminPlotError) && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  {subAdminFieldErrors.plot || subAdminPlotError}
                </p>
              )}
            </div>

            {/* 5 Quick Booking Fields */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div id="subAdmin_customerName">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Full Name <span className="text-rose-500">*</span>
                </label>
                <LiveMemberPicker
                  value={subAdminForm.customerName}
                  onChange={(val) => {
                    setSubAdminForm((prev) => ({ ...prev, customerName: val }));
                    setSubAdminFieldErrors((prev) => ({ ...prev, customerName: undefined }));
                  }}
                  selectedMember={subAdminSelectedMember}
                  onSelectMember={(member) => {
                    setSubAdminSelectedMember(member);
                    if (member) {
                      setSubAdminForm((prev) => ({
                        ...prev,
                        customerName: member.fullName,
                        cnic: member.cnic ? formatCnic(member.cnic) : prev.cnic,
                        city: member.city || prev.city,
                        nokCnic: member.nokCnic ? formatCnic(member.nokCnic) : prev.nokCnic,
                        customerId: member.id,
                      }));
                      setSubAdminFieldErrors((prev) => ({ ...prev, customerName: undefined, cnic: undefined, city: undefined, nokCnic: undefined }));
                    } else {
                      setSubAdminForm((prev) => ({ ...prev, customerId: '' }));
                    }
                  }}
                  placeholder="e.g. Hamza Tariq (type to search)"
                  required
                />
                {subAdminFieldErrors.customerName && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {subAdminFieldErrors.customerName}
                  </p>
                )}
              </div>

              <div id="subAdmin_cnic">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Customer CNIC <span className="text-rose-500">*</span></span>
                  {subAdminSelectedMember && (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </label>
                <LiveCnicMemberPicker
                  value={subAdminForm.cnic}
                  onChange={(val) => {
                    setSubAdminForm((prev) => ({ ...prev, cnic: val }));
                    setSubAdminFieldErrors((prev) => ({ ...prev, cnic: undefined }));
                  }}
                  selectedMember={subAdminSelectedMember}
                  onSelectMember={(member) => {
                    setSubAdminSelectedMember(member);
                    if (member) {
                      setSubAdminForm((prev) => ({
                        ...prev,
                        customerName: member.fullName,
                        cnic: member.cnic ? formatCnic(member.cnic) : prev.cnic,
                        city: member.city || prev.city,
                        nokCnic: member.nokCnic ? formatCnic(member.nokCnic) : prev.nokCnic,
                        customerId: member.id,
                      }));
                      setSubAdminFieldErrors((prev) => ({ ...prev, customerName: undefined, cnic: undefined, city: undefined, nokCnic: undefined }));
                    } else {
                      setSubAdminForm((prev) => ({ ...prev, customerId: '' }));
                    }
                  }}
                  placeholder="00000-0000000-0"
                  required
                />
                {subAdminFieldErrors.cnic && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {subAdminFieldErrors.cnic}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>City <span className="text-rose-500">*</span></span>
                  {subAdminSelectedMember && (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </label>
                <input
                  id="subAdmin_city"
                  type="text"
                  required
                  value={subAdminForm.city}
                  disabled={Boolean(subAdminSelectedMember)}
                  onChange={(e) => {
                    setSubAdminForm({ ...subAdminForm, city: e.target.value });
                    setSubAdminFieldErrors((prev) => ({ ...prev, city: undefined }));
                  }}
                  placeholder="e.g. Abbottabad, Lahore"
                  className={`w-full px-3 py-2 text-xs rounded-xl border transition-all ${
                    subAdminSelectedMember
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-700 cursor-not-allowed'
                      : subAdminFieldErrors.city
                        ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                        : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                  }`}
                />
                {subAdminFieldErrors.city && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {subAdminFieldErrors.city}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Next of Kin CNIC <span className="text-rose-500">*</span></span>
                  {subAdminSelectedMember && (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </label>
                <input
                  id="subAdmin_nokCnic"
                  type="text"
                  required
                  maxLength={15}
                  value={subAdminForm.nokCnic}
                  disabled={Boolean(subAdminSelectedMember)}
                  onChange={(e) => {
                    setSubAdminForm({ ...subAdminForm, nokCnic: formatCnic(e.target.value) });
                    setSubAdminFieldErrors((prev) => ({ ...prev, nokCnic: undefined }));
                  }}
                  placeholder="00000-0000000-0"
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border transition-all ${
                    subAdminSelectedMember
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-700 cursor-not-allowed'
                      : subAdminFieldErrors.nokCnic
                        ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                        : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                  }`}
                />
                {subAdminFieldErrors.nokCnic && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {subAdminFieldErrors.nokCnic}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Plot Price (PKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="subAdmin_price"
                  type="number"
                  required
                  min={1}
                  step="any"
                  value={subAdminForm.price}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                    setSubAdminForm({ ...subAdminForm, price: cleanVal });
                    setSubAdminFieldErrors((prev) => ({ ...prev, price: undefined }));
                  }}
                  placeholder="Enter plot price"
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-mono font-bold ${
                    subAdminFieldErrors.price
                      ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                      : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                  }`}
                />
                {subAdminFieldErrors.price && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {subAdminFieldErrors.price}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-950 leading-relaxed">
              ℹ️ <strong>Formalities Pending:</strong> Submitting this quick booking will secure the plot immediately as <strong>Booked (Pending Formalities)</strong> to prevent double-booking. Member registration and issuance of membership credentials can be finalized in the Customer Directory.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              {queryReturnBlock && (
                <button
                  type="button"
                  onClick={handleCancelLockAndReturn}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel & Return to Map
                </button>
              )}
              <button
                type="submit"
                disabled={subAdminSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{subAdminSubmitting ? 'Booking Plot...' : 'Confirm Quick Booking'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
                    {/* Header & Navigation Pills / Completion Mode Banner */}
          {completeTargetCustomer || queryCompleteCustomer ? (
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-50 border-2 border-amber-500/40 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                      Complete Member Registration
                    </span>
                    <span className="text-xs text-amber-900 font-bold">
                      Admin Quick Booking Formalities
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-slate-900 font-serif">
                    {completeTargetCustomer ? (
                      `${completeTargetCustomer.fullName} (${formatCnic(completeTargetCustomer.cnic)})`
                    ) : (queryCustomerName || queryCustomerCnic) ? (
                      `${queryCustomerName}${queryCustomerCnic ? ` (${formatCnic(queryCustomerCnic)})` : ''}`
                    ) : (
                      <span className="inline-block h-5 w-48 bg-amber-300/40 animate-pulse rounded align-middle" />
                    )}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Establish installment schedule on the 5th of each month, and issue official portal access credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelLockAndReturn}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel &amp; Return to Directory</span>
              </button>
            </div>
          ) : setPlanCustomer || querySetPlanCustomer ? (
            <div className="bg-gradient-to-r from-emerald-600/15 via-teal-600/10 to-emerald-50 border-2 border-emerald-600/40 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider">
                      Set Payment Plan
                    </span>
                    <span className="text-xs text-emerald-900 font-bold">
                      Existing Registered Member • Held Plot Assignment
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-slate-900 font-serif">
                    {setPlanCustomer ? (
                      `${setPlanCustomer.fullName} (${setPlanCustomer.membershipNo || formatCnic(setPlanCustomer.cnic)})`
                    ) : (queryCustomerName || queryCustomerCnic) ? (
                      `${queryCustomerName}${queryCustomerCnic ? ` (${formatCnic(queryCustomerCnic)})` : ''}`
                    ) : (
                      <span className="inline-block h-5 w-48 bg-emerald-300/40 animate-pulse rounded align-middle" />
                    )}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Assign official payment schedule and generate ledger bills for Plot {setPlanPlot?.plotNumber || queryPlotNumber || queryPlotId}. Existing member profile details are prefilled.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelLockAndReturn}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel &amp; Return to Directory</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 font-serif tracking-tight">
                      Customer Registration &amp; Plot Bookings
                    </h1>
                    <p className="text-xs text-slate-500">
                      Official society paper application workflow with customizable installment schedules and physical paperwork.
                    </p>
                  </div>
                </div>

                {/* Path Toggle Pills */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('path_a')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'path_a'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Path A: New Customer</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('path_b')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'path_b'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Path B: Existing Customer</span>
                  </button>
                </div>
              </div>
            </div>
          )}

      {/* Plot Held by Another Officer Banner */}
      {plotLockHolder && (
        <div id="plot-locked-by-other-banner" className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-center gap-3 text-amber-950 font-medium text-xs shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <strong className="font-bold text-amber-900 block text-sm">Plot Held by Another Officer</strong>
            <span>Plot {selectedPlotA?.plotNumber || queryPlotNumber || queryPlotId} is currently held by <strong className="font-bold text-amber-950">{plotLockHolder}</strong>. The plot details are visible, but saving is disabled until the hold is released.</span>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* PATH A: FULL PAPER BOOKING FORM (NEW CUSTOMER)       */}
      {/* ==================================================== */}
      {activeTab === 'path_a' && (
        <form onSubmit={handleSubmitPathA} noValidate className="space-y-6">


          {/* Section 1: Applicant Details */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">1</span>
              <h2 className="text-sm font-bold text-slate-800 font-serif">Applicant Particulars</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Membership No. *
                </label>
                <input
                  type="text"
                  required
                  value={pathAForm.membershipNo}
                  onChange={(e) => setPathAForm({ ...pathAForm, membershipNo: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div id="pathA_fullName">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name of Applicant *
                </label>
                <LiveMemberPicker
                  value={pathAForm.fullName}
                  onChange={(val) => {
                    setPathAForm((prev) => ({ ...prev, fullName: val }));
                    setPathAFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                  }}
                  selectedMember={pathASelectedMember}
                  onSelectMember={async (member) => {
                    setPathASelectedMember(member);
                    if (member) {
                      if (member.registrationStatus === 'minimal') {
                        if (session) {
                          const res = await getAdminCustomerById(session, member.id);
                          if (res.ok && res.data) {
                            setCompleteTargetCustomer(res.data);
                          }
                        }
                      }
                      setPathAForm((prev) => ({
                        ...prev,
                        fullName: member.fullName,
                        cnic: member.cnic ? formatCnic(member.cnic) : prev.cnic,
                        phone: member.phone || prev.phone,
                        email: member.email || prev.email,
                        membershipNo: member.membershipNo || prev.membershipNo,
                      }));
                      setPathAFieldErrors((prev) => ({ ...prev, fullName: undefined, cnic: undefined, phone: undefined, email: undefined }));
                      if (member.city) {
                        setMemberCity(member.city);
                        setPathAFieldErrors((prev) => ({ ...prev, city: undefined }));
                      }
                    } else {
                      if (completeTargetCustomer && completeTargetCustomer.id === pathASelectedMember?.id) {
                        setCompleteTargetCustomer(null);
                      }
                    }
                  }}
                  placeholder="e.g. Muhammad Aslam Khan (type name, CNIC, phone or membership #)"
                  required
                />
                {pathAFieldErrors.fullName && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {pathAFieldErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father / Husband Name (S/O or W/O) *
                </label>
                <input
                  id="pathA_fatherOrHusbandName"
                  type="text"
                  required
                  placeholder="e.g. Haji Abdul Rasheed"
                  value={pathAForm.fatherOrHusbandName}
                  onChange={(e) => {
                    setPathAForm({ ...pathAForm, fatherOrHusbandName: e.target.value });
                    setPathAFieldErrors((prev) => ({ ...prev, fatherOrHusbandName: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border transition-all ${
                    pathAFieldErrors.fatherOrHusbandName
                      ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                      : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                  }`}
                />
                {pathAFieldErrors.fatherOrHusbandName && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {pathAFieldErrors.fatherOrHusbandName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  13-Digit CNIC *
                </label>
                <input
                  id="pathA_cnic"
                  type="text"
                  required
                  maxLength={15}
                  placeholder="00000-0000000-0"
                  value={pathAForm.cnic}
                  onChange={(e) => {
                    setPathAForm({ ...pathAForm, cnic: formatCnic(e.target.value) });
                    setPathAFieldErrors((prev) => ({ ...prev, cnic: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border transition-all ${
                    pathAFieldErrors.cnic
                      ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                      : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                  }`}
                />
                {pathAFieldErrors.cnic ? (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {pathAFieldErrors.cnic}
                  </p>
                ) : (
                  <span className="text-[10px] text-slate-400">13 digits in 00000-0000000-0 format</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile / Phone Number *
                </label>
                <input
                  id="pathA_phone"
                  type="text"
                  required
                  maxLength={12}
                  placeholder="0300-1234567"
                  value={pathAForm.phone}
                  onChange={(e) => {
                    setPathAForm({ ...pathAForm, phone: formatPhone(e.target.value) });
                    setPathAFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border transition-all ${
                    pathAFieldErrors.phone
                      ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                      : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                  }`}
                />
                {pathAFieldErrors.phone ? (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {pathAFieldErrors.phone}
                  </p>
                ) : (
                  <span className="text-[10px] text-slate-400">Cannot exceed 11 digits (e.g. 0300-1234567)</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="pathA_email"
                  type="email"
                  required
                  placeholder="aslam@example.com"
                  value={pathAForm.email}
                  onChange={(e) => {
                    setPathAForm({ ...pathAForm, email: e.target.value });
                    setPathAFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border transition-all ${
                    pathAFieldErrors.email
                      ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                      : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                  }`}
                />
                {pathAFieldErrors.email && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {pathAFieldErrors.email}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Permanent / Mailing Address *
                </label>
                <input
                  id="pathA_mailingAddress"
                  type="text"
                  required
                  placeholder="House #, Street #, Sector/Area"
                  value={pathAForm.mailingAddress}
                  onChange={(e) => {
                    setPathAForm({ ...pathAForm, mailingAddress: e.target.value });
                    setPathAFieldErrors((prev) => ({ ...prev, mailingAddress: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border transition-all ${
                    pathAFieldErrors.mailingAddress
                      ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                      : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                  }`}
                />
                {pathAFieldErrors.mailingAddress && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {pathAFieldErrors.mailingAddress}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City *
                </label>
                <input
                  id="pathA_city"
                  type="text"
                  required
                  placeholder="e.g. Islamabad, Peshawar"
                  value={memberCity}
                  onChange={(e) => {
                    setMemberCity(e.target.value);
                    setPathAFieldErrors((prev) => ({ ...prev, city: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border transition-all ${
                    pathAFieldErrors.city
                      ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                      : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                  }`}
                />
                {pathAFieldErrors.city ? (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {pathAFieldErrors.city}
                  </p>
                ) : (
                  <span className="text-[10px] text-slate-400">City is saved on member profile</span>
                )}
              </div>

              {/* Member Portal Login Credentials Gate (Item 4) */}
              <div className="md:col-span-3 p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Lock className="w-4 h-4 text-emerald-700" />
                    <span>Customer Portal Login Credentials</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Username is customer&apos;s Membership Number
                  </span>
                </div>

                {!canIssueCredentials ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-950">Portal Credentials Notice</div>
                      <p className="mt-0.5 text-amber-800 leading-relaxed">
                        Login credentials cannot be issued by your account. An authorized administrator can generate them later from the Customer Directory.
                      </p>
                    </div>
                  </div>
                ) : setPlanCustomer ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">Existing Member Portal Account Active</span>
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          Member signs in using Membership # <strong className="font-mono">{setPlanCustomer.membershipNo}</strong>. Credentials are already active on file.
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                      Active Account
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Portal Username (Membership No.)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={pathAForm.membershipNo}
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded-xl border border-slate-200 cursor-not-allowed"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Customer signs into portal using their Membership Number.
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Initial Portal Password * (min 8 chars)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
                            let p = 'PV-';
                            for (let i = 0; i < 6; i++) {
                              p += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            setPathAForm((prev) => ({ ...prev, portalPassword: p }));
                            setPathAFieldErrors((prev) => ({ ...prev, portalPassword: undefined }));
                          }}
                          className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Generate Secure
                        </button>
                      </div>
                      <input
                        id="pathA_portalPassword"
                        type="text"
                        required
                        minLength={8}
                        placeholder="Enter member portal password"
                        value={pathAForm.portalPassword || ''}
                        onChange={(e) => {
                          setPathAForm({ ...pathAForm, portalPassword: e.target.value });
                          setPathAFieldErrors((prev) => ({ ...prev, portalPassword: undefined }));
                        }}
                        className={`w-full px-3 py-2 text-xs font-mono rounded-xl border transition-all ${
                          pathAFieldErrors.portalPassword
                            ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                            : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                        }`}
                      />
                      {pathAFieldErrors.portalPassword ? (
                        <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          {pathAFieldErrors.portalPassword}
                        </p>
                      ) : (
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Minimum 8 characters. Member can change this later in their profile.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Next of Kin */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">2</span>
              <h2 className="text-sm font-bold text-slate-800 font-serif">Next of Kin (Nominee)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominee Full Name *
                </label>
                <input
                  id="pathA_nokName"
                  type="text"
                  required
                  placeholder="e.g. Farooq Aslam Khan"
                  value={pathAForm.nokName}
                  onChange={(e) => {
                    setPathAForm({ ...pathAForm, nokName: e.target.value });
                    setPathAFieldErrors((prev) => ({ ...prev, nokName: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border transition-all ${
                    pathAFieldErrors.nokName
                      ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                      : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                  }`}
                />
                {pathAFieldErrors.nokName && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {pathAFieldErrors.nokName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominee 13-Digit CNIC *
                </label>
                <input
                  id="pathA_nokCnic"
                  type="text"
                  required
                  maxLength={15}
                  placeholder="00000-0000000-0"
                  value={pathAForm.nokCnic}
                  onChange={(e) => {
                    setPathAForm({ ...pathAForm, nokCnic: formatCnic(e.target.value) });
                    setPathAFieldErrors((prev) => ({ ...prev, nokCnic: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border transition-all ${
                    pathAFieldErrors.nokCnic
                      ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                      : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                  }`}
                />
                {pathAFieldErrors.nokCnic ? (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {pathAFieldErrors.nokCnic}
                  </p>
                ) : (
                  <span className="text-[10px] text-slate-400">13 digits in 00000-0000000-0 format</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Plot Selection & Prerequisite Verification */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">3</span>
              <h2 className="text-sm font-bold text-slate-800 font-serif">Plot Selection & Master Plan Prerequisite</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div id="pathA_plot">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Registered Plot *
                </label>
                {Boolean(queryPlotId) || Boolean(queryCompleteCustomer) || Boolean(completeTargetCustomer) || isLockedFromMap || Boolean(lockedPlot) ? (
                  <div id="locked-plot-card" className="p-3 bg-slate-100 border border-slate-300 rounded-xl space-y-1">
                    <div className="text-xs font-bold text-slate-900 font-mono flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        {(selectedPlotA || lockedPlot) ? (
                          `Plot ${(selectedPlotA || lockedPlot)?.plotNumber} (${((selectedPlotA || lockedPlot)?.blockId || '').toUpperCase()}), ${(selectedPlotA || lockedPlot)?.size}, PKR ${((selectedPlotA || lockedPlot)?.price || 0).toLocaleString()}`
                        ) : plotLoading ? (
                          <span className="text-slate-500 font-sans font-normal text-xs flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 inline" />
                            Loading plot...
                          </span>
                        ) : (
                          <span className="text-rose-600 font-sans text-xs">Plot could not be loaded</span>
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {(completeTargetCustomer || queryCompleteCustomer)
                        ? 'Selection locked to the plot already booked for this member.'
                        : 'Selection locked to the plot chosen on the master plan.'}
                    </p>
                  </div>
                ) : (
                  <PlotSelector
                    value={pathAForm.plotId}
                    onChange={(val) => {
                      handleVerifyPlotA(val);
                      setPathAFieldErrors((prev) => ({ ...prev, plot: undefined }));
                    }}
                    onSelectPlot={(p) => {
                      setRegisteredPlotsCache([p]);
                      const cleanPrice = toPlainNumber(p.price);
                      const normalizedPlot = { ...p, price: cleanPrice };
                      setSelectedPlotA(normalizedPlot);
                      setTotalPaymentA(cleanPrice);
                      setPathAFieldErrors((prev) => ({ ...prev, plot: undefined, price: undefined }));
                    }}
                    session={session}
                  />
                )}
                {pathAFieldErrors.plot && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {pathAFieldErrors.plot}
                  </p>
                )}
              </div>

              {/* Live Plot Verification Card */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Master Plan Verification Status
                </label>
                {selectedPlotA ? (
                  <div id="plot-verification-card" className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Plot Registered &amp; Available
                      </span>
                      <span className="font-mono font-bold uppercase text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300">
                        {selectedPlotA.blockId}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-200/70 text-[11px]">
                      <div>
                        <span className="text-emerald-700">Plot Number:</span>{' '}
                        <strong className="text-emerald-950 font-mono">{selectedPlotA.plotNumber}</strong>
                      </div>
                      <div>
                        <span className="text-emerald-700">Category:</span>{' '}
                        <strong className="text-emerald-950 capitalize">{selectedPlotA.category} ({selectedPlotA.size})</strong>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-emerald-700">Plot Purchase Price:</span>{' '}
                        <strong className="text-emerald-950 font-mono text-sm">PKR {selectedPlotA.price.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                ) : plotLoading ? (
                  <div id="plot-verification-card" className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                    <span>Loading plot details from master plan...</span>
                  </div>
                ) : pathAPlotError ? (
                  <div id="plot-verification-card" className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Prerequisite Check Failed</div>
                      <p className="mt-0.5 text-rose-800">{pathAPlotError}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                    Select a plot to verify registration against society master plan.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Payment Terms & Dynamic Installment Engine (Item 6) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">4</span>
              <h2 className="text-sm font-bold text-slate-800 font-serif">Payment Terms & Financial Schedule Engine</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Type *
                </label>
                <select
                  value={pathAForm.paymentType}
                  onChange={(e) =>
                    setPathAForm({ ...pathAForm, paymentType: e.target.value as PaymentType })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 font-medium"
                >
                  <option value="installment">Installment Payment Plan (Customizable)</option>
                  <option value="one_time">Full Upfront Payment</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paper Installment Book / Manual Receipt # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BK-2026-902"
                  value={pathAForm.paperInstallmentRef || ''}
                  onChange={(e) =>
                    setPathAForm({ ...pathAForm, paperInstallmentRef: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            {/* One-Time Payment Form Fields */}
            {pathAForm.paymentType === 'one_time' && selectedPlotA && (
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900 font-serif">One-Time Full Settlement Parameters</span>
                  {session?.role === 'super_admin' ? (
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded border border-indigo-200">
                      Super Admin: Editable Price (Updates map on submit)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Official Fixed Price
                    </span>
                  )}
                </div>

                <div className="max-w-xs">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Total Payment (Plot Price) *
                    </label>
                    {session?.role === 'super_admin' && (
                      <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        Super Admin
                      </span>
                    )}
                  </div>
                  {canEditPriceA ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-bold text-slate-500">PKR</span>
                        <input
                          id="pathA_price"
                          type="number"
                          required
                          min={1}
                          step="any"
                          value={totalPaymentA || ''}
                          onWheel={(e) => e.currentTarget.blur()}
                          onChange={(e) => {
                            setTotalPaymentA(toPlainNumber(e.target.value));
                            setPathAFieldErrors((prev) => ({ ...prev, price: undefined }));
                          }}
                          placeholder="Enter plot price"
                          className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border ${
                            pathAFieldErrors.price
                              ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                              : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                          } bg-white`}
                        />
                      </div>
                      {pathAFieldErrors.price && (
                        <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          {pathAFieldErrors.price}
                        </p>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={selectedPlotA.price > 0 ? `PKR ${selectedPlotA.price.toLocaleString()}` : 'Price not set'}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded-xl border border-slate-200 cursor-not-allowed"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Installment Form Fields: Fixed Prime View Schedule */}
            {pathAForm.paymentType === 'installment' && selectedPlotA && (
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900 font-serif">Fixed Prime View Installment Schedule</span>
                  <span className="text-[11px] text-slate-500 font-medium">Standard 4-Way Pool Division (25% / 38.2% / 28.8% / 8%)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Total Payment */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Total Payment (Plot Price) *
                      </label>
                      {session?.role === 'super_admin' ? (
                        <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          Super Admin
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-medium flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Fixed
                        </span>
                      )}
                    </div>
                    {canEditPriceA ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono font-bold text-slate-500">PKR</span>
                          <input
                            id="pathA_price"
                            type="number"
                            required
                            min={1}
                            step="any"
                            value={totalPaymentA || ''}
                            onWheel={(e) => e.currentTarget.blur()}
                            onChange={(e) => {
                              setTotalPaymentA(toPlainNumber(e.target.value));
                              setPathAFieldErrors((prev) => ({ ...prev, price: undefined }));
                            }}
                            placeholder="Enter plot price"
                            className={`w-full px-2.5 py-2 text-xs font-mono font-bold rounded-xl border ${
                              pathAFieldErrors.price
                                ? 'border-rose-400 focus:border-rose-600 ring-1 ring-rose-400/20'
                                : 'border-slate-300 focus:outline-hidden focus:border-emerald-600'
                            } bg-white`}
                          />
                        </div>
                        {pathAFieldErrors.price && (
                          <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            {pathAFieldErrors.price}
                          </p>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={selectedPlotA.price > 0 ? `PKR ${selectedPlotA.price.toLocaleString()}` : 'Price not set'}
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded-xl border border-slate-200 cursor-not-allowed"
                      />
                    )}
                  </div>

                  {/* Plan Length Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Plan Length (Years) *
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setYearsA(y)}
                          className={`py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                            yearsA === y
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {y} {y === 1 ? 'Year' : 'Years'}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {(yearsA * 12) - 2 - (yearsA * 2)} Monthly bills + {yearsA * 2} Bi-annual bills + Down payment + Possession
                    </span>
                  </div>
                </div>

                {/* Interactive Preview Schedule Table */}
                {planA && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">Down payment (25%)</span>
                        <span className="text-sm font-mono font-bold text-emerald-950 mt-0.5 block">
                          PKR {planA[0].amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-emerald-700">Paid upfront</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                        <span className="text-[10px] uppercase font-bold text-blue-800 block">Monthly Pool (38.2%)</span>
                        <span className="text-sm font-mono font-bold text-blue-950 mt-0.5 block">
                          PKR {(Math.floor((Math.round(effectivePriceA * 100) * 382) / 1000) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-blue-700">{(yearsA * 12) - 2 - (yearsA * 2)} monthly bills</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                        <span className="text-[10px] uppercase font-bold text-sky-800 block">Bi-annual Pool (28.8%)</span>
                        <span className="text-sm font-mono font-bold text-sky-950 mt-0.5 block">
                          PKR {(Math.floor((Math.round(effectivePriceA * 100) * 288) / 1000) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-sky-700">{yearsA * 2} bi-annual bills</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                        <span className="text-[10px] uppercase font-bold text-purple-800 block">Possession (8% + rem)</span>
                        <span className="text-sm font-mono font-bold text-purple-950 mt-0.5 block">
                          PKR {(planA.find((r) => r.feeType === 'plot_possession')?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-purple-700">Final handover</span>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="px-3 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Preview Installment Schedule ({planA.length} Rows)</span>
                        <span className="text-[11px] font-mono text-slate-600">Total: PKR {effectivePriceA.toLocaleString()}</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider font-semibold">
                            <tr>
                              <th className="py-2 px-3">Year</th>
                              <th className="py-2 px-3">Payment Type</th>
                              <th className="py-2 px-3">Due Date</th>
                              <th className="py-2 px-3 text-right">Amount</th>
                              <th className="py-2 px-3 text-right">Cumulative Paid</th>
                              <th className="py-2 px-3 text-right">Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {planA.map((row) => (
                              <tr key={row.seq} className="hover:bg-slate-50 transition-colors">
                                <td className="py-1.5 px-3 text-slate-600">Year {row.year}</td>
                                <td className="py-1.5 px-3 font-sans font-medium text-slate-800">{row.label}</td>
                                <td className="py-1.5 px-3 text-slate-600">{row.dueDateStr}</td>
                                <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                                  PKR {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-1.5 px-3 text-right text-emerald-700 font-semibold">
                                  PKR {row.cumulativePaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-1.5 px-3 text-right text-slate-700">
                                  PKR {row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Financial Breakdown Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5">
              {selectedPlotA && pathAForm.paymentType === 'installment' && planA && (
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Plot Downpayment (25% Collected Upfront):</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    PKR {planA[0].amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Paid)
                  </span>
                </div>
              )}
              {selectedPlotA && pathAForm.paymentType === 'one_time' && (
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Plot Full Upfront Payment:</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    PKR {(effectivePriceA || selectedPlotA.price).toLocaleString(undefined, { minimumFractionDigits: 2 })} (Paid)
                  </span>
                </div>
              )}
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-slate-600 font-bold">
                <span>Total Upfront Settlement on Enrollment:</span>
                <span className="font-mono font-bold text-slate-900">
                  PKR {(pathAForm.paymentType === 'installment' && planA ? planA[0].amount : (effectivePriceA || selectedPlotA?.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Physical Document Attachments */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">5</span>
                <h2 className="text-sm font-bold text-slate-800 font-serif">Physical Document Attachments</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Customer Paperwork &amp; Physical Documents</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. Applicant Photo */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">Applicant Photo</label>
                    {docFiles.photo ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3" /> Attached
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Required</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Verified passport size photo</p>
                </div>

                {docFiles.photo ? (
                  <div className="relative group rounded-xl border border-emerald-300 bg-white p-2.5 flex items-center gap-3">
                    <img
                      src={docFiles.photo.dataUrl}
                      alt="Applicant Photo Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{docFiles.photo.name}</p>
                      <p className="text-[10px] text-slate-500">{docFiles.photo.sizeKb} KB • Ready</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile('photo')}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="relative border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-5 flex flex-col items-center justify-center gap-2 bg-white hover:bg-emerald-50/40 cursor-pointer transition group">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={docUploading === 'photo'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('photo', file);
                      }}
                    />
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                      {docUploading === 'photo' ? (
                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-800 block">
                        Upload Photo
                      </span>
                      <span className="text-[10px] text-slate-400">JPEG, PNG up to 5MB</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {completeTargetCustomer ? (
              <button
                type="button"
                onClick={handleCancelLockAndReturn}
                className="px-5 py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
              >
                Cancel &amp; Return to Customer Directory
              </button>
            ) : isLockedFromMap || (queryPlotId && queryLockToken) ? (
              <button
                type="button"
                onClick={handleCancelLockAndReturn}
                className="px-5 py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
              >
                Cancel &amp; Return to Master Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/admin/dashboard')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              id="submit-booking-btn"
              type="submit"
              disabled={pathASubmitting || Boolean(plotLockHolder)}
              className="px-6 py-2.5 bg-[#10251E] hover:bg-[#18392C] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2 min-w-[260px]"
            >
              {pathASubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span>Saving…</span>
                </>
              ) : pathASuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Success!</span>
                </>
              ) : plotLockHolder ? (
                <>
                  <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Held by {plotLockHolder} (Save Disabled)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{setPlanCustomer ? 'Assign Payment Plan & Activate Ledger' : completeTargetCustomer ? 'Complete Registration & Issue Portal Credentials' : 'Submit Application & Register Plot'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* PATH B: EXISTING CUSTOMER SEARCH & ATTACH            */}
      {/* ==================================================== */}
      {activeTab === 'path_b' && (
        <div className="space-y-6">
          {/* Step 1: Customer Lookup */}
          <div id="pathB_customer" className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <h2 className="text-sm font-bold text-slate-800 font-serif">Search Existing Customer Record</h2>
                <p className="text-[11px] text-slate-500">
                  Search by Member Name, 13-digit CNIC, or Mobile Number.
                </p>
              </div>
            </div>

            {/* If a customer is selected, show identity badge with Clear control */}
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-xl text-xs shadow-xs transition-all">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm font-serif font-bold text-emerald-950 truncate">
                        {selectedCustomer.fullName}
                      </strong>
                      {selectedCustomer.membershipNo && (
                        <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                          {selectedCustomer.membershipNo}
                        </span>
                      )}
                      <span className="font-mono text-xs text-emerald-800">
                        {selectedCustomer.cnic}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700 flex items-center gap-2 mt-0.5">
                      {selectedCustomer.phone && <span>Ph: {selectedCustomer.phone}</span>}
                      {(selectedCustomer as any).city && <span>• {(selectedCustomer as any).city}</span>}
                      <span>•</span>
                      <span className="font-bold">
                        {selectedCustomer.propertiesCount} {selectedCustomer.propertiesCount === 1 ? 'Plot' : 'Plots'} on file
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setIsCustomerConfirmed(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="ml-3 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:text-rose-700 hover:bg-rose-50 border border-emerald-300 hover:border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                  title="Clear selection and unlock search"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear &amp; Change</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSearchSubmit} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Search by customer name, membership #, CNIC, or mobile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      const totalItems = searchResults.length;
                      if (totalItems === 0) return;
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setPathBHighlightedIndex((prev) => (prev + 1) % totalItems);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setPathBHighlightedIndex((prev) => (prev - 1 + totalItems) % totalItems);
                      } else if (e.key === 'Enter') {
                        if (pathBHighlightedIndex >= 0 && pathBHighlightedIndex < searchResults.length) {
                          e.preventDefault();
                          handleSelectCustomer(searchResults[pathBHighlightedIndex]);
                        }
                      } else if (e.key === 'Escape') {
                        setSearchResults([]);
                      }
                    }}
                    autoComplete="off"
                    className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2 min-w-[110px]"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Search className="w-3.5 h-3.5 shrink-0" />}
                  <span>{isSearching ? 'Searching…' : 'Search'}</span>
                </button>
              </form>
            )}

            {pathBFieldErrors.customer && (
              <p className="text-[11px] text-rose-600 font-medium mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                {pathBFieldErrors.customer}
              </p>
            )}

            {/* Live Results Table (updates while typing, max 8 rows) */}
            {searchQuery.trim() && !selectedCustomer && (isSearching || searchResults.length > 0) && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>
                    {isSearching
                      ? 'Searching members...'
                      : `Found ${searchResults.length} Matching Profiles (Click row or press Enter to select)`}
                  </span>
                  <span>Max 8 rows</span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  {searchResults.map((cust, idx) => {
                    const isHighlighted = idx === pathBHighlightedIndex;
                    return (
                      <div
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        onMouseEnter={() => setPathBHighlightedIndex(idx)}
                        className={`p-3.5 flex items-center justify-between gap-4 transition cursor-pointer ${
                          isHighlighted ? 'bg-blue-50/90 text-blue-950' : 'bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-xs font-serif font-bold text-slate-900">
                              {cust.fullName}
                            </strong>
                            {cust.membershipNo && (
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200">
                                {cust.membershipNo}
                              </span>
                            )}
                            <span className="font-mono text-[11px] text-slate-500">
                              CNIC: {cust.cnic}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 flex-wrap">
                            {cust.phone && <span>Ph: {cust.phone}</span>}
                            {(cust as any).city && <span>• {(cust as any).city}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                            {cust.propertiesCount} {cust.propertiesCount === 1 ? 'Plot' : 'Plots'}
                          </span>
                          <button
                            type="button"
                            disabled={Boolean(selectingCustomerId)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCustomer(cust);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs min-w-[125px] flex items-center justify-center gap-1.5"
                          >
                            {selectingCustomerId === cust.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                <span>Opening…</span>
                              </>
                            ) : (
                              <span>Select Customer</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Confirmation Step */}
          {selectedCustomer && (
            <div className="bg-white rounded-2xl border-2 border-blue-200/90 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 font-serif">
                      Confirmation Step: Verify Identity
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Explicit confirmation required to prevent accidental attachment to duplicate names.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setIsCustomerConfirmed(false);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Change Customer
                </button>
              </div>

              {/* Confirmation Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Selected Customer Name:</span>
                    <strong className="text-slate-900 text-sm font-serif">{selectedCustomer.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">13-Digit CNIC:</span>
                    <strong className="text-slate-900 font-mono text-sm">{selectedCustomer.cnic}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Current Property Count:</span>
                    <strong className="text-indigo-900 text-sm font-bold">
                      {selectedCustomer.propertiesCount} {selectedCustomer.propertiesCount === 1 ? 'Plot' : 'Plots'} Registered
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div>
                    Membership No: <strong className="font-mono">{selectedCustomer.membershipNo}</strong> • Phone: <strong className="font-mono">{selectedCustomer.phone}</strong>
                  </div>
                  {selectedCustomer.accountStatus === 'suspended' ? (
                    <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Account Suspended - Plot Attachment Prohibited
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Account Active
                    </span>
                  )}
                </div>
              </div>

              {/* Explicit Confirmation Action */}
              {selectedCustomer.accountStatus === 'suspended' ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Cannot attach new bookings: Customer account is currently suspended.</span>
                </div>
              ) : !isCustomerConfirmed ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl gap-3">
                  <span className="text-xs text-amber-950 font-medium">
                    Please verify that the Name, CNIC, and current property count correspond to the intended applicant.
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setResetModalCustomer(selectedCustomer);
                        setResetNewPassword('');
                        setResetPasswordError(null);
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reset Portal Password</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (selectedCustomer && !(selectedCustomer as any).bookings && session) {
                          const res = await getAdminCustomerById(session, selectedCustomer.id);
                          if (res.ok && res.data) {
                            const bookings = res.data.bookings || [];
                            setSelectedCustomer({
                              ...selectedCustomer,
                              propertiesCount: bookings.length,
                              bookings,
                            });
                          }
                        }
                        setPathBFieldErrors((prev) => ({ ...prev, customer: undefined }));
                        setIsCustomerConfirmed(true);
                      }}
                      id="pathB_confirm_btn"
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Customer & Proceed</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Identity Confirmed: {selectedCustomer.fullName} ({selectedCustomer.cnic}). Ready to attach additional plot booking.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalCustomer(selectedCustomer);
                      setResetNewPassword('');
                      setResetPasswordError(null);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Portal Password</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Previous Bookings Section */}
          {selectedCustomer && isCustomerConfirmed && (() => {
            const bookings = (selectedCustomer as any).bookings || [];
            return (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-indigo-700" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Previous Booking Records ({bookings.length})
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {bookings.length === 1 ? '1 active plot registered under this membership.' : `${bookings.length} active plots registered under this membership.`}
                      </p>
                    </div>
                  </div>
                </div>

                {bookings.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                    No previous bookings recorded for this member.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {bookings.map((b: any, idx: number) => {
                      const p = b.plot || {};
                      const block = p.blockId || b.block || b.blockId || 'Block';
                      const plotNumber = p.plotNumber || b.plotNumber || 'N/A';
                      const size = p.size || b.size || 'Standard';
                      return (
                        <div
                          key={b.id || idx}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-xs text-slate-900">
                              {block}: {plotNumber}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              Size: {size}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Booked
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Step 3: Attach Plot (Only after confirmation) */}
          {selectedCustomer && isCustomerConfirmed && selectedCustomer.accountStatus !== 'suspended' && (
            <form onSubmit={handleSubmitPathB} noValidate className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">3</span>
                <h2 className="text-sm font-bold text-slate-800 font-serif">Attach Plot & Select Financial Schedule</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div id="pathB_plot">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Registered Plot *
                  </label>
                  {Boolean(queryPlotId) || isLockedFromMap || Boolean(lockedPlot) ? (
                    <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl space-y-1">
                      <div className="text-xs font-bold text-slate-900 font-mono flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>
                          {plotLoading ? (
                            <span className="text-slate-500 font-sans font-normal text-xs flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 inline" />
                              Loading plot...
                            </span>
                          ) : (selectedPlotB || lockedPlot) ? (
                            `Plot ${(selectedPlotB || lockedPlot)?.plotNumber} (${((selectedPlotB || lockedPlot)?.blockId || '').toUpperCase()}) - Locked from Master Plan`
                          ) : (
                            <span className="text-rose-600 font-sans text-xs">Plot could not be loaded</span>
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Selection prefilled and locked read-only via Master Plan lock token.
                      </p>
                    </div>
                  ) : (
                    <>
                      <PlotSelector
                        value={pathBPlotId}
                        onChange={(id) => {
                          handleVerifyPlotB(id);
                          setPathBFieldErrors((prev) => ({ ...prev, plot: undefined }));
                        }}
                        onSelectPlot={(p) => {
                          setRegisteredPlotsCache([p]);
                          const cleanPrice = toPlainNumber(p.price);
                          const normalizedPlot = { ...p, price: cleanPrice };
                          setSelectedPlotB(normalizedPlot);
                          setTotalPaymentB(cleanPrice);
                          setPathBFieldErrors((prev) => ({ ...prev, plot: undefined, price: undefined }));
                        }}
                        session={session}
                      />
                      {pathBFieldErrors.plot && (
                        <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          {pathBFieldErrors.plot}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Plot verification */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Master Plan Status
                  </label>
                  {pathBPlotError ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                      {pathBPlotError}
                    </div>
                  ) : selectedPlotB ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                      <span><strong>Plot {selectedPlotB.plotNumber}</strong> ({selectedPlotB.size}, {selectedPlotB.category})</span>
                      <span className="font-bold font-mono">PKR {selectedPlotB.price.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 italic">
                      Select a plot to verify.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Type *
                  </label>
                  <select
                    value={pathBPaymentType}
                    onChange={(e) => setPathBPaymentType(e.target.value as PaymentType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 font-medium"
                  >
                    <option value="installment">Installment Payment Plan (Customizable)</option>
                    <option value="one_time">Full Upfront Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Paper Installment Book / Manual Receipt # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BK-2026-903"
                    value={pathBPaperRef}
                    onChange={(e) => setPathBPaperRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* One-Time Payment Parameters for Path B */}
              {pathBPaymentType === 'one_time' && selectedPlotB && (
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-900 font-serif">One-Time Full Settlement Parameters</span>
                    {session?.role === 'super_admin' ? (
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded border border-indigo-200">
                        Super Admin: Editable Price (Updates map on submit)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Official Fixed Price
                      </span>
                    )}
                  </div>

                  <div className="max-w-xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Total Payment (Plot Price) *
                      </label>
                      {session?.role === 'super_admin' && (
                        <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          Super Admin
                        </span>
                      )}
                    </div>
                    {canEditPriceB ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono font-bold text-slate-500">PKR</span>
                          <input
                            id="pathB_price"
                            type="number"
                            required
                            min={1}
                            step="any"
                            value={totalPaymentB || ''}
                            onWheel={(e) => e.currentTarget.blur()}
                            onChange={(e) => {
                              setTotalPaymentB(toPlainNumber(e.target.value));
                              setPathBFieldErrors((prev) => ({ ...prev, price: undefined }));
                            }}
                            placeholder="Enter plot price"
                            className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border ${
                              pathBFieldErrors.price
                                ? 'border-rose-400 ring-2 ring-rose-200 focus:border-rose-500'
                                : 'border-slate-300 focus:border-emerald-600'
                            } focus:outline-hidden bg-white`}
                          />
                        </div>
                        {pathBFieldErrors.price && (
                          <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            {pathBFieldErrors.price}
                          </p>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={selectedPlotB.price > 0 ? `PKR ${selectedPlotB.price.toLocaleString()}` : 'Price not set'}
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded-xl border border-slate-200 cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Installment Plan Parameters for Path B: Fixed Prime View Schedule */}
              {pathBPaymentType === 'installment' && selectedPlotB && (
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-900 font-serif">Fixed Prime View Installment Schedule</span>
                    <span className="text-[11px] text-slate-500 font-medium">Standard 4-Way Pool Division (25% / 38.2% / 28.8% / 8%)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Total Price */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Total Payment (Plot Price) *
                        </label>
                        {session?.role === 'super_admin' ? (
                          <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            Super Admin
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-medium flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Fixed
                          </span>
                        )}
                      </div>
                      {canEditPriceB ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono font-bold text-slate-500">PKR</span>
                            <input
                              id="pathB_price"
                              type="number"
                              required
                              min={1}
                              step="any"
                              value={totalPaymentB || ''}
                              onWheel={(e) => e.currentTarget.blur()}
                              onChange={(e) => {
                                setTotalPaymentB(toPlainNumber(e.target.value));
                                setPathBFieldErrors((prev) => ({ ...prev, price: undefined }));
                              }}
                              placeholder="Enter plot price"
                              className={`w-full px-2.5 py-2 text-xs font-mono font-bold rounded-xl border ${
                                pathBFieldErrors.price
                                  ? 'border-rose-400 ring-2 ring-rose-200 focus:border-rose-500'
                                  : 'border-slate-300 focus:border-emerald-600'
                              } focus:outline-hidden bg-white`}
                            />
                          </div>
                          {pathBFieldErrors.price && (
                            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              {pathBFieldErrors.price}
                            </p>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          disabled
                          value={selectedPlotB.price > 0 ? `PKR ${selectedPlotB.price.toLocaleString()}` : 'Price not set'}
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded-xl border border-slate-200 cursor-not-allowed"
                        />
                      )}
                    </div>

                    {/* Plan Length Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Plan Length (Years) *
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 2, 3, 4, 5].map((y) => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => setYearsB(y)}
                            className={`py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                              yearsB === y
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {y} {y === 1 ? 'Year' : 'Years'}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {(yearsB * 12) - 2 - (yearsB * 2)} Monthly bills + {yearsB * 2} Bi-annual bills + Down payment + Possession
                      </span>
                    </div>
                  </div>

                  {/* Interactive Preview Schedule Table */}
                  {planB && (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block">Down payment (25%)</span>
                          <span className="text-sm font-mono font-bold text-emerald-950 mt-0.5 block">
                            PKR {planB[0].amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-emerald-700">Paid upfront</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                          <span className="text-[10px] uppercase font-bold text-blue-800 block">Monthly Pool (38.2%)</span>
                          <span className="text-sm font-mono font-bold text-blue-950 mt-0.5 block">
                            PKR {(Math.floor((Math.round(effectivePriceB * 100) * 382) / 1000) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-blue-700">{(yearsB * 12) - 2 - (yearsB * 2)} monthly bills</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                          <span className="text-[10px] uppercase font-bold text-sky-800 block">Bi-annual Pool (28.8%)</span>
                          <span className="text-sm font-mono font-bold text-sky-950 mt-0.5 block">
                            PKR {(Math.floor((Math.round(effectivePriceB * 100) * 288) / 1000) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-sky-700">{yearsB * 2} bi-annual bills</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                          <span className="text-[10px] uppercase font-bold text-purple-800 block">Possession (8% + rem)</span>
                          <span className="text-sm font-mono font-bold text-purple-950 mt-0.5 block">
                            PKR {(planB.find((r) => r.feeType === 'plot_possession')?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-purple-700">Final handover</span>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        <div className="px-3 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">Preview Installment Schedule ({planB.length} Rows)</span>
                          <span className="text-[11px] font-mono text-slate-600">Total: PKR {effectivePriceB.toLocaleString()}</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider font-semibold">
                              <tr>
                                <th className="py-2 px-3">Year</th>
                                <th className="py-2 px-3">Payment Type</th>
                                <th className="py-2 px-3">Due Date</th>
                                <th className="py-2 px-3 text-right">Amount</th>
                                <th className="py-2 px-3 text-right">Cumulative Paid</th>
                                <th className="py-2 px-3 text-right">Balance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                              {planB.map((row) => (
                                <tr key={row.seq} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-1.5 px-3 text-slate-600">Year {row.year}</td>
                                  <td className="py-1.5 px-3 font-sans font-medium text-slate-800">{row.label}</td>
                                  <td className="py-1.5 px-3 text-slate-600">{row.dueDateStr}</td>
                                  <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                                    PKR {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-1.5 px-3 text-right text-emerald-700 font-semibold">
                                    PKR {row.cumulativePaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-1.5 px-3 text-right text-slate-700">
                                    PKR {row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                {isLockedFromMap && (
                  <button
                    type="button"
                    onClick={handleCancelLockAndReturn}
                    className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    Cancel & Release Lock
                  </button>
                )}
                <button
                  type="submit"
                  disabled={pathBSubmitting || pathBSuccess}
                  className="px-6 py-2.5 bg-[#10251E] hover:bg-[#18392C] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2 min-w-[240px]"
                >
                  {pathBSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <span>Saving…</span>
                    </>
                  ) : pathBSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Success!</span>
                    </>
                  ) : (
                    <>
                      <Building className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span>Attach Plot Booking to Customer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  )}



      {/* ==================================================== */}
      {/* ADMIN-SIDE RESET CUSTOMER PASSWORD MODAL             */}
      {/* ==================================================== */}
      {resetModalCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-white">Reset Portal Password</h3>
                  <p className="text-[11px] text-slate-400">Admin-mediated password recovery</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalCustomer(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Member Name:</span>
                  <strong className="text-slate-900">{resetModalCustomer.fullName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Membership No. (Username):</span>
                  <strong className="font-mono text-emerald-800">{resetModalCustomer.membershipNo}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">CNIC:</span>
                  <span className="font-mono text-slate-700">{resetModalCustomer.cnic}</span>
                </div>
              </div>

              {resetPasswordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{resetPasswordError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    New Portal Password (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
                      let p = 'PV-';
                      for (let i = 0; i < 5; i++) {
                        p += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setResetNewPassword(p);
                    }}
                    className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Generate Random Secure
                  </button>
                </div>
                <input
                  type="text"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate, or enter min 8 chars"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
                <p className="text-[10px] text-slate-400">
                  If left blank, a secure random 8-character password will be created automatically.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModalCustomer(null)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {isResettingPassword ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>Confirm Reset</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CREDENTIALS RELAY MODAL                              */}
      {/* ==================================================== */}
      {credentialsModal?.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-5 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-[#D4AF37]">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base">Account Credentials Generated</h3>
                  <p className="text-[11px] text-emerald-200">Relay these credentials to the member</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (copyCredsTimeoutRef.current) clearTimeout(copyCredsTimeoutRef.current);
                  setCredentialsModal(null);
                  if (completeTargetCustomer) {
                    router.push('/admin/customers-directory');
                  } else {
                    window.location.replace('/admin/customers');
                  }
                }}
                className="text-emerald-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                The member account credentials for <strong>{credentialsModal.customerName}</strong> ({credentialsModal.membershipNo}) are ready:
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Username / Membership No:</span>
                  <strong className="font-mono text-slate-900">{credentialsModal.username}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Active Password:</span>
                  <strong className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {credentialsModal.password}
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Username: ${credentialsModal.username}\nPassword: ${credentialsModal.password}`
                    );
                    setCopiedCreds(true);
                    if (copyCredsTimeoutRef.current) clearTimeout(copyCredsTimeoutRef.current);
                    copyCredsTimeoutRef.current = setTimeout(() => {
                      if (completeTargetCustomer) {
                        router.push('/admin/customers-directory');
                      } else {
                        window.location.replace('/admin/customers');
                      }
                    }, 1000);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedCreds ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copy Credentials</span>
                    </>
                  )}
                </button>

                {agreementModal && (
                  <button
                    type="button"
                    onClick={() => {
                      if (copyCredsTimeoutRef.current) clearTimeout(copyCredsTimeoutRef.current);
                      setCredentialsModal(null);
                      setAgreementModal((prev) => (prev ? { ...prev, open: true } : null));
                    }}
                    className="px-4 py-2 bg-[#10251E] hover:bg-[#18392C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>View Agreement</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (copyCredsTimeoutRef.current) clearTimeout(copyCredsTimeoutRef.current);
                    setCredentialsModal(null);
                    if (completeTargetCustomer) {
                      router.push('/admin/customers-directory');
                    } else {
                      window.location.replace('/admin/customers');
                    }
                  }}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {completeTargetCustomer ? 'Go to Directory' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STYLED PRINTABLE BOOKING AGREEMENT MODAL             */}
      {/* ==================================================== */}
      <BookingAgreementModal
        open={Boolean(agreementModal?.open)}
        onClose={() => {
          setAgreementModal((prev) => (prev ? { ...prev, open: false } : null));
          if (completeTargetCustomer) {
            router.push('/admin/customers-directory');
          } else {
            window.location.replace('/admin/customers');
          }
        }}
        data={agreementModal ? {
          customer: agreementModal.customer as any,
          plot: agreementModal.plot,
          paymentType: agreementModal.paymentType,
          paperRef: agreementModal.paperRef,
          bookingDate: agreementModal.bookingDate,
          installmentPlan: agreementModal.installmentPlan,
        } : null}
      />
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={null}>
      <CustomersPageContent />
    </Suspense>
  );
}
