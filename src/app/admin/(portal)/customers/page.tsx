'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { AdminSession, PaymentType, Plot, Customer } from '@/lib/mock/types';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import {
  searchCustomers,
  verifyPlotRegistered,
  createCustomerWithBooking,
  addBookingToCustomer,
  CustomerDisambiguation,
  CreateCustomerWithBookingInput,
} from '@/lib/dal/customers';
import { mockStore } from '@/lib/mock/store';

export default function CustomersPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'path_a' (New Customer) vs 'path_b' (Existing Customer)
  const [activeTab, setActiveTab] = useState<'path_a' | 'path_b'>('path_a');

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Available plots list for plot picker
  const [availablePlots, setAvailablePlots] = useState<Plot[]>([]);

  // ----------------------------------------------------
  // PATH A: NEW CUSTOMER FORM STATE
  // ----------------------------------------------------
  const [pathAForm, setPathAForm] = useState<CreateCustomerWithBookingInput>({
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
  });
  const [pathASubmitting, setPathASubmitting] = useState(false);
  const [pathAPlotError, setPathAPlotError] = useState<string | null>(null);
  const [selectedPlotA, setSelectedPlotA] = useState<Plot | null>(null);

  // ----------------------------------------------------
  // PATH B: EXISTING CUSTOMER STATE
  // ----------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerDisambiguation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected customer for disambiguation
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDisambiguation | null>(null);
  // User Requirement: Mandatory Confirmation Step
  const [isCustomerConfirmed, setIsCustomerConfirmed] = useState(false);

  // Path B booking fields
  const [pathBPlotId, setPathBPlotId] = useState('');
  const [pathBPaymentType, setPathBPaymentType] = useState<PaymentType>('installment');
  const [pathBPaperRef, setPathBPaperRef] = useState('');
  const [selectedPlotB, setSelectedPlotB] = useState<Plot | null>(null);
  const [pathBPlotError, setPathBPlotError] = useState<string | null>(null);
  const [pathBSubmitting, setPathBSubmitting] = useState(false);

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
  } | null>(null);

  // Load active session and plots
  const loadInitialData = useCallback(() => {
    mockStore.loadFromStorage();
    const cur = getActiveAdminSession();
    if (!cur) {
      router.push('/admin/login');
      return;
    }
    setSession(cur);

    // Filter available sellable plots within admin scope
    const plots = mockStore.plots.filter((p) => {
      if (p.category === 'amenity' || p.status === 'booked') return false;
      if (cur.role === 'super_admin') return true;
      return cur.assignedBlocks.includes(p.blockId);
    });
    setAvailablePlots(plots);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Flash feedback timer
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

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
  };

  const handleVerifyPlotB = (plotId: string) => {
    setPathBPlotError(null);
    setPathBPlotId(plotId);
    if (!plotId.trim()) {
      setSelectedPlotB(null);
      return;
    }

    const { exists, plot } = verifyPlotRegistered(plotId.trim());
    if (!exists || !plot) {
      setPathBPlotError('This plot is not registered on the master plan map. Kindly register the plot before proceeding.');
      setSelectedPlotB(null);
      return;
    }

    if (plot.category === 'amenity') {
      setPathBPlotError('Amenity utility plots cannot be booked or sold.');
      setSelectedPlotB(null);
      return;
    }

    if (plot.status === 'booked') {
      setPathBPlotError('This plot has already been committed to another owner.');
      setSelectedPlotB(null);
      return;
    }

    if (session && session.role !== 'super_admin' && !session.assignedBlocks.includes(plot.blockId)) {
      setPathBPlotError(`Plot ${plot.plotNumber} (${plot.blockId}) is outside your assigned administrative block scope.`);
      setSelectedPlotB(null);
      return;
    }

    setSelectedPlotB(plot);
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

    setPathASubmitting(true);
    const res = await createCustomerWithBooking(session, pathAForm);
    setPathASubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', message: res.message || res.error || 'Failed to complete booking.' });
      return;
    }

    setFeedback({
      type: 'success',
      message: `Booking successfully created for ${res.customer?.fullName} on Plot ${plot.plotNumber}!`,
    });

    // Show Credentials Modal
    if (res.credentials && res.customer) {
      setCredentialsModal({
        open: true,
        username: res.credentials.username,
        password: res.credentials.password,
        customerName: res.customer.fullName,
        membershipNo: res.customer.membershipNo,
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
      });
    }

    // Reset Form
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
    });
    setSelectedPlotA(null);
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

    setPathBSubmitting(true);
    const res = await addBookingToCustomer(session, {
      customerId: selectedCustomer.id,
      plotId: pathBPlotId,
      paymentType: pathBPaymentType,
      paperInstallmentRef: pathBPaperRef,
    });
    setPathBSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', message: res.message || res.error || 'Failed to attach booking.' });
      return;
    }

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
    });

    // Reset Path B selection
    setSelectedCustomer(null);
    setIsCustomerConfirmed(false);
    setPathBPlotId('');
    setSelectedPlotB(null);
    loadInitialData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm font-medium text-slate-600">Loading booking portal...</span>
      </div>
    );
  }

  // Permission Guard
  const canAccess = session?.role === 'super_admin' || session?.permissions.can_create_customer;
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

      {/* Header & Path Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-serif tracking-tight">
                Customer Registration & Plot Bookings
              </h1>
              <p className="text-xs text-slate-500">
                Official society paper application workflow with statutory fees and 24-month installment schedules.
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
                  Mobile / Contact No. *
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
                        <span className="text-emerald-700">Plot Price:</span>{' '}
                        <strong className="text-emerald-950">PKR {selectedPlotA.price.toLocaleString()}</strong>
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

          {/* Section 4: Payment Terms & Statutory Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">4</span>
              <h2 className="text-sm font-bold text-slate-800 font-serif">Payment Terms & Financial Schedule</h2>
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
                  <option value="installment">24-Month Installment Plan (Equal Monthly)</option>
                  <option value="one_time">One-Time Lump Sum Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paper Installment Book / Manual Receipt #
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

              {/* Financial Calculation Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Admission Fee:</span>
                  <span className="font-mono text-emerald-700 font-bold">PKR 2,000 (Paid)</span>
                </div>
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Share Subscription Fee:</span>
                  <span className="font-mono text-emerald-700 font-bold">PKR 10,000 (Paid)</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-slate-600">
                  <span>Plot Purchase Value:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedPlotA ? `PKR ${selectedPlotA.price.toLocaleString()}` : '--'}
                  </span>
                </div>
                {selectedPlotA && pathAForm.paymentType === 'installment' && (
                  <div className="text-[10px] text-indigo-700 font-medium pt-1">
                    24 Installments of <strong>PKR {Math.round(selectedPlotA.price / 24).toLocaleString()}</strong> / month.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Document Upload Placeholders */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">5</span>
              <h2 className="text-sm font-bold text-slate-800 font-serif">Physical Document Attachments</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 border border-dashed border-slate-300 rounded-xl text-center bg-slate-50/50">
                <FileCheck className="w-6 h-6 mx-auto mb-1 text-emerald-700" />
                <div className="font-bold text-slate-800">Applicant Photo</div>
                <span className="text-[10px] text-slate-500">Verified passport size photo</span>
              </div>
              <div className="p-3 border border-dashed border-slate-300 rounded-xl text-center bg-slate-50/50">
                <FileCheck className="w-6 h-6 mx-auto mb-1 text-emerald-700" />
                <div className="font-bold text-slate-800">Applicant CNIC Copy</div>
                <span className="text-[10px] text-slate-500">Verified front & back copy</span>
              </div>
              <div className="p-3 border border-dashed border-slate-300 rounded-xl text-center bg-slate-50/50">
                <FileCheck className="w-6 h-6 mx-auto mb-1 text-emerald-700" />
                <div className="font-bold text-slate-800">Next of Kin CNIC Copy</div>
                <span className="text-[10px] text-slate-500">Verified nominee CNIC</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pathASubmitting || !selectedPlotA || Boolean(pathAPlotError)}
              className="px-6 py-2.5 bg-[#10251E] hover:bg-[#18392C] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2"
            >
              {pathASubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enrolling Customer & Generating Schedule...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Submit Application & Register Plot</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* PATH B: EXISTING CUSTOMER SEARCH & DISAMBIGUATION   */}
      {/* ==================================================== */}
      {activeTab === 'path_b' && (
        <div className="space-y-6">
          {/* Step 1: Search Customer */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <h2 className="text-sm font-bold text-slate-800 font-serif">Search Society Member</h2>
                <p className="text-[11px] text-slate-500">
                  Search by Applicant Name, Phone Number, CNIC, or Membership Number.
                </p>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Type customer name (e.g. Muhammad), CNIC (37405-...), phone, or PV-..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSearching ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Search</span>
              </button>
            </form>

            {/* Disambiguation Results */}
            {searchResults.length > 0 && !selectedCustomer && (
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-600 mb-2">
                  Matching Customers ({searchResults.length}) - Select matching record:
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {searchResults.map((cust) => (
                    <div
                      key={cust.id}
                      className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{cust.fullName}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {cust.membershipNo}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                              cust.accountStatus === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {cust.accountStatus}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5">
                          {cust.fatherOrHusbandName && (
                            <span>S/O: <strong>{cust.fatherOrHusbandName}</strong></span>
                          )}
                          <span>CNIC: <strong className="font-mono">{cust.cnic}</strong></span>
                          <span>Phone: <strong className="font-mono">{cust.phone}</strong></span>
                          <span>Current Properties: <strong>{cust.propertiesCount} plot(s)</strong></span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setIsCustomerConfirmed(false);
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer self-end md:self-center"
                      >
                        Select Customer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ==================================================================== */}
          {/* STEP 2: USER MANDATED CONFIRMATION STEP (GUARD AGAINST WRONG RECORD) */}
          {/* ==================================================================== */}
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
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
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
                <div className="flex items-center justify-between p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="text-xs text-amber-950 font-medium">
                    Please verify that the Name, CNIC, and current property count correspond to the intended applicant.
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomerConfirmed(true)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Customer & Proceed</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Identity Confirmed: {selectedCustomer.fullName} ({selectedCustomer.cnic}). Ready to attach additional plot booking.</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Attach Plot (Only after confirmation) */}
          {selectedCustomer && isCustomerConfirmed && selectedCustomer.accountStatus !== 'suspended' && (
            <form onSubmit={handleSubmitPathB} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">3</span>
                <h2 className="text-sm font-bold text-slate-800 font-serif">Attach Plot & Select Schedule</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Registered Plot *
                  </label>
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
                      <span><strong>{selectedPlotB.plotNumber}</strong> ({selectedPlotB.size})</span>
                      <span className="font-bold">PKR {selectedPlotB.price.toLocaleString()}</span>
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
                    <option value="installment">24-Month Installment Plan</option>
                    <option value="one_time">One-Time Lump Sum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Paper Installment Book / Manual Receipt #
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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
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
                onClick={() => setCredentialsModal(null)}
                className="text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                The member account for <strong>{credentialsModal.customerName}</strong> ({credentialsModal.membershipNo}) has been created with default portal access:
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Username / Email:</span>
                  <strong className="font-mono text-slate-900">{credentialsModal.username}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Initial Password:</span>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STYLED PRINTABLE BOOKING AGREEMENT MODAL             */}
      {/* ==================================================== */}
      {agreementModal?.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-3xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:my-0 print:max-w-none">
            {/* Modal Actions Bar (Hidden on print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Official Booking Agreement Document (Preview)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#b5952f] text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Agreement</span>
                </button>
                <button
                  onClick={() => setAgreementModal((prev) => (prev ? { ...prev, open: false } : null))}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 space-y-6 text-slate-900 font-sans print:p-6">
              {/* Header */}
              <div className="text-center border-b-2 border-[#10251E] pb-4">
                <div className="font-serif font-extrabold text-2xl tracking-wider text-[#10251E]">
                  PRIME VIEW HOUSING SCHEME
                </div>
                <div className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">
                  Executive Society Administration & Plot Allocation
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Main Expressway Sector, Islamabad / Rawalpindi Territory • UAN: (051) 111-PRIME
                </div>
                <div className="mt-3 inline-block bg-[#10251E] text-white px-4 py-1 rounded text-xs font-bold uppercase tracking-widest">
                  PLOT BOOKING & ALLOTMENT AGREEMENT
                </div>
              </div>

              {/* Reference & Date */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
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
                      <td className="p-2 bg-slate-50 font-bold w-1/4">Full Name:</td>
                      <td className="p-2 w-1/4">{agreementModal.customer.fullName}</td>
                      <td className="p-2 bg-slate-50 font-bold w-1/4">S/O or W/O:</td>
                      <td className="p-2 w-1/4">{agreementModal.customer.fatherOrHusbandName || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 bg-slate-50 font-bold">CNIC Number:</td>
                      <td className="p-2 font-mono">{agreementModal.customer.cnic}</td>
                      <td className="p-2 bg-slate-50 font-bold">Contact No:</td>
                      <td className="p-2 font-mono">{agreementModal.customer.phone}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 bg-slate-50 font-bold">Email Address:</td>
                      <td className="p-2">{agreementModal.customer.email}</td>
                      <td className="p-2 bg-slate-50 font-bold">Nominee / NOK:</td>
                      <td className="p-2">{agreementModal.customer.nokName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-bold">Mailing Address:</td>
                      <td colSpan={3} className="p-2">{agreementModal.customer.mailingAddress}</td>
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
                      <td className="p-2 bg-slate-50 font-bold w-1/4">Plot Number:</td>
                      <td className="p-2 font-mono font-bold w-1/4">{agreementModal.plot.plotNumber}</td>
                      <td className="p-2 bg-slate-50 font-bold w-1/4">Assigned Block:</td>
                      <td className="p-2 uppercase font-bold w-1/4">{agreementModal.plot.blockId}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 bg-slate-50 font-bold">Size / Dimensions:</td>
                      <td className="p-2">{agreementModal.plot.size}</td>
                      <td className="p-2 bg-slate-50 font-bold">Category:</td>
                      <td className="p-2 capitalize">{agreementModal.plot.category}</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-bold">Total Plot Value:</td>
                      <td colSpan={3} className="p-2 font-bold text-slate-900">
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
                      <th className="p-2">Fee Description</th>
                      <th className="p-2">Amount (PKR)</th>
                      <th className="p-2">Payment Status</th>
                      <th className="p-2">Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-semibold">Society Admission Fee</td>
                      <td className="p-2 font-mono">2,000</td>
                      <td className="p-2 font-bold text-emerald-700">PAID UPFRONT</td>
                      <td className="p-2 text-slate-500">Statutory Membership Fee</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-semibold">Share Subscription Fee</td>
                      <td className="p-2 font-mono">10,000</td>
                      <td className="p-2 font-bold text-emerald-700">PAID UPFRONT</td>
                      <td className="p-2 text-slate-500">Statutory Society Share</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">
                        Plot Payment: {agreementModal.paymentType === 'installment' ? '24 Equal Monthly Installments' : 'One-Time Lump Sum'}
                      </td>
                      <td className="p-2 font-mono font-bold">
                        {agreementModal.plot.price.toLocaleString()}
                      </td>
                      <td className="p-2 font-bold text-indigo-700">
                        {agreementModal.paymentType === 'installment'
                          ? `1st Inst. Paid • 23 Monthly Remaining`
                          : 'Full Payment Paid'}
                      </td>
                      <td className="p-2 text-slate-500">
                        {agreementModal.paperRef ? `Ref: ${agreementModal.paperRef}` : 'Standard Schedule'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mb-2" />
                  <div className="font-bold text-slate-800">Applicant Signature</div>
                  <div className="text-[10px] text-slate-400">Allottee Member</div>
                </div>

                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mb-2" />
                  <div className="font-bold text-slate-800">Authorized Officer</div>
                  <div className="text-[10px] text-slate-400">Prime View Operations</div>
                </div>

                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mb-2" />
                  <div className="font-bold text-slate-800">Society Secretary</div>
                  <div className="text-[10px] text-slate-400">Executive Committee Seal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
