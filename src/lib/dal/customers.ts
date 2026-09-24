import {
  AdminSession,
  Customer,
  Booking,
  Plot,
  PaymentType,
  AccountStatus,
  InstallmentPlanConfig,
} from '../mock/types';
import { getActiveSession } from './auth';
import { apiGet, apiPost, apiPatch, apiDelete } from '../api';
import { computePlotLedger } from '../ledger/plotLedger';

export interface CustomerDisambiguation {
  id: string;
  membershipNo: string;
  fullName: string;
  fatherOrHusbandName?: string;
  cnic: string;
  phone: string;
  email: string;
  mailingAddress: string;
  accountStatus: AccountStatus;
  propertiesCount: number;
}

export interface CreateCustomerWithBookingInput {
  plotId: string;
  paymentType: PaymentType;
  paperInstallmentRef?: string;
  membershipNo: string;
  fullName: string;
  fatherOrHusbandName: string;
  cnic: string;
  phone: string;
  email: string;
  mailingAddress: string;
  nokName: string;
  nokCnic: string;
  applicantPhotoUrl?: string;
  cnicCopyUrl?: string;
  nokCnicCopyUrl?: string;
  portalPassword?: string;
  lockToken?: string;
  installmentPlan?: InstallmentPlanConfig;
}

export interface AddBookingToCustomerInput {
  customerId: string;
  plotId: string;
  paymentType: PaymentType;
  paperInstallmentRef?: string;
  lockToken?: string;
  installmentPlan?: InstallmentPlanConfig;
}

export interface CustomerDirectoryPlot {
  bookingId: string;
  plotId: string;
  plotNumber: string;
  blockId: string;
  blockName: string;
  category: string;
  size: string;
  price: number;
  paymentType: PaymentType;
  bookingDate: string;
}

export interface CustomerDirectoryEntry {
  id: string;
  membershipNo: string;
  fullName: string;
  fatherOrHusbandName?: string;
  cnic: string;
  email: string;
  phone: string;
  city: string;
  mailingAddress: string;
  nokName?: string;
  nokCnic?: string;
  applicantPhotoUrl?: string;
  accountStatus: AccountStatus;
  registrationStatus: 'minimal' | 'complete';
  credentialsPending: boolean;
  createdDate: string;
  lastLogin?: string;
  strikeCount: number;
  strikeHistory: Array<{
    id: string;
    reason: string;
    assignedBy: string;
    assignedAt: string;
    receiptId?: string;
  }>;
  plots: CustomerDirectoryPlot[];
  plotsCount: number;
  installmentsPaidCount: number;
  installmentsDueCount: number;
  totalPaidAmount: number;
  totalOutstandingAmount: number;
}

export interface CreateMinimalBookingInput {
  plotId: string;
  customerName: string;
  cnic: string;
  city: string;
  lockToken?: string;
}

export interface CompleteMemberRegistrationInput {
  customerId: string;
  bookingId?: string;
  membershipNo: string;
  fatherOrHusbandName: string;
  phone: string;
  email: string;
  mailingAddress: string;
  nokName: string;
  nokCnic: string;
  paymentType: 'one_time' | 'installment';
  portalPassword?: string;
  installmentPlan?: InstallmentPlanConfig;
  paperInstallmentRef?: string;
  applicantPhotoUrl?: string;
  cnicCopyUrl?: string;
  nokCnicCopyUrl?: string;
}

// In-memory plot cache to support synchronous plot verification
let registeredPlotsCache: Plot[] = [];

export function setRegisteredPlotsCache(plots: Plot[]) {
  registeredPlotsCache = plots;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('pv_cached_plots', JSON.stringify(plots));
    } catch {
      // Storage unavailable or full
    }
  }
}

/**
 * Verify if a plot is officially registered in the Master Plan map.
 * Section 2.2.1 Prerequisite Check.
 */
export function verifyPlotRegistered(plotId: string): { exists: boolean; plot?: Plot } {
  const trimmed = plotId.trim().toLowerCase();
  if (!trimmed) return { exists: false };

  // Check in-memory cache
  let plot = registeredPlotsCache.find(
    (p) => p.id?.toLowerCase() === trimmed || p.plotNumber?.toLowerCase() === trimmed
  );

  // Fallback to session storage if cache empty in browser
  if (!plot && typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('pv_cached_plots');
      if (stored) {
        registeredPlotsCache = JSON.parse(stored);
        plot = registeredPlotsCache.find(
          (p) => p.id?.toLowerCase() === trimmed || p.plotNumber?.toLowerCase() === trimmed
        );
      }
    } catch {
      // Ignore sessionStorage parsing errors
    }
  }

  return { exists: Boolean(plot), plot };
}

/**
 * Search existing customers by Name, Phone, or CNIC with disambiguating details.
 * Exception 4.9: Prevents attaching booking to the wrong "Muhammad Ali".
 */
export async function searchCustomers(
  session: AdminSession,
  query: string
): Promise<{ ok: boolean; customers: CustomerDisambiguation[]; error?: string; message?: string }> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { ok: true, customers: [] };
  }

  const res = await apiGet<any[]>('/customers', session?.token);
  if (!res.ok || !res.data) {
    return { ok: false, customers: [], error: res.error, message: res.error };
  }

  const matches = res.data.filter(
    (c: any) =>
      c.fullName?.toLowerCase().includes(q) ||
      c.cnic?.includes(q) ||
      c.phone?.includes(q) ||
      c.membershipNo?.toLowerCase().includes(q)
  );

  const disambiguated: CustomerDisambiguation[] = matches.map((c: any) => {
    const propertiesCount = (c.bookings || []).filter(
      (b: any) => b.status === 'completed' || b.status === 'active'
    ).length;

    return {
      id: c.id,
      membershipNo: c.membershipNo || '',
      fullName: c.fullName,
      fatherOrHusbandName: c.fatherOrHusbandName,
      cnic: c.cnic,
      phone: c.phone || '',
      email: c.email || '',
      mailingAddress: c.mailingAddress || '',
      accountStatus: c.accountStatus || 'active',
      propertiesCount,
    };
  });

  return { ok: true, customers: disambiguated };
}

/**
 * Path A: Create new Customer account and attach first Plot Booking.
 */
export async function createCustomerWithBooking(
  session: AdminSession,
  input: CreateCustomerWithBookingInput
): Promise<{
  ok: boolean;
  customer?: Customer;
  booking?: Booking;
  credentials?: { username: string; password: string };
  credentialsPending?: boolean;
  error?: string;
  reason?: string;
  message?: string;
}> {
  const payload = {
    plotId: input.plotId,
    paymentType: input.paymentType,
    membershipNo: input.membershipNo,
    fullName: input.fullName,
    fatherOrHusbandName: input.fatherOrHusbandName,
    cnic: input.cnic,
    phone: input.phone,
    email: input.email,
    mailingAddress: input.mailingAddress,
    nokName: input.nokName,
    nokCnic: input.nokCnic,
    installmentPlan: input.installmentPlan,
    portalPassword: input.portalPassword,
    paperInstallmentRef: input.paperInstallmentRef,
    lockToken: input.lockToken,
    applicantPhotoUrl: input.applicantPhotoUrl,
    cnicCopyUrl: input.cnicCopyUrl,
    nokCnicCopyUrl: input.nokCnicCopyUrl,
  };

  const res = await apiPost<any>('/customers', payload, session?.token);
  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error,
      reason: res.error,
      message: res.error || 'Failed to create customer with booking.',
    };
  }

  return {
    ok: true,
    customer: res.data.customer,
    booking: res.data.booking,
    credentials: res.data.credentials,
  };
}

/**
 * Path B: Add additional Plot Booking to an existing customer account.
 */
export async function addBookingToCustomer(
  session: AdminSession,
  input: AddBookingToCustomerInput
): Promise<{
  ok: boolean;
  booking?: Booking;
  error?: string;
  reason?: string;
  message?: string;
}> {
  const payload = {
    plotId: input.plotId,
    paymentType: input.paymentType,
    installmentPlan: input.installmentPlan,
    paperInstallmentRef: input.paperInstallmentRef,
    lockToken: input.lockToken,
  };

  const res = await apiPost<any>(`/customers/${input.customerId}/bookings`, payload, session?.token);
  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error,
      reason: res.error,
      message: res.error || 'Failed to add booking to customer.',
    };
  }

  return {
    ok: true,
    booking: res.data.booking,
  };
}

/**
 * Fetch profile for the currently logged-in customer.
 */
export async function getCustomerProfile(): Promise<{
  ok: boolean;
  data?: Customer;
  error?: string;
}> {
  const session = getActiveSession();
  if (!session || session.role !== 'customer') {
    return { ok: false, error: 'UNAUTHORIZED' };
  }

  const res = await apiGet<Customer>(`/customers/${session.customerId}`, session.token);
  if (!res.ok || !res.data) {
    return { ok: false, error: res.error || 'NOT_FOUND' };
  }

  return { ok: true, data: res.data };
}

/**
 * Customer self-service profile update.
 */
export async function updateProfile(
  updates: Partial<Customer>
): Promise<{ ok: boolean; data?: Customer; error?: string; message?: string }> {
  const session = getActiveSession();
  if (!session || session.role !== 'customer') {
    return {
      ok: false,
      error: 'UNAUTHORIZED',
      message: 'You must be logged in as a member to update your profile.',
    };
  }

  const res = await apiPatch<any>(
    `/customers/${session.customerId}/profile`,
    updates,
    session.token
  );

  if (!res.ok) {
    return { ok: false, error: res.error, message: res.message || res.error };
  }

  return { ok: true, data: res.data?.customer || res.data };
}

/**
 * Customer password change.
 */
export async function changeCustomerPassword(
  customerId: string,
  currentPass: string,
  newPass: string
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const session = getActiveSession();
  if (!session) {
    return {
      ok: false,
      error: 'UNAUTHORIZED',
      message: 'You must be logged in to change your password.',
    };
  }

  const res = await apiPost<{ ok: boolean; message?: string }>(
    `/customers/${customerId}/change-password`,
    { oldPassword: currentPass, newPassword: newPass },
    session.token
  );

  if (!res.ok) {
    return { ok: false, error: res.error, message: res.message || res.error };
  }

  return { ok: true, message: res.data?.message || 'Password changed successfully.' };
}

/**
 * Record first-login Terms & Conditions acceptance by the member.
 */
export async function acceptTermsAndConditions(
  customerId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = getActiveSession();
  const res = await apiPost<any>(
    `/customers/${customerId}/accept-terms`,
    {},
    session?.token
  );
  if (!res.ok) {
    return { ok: false, error: res.error || 'Failed to record acceptance.' };
  }
  return { ok: true };
}

export async function resetCustomerPassword(
  session: AdminSession,
  customerId: string,
  _newPassword?: string // ignore; server generates
): Promise<{ ok: boolean; username?: string; newPassword?: string; error?: string; message?: string }> {
  const res = await apiPost<{ ok: boolean; username?: string; newPassword?: string }>(
    `/customers/${customerId}/reset-password`,
    {},
    session?.token
  );
  if (!res.ok) {
    return { ok: false, error: res.error, message: res.message || res.error };
  }
  return {
    ok: true,
    newPassword: (res.data as any)?.newPassword,
    username: (res.data as any)?.username,
  };
}

/**
 * Retrieve enriched Customers Directory.
 */
export async function getCustomersDirectory(
  session: AdminSession
): Promise<{ ok: boolean; customers: CustomerDirectoryEntry[]; error?: string; message?: string }> {
  const isSuper = session.role === 'super_admin';
  const hasViewPerm = Boolean(
    session.permissions?.can_view_customers || session.permissions?.can_create_customer
  );

  if (!isSuper && !hasViewPerm) {
    return {
      ok: false,
      customers: [],
      error: 'FORBIDDEN',
      message: 'You do not have permission to access the customer directory.',
    };
  }

  const res = await apiGet<any[]>('/customers', session?.token);
  if (!res.ok || !res.data) {
    return {
      ok: false,
      customers: [],
      error: res.error,
      message: res.error || 'Failed to fetch customer directory.',
    };
  }

  const enrichedList: CustomerDirectoryEntry[] = [];

  for (const customer of res.data) {
    const visiblePlots: CustomerDirectoryPlot[] = [];
    const customerBookings = customer.bookings || [];

    for (const booking of customerBookings) {
      const plot = booking.plot;
      if (!plot) continue;

      visiblePlots.push({
        bookingId: booking.id,
        plotId: plot.id,
        plotNumber: plot.plotNumber,
        blockId: plot.blockId,
        blockName: plot.block?.name || plot.blockId,
        category: plot.category,
        size: plot.size,
        price: Number(plot.price),
        paymentType: booking.paymentType,
        bookingDate: booking.bookingDate,
      });
    }

    // Calculate installment and financial stats from bookings
    let installmentsPaidCount = 0;
    let installmentsDueCount = 0;
    let totalPaidAmount = 0;
    let totalOutstandingAmount = 0;

    for (const booking of customerBookings) {
      const plot = visiblePlots.find((p) => p.plotId === booking.plotId);
      const ledger = computePlotLedger(plot?.price || 0, booking.payments || []);
      totalPaidAmount += ledger.totalPaidToDate;
      totalOutstandingAmount += ledger.remainingBalance;

      for (const p of booking.payments || []) {
        if (p.feeType === 'plot_installment' && p.status === 'paid') {
          installmentsPaidCount++;
        }
        if (p.feeType === 'plot_installment' && (p.status === 'pending' || p.status === 'overdue' || p.status === 'partially_paid')) {
          installmentsDueCount++;
        }
      }
    }

    enrichedList.push({
      id: customer.id,
      membershipNo:
        customer.membershipNo ||
        (customer.registrationStatus === 'minimal' ? 'PENDING' : ''),
      fullName: customer.fullName,
      fatherOrHusbandName: customer.fatherOrHusbandName,
      cnic: customer.cnic,
      email: customer.email || '',
      phone: customer.phone || '',
      city: customer.city || '',
      mailingAddress: customer.mailingAddress || '',
      nokName: customer.nokName,
      nokCnic: customer.nokCnic,
      applicantPhotoUrl: customer.applicantPhotoUrl,
      accountStatus: customer.accountStatus || 'active',
      registrationStatus: customer.registrationStatus || 'complete',
      credentialsPending: Boolean(customer.credentialsPending),
      createdDate: customer.createdAt || new Date().toISOString(),
      lastLogin: customer.lastLogin,
      strikeCount: customer.strikeCount || 0,
      strikeHistory: (customer.strikes || []).map((s: any) => ({
        id: s.id,
        reason: s.reason,
        assignedBy: s.assignedBy,
        assignedAt: s.createdAt,
        receiptId: s.receiptId,
      })),
      plots: visiblePlots,
      plotsCount: visiblePlots.length,
      installmentsPaidCount,
      installmentsDueCount,
      totalPaidAmount,
      totalOutstandingAmount,
    });
  }

  enrichedList.sort((a, b) => a.membershipNo.localeCompare(b.membershipNo));
  return { ok: true, customers: enrichedList };
}

/**
 * Assign an administrative strike to a customer.
 */
export async function assignCustomerStrike(
  session: AdminSession,
  input: { customerId: string; reason: string; receiptId?: string }
): Promise<{ ok: boolean; customer?: Customer; error?: string; message?: string }> {
  const res = await apiPost<any>(
    `/customers/${input.customerId}/strikes`,
    { reason: input.reason, receiptId: input.receiptId },
    session?.token
  );

  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error,
      message: res.error || 'Failed to assign strike.',
    };
  }

  return {
    ok: true,
    message: res.data.message || 'Strike assigned successfully.',
  };
}

/**
 * Suspend or reactivate a Customer Portal account.
 */
export async function toggleCustomerSuspension(
  session: AdminSession,
  customerId: string,
  action: 'suspend' | 'activate',
  reason?: string
): Promise<{ ok: boolean; customer?: Customer; error?: string; message?: string }> {
  const res = await apiPost<any>(
    `/customers/${customerId}/suspend`,
    { action, reason },
    session?.token
  );

  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error,
      message: res.error || 'Failed to modify suspension status.',
    };
  }

  return {
    ok: true,
    customer: res.data.customer,
    message: res.data.message || 'Customer account status updated successfully.',
  };
}

export async function issuePortalCredentials(
  session: AdminSession,
  customerId: string
): Promise<{
  ok: boolean;
  username?: string;
  password?: string;
  customer?: Customer;
  error?: string;
  reason?: string;
  message?: string;
}> {
  const res = await apiPost<{ ok: boolean; username?: string; password?: string }>(
    `/customers/${customerId}/issue-credentials`,
    {},
    session?.token
  );
  if (!res.ok) {
    return { ok: false, error: res.error, message: res.message || res.error };
  }
  return {
    ok: true,
    username: (res.data as any)?.username,
    password: (res.data as any)?.password,
  };
}

export async function deleteCustomer(
  session: AdminSession,
  customerId: string
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const res = await apiDelete<{ ok: boolean; deletedId?: string }>(
    `/customers/${customerId}`,
    session?.token
  );
  if (!res.ok) {
    return { ok: false, error: res.error, message: res.message || res.error };
  }
  return { ok: true };
}

/**
 * Sub Admin Quick Booking Flow (Minimal Customer Registration).
 */
export async function createMinimalBooking(
  session: AdminSession,
  input: CreateMinimalBookingInput
): Promise<{
  ok: boolean;
  customer?: Customer;
  booking?: Booking;
  error?: string;
  reason?: string;
  message?: string;
}> {
  const res = await apiPost<any>('/customers/minimal-booking', input, session?.token);
  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error,
      reason: res.error,
      message: res.error || 'Failed to create minimal booking.',
    };
  }

  return {
    ok: true,
    customer: res.data.customer,
    booking: res.data.booking,
  };
}

/**
 * Super Admin Action: Complete Member Registration.
 */
export async function completeMemberRegistration(
  session: AdminSession,
  input: CompleteMemberRegistrationInput
): Promise<{
  ok: boolean;
  customer?: Customer;
  booking?: Booking;
  credentials?: { username: string; password: string };
  error?: string;
  reason?: string;
  message?: string;
}> {
  const { customerId, ...body } = input;
  const res = await apiPost<any>(
    `/customers/${customerId}/complete-registration`,
    body,
    session?.token
  );

  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error,
      reason: res.error,
      message: res.error || 'Failed to complete member registration.',
    };
  }

  return {
    ok: true,
    customer: res.data.customer,
    booking: res.data.booking,
    credentials: res.data.credentials,
    message: res.data.message,
  };
}
