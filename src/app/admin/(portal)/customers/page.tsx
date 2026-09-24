'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
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
} from 'lucide-react';
import { AdminSession, PaymentType, Plot, Customer, InstallmentPlanConfig } from '@/lib/mock/types';
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
} from '@/lib/dal/customers';
import { releaseLock, releaseLockSync, getAdminAllPlots, updatePlotPrice } from '@/lib/dal/adminPlots';
import { compressAndEncodeReceipt } from '@/lib/utils/imageCompression';
import { AdminCustomerRegistrationSkeleton } from '@/components/ui/skeleton';

function CustomersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query parameters from Master Plan redirect or Customer Directory
  const queryPlotId = searchParams.get('plotId') || '';
  const queryLockToken = searchParams.get('lockToken') || '';
  const queryReturnBlock = searchParams.get('returnBlock') || '';
  const queryReservationId = searchParams.get('reservationId') || '';
  const queryCustomerName = searchParams.get('customerName') || '';
  const queryCustomerPhone = searchParams.get('customerPhone') || '';
  const queryCustomerEmail = searchParams.get('customerEmail') || '';
  const queryCustomerId = searchParams.get('customerId') || '';
  const queryTab = searchParams.get('tab') || '';
  const queryCompleteCustomer = searchParams.get('completeCustomer') || searchParams.get('completeCustomerId') || '';

  const [session, setSession] = useState<AdminSession | null>(null);
  const sessionRef = useRef<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [completeTargetCustomer, setCompleteTargetCustomer] = useState<Customer | null>(null);

  // Active Tab: 'path_a' (New Customer), 'path_b' (Existing Customer)
  const [activeTab, setActiveTab] = useState<'path_a' | 'path_b'>(
    queryCustomerId || queryTab === 'path_b' ? 'path_b' : 'path_a'
  );

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Available plots list for plot picker
  const [availablePlots, setAvailablePlots] = useState<Plot[]>([]);

  // Master Plan Redirect State
  const [lockedPlot, setLockedPlot] = useState<Plot | null>(null);
  const [isLockedFromMap, setIsLockedFromMap] = useState<boolean>(false);
  const isCommittedRef = useRef(false);

  // ----------------------------------------------------
  // INSTALLMENT SCHEDULE CONFIG STATE (Item 6)
  // ----------------------------------------------------
  // Path A Installment State
  const [yearsA, setYearsA] = useState<number>(2);
  const [paidAfterEveryA, setPaidAfterEveryA] = useState<number>(1); // months
  const [downpaymentA, setDownpaymentA] = useState<number>(0);
  const [downpaymentCustomizedA, setDownpaymentCustomizedA] = useState<boolean>(false);
  const [totalPaymentA, setTotalPaymentA] = useState<number>(0);

  // Path B Installment State
  const [yearsB, setYearsB] = useState<number>(2);
  const [paidAfterEveryB, setPaidAfterEveryB] = useState<number>(1); // months
  const [downpaymentB, setDownpaymentB] = useState<number>(0);
  const [downpaymentCustomizedB, setDownpaymentCustomizedB] = useState<boolean>(false);
  const [totalPaymentB, setTotalPaymentB] = useState<number>(0);

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
    cnic: '',
    phone: queryCustomerPhone,
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
  const [pathAPlotError, setPathAPlotError] = useState<string | null>(null);
  const [selectedPlotA, setSelectedPlotA] = useState<Plot | null>(null);

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

  // ----------------------------------------------------
  // SUB ADMIN 3-FIELD QUICK BOOKING STATE (CR 07 §5)
  // ----------------------------------------------------
  const [subAdminPlotId, setSubAdminPlotId] = useState(queryPlotId || '');
  const [subAdminForm, setSubAdminForm] = useState({
    customerName: queryCustomerName || '',
    cnic: '',
    city: '',
  });
  const [subAdminSubmitting, setSubAdminSubmitting] = useState(false);
  const [subAdminPlotError, setSubAdminPlotError] = useState<string | null>(null);

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

  // Load active session and plots
  const loadInitialData = useCallback(() => {
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);

    // Filter available sellable plots within admin scope via API
    getAdminAllPlots(cur).then((res) => {
      if (res.ok && res.plots) {
        const sellable = res.plots.filter(p => {
          if (p.category === 'amenity' || p.status === 'booked') return false;
          if (cur.role === 'super_admin') return true;
          return cur.assignedBlocks.includes(p.blockId);
        });
        setAvailablePlots(sellable);
        setRegisteredPlotsCache(sellable);
      }
    });

    // Handle plot locking from Master Plan redirect
    if (queryPlotId) {
      // Defer lookup until availablePlots resolves, or try to pre-select it from availablePlots later.
      // (The actual plot might be resolved by loadInitialData's getAdminAllPlots fetch, so we rely on the component state if it updates, or we fetch it specifically.)
      // Actually we'll let verifyPlotRegistered(queryPlotId) in useEffect handle the UI sync.
      
      setPathAForm((prev) => ({ ...prev, plotId: queryPlotId, lockToken: queryLockToken || undefined }));
      setPathBPlotId(queryPlotId);
      setSubAdminPlotId(queryPlotId);
    }

    // Handle customer preselection from query param
    if (queryCustomerId) {
      // Just pass ID, we don't have the full mock list anymore
      // Disambiguation will handle fetching it via handleSearchSubmit later if needed, 
      // or we can let the UI perform a targeted search.
      setSearchQuery(queryCustomerId);
    }

    // Handle Complete Registration for quick-booked member (CR 07 §5)
    if (queryCompleteCustomer) {
      // For now, if we don't have the full customer, we cannot pre-populate.
      // This is expected to be launched from the Customers Directory where we pass more context in the future.
    }

    setLoading(false);
  }, [router, queryPlotId, queryLockToken, queryCustomerId, queryCompleteCustomer, downpaymentCustomizedA, downpaymentCustomizedB]);

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
    if (queryPlotId && session) {
      await releaseLock(session, queryPlotId);
    }
    if (queryReturnBlock) {
      router.push(`/admin/master-plan/${queryReturnBlock}`);
    } else {
      router.push('/admin/customers');
    }
  };

  // Tier 2: React Component Unmount Cleanup
  useEffect(() => {
    return () => {
      if (!isCommittedRef.current && queryLockToken && queryPlotId && sessionRef.current) {
        releaseLock(sessionRef.current, queryPlotId);
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
    } catch (err) {
      console.error('Failed to encode document:', err);
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

    setSelectedPlotA(plot);
    setTotalPaymentA(plot.price);
    if (!downpaymentCustomizedA) {
      setDownpaymentA(Math.round(plot.price * 0.2));
    }
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

    setSelectedPlotB(plot);
    setTotalPaymentB(plot.price);
    if (!downpaymentCustomizedB) {
      setDownpaymentB(Math.round(plot.price * 0.2));
    }
  };

  // ----------------------------------------------------
  // SUBMIT PATH A (NEW CUSTOMER)
  // ----------------------------------------------------
  const handleSubmitPathA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setPathAPlotError(null);

    // Prerequisite verification
    const { exists, plot } = verifyPlotRegistered(pathAForm.plotId);
    if (!exists || !plot) {
      setPathAPlotError('This plot is not registered on the master plan map. Kindly register the plot before proceeding.');
      return;
    }

    // Portal Credentials Gate: Strictly Super Admin Only (Change Request 07 §5)
    const canIssueCreds = session.role === 'super_admin';

    // Minimum 8 characters check if issuing credentials
    if (canIssueCreds && pathAForm.portalPassword && pathAForm.portalPassword.trim().length < 8) {
      setFeedback({ type: 'error', message: 'Initial customer portal password must be at least 8 characters long.' });
      return;
    }

    const finalPriceA = (session.role === 'super_admin' && totalPaymentA > 0) ? totalPaymentA : plot.price;

    // Synchronize price if Super Admin updated plot price
    if (session.role === 'super_admin' && totalPaymentA > 0 && totalPaymentA !== plot.price) {
      await updatePlotPrice(session, plot.id, totalPaymentA);
      plot.price = totalPaymentA;
    }

    // Build installment plan config if installment type
    let installmentPlan: InstallmentPlanConfig | undefined = undefined;
    if (pathAForm.paymentType === 'installment') {
      const calc = calculatePlan(finalPriceA, downpaymentA, yearsA, paidAfterEveryA);
      installmentPlan = {
        totalPayment: calc.totalPayment,
        downpayment: calc.downpayment,
        years: calc.years,
        paidAfterEvery: calc.paidAfterEvery,
        numberOfInstallments: calc.numberOfInstallments,
      };
    }

    // If completing registration for a quick-booked member (CR 07 §5):
    if (completeTargetCustomer) {
      setPathASubmitting(true);
      const res = await completeMemberRegistration(session, {
        customerId: completeTargetCustomer.id,
        membershipNo: pathAForm.membershipNo,
        fatherOrHusbandName: pathAForm.fatherOrHusbandName,
        phone: pathAForm.phone,
        email: pathAForm.email,
        mailingAddress: pathAForm.mailingAddress,
        nokName: pathAForm.nokName,
        nokCnic: pathAForm.nokCnic,
        applicantPhotoUrl: pathAForm.applicantPhotoUrl,
        cnicCopyUrl: pathAForm.cnicCopyUrl,
        nokCnicCopyUrl: pathAForm.nokCnicCopyUrl,
        portalPassword: pathAForm.portalPassword,
        paymentType: pathAForm.paymentType,
        paperInstallmentRef: pathAForm.paperInstallmentRef,
        installmentPlan,
      });
      setPathASubmitting(false);

      if (!res.ok) {
        setFeedback({ type: 'error', message: res.message || res.error || 'Failed to complete registration.' });
        return;
      }

      isCommittedRef.current = true;
      setFeedback({
        type: 'success',
        message: `Member registration completed successfully for ${res.customer?.fullName} on Plot ${plot.plotNumber}!`,
      });

      if (res.credentials && res.customer) {
        setCredentialsModal({
          open: true,
          username: res.credentials.username,
          password: res.credentials.password,
          customerName: res.customer.fullName,
          membershipNo: res.customer.membershipNo,
        });
      }

      if (res.customer && plot) {
        setAgreementModal({
          open: false,
          customer: res.customer,
          plot,
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
    const res = await createCustomerWithBooking(session, {
      ...pathAForm,
      lockToken: queryLockToken || undefined,
      installmentPlan,
      portalPassword: canIssueCreds ? pathAForm.portalPassword : '',
    });
    setPathASubmitting(false);

    if (!res.ok) {
      // NOTE: Form values are preserved on failure per specification!
      setFeedback({ type: 'error', message: res.message || res.error || 'Failed to complete booking.' });
      return;
    }

    // Mark committed to avoid unmount lock release
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
        plot,
        paymentType: pathAForm.paymentType,
        paperRef: pathAForm.paperInstallmentRef,
        bookingDate: new Date().toLocaleDateString('en-GB'),
        installmentPlan,
      });
    }

    // Reset Form if not in query mode
    if (!queryPlotId) {
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
    }
    loadInitialData();
  };

  // ----------------------------------------------------
  // SEARCH PATH B CUSTOMERS
  // ----------------------------------------------------
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !searchQuery.trim()) return;
    setIsSearching(true);
    const res = await searchCustomers(session, searchQuery);
    setIsSearching(false);
    if (res.ok) {
      setSearchResults(res.customers);
      setSelectedCustomer(null);
      setIsCustomerConfirmed(false);
    }
  };

  // ----------------------------------------------------
  // SUBMIT PATH B (EXISTING CUSTOMER)
  // ----------------------------------------------------
  const handleSubmitPathB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedCustomer || !isCustomerConfirmed) return;
    setPathBPlotError(null);

    // Prerequisite verification
    const { exists, plot } = verifyPlotRegistered(pathBPlotId);
    if (!exists || !plot) {
      setPathBPlotError('This plot is not registered on the master plan map. Kindly register the plot before proceeding.');
      return;
    }

    const finalPriceB = (session.role === 'super_admin' && totalPaymentB > 0) ? totalPaymentB : plot.price;

    // Synchronize price if Super Admin updated plot price
    if (session.role === 'super_admin' && totalPaymentB > 0 && totalPaymentB !== plot.price) {
      await updatePlotPrice(session, plot.id, totalPaymentB);
      plot.price = totalPaymentB;
    }

    // Build installment plan config if installment type
    let installmentPlan: InstallmentPlanConfig | undefined = undefined;
    if (pathBPaymentType === 'installment') {
      const calc = calculatePlan(finalPriceB, downpaymentB, yearsB, paidAfterEveryB);
      installmentPlan = {
        totalPayment: calc.totalPayment,
        downpayment: calc.downpayment,
        years: calc.years,
        paidAfterEvery: calc.paidAfterEvery,
        numberOfInstallments: calc.numberOfInstallments,
      };
    }

    setPathBSubmitting(true);
    const res = await addBookingToCustomer(session, {
      customerId: selectedCustomer.id,
      plotId: pathBPlotId,
      paymentType: pathBPaymentType,
      paperInstallmentRef: pathBPaperRef,
      lockToken: queryLockToken || undefined,
      installmentPlan,
    });
    setPathBSubmitting(false);

    if (!res.ok) {
      // NOTE: Form values are preserved on failure per specification!
      setFeedback({ type: 'error', message: res.message || res.error || 'Failed to attach booking.' });
      return;
    }

    // Mark committed to avoid unmount lock release
    isCommittedRef.current = true;

    setFeedback({
      type: 'success',
      message: `Additional plot ${plot.plotNumber} successfully booked for ${selectedCustomer.fullName}!`,
    });



    // Open Printable Agreement Modal
    setAgreementModal({
      open: true,
      customer: selectedCustomer,
      plot,
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
  // SUBMIT SUB ADMIN QUICK BOOKING (CR 07 §5)
  // ----------------------------------------------------
  const handleSubmitSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSubAdminPlotError(null);

    const targetPlotId = lockedPlot ? lockedPlot.id : subAdminPlotId;
    if (!targetPlotId) {
      setSubAdminPlotError('Please select an available plot to book.');
      return;
    }

    const { exists, plot } = verifyPlotRegistered(targetPlotId);
    if (!exists || !plot) {
      setSubAdminPlotError('Selected plot is not registered on the master plan.');
      return;
    }

    setSubAdminSubmitting(true);
    const res = await createMinimalBooking(session, {
      plotId: plot.id,
      customerName: subAdminForm.customerName,
      cnic: subAdminForm.cnic,
      city: subAdminForm.city,
      lockToken: queryLockToken || undefined,
    });
    setSubAdminSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', message: res.message || res.error || 'Failed to complete quick booking.' });
      return;
    }

    isCommittedRef.current = true;
    setFeedback({
      type: 'success',
      message: `Quick booking successfully created for ${res.customer?.fullName} on Plot ${plot.plotNumber} (Booked - Pending Formalities)!`,
    });

    setSubAdminForm({ customerName: '', cnic: '', city: '' });
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
      const res = await resetCustomerPassword(
        session,
        resetModalCustomer.id,
        resetNewPassword.trim() || undefined
      );

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
        setResetPasswordError(res.message || res.error || 'Failed to reset password.');
      }
    } catch {
      setResetPasswordError('An unexpected error occurred while resetting password.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (loading) {
    return <AdminCustomerRegistrationSkeleton />;
  }

  // Permission Guard
  const canAccess = session?.role === 'super_admin' || Boolean(session?.permissions?.can_create_customer || session?.permissions?.can_book);
  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Access Denied: Customer Registration</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your administrative account does not have permission to create customer records or attach plot bookings. Contact a Super Administrator to adjust your privileges.
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

  const canIssueCredentials = session?.role === 'super_admin';

  // Calculations for Path A
  const effectivePriceA = (session?.role === 'super_admin' && totalPaymentA > 0) ? totalPaymentA : (selectedPlotA?.price || 0);
  const planA = selectedPlotA
    ? calculatePlan(effectivePriceA, downpaymentA, yearsA, paidAfterEveryA)
    : null;

  // Calculations for Path B
  const effectivePriceB = (session?.role === 'super_admin' && totalPaymentB > 0) ? totalPaymentB : (selectedPlotB?.price || 0);
  const planB = selectedPlotB
    ? calculatePlan(effectivePriceB, downpaymentB, yearsB, paidAfterEveryB)
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

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

      {/* Sub Admin 3-Field Quick Booking Flow (CR 07 §5) */}
      {session?.role === 'sub_admin' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-serif tracking-tight">
                Quick Plot Booking (Sub Admin)
              </h1>
              <p className="text-xs text-slate-500">
                Streamlined 3-field quick booking flow. Statutory society fees and payment schedule will be finalized by Super Administration upon member registration.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitSubAdmin} className="space-y-5">
            {/* Target Plot Display / Selector */}
            <div>
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
                <select
                  value={subAdminPlotId}
                  onChange={(e) => {
                    setSubAdminPlotId(e.target.value);
                    setSubAdminPlotError(null);
                  }}
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 bg-white"
                >
                  <option value="">-- Select Available Plot in Assigned Sectors --</option>
                  {availablePlots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.blockId.toUpperCase()} • Plot {p.plotNumber} ({p.size}) — PKR {p.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              )}
              {subAdminPlotError && (
                <p className="text-xs text-rose-600 mt-1 font-semibold">{subAdminPlotError}</p>
              )}
            </div>

            {/* 3 Required Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subAdminForm.customerName}
                  onChange={(e) => setSubAdminForm({ ...subAdminForm, customerName: e.target.value })}
                  placeholder="e.g. Hamza Tariq"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer CNIC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subAdminForm.cnic}
                  onChange={(e) => setSubAdminForm({ ...subAdminForm, cnic: e.target.value })}
                  placeholder="37405-1234567-1"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subAdminForm.city}
                  onChange={(e) => setSubAdminForm({ ...subAdminForm, city: e.target.value })}
                  placeholder="e.g. Lahore, Rawalpindi, Islamabad"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-950 leading-relaxed">
              ℹ️ <strong>Formalities Pending:</strong> Submitting this quick booking will secure the plot immediately as <strong>Booked (Pending Formalities)</strong> to prevent double-booking. Super Administration will execute member registration, issue membership credentials, and attach statutory fees in the Customer Directory.
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
                disabled={subAdminSubmitting || (!lockedPlot && !subAdminPlotId)}
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
          {completeTargetCustomer ? (
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
                      Sub-Admin Quick Booking Formalities
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-slate-900 font-serif">
                    {completeTargetCustomer.fullName} ({completeTargetCustomer.cnic})
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Complete statutory fee allocation, establish installment schedule on the 5th of each month, and issue official portal access credentials.
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

      {/* ==================================================== */}
      {/* PATH A: FULL PAPER BOOKING FORM (NEW CUSTOMER)       */}
      {/* ==================================================== */}
      {activeTab === 'path_a' && (
        <form onSubmit={handleSubmitPathA} className="space-y-6">
          {/* Statutory Fee Notice Banner */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900">Statutory Society Fees Notice</div>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                In compliance with society regulations, an <strong>Admission Fee of PKR 2,000</strong> and a <strong>Share Subscription Fee of PKR 10,000</strong> will be automatically billed and marked paid upfront upon enrollment. These fees remain strictly segregated from the plot purchase value.
              </p>
            </div>
          </div>

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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name of Applicant *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Aslam Khan"
                  value={pathAForm.fullName}
                  onChange={(e) => setPathAForm({ ...pathAForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father / Husband Name (S/O or W/O) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haji Abdul Rasheed"
                  value={pathAForm.fatherOrHusbandName}
                  onChange={(e) => setPathAForm({ ...pathAForm, fatherOrHusbandName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  13-Digit CNIC *
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="37405-1234567-1"
                  value={pathAForm.cnic}
                  onChange={(e) => setPathAForm({ ...pathAForm, cnic: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-400">Standard 13 digits (with or without dashes)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile / Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0300-1234567"
                  value={pathAForm.phone}
                  onChange={(e) => setPathAForm({ ...pathAForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="aslam@example.com"
                  value={pathAForm.email}
                  onChange={(e) => setPathAForm({ ...pathAForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Permanent / Mailing Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="House #, Street #, Sector/Area, City"
                  value={pathAForm.mailingAddress}
                  onChange={(e) => setPathAForm({ ...pathAForm, mailingAddress: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
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
                          }}
                          className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Generate Secure
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        minLength={8}
                        placeholder="Enter member portal password"
                        value={pathAForm.portalPassword || ''}
                        onChange={(e) => setPathAForm({ ...pathAForm, portalPassword: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Minimum 8 characters. Member can change this later in their profile.
                      </span>
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
                  type="text"
                  required
                  placeholder="e.g. Farooq Aslam Khan"
                  value={pathAForm.nokName}
                  onChange={(e) => setPathAForm({ ...pathAForm, nokName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominee 13-Digit CNIC *
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="37405-9876543-2"
                  value={pathAForm.nokCnic}
                  onChange={(e) => setPathAForm({ ...pathAForm, nokCnic: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
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
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Registered Plot *
                </label>
                {isLockedFromMap && lockedPlot ? (
                  <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl space-y-1">
                    <div className="text-xs font-bold text-slate-900 font-mono flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Plot {lockedPlot.plotNumber} ({lockedPlot.blockId.toUpperCase()}) - Locked from Master Plan</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Selection prefilled and locked read-only via Master Plan lock token.
                    </p>
                  </div>
                ) : (
                  <>
                    <select
                      value={pathAForm.plotId}
                      onChange={(e) => handleVerifyPlotA(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                    >
                      <option value="">-- Choose from available registered plots --</option>
                      {availablePlots.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.plotNumber} ({p.blockId.toUpperCase()}) - {p.size} ({p.category}) - PKR {p.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-[11px] text-slate-500">
                      Or enter Plot ID directly:
                      <div className="flex gap-2 mt-1">
                        <input
                          type="text"
                          placeholder="e.g. abbott-001"
                          value={pathAForm.plotId}
                          onChange={(e) => handleVerifyPlotA(e.target.value)}
                          className="px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg flex-1"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Live Plot Verification Card */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Master Plan Verification Status
                </label>
                {pathAPlotError ? (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Prerequisite Check Failed</div>
                      <p className="mt-0.5 text-rose-800">{pathAPlotError}</p>
                    </div>
                  </div>
                ) : selectedPlotA ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Plot Registered & Available
                      </span>
                      <span className="font-mono font-bold uppercase text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300">
                        {selectedPlotA.blockId}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-200/70 text-[11px]">
                      <div>
                        <span className="text-emerald-700">Plot Number:</span>{' '}
                        <strong className="text-emerald-950 font-mono">{selectedPlotA.plotNumber}</strong>
                      </div>
                      <div>
                        <span className="text-emerald-700">Category:</span>{' '}
                        <strong className="text-emerald-950 capitalize">{selectedPlotA.category} ({selectedPlotA.size})</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-emerald-700">Plot Purchase Price:</span>{' '}
                        <strong className="text-emerald-950 font-mono text-sm">PKR {selectedPlotA.price.toLocaleString()}</strong>
                      </div>
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
                  {session?.role === 'super_admin' ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono font-bold text-slate-500">PKR</span>
                      <input
                        type="number"
                        required
                        min={100000}
                        step={50000}
                        value={totalPaymentA || ''}
                        onChange={(e) => setTotalPaymentA(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 bg-white"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={`PKR ${selectedPlotA.price.toLocaleString()}`}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded-xl border border-slate-200 cursor-not-allowed"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Installment Form Fields (Item 6) */}
            {pathAForm.paymentType === 'installment' && selectedPlotA && (
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900 font-serif">Installment Plan Parameters</span>
                  <span className="text-[11px] text-slate-500 font-medium">Customizable duration and payment frequency</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Field 1: Total Payment */}
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
                    {session?.role === 'super_admin' ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-bold text-slate-500">PKR</span>
                        <input
                          type="number"
                          required
                          min={100000}
                          step={50000}
                          value={totalPaymentA || ''}
                          onChange={(e) => {
                            const newTot = Number(e.target.value);
                            setTotalPaymentA(newTot);
                            if (!downpaymentCustomizedA && newTot > 0) {
                              setDownpaymentA(Math.round(newTot * 0.2));
                            }
                          }}
                          className="w-full px-2.5 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 bg-white"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={`PKR ${selectedPlotA.price.toLocaleString()}`}
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded-xl border border-slate-200 cursor-not-allowed"
                      />
                    )}
                  </div>

                  {/* Field 2: Downpayment */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Downpayment (PKR) *
                      </label>
                      <span className="text-[10px] text-emerald-700 font-bold">Paid Upfront</span>
                    </div>
                    <input
                      type="number"
                      required
                      min={0}
                      max={effectivePriceA}
                      step={5000}
                      value={downpaymentA}
                      onChange={(e) => {
                        setDownpaymentA(Number(e.target.value));
                        setDownpaymentCustomizedA(true);
                      }}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                    />
                    <div className="flex gap-1 mt-1.5">
                      {[10, 20, 25, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setDownpaymentA(Math.round(effectivePriceA * (pct / 100)));
                            setDownpaymentCustomizedA(true);
                          }}
                          className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 rounded-md text-slate-600 hover:text-emerald-800 font-medium cursor-pointer"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 3: Number of Years */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Number of Years *
                    </label>
                    <input
                      type="number"
                      required
                      min={0.5}
                      max={10}
                      step={0.5}
                      value={yearsA}
                      onChange={(e) => setYearsA(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                    />
                    <div className="flex gap-1 mt-1.5">
                      {[1, 2, 3, 4, 5].map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setYearsA(y)}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium cursor-pointer ${
                            yearsA === y
                              ? 'bg-emerald-700 text-white font-bold'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {y}Y
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 4: Paid After Every */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Paid After Every (Months) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={24}
                      value={paidAfterEveryA}
                      onChange={(e) => setPaidAfterEveryA(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                    />
                    <div className="flex gap-1 mt-1.5">
                      {[
                        { label: '1M (Monthly)', val: 1 },
                        { label: '3M (Quarterly)', val: 3 },
                        { label: '6M (Semi-Ann)', val: 6 },
                        { label: '12M (Ann)', val: 12 },
                      ].map((f) => (
                        <button
                          key={f.val}
                          type="button"
                          onClick={() => setPaidAfterEveryA(f.val)}
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium cursor-pointer ${
                            paidAfterEveryA === f.val
                              ? 'bg-emerald-700 text-white font-bold'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {f.val}M
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Field 5: Auto-Calculated Number of Installments & Breakdown */}
                {planA && (
                  <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">
                        Auto-Calculated Installments
                      </span>
                      <div className="text-base font-bold font-mono text-emerald-800">
                        {planA.numberOfInstallments} Installments
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Formula: {planA.years} Years × 12 = {Math.round(planA.years * 12)} Mos ÷ {planA.paidAfterEvery} Mos
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">
                        Financed Balance Remaining
                      </span>
                      <div className="text-base font-bold font-mono text-slate-900">
                        PKR {planA.financed.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Total {selectedPlotA.price.toLocaleString()} − Downpayment {planA.downpayment.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                      <span className="text-[11px] text-emerald-800 font-bold block uppercase tracking-wider">
                        Installment Amount Breakdown
                      </span>
                      <div className="text-xs font-bold text-emerald-950 font-mono">
                        {planA.numberOfInstallments > 1 ? (
                          <>
                            {planA.numberOfInstallments - 1} × PKR {planA.baseInstallment.toLocaleString()}
                            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                              Final Installment: PKR {planA.finalInstallment.toLocaleString()}
                              {planA.remainder > 0 && (
                                <span className="text-[10px] font-normal text-emerald-600 block">
                                  (absorbs rounding remainder of PKR {planA.remainder})
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span>1 Installment: PKR {planA.finalInstallment.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Financial Statutory Breakdown Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>Admission Fee (Statutory Isolated):</span>
                <span className="font-mono text-emerald-700 font-bold">PKR 2,000 (Paid)</span>
              </div>
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>Share Subscription Fee (Statutory Isolated):</span>
                <span className="font-mono text-emerald-700 font-bold">PKR 10,000 (Paid)</span>
              </div>
              {selectedPlotA && pathAForm.paymentType === 'installment' && planA && (
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Plot Downpayment (Collected Upfront):</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    PKR {planA.downpayment.toLocaleString()} (Paid)
                  </span>
                </div>
              )}
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-slate-600 font-bold">
                <span>Total Upfront Settlement on Enrollment:</span>
                <span className="font-mono font-bold text-slate-900">
                  PKR {(12000 + (pathAForm.paymentType === 'installment' && planA ? planA.downpayment : (selectedPlotA?.price || 0))).toLocaleString()}
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
            ) : isLockedFromMap ? (
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
              type="submit"
              disabled={pathASubmitting || !selectedPlotA || Boolean(pathAPlotError)}
              className="px-6 py-2.5 bg-[#10251E] hover:bg-[#18392C] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2"
            >
              {pathASubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{completeTargetCustomer ? 'Completing Registration & Issuing Credentials...' : 'Enrolling Customer & Generating Schedule...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>{completeTargetCustomer ? 'Complete Registration & Issue Portal Credentials' : 'Submit Application & Register Plot'}</span>
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
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <h2 className="text-sm font-bold text-slate-800 font-serif">Search Existing Customer Record</h2>
                <p className="text-[11px] text-slate-500">
                  Search by Member Name, 13-digit CNIC, or Mobile Number.
                </p>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Search by full name, CNIC (e.g. 37405-...), or mobile number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Results Disambiguation List */}
            {searchResults.length > 0 && !selectedCustomer && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Found {searchResults.length} Matching Profiles (Select to confirm)
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {searchResults.map((cust) => (
                    <div
                      key={cust.id}
                      className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-4 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-slate-900 font-serif">{cust.fullName}</strong>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {cust.membershipNo}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          CNIC: {cust.cnic} • Phone: {cust.phone}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {cust.propertiesCount} {cust.propertiesCount === 1 ? 'Plot' : 'Plots'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setIsCustomerConfirmed(false);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Select Customer
                        </button>
                      </div>
                    </div>
                  ))}
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
                      onClick={() => setIsCustomerConfirmed(true)}
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

          {/* Previous Bookings Section (Fix 9 & Constraint 3: separate fixed fees + raw installment plan inputs) */}
          {selectedCustomer && (() => {
            return (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-indigo-700" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Previous Booking Records ({selectedCustomer.propertiesCount})
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        This customer currently has {selectedCustomer.propertiesCount} active plot(s) registered under their membership.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Step 3: Attach Plot (Only after confirmation) */}
          {selectedCustomer && isCustomerConfirmed && selectedCustomer.accountStatus !== 'suspended' && (
            <form onSubmit={handleSubmitPathB} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">3</span>
                <h2 className="text-sm font-bold text-slate-800 font-serif">Attach Plot & Select Financial Schedule</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Registered Plot *
                  </label>
                  {isLockedFromMap && lockedPlot ? (
                    <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl space-y-1">
                      <div className="text-xs font-bold text-slate-900 font-mono flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Plot {lockedPlot.plotNumber} ({lockedPlot.blockId.toUpperCase()}) - Locked from Master Plan</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Selection prefilled and locked read-only via Master Plan lock token.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={pathBPlotId}
                      onChange={(e) => handleVerifyPlotB(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                    >
                      <option value="">-- Choose from available registered plots --</option>
                      {availablePlots.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.plotNumber} ({p.blockId.toUpperCase()}) - {p.size} ({p.category}) - PKR {p.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
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
                    {session?.role === 'super_admin' ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-bold text-slate-500">PKR</span>
                        <input
                          type="number"
                          required
                          min={100000}
                          step={50000}
                          value={totalPaymentB || ''}
                          onChange={(e) => setTotalPaymentB(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 bg-white"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={`PKR ${selectedPlotB.price.toLocaleString()}`}
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded-xl border border-slate-200 cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Installment Plan Parameters for Path B (Item 6) */}
              {pathBPaymentType === 'installment' && selectedPlotB && (
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-900 font-serif">Installment Plan Parameters</span>
                    <span className="text-[11px] text-slate-500 font-medium">Auto-calculated schedule with remainder absorption</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                      {session?.role === 'super_admin' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono font-bold text-slate-500">PKR</span>
                          <input
                            type="number"
                            required
                            min={100000}
                            step={50000}
                            value={totalPaymentB || ''}
                            onChange={(e) => {
                              const newTot = Number(e.target.value);
                              setTotalPaymentB(newTot);
                              if (!downpaymentCustomizedB && newTot > 0) {
                                setDownpaymentB(Math.round(newTot * 0.2));
                              }
                            }}
                            className="w-full px-2.5 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 bg-white"
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          disabled
                          value={`PKR ${selectedPlotB.price.toLocaleString()}`}
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded-xl border border-slate-200 cursor-not-allowed"
                        />
                      )}
                    </div>

                    {/* Downpayment */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Downpayment (PKR) *
                        </label>
                        <span className="text-[10px] text-emerald-700 font-bold">Paid Upfront</span>
                      </div>
                      <input
                        type="number"
                        required
                        min={0}
                        max={effectivePriceB}
                        step={5000}
                        value={downpaymentB}
                        onChange={(e) => {
                          setDownpaymentB(Number(e.target.value));
                          setDownpaymentCustomizedB(true);
                        }}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                      />
                      <div className="flex gap-1 mt-1.5">
                        {[10, 20, 25, 50].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              setDownpaymentB(Math.round(effectivePriceB * (pct / 100)));
                              setDownpaymentCustomizedB(true);
                            }}
                            className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 rounded-md text-slate-600 hover:text-emerald-800 font-medium cursor-pointer"
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Number of Years */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Number of Years *
                      </label>
                      <input
                        type="number"
                        required
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={yearsB}
                        onChange={(e) => setYearsB(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                      />
                      <div className="flex gap-1 mt-1.5">
                        {[1, 2, 3, 4, 5].map((y) => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => setYearsB(y)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium cursor-pointer ${
                              yearsB === y
                                ? 'bg-emerald-700 text-white font-bold'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {y}Y
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Paid After Every */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Paid After Every (Months) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={24}
                        value={paidAfterEveryB}
                        onChange={(e) => setPaidAfterEveryB(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                      />
                      <div className="flex gap-1 mt-1.5">
                        {[
                          { label: '1M (Monthly)', val: 1 },
                          { label: '3M (Quarterly)', val: 3 },
                          { label: '6M (Semi-Ann)', val: 6 },
                          { label: '12M (Ann)', val: 12 },
                        ].map((f) => (
                          <button
                            key={f.val}
                            type="button"
                            onClick={() => setPaidAfterEveryB(f.val)}
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium cursor-pointer ${
                              paidAfterEveryB === f.val
                                ? 'bg-emerald-700 text-white font-bold'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {f.val}M
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary & Remainder Absorption */}
                  {planB && (
                    <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">
                          Auto-Calculated Installments
                        </span>
                        <div className="text-base font-bold font-mono text-emerald-800">
                          {planB.numberOfInstallments} Installments
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Formula: {planB.years} Years × 12 = {Math.round(planB.years * 12)} Mos ÷ {planB.paidAfterEvery} Mos
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">
                          Financed Balance Remaining
                        </span>
                        <div className="text-base font-bold font-mono text-slate-900">
                          PKR {planB.financed.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Total {effectivePriceB.toLocaleString()} − Downpayment {planB.downpayment.toLocaleString()}
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                        <span className="text-[11px] text-emerald-800 font-bold block uppercase tracking-wider">
                          Installment Amount Breakdown
                        </span>
                        <div className="text-xs font-bold text-emerald-950 font-mono">
                          {planB.numberOfInstallments > 1 ? (
                            <>
                              {planB.numberOfInstallments - 1} × PKR {planB.baseInstallment.toLocaleString()}
                              <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                                Final Installment: PKR {planB.finalInstallment.toLocaleString()}
                                {planB.remainder > 0 && (
                                  <span className="text-[10px] font-normal text-emerald-600 block">
                                    (absorbs rounding remainder of PKR {planB.remainder})
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <span>1 Installment: PKR {planB.finalInstallment.toLocaleString()}</span>
                          )}
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
                  disabled={pathBSubmitting || !selectedPlotB || Boolean(pathBPlotError)}
                  className="px-6 py-2.5 bg-[#10251E] hover:bg-[#18392C] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {pathBSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Attaching Plot...</span>
                    </>
                  ) : (
                    <>
                      <Building className="w-4 h-4 text-[#D4AF37]" />
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
                  setCredentialsModal(null);
                  if (completeTargetCustomer) {
                    router.push('/admin/customers-directory');
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
                      `Prime View Member Portal Credentials:\nUsername: ${credentialsModal.username}\nPassword: ${credentialsModal.password}\nPortal URL: /society-members/dashboard`
                    );
                    setCopiedCreds(true);
                    setTimeout(() => setCopiedCreds(false), 2500);
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
                    setCredentialsModal(null);
                    if (completeTargetCustomer) {
                      router.push('/admin/customers-directory');
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
      {agreementModal?.open && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setAgreementModal((prev) => (prev ? { ...prev, open: false } : null));
              if (completeTargetCustomer) {
                router.push('/admin/customers-directory');
              }
            }
          }}
        >
          <div id="pv-booking-agreement-printable" className="bg-white rounded-2xl border border-slate-300 w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] print:border-none print:shadow-none print:my-0 print:max-w-none print:max-h-none print:h-auto print:overflow-visible">
            {/* Modal Actions Bar (Sticky/Anchored at top, hidden on print) */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800 shadow-xs print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
                  Official Booking Agreement Document (Preview)
                </span>
                <span className="text-xs font-bold uppercase tracking-wider sm:hidden">
                  Agreement Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#b5952f] text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Agreement</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAgreementModal((prev) => (prev ? { ...prev, open: false } : null));
                    if (completeTargetCustomer) {
                      router.push('/admin/customers-directory');
                    }
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body (Default 100% view) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 text-slate-900 font-sans print:p-6 print:overflow-visible print:h-auto">
              <div className="space-y-4 sm:space-y-5">
                {/* Header with Prime View Logo on the Right Side */}
                <div className="border-b-2 border-[#10251E] pb-3 sm:pb-4 flex items-center justify-between gap-3">
                  {/* Left spacer to keep text centered on desktop */}
                  <div className="hidden sm:block w-16 sm:w-20 shrink-0" />

                  {/* Center Society Information */}
                  <div className="flex-1 text-center">
                    <div className="font-serif font-extrabold text-xl sm:text-2xl tracking-wider text-[#10251E]">
                      PRIME VIEW HOUSING SCHEME
                    </div>
                    <div className="text-[11px] sm:text-xs uppercase tracking-widest text-[#D4AF37] font-bold">
                      Executive Society Administration & Plot Allocation
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
                      Main Expressway Sector, Islamabad / Rawalpindi Territory • UAN: (051) 111-PRIME
                    </div>
                    <div className="mt-2.5 sm:mt-3 inline-block bg-[#10251E] text-white px-3.5 sm:px-4 py-1 rounded text-[11px] sm:text-xs font-bold uppercase tracking-widest">
                      PLOT BOOKING & ALLOTMENT AGREEMENT
                    </div>
                  </div>

                  {/* Right Side: Official Prime View Logo */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative flex items-center justify-center">
                    <Image
                      src="/logo-trimmed.png"
                      alt="Prime View Logo"
                      width={80}
                      height={80}
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>

                {/* Reference & Date */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 py-1">
                  <div>
                    Membership Ref: <strong className="font-mono text-slate-950">{agreementModal.customer.membershipNo}</strong>
                  </div>
                  <div>
                    Date of Issue: <strong>{agreementModal.bookingDate}</strong>
                  </div>
                </div>

                {/* Customer Particulars Table */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 border-b border-slate-200 pb-1">
                    Section I: Allottee Particulars
                  </div>
                  <table className="w-full text-xs border border-slate-300">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-1.5 sm:p-2 bg-slate-50 font-bold w-1/4">Full Name:</td>
                        <td className="p-1.5 sm:p-2 w-1/4">{agreementModal.customer.fullName}</td>
                        <td className="p-1.5 sm:p-2 bg-slate-50 font-bold w-1/4">S/O or W/O:</td>
                        <td className="p-1.5 sm:p-2 w-1/4">{agreementModal.customer.fatherOrHusbandName || 'N/A'}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">CNIC Number:</td>
                        <td className="p-1.5 sm:p-2 font-mono">{agreementModal.customer.cnic}</td>
                        <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Contact No:</td>
                        <td className="p-1.5 sm:p-2 font-mono">{agreementModal.customer.phone}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Email Address:</td>
                        <td className="p-1.5 sm:p-2">{agreementModal.customer.email}</td>
                        <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Nominee / NOK:</td>
                        <td className="p-1.5 sm:p-2">{agreementModal.customer.nokName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Mailing Address:</td>
                        <td colSpan={3} className="p-1.5 sm:p-2">{agreementModal.customer.mailingAddress}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Plot Allocation Particulars */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 border-b border-slate-200 pb-1">
                    Section II: Allocated Plot Particulars
                  </div>
                  <table className="w-full text-xs border border-slate-300">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-1.5 sm:p-2 bg-slate-50 font-bold w-1/4">Plot Number:</td>
                        <td className="p-1.5 sm:p-2 font-mono font-bold w-1/4">{agreementModal.plot.plotNumber}</td>
                        <td className="p-1.5 sm:p-2 bg-slate-50 font-bold w-1/4">Assigned Block:</td>
                        <td className="p-1.5 sm:p-2 uppercase font-bold w-1/4">{agreementModal.plot.blockId}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Size / Dimensions:</td>
                        <td className="p-1.5 sm:p-2">{agreementModal.plot.size}</td>
                        <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Category:</td>
                        <td className="p-1.5 sm:p-2 capitalize">{agreementModal.plot.category}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 sm:p-2 bg-slate-50 font-bold">Total Plot Value:</td>
                        <td colSpan={3} className="p-1.5 sm:p-2 font-bold text-slate-900">
                          PKR {agreementModal.plot.price.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Statutory Society Fees & Payment Terms */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 border-b border-slate-200 pb-1">
                    Section III: Statutory Fees & Schedule Structure
                  </div>
                  <table className="w-full text-xs border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-left">
                        <th className="p-1.5 sm:p-2">Fee Description</th>
                        <th className="p-1.5 sm:p-2">Amount (PKR)</th>
                        <th className="p-1.5 sm:p-2">Payment Status</th>
                        <th className="p-1.5 sm:p-2">Classification</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-1.5 sm:p-2 font-semibold">Society Admission Fee</td>
                        <td className="p-1.5 sm:p-2 font-mono">2,000</td>
                        <td className="p-1.5 sm:p-2 font-bold text-emerald-700">PAID UPFRONT</td>
                        <td className="p-1.5 sm:p-2 text-slate-500">Statutory Membership Fee</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-1.5 sm:p-2 font-semibold">Share Subscription Fee</td>
                        <td className="p-1.5 sm:p-2 font-mono">10,000</td>
                        <td className="p-1.5 sm:p-2 font-bold text-emerald-700">PAID UPFRONT</td>
                        <td className="p-1.5 sm:p-2 text-slate-500">Statutory Society Share</td>
                      </tr>
                      {agreementModal.installmentPlan && (
                        <tr className="border-b border-slate-200">
                          <td className="p-1.5 sm:p-2 font-semibold">Plot Upfront Downpayment</td>
                          <td className="p-1.5 sm:p-2 font-mono">{agreementModal.installmentPlan.downpayment.toLocaleString()}</td>
                          <td className="p-1.5 sm:p-2 font-bold text-emerald-700">PAID UPFRONT</td>
                          <td className="p-1.5 sm:p-2 text-slate-500">Initial Booking Downpayment</td>
                        </tr>
                      )}
                      <tr>
                        <td className="p-1.5 sm:p-2 font-semibold">
                          Plot Payment:{' '}
                          {agreementModal.paymentType === 'installment'
                            ? `${agreementModal.installmentPlan?.years || 2}-Year Installment Plan (${agreementModal.installmentPlan?.numberOfInstallments || 24} Installments)`
                            : 'Full Upfront Payment'}
                        </td>
                        <td className="p-1.5 sm:p-2 font-mono font-bold">
                          {agreementModal.plot.price.toLocaleString()}
                        </td>
                        <td className="p-1.5 sm:p-2 font-bold text-indigo-700">
                          {agreementModal.paymentType === 'installment'
                            ? `Downpayment Paid • ${agreementModal.installmentPlan?.numberOfInstallments || 24} Installments Scheduled`
                            : 'Full Payment Paid'}
                        </td>
                        <td className="p-1.5 sm:p-2 text-slate-500">
                          {agreementModal.paperRef ? `Ref: ${agreementModal.paperRef}` : 'Standard Schedule'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="pt-5 sm:pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 sm:gap-6 text-center text-xs">
                  <div>
                    <div className="h-9 sm:h-11 border-b border-dashed border-slate-400 mb-1.5 sm:mb-2" />
                    <div className="font-bold text-slate-800 text-[11px] sm:text-xs">Applicant Signature</div>
                    <div className="text-[10px] text-slate-400">Allottee Member</div>
                  </div>

                  <div>
                    <div className="h-9 sm:h-11 border-b border-dashed border-slate-400 mb-1.5 sm:mb-2" />
                    <div className="font-bold text-slate-800 text-[11px] sm:text-xs">Authorized Officer</div>
                    <div className="text-[10px] text-slate-400">Prime View Operations</div>
                  </div>

                  <div>
                    <div className="h-9 sm:h-11 border-b border-dashed border-slate-400 mb-1.5 sm:mb-2" />
                    <div className="font-bold text-slate-800 text-[11px] sm:text-xs">Society Secretary</div>
                    <div className="text-[10px] text-slate-400">Executive Committee Seal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<AdminCustomerRegistrationSkeleton />}>
      <CustomersPageContent />
    </Suspense>
  );
}
