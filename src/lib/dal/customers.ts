import { mockStore } from '../mock/store';
import { AdminSession, Customer, Booking, PaymentRecord, SocietyDocument, Plot, PaymentType, AccountStatus, InstallmentPlanConfig } from '../mock/types';
import { canAccessBlock } from './adminAuth';
import { getActiveSession } from './auth';
import { apiGet } from '../api';

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

/**
 * Verify if a plot is officially registered in the Master Plan map.
 * Section 2.2.1 Prerequisite Check.
 */
export function verifyPlotRegistered(plotId: string): { exists: boolean; plot?: Plot } {
  mockStore.loadFromStorage();
  const trimmed = plotId.trim().toLowerCase();
  const plot = mockStore.plots.find(
    (p) => p.id.toLowerCase() === trimmed || p.plotNumber.toLowerCase() === trimmed
  );
  return { exists: Boolean(plot), plot };
}

/**
 * Search existing customers by Name, Phone, or CNIC with disambiguating details.
 * Exception 4.9: Prevents attaching booking to the wrong "Muhammad Ali".
 */
export async function searchCustomers(
  session: AdminSession,
  query: string
): Promise<{ ok: boolean; customers: CustomerDisambiguation[] }> {
  mockStore.loadFromStorage();
  const q = query.trim().toLowerCase();
  if (!q) {
    return { ok: true, customers: [] };
  }

  const matches = mockStore.customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(q) ||
      c.cnic.includes(q) ||
      c.phone.includes(q) ||
      c.membershipNo.toLowerCase().includes(q)
  );

  const disambiguated: CustomerDisambiguation[] = matches.map((c) => {
    const propertiesCount = mockStore.bookings.filter(
      (b) => b.customerId === c.id && b.status === 'completed'
    ).length;

    return {
      id: c.id,
      membershipNo: c.membershipNo,
      fullName: c.fullName,
      fatherOrHusbandName: c.fatherOrHusbandName,
      cnic: c.cnic,
      phone: c.phone,
      email: c.email,
      mailingAddress: c.mailingAddress,
      accountStatus: c.accountStatus,
      propertiesCount,
    };
  });

  return { ok: true, customers: disambiguated };
}

/**
 * Path A: Create new Customer account and attach first Plot Booking.
 * Implements complete paper booking form field set, fixed statutory fees,
 * 24-month installment schedule, and atomic commit discipline.
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
  message?: string;
}> {
  mockStore.loadFromStorage();

  // 1. Permission check
  if (!session.permissions.can_create_customer && session.role !== 'super_admin') {
    return { ok: false, error: 'FORBIDDEN', message: 'You do not have permission to create customer bookings.' };
  }

  // 2. Master Plan Prerequisite Check (Exception 4.5 & Section 2.2.1)
  const { exists, plot } = verifyPlotRegistered(input.plotId);
  if (!exists || !plot) {
    return {
      ok: false,
      error: 'PLOT_NOT_REGISTERED',
      message: 'This plot is not registered on the master plan map. Kindly register the plot before proceeding.',
    };
  }

  // 3. Block Scoping Check
  if (!canAccessBlock(session, plot.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE', message: 'Plot is outside your assigned administrative block scope.' };
  }

  // 4. Non-Sellable Amenity Guard
  if (plot.category === 'amenity') {
    return { ok: false, error: 'AMENITY_NOT_SELLABLE', message: 'Amenity utility plots cannot be booked or sold.' };
  }

  if (plot.isAdjustment) {
    return { ok: false, error: 'PLOT_UNDER_ADJUSTMENT', message: 'This plot is under administrative adjustment/re-survey and cannot be booked.' };
  }

  // 5. Layer 2 Atomic Commit Guard: verify plot availability
  if (plot.status === 'booked') {
    return { ok: false, error: 'PLOT_ALREADY_BOOKED', message: 'This plot has already been committed to another owner.' };
  }

  // 5.1 Lock validation (Change Request 05 §3)
  if (plot.lockedBy) {
    const isLockOwner = plot.lockedBy === session.adminId;
    const isTokenMatch = !input.lockToken || plot.lockToken === input.lockToken;
    const isUnexpired = plot.lockedAt && (Date.now() - plot.lockedAt <= 10 * 60 * 1000);
    if (!isLockOwner || !isTokenMatch || !isUnexpired) {
      return {
        ok: false,
        error: 'LOCK_EXPIRED',
        message: 'Your session to book this plot has expired, please try again.',
      };
    }
  }

  // 5.2 Portal Credentials Gate (Super Admin Only per Change Request 07)
  const canIssueCredentials = session.role === 'super_admin';

  // ============================================================================
  // SECURITY NOTICE / BACKEND MIGRATION NOTE:
  // 'password123' / 'Password123!' is a MOCK-DATA-ONLY PLACEHOLDER for prototype demo.
  // It is NOT a real credential policy. In the production backend phase, replace with
  // cryptographically secure one-time temporary passwords, SMS/Email OTP provisioning,
  // or a secure password-reset invitation link per 00 §5 and 03 §5.
  // ============================================================================
  let initialPassword = '';
  if (canIssueCredentials) {
    initialPassword = input.portalPassword?.trim() || 'password123';
    if (initialPassword.length < 8) {
      return {
        ok: false,
        error: 'INVALID_PASSWORD',
        message: 'Portal password must be at least 8 characters long to prevent brute force attacks.',
      };
    }
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 6. Exception 4.4 Atomicity Discipline: Build full records array in memory first
  const customerId = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newCustomer: Customer = {
    id: customerId,
    membershipNo: input.membershipNo.trim(),
    fullName: input.fullName.trim(),
    fatherOrHusbandName: input.fatherOrHusbandName.trim(),
    cnic: input.cnic.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    mailingAddress: input.mailingAddress.trim(),
    nokName: input.nokName.trim(),
    nokCnic: input.nokCnic.trim(),
    applicantPhotoUrl: input.applicantPhotoUrl || '/media/placeholder-applicant.jpg',
    cnicCopyUrl: input.cnicCopyUrl || '/media/placeholder-cnic.jpg',
    nokCnicCopyUrl: input.nokCnicCopyUrl || '/media/placeholder-nok.jpg',
    accountStatus: 'active',
    registrationStatus: 'complete',
    createdDate: todayStr,
    passwordHash: initialPassword,
    credentialsPending: !canIssueCredentials,
    termsAccepted: false, // Must accept terms on first login
  };

  const newBooking: Booking = {
    id: bookingId,
    customerId,
    plotId: plot.id,
    paymentType: input.paymentType,
    status: 'completed',
    registrationStatus: 'complete',
    bookingDate: todayStr,
    confirmationDate: todayStr,
    paperInstallmentRef: input.paperInstallmentRef?.trim(),
  };

  // 7. Statutory Fees (PKR 2,000 Admission Fee + PKR 10,000 Share Subscription Fee)
  // Collected upfront, marked as paid, isolated from plot price total (Exception 4.11)
  const admissionFee: PaymentRecord = {
    id: `fee-adm-${bookingId}`,
    bookingId,
    plotId: plot.id,
    feeType: 'admission_fee',
    dueDate: todayStr,
    amount: 2000,
    paidAmount: 2000,
    paidDate: todayStr,
    status: 'paid',
    transactionRef: `TXN-ADM-${Date.now().toString().slice(-6)}`,
  };

  const shareSubFee: PaymentRecord = {
    id: `fee-sub-${bookingId}`,
    bookingId,
    plotId: plot.id,
    feeType: 'share_subscription_fee',
    dueDate: todayStr,
    amount: 10000,
    paidAmount: 10000,
    paidDate: todayStr,
    status: 'paid',
    transactionRef: `TXN-SUB-${Date.now().toString().slice(-6)}`,
  };

  const paymentRecords: PaymentRecord[] = [admissionFee, shareSubFee];  // 8. Plot Price Payment Schedule (Structured Installment Plan — Change Request 05 §6)
  if (input.paymentType === 'one_time') {
    const oneTimePayment: PaymentRecord = {
      id: `pay-one-${bookingId}`,
      bookingId,
      plotId: plot.id,
      feeType: 'plot_one_time',
      dueDate: todayStr,
      amount: plot.price,
      paidAmount: plot.price,
      paidDate: todayStr,
      status: 'paid',
      transactionRef: `TXN-FULL-${Date.now().toString().slice(-6)}`,
    };
    paymentRecords.push(oneTimePayment);
  } else {
    // Dynamic Installment Plan Engine
    const plan = input.installmentPlan;
    const totalPayment = plan?.totalPayment || plot.price;
    const downpayment = plan ? Math.max(0, plan.downpayment) : Math.round(plot.price / 4);
    const planYears = plan?.planYears || plan?.years || 2;
    const paidAfterEvery = plan?.paidAfterEveryMonths || plan?.paidAfterEvery || 6;
    const numberOfInstallments = plan?.numberOfInstallments || Math.ceil((planYears * 12) / paidAfterEvery);

    // Form-level validation guard: 0 <= downpayment < totalPayment
    if (downpayment >= totalPayment) {
      return {
        ok: false,
        error: 'INVALID_DOWNPAYMENT',
        message: 'Downpayment must be less than Total Payment price.',
      };
    }

    // 8.1 Upfront Downpayment Record (feeType: 'plot_downpayment', marked paid immediately)
    if (downpayment > 0) {
      paymentRecords.push({
        id: `pay-down-${bookingId}`,
        bookingId,
        plotId: plot.id,
        feeType: 'plot_downpayment',
        installmentNumber: 0,
        dueDate: todayStr,
        amount: downpayment,
        paidAmount: downpayment,
        paidDate: todayStr,
        status: 'paid',
        transactionRef: `TXN-DOWN-${Date.now().toString().slice(-6)}`,
      });
    }

    // 8.2 Generate N Installment Records with rounding remainder absorbed by final installment
    const remainingBalance = totalPayment - downpayment;
    const baseInstallmentAmount = Math.floor(remainingBalance / numberOfInstallments);
    const roundingRemainder = remainingBalance - (baseInstallmentAmount * numberOfInstallments);

    for (let i = 1; i <= numberOfInstallments; i++) {
      // Due date strictly falls on the 5th of the month following the booking month (Item 2)
      const dueDate = new Date(now.getFullYear(), now.getMonth() + (i * paidAfterEvery), 5);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      // Final installment absorbs remainder (Exception 4.13b)
      const currentInstAmount = i === numberOfInstallments
        ? baseInstallmentAmount + roundingRemainder
        : baseInstallmentAmount;

      paymentRecords.push({
        id: `pay-inst-${bookingId}-${i}`,
        bookingId,
        plotId: plot.id,
        feeType: 'plot_installment',
        installmentNumber: i,
        dueDate: dueDateStr,
        amount: currentInstAmount,
        paidAmount: 0,
        status: 'pending',
      });
    }

    // Persist raw plan parameters for auditability
    newBooking.installmentPlan = {
      totalPayment,
      downpayment,
      planYears,
      paidAfterEveryMonths: paidAfterEvery,
      numberOfInstallments,
    };
  }

  // 9. Documents generation
  const bookingDoc: SocietyDocument = {
    id: `doc-book-${bookingId}`,
    bookingId,
    plotId: plot.id,
    type: 'booking_agreement',
    fileName: `Booking_Agreement_${newCustomer.membershipNo}_${plot.plotNumber}.pdf`,
    uploadDate: todayStr,
    fileSizeKb: 340,
    mockFileUrl: `/docs/agreements/Booking_${plot.plotNumber}.pdf`,
  };

  // 10. Single Combined Store Mutation (Atomic Commit)
  plot.status = 'booked';
  plot.currentOwnerId = customerId;
  plot.lockedBy = undefined;
  plot.lockedByName = undefined;
  plot.lockedAt = undefined;
  plot.lockToken = undefined;
  mockStore.clearLockTimeout(plot.id);

  mockStore.customers.push(newCustomer);
  mockStore.bookings.push(newBooking);
  mockStore.payments.push(...paymentRecords);
  mockStore.documents.push(bookingDoc);

  // Persist attached physical paperwork into mockStore.customerDocuments for dossier inspection
  if (input.applicantPhotoUrl && input.applicantPhotoUrl.startsWith('data:')) {
    mockStore.customerDocuments.push({
      id: `cdoc-${Date.now()}-photo`,
      customerId,
      bookingId,
      type: 'applicant_photo',
      fileName: 'applicant_photo.jpg',
      fileSizeKb: Math.max(1, Math.round(input.applicantPhotoUrl.length / 1024)),
      fileUrl: input.applicantPhotoUrl,
      uploadedAt: new Date().toISOString(),
      uploadedByUserId: session.adminId,
      uploadedByUserName: session.fullName,
    });
  }
  if (input.cnicCopyUrl && input.cnicCopyUrl.startsWith('data:')) {
    const isPdf = input.cnicCopyUrl.startsWith('data:application/pdf');
    mockStore.customerDocuments.push({
      id: `cdoc-${Date.now()}-cnic`,
      customerId,
      bookingId,
      type: 'cnic_copy',
      fileName: isPdf ? 'applicant_cnic.pdf' : 'applicant_cnic.jpg',
      fileSizeKb: Math.max(1, Math.round(input.cnicCopyUrl.length / 1024)),
      fileUrl: input.cnicCopyUrl,
      uploadedAt: new Date().toISOString(),
      uploadedByUserId: session.adminId,
      uploadedByUserName: session.fullName,
    });
  }
  if (input.nokCnicCopyUrl && input.nokCnicCopyUrl.startsWith('data:')) {
    const isPdf = input.nokCnicCopyUrl.startsWith('data:application/pdf');
    mockStore.customerDocuments.push({
      id: `cdoc-${Date.now()}-nok`,
      customerId,
      bookingId,
      type: 'nok_cnic_copy',
      fileName: isPdf ? 'nok_cnic.pdf' : 'nok_cnic.jpg',
      fileSizeKb: Math.max(1, Math.round(input.nokCnicCopyUrl.length / 1024)),
      fileUrl: input.nokCnicCopyUrl,
      uploadedAt: new Date().toISOString(),
      uploadedByUserId: session.adminId,
      uploadedByUserName: session.fullName,
    });
  }

  // 11. Audit Logging & Cross-tab Broadcast
  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'CUSTOMER_CREATED',
    entityType: 'customer',
    entityId: customerId,
    details: `Customer ${newCustomer.fullName} (${newCustomer.membershipNo}) created by ${session.fullName}`,
    newValue: JSON.stringify({
      membershipNo: newCustomer.membershipNo,
      plotNumber: plot.plotNumber,
      paymentType: input.paymentType,
    }),
  });

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'PLOT_BOOKED',
    entityType: 'booking',
    entityId: bookingId,
    details: `Plot ${plot.plotNumber} booked for customer ${newCustomer.fullName} (${newCustomer.membershipNo})`,
  });

  mockStore.broadcast({
    type: 'PLOT_BOOKED',
    timestamp: new Date().toISOString(),
    plotId: plot.id,
    bookingId,
    customerId,
  });

  mockStore.broadcast({
    type: 'CUSTOMER_CREATED',
    timestamp: new Date().toISOString(),
    customerId,
    membershipNo: newCustomer.membershipNo,
  });

  return {
    ok: true,
    customer: newCustomer,
    booking: newBooking,
    credentials: canIssueCredentials
      ? {
          username: newCustomer.membershipNo,
          password: initialPassword,
        }
      : undefined,
    credentialsPending: !canIssueCredentials,
  };
}

/**
 * Path B: Add additional Plot Booking to an existing customer account.
 * Exception 4.6: Blocks if customer is suspended.
 * Exception 4.4: In-memory atomicity discipline.
 */
export async function addBookingToCustomer(
  session: AdminSession,
  input: AddBookingToCustomerInput
): Promise<{
  ok: boolean;
  booking?: Booking;
  error?: string;
  message?: string;
}> {
  mockStore.loadFromStorage();

  // 1. Permission check
  if (!session.permissions.can_create_customer && session.role !== 'super_admin') {
    return { ok: false, error: 'FORBIDDEN', message: 'You do not have permission to attach plot bookings.' };
  }

  // 2. Customer Lookup & Exception 4.6 Suspended Check
  const customer = mockStore.customers.find((c) => c.id === input.customerId);
  if (!customer) {
    return { ok: false, error: 'CUSTOMER_NOT_FOUND', message: 'Selected customer could not be found.' };
  }

  if (customer.accountStatus === 'suspended') {
    return {
      ok: false,
      error: 'CUSTOMER_SUSPENDED',
      message: 'Cannot attach new bookings: Customer account is currently suspended.',
    };
  }

  // 3. Master Plan Prerequisite Check
  const { exists, plot } = verifyPlotRegistered(input.plotId);
  if (!exists || !plot) {
    return {
      ok: false,
      error: 'PLOT_NOT_REGISTERED',
      message: 'This plot is not registered on the master plan map. Kindly register the plot before proceeding.',
    };
  }

  // 4. Block Scope & Non-sellable check
  if (!canAccessBlock(session, plot.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE', message: 'Plot is outside your assigned administrative block scope.' };
  }

  if (plot.category === 'amenity') {
    return { ok: false, error: 'AMENITY_NOT_SELLABLE', message: 'Amenity utility plots cannot be booked or sold.' };
  }

  if (plot.isAdjustment) {
    return { ok: false, error: 'PLOT_UNDER_ADJUSTMENT', message: 'This plot is under administrative adjustment/re-survey and cannot be booked.' };
  }

  // 5. Atomic commit check
  if (plot.status === 'booked') {
    return { ok: false, error: 'PLOT_ALREADY_BOOKED', message: 'This plot has already been committed to another owner.' };
  }

  // 5.1 Lock validation (Change Request 05 §3)
  if (plot.lockedBy) {
    const isLockOwner = plot.lockedBy === session.adminId;
    const isTokenMatch = !input.lockToken || plot.lockToken === input.lockToken;
    const isUnexpired = plot.lockedAt && (Date.now() - plot.lockedAt <= 10 * 60 * 1000);
    if (!isLockOwner || !isTokenMatch || !isUnexpired) {
      return {
        ok: false,
        error: 'LOCK_EXPIRED',
        message: 'Your session to book this plot has expired, please try again.',
      };
    }
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newBooking: Booking = {
    id: bookingId,
    customerId: customer.id,
    plotId: plot.id,
    paymentType: input.paymentType,
    status: 'completed',
    registrationStatus: 'complete',
    bookingDate: todayStr,
    confirmationDate: todayStr,
    paperInstallmentRef: input.paperInstallmentRef?.trim(),
  };

  // Statutory Fees
  const admissionFee: PaymentRecord = {
    id: `fee-adm-${bookingId}`,
    bookingId,
    plotId: plot.id,
    feeType: 'admission_fee',
    dueDate: todayStr,
    amount: 2000,
    paidAmount: 2000,
    paidDate: todayStr,
    status: 'paid',
    transactionRef: `TXN-ADM-${Date.now().toString().slice(-6)}`,
  };

  const shareSubFee: PaymentRecord = {
    id: `fee-sub-${bookingId}`,
    bookingId,
    plotId: plot.id,
    feeType: 'share_subscription_fee',
    dueDate: todayStr,
    amount: 10000,
    paidAmount: 10000,
    paidDate: todayStr,
    status: 'paid',
    transactionRef: `TXN-SUB-${Date.now().toString().slice(-6)}`,
  };

  const paymentRecords: PaymentRecord[] = [admissionFee, shareSubFee];

  // Plot price schedule
  if (input.paymentType === 'one_time') {
    paymentRecords.push({
      id: `pay-one-${bookingId}`,
      bookingId,
      plotId: plot.id,
      feeType: 'plot_one_time',
      dueDate: todayStr,
      amount: plot.price,
      paidAmount: plot.price,
      paidDate: todayStr,
      status: 'paid',
      transactionRef: `TXN-FULL-${Date.now().toString().slice(-6)}`,
    });
  } else {
    // Dynamic Installment Plan Engine (Change Request 05 §6)
    const plan = input.installmentPlan;
    const totalPayment = plan?.totalPayment || plot.price;
    const downpayment = plan ? Math.max(0, plan.downpayment) : Math.round(plot.price / 4);
    const planYears = plan?.planYears || plan?.years || 2;
    const paidAfterEvery = plan?.paidAfterEveryMonths || plan?.paidAfterEvery || 6;
    const numberOfInstallments = plan?.numberOfInstallments || Math.ceil((planYears * 12) / paidAfterEvery);

    if (downpayment >= totalPayment) {
      return {
        ok: false,
        error: 'INVALID_DOWNPAYMENT',
        message: 'Downpayment must be less than Total Payment price.',
      };
    }

    if (downpayment > 0) {
      paymentRecords.push({
        id: `pay-down-${bookingId}`,
        bookingId,
        plotId: plot.id,
        feeType: 'plot_downpayment',
        installmentNumber: 0,
        dueDate: todayStr,
        amount: downpayment,
        paidAmount: downpayment,
        paidDate: todayStr,
        status: 'paid',
        transactionRef: `TXN-DOWN-${Date.now().toString().slice(-6)}`,
      });
    }

    const remainingBalance = totalPayment - downpayment;
    const baseInstallmentAmount = Math.floor(remainingBalance / numberOfInstallments);
    const roundingRemainder = remainingBalance - (baseInstallmentAmount * numberOfInstallments);

    for (let i = 1; i <= numberOfInstallments; i++) {
      // Due date strictly falls on the 5th of the month following the booking month (Item 2)
      const dueDate = new Date(now.getFullYear(), now.getMonth() + (i * paidAfterEvery), 5);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const currentInstAmount = i === numberOfInstallments
        ? baseInstallmentAmount + roundingRemainder
        : baseInstallmentAmount;

      paymentRecords.push({
        id: `pay-inst-${bookingId}-${i}`,
        bookingId,
        plotId: plot.id,
        feeType: 'plot_installment',
        installmentNumber: i,
        dueDate: dueDateStr,
        amount: currentInstAmount,
        paidAmount: 0,
        status: 'pending',
      });
    }

    newBooking.installmentPlan = {
      totalPayment,
      downpayment,
      planYears,
      paidAfterEveryMonths: paidAfterEvery,
      numberOfInstallments,
    };
  }

  // Commit mutation
  plot.status = 'booked';
  plot.currentOwnerId = customer.id;
  plot.lockedBy = undefined;
  plot.lockedByName = undefined;
  plot.lockedAt = undefined;
  plot.lockToken = undefined;
  mockStore.clearLockTimeout(plot.id);

  mockStore.bookings.push(newBooking);
  mockStore.payments.push(...paymentRecords);

  // Audit log & Broadcast
  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'CUSTOMER_PLOT_ADDED',
    entityType: 'booking',
    entityId: bookingId,
    details: `Added new Plot ${plot.plotNumber} booking to existing customer ${customer.fullName} (${customer.membershipNo})`,
  });

  mockStore.broadcast({
    type: 'PLOT_BOOKED',
    timestamp: new Date().toISOString(),
    plotId: plot.id,
    bookingId,
    customerId: customer.id,
  });

  mockStore.broadcast({
    type: 'BOOKING_CREATED',
    timestamp: new Date().toISOString(),
    bookingId,
    customerId: customer.id,
  });

  return { ok: true, booking: newBooking };
}

/**
 * Retrieve the current logged in customer's profile via real API (GET /customers/:id) or mockStore fallback.
 */
export async function getCustomerProfile(): Promise<{
  ok: boolean;
  data?: Customer;
  error?: string;
}> {
  mockStore.loadFromStorage();
  const session = getActiveSession();
  if (!session || session.role !== 'customer') {
    return { ok: false, error: 'UNAUTHORIZED' };
  }

  if (session.token) {
    const apiRes = await apiGet<Customer>(`/customers/${session.customerId}`, session.token);
    if (apiRes.ok && apiRes.data) {
      return { ok: true, data: apiRes.data };
    }
  }

  const customer = mockStore.customers.find((c) => c.id === session.customerId);
  if (!customer) {
    return { ok: false, error: 'NOT_FOUND' };
  }

  return { ok: true, data: customer };
}

/**
 * Update current logged in customer's contact information (Member Portal).
 */
export async function updateProfile(updates: Partial<Customer>): Promise<{
  ok: boolean;
  data?: Customer;
  error?: string;
}> {
  mockStore.loadFromStorage();
  const session = getActiveSession();
  if (!session || session.role !== 'customer') {
    return { ok: false, error: 'UNAUTHORIZED' };
  }

  const customer = mockStore.customers.find((c) => c.id === session.customerId);
  if (!customer) {
    return { ok: false, error: 'NOT_FOUND' };
  }

  if (updates.fullName !== undefined) customer.fullName = updates.fullName.trim();
  if (updates.email !== undefined) customer.email = updates.email.trim();
  if (updates.phone !== undefined) customer.phone = updates.phone.trim();
  if (updates.mailingAddress !== undefined) customer.mailingAddress = updates.mailingAddress.trim();

  mockStore.saveToStorage();

  mockStore.addAuditEntry({
    actorId: customer.id,
    actorName: customer.fullName,
    actorRole: 'customer',
    action: 'PROFILE_UPDATED',
    entityType: 'customer',
    entityId: customer.id,
    details: `Customer ${customer.fullName} updated contact information`,
  });

  mockStore.broadcast({
    type: 'PROFILE_UPDATED',
    timestamp: new Date().toISOString(),
    customerId: customer.id,
  });

  return { ok: true, data: customer };
}

/**
 * Customer Password Change Capability.
 * Verifies current password and enforces minimum 8 characters.
 */
export async function changeCustomerPassword(
  customerId: string,
  currentPass: string,
  newPass: string
): Promise<{ ok: boolean; error?: string; message?: string }> {
  mockStore.loadFromStorage();
  const session = getActiveSession();
  if (!session || session.customerId !== customerId) {
    return { ok: false, error: 'UNAUTHORIZED', message: 'Please log in to change your password.' };
  }

  const customer = mockStore.customers.find((c) => c.id === customerId);
  if (!customer) {
    return { ok: false, error: 'NOT_FOUND', message: 'Customer account not found.' };
  }

  if (customer.passwordHash !== currentPass) {
    return { ok: false, error: 'INCORRECT_PASSWORD', message: 'The current password you entered is incorrect.' };
  }

  const trimmedNew = newPass.trim();
  if (trimmedNew.length < 8) {
    return {
      ok: false,
      error: 'PASSWORD_TOO_SHORT',
      message: 'New password must be at least 8 characters long.',
    };
  }

  customer.passwordHash = trimmedNew;
  mockStore.saveToStorage();

  mockStore.addAuditEntry({
    actorId: customer.id,
    actorName: customer.fullName,
    actorRole: 'customer',
    action: 'CUSTOMER_PASSWORD_CHANGED',
    entityType: 'customer',
    entityId: customer.id,
    details: `Customer ${customer.fullName} changed portal password`,
  });

  return { ok: true, message: 'Password updated successfully.' };
}

/**
 * Record first-login Terms & Conditions acceptance by the member.
 */
export async function acceptTermsAndConditions(
  customerId: string
): Promise<{ ok: boolean; error?: string }> {
  mockStore.loadFromStorage();
  const customer = mockStore.customers.find((c) => c.id === customerId);
  if (!customer) {
    return { ok: false, error: 'NOT_FOUND' };
  }

  customer.termsAccepted = true;
  customer.termsAcceptedAt = new Date().toISOString();
  mockStore.saveToStorage();

  mockStore.addAuditEntry({
    actorId: customer.id,
    actorName: customer.fullName,
    actorRole: 'customer',
    action: 'TERMS_ACCEPTED',
    entityType: 'customer',
    entityId: customer.id,
    details: `Customer ${customer.fullName} agreed to Society Terms and Conditions on first login`,
  });

  mockStore.broadcast({
    type: 'PROFILE_UPDATED',
    timestamp: new Date().toISOString(),
    customerId: customer.id,
  });

  return { ok: true };
}

/**
 * Admin action: Reset a customer's portal password.
 * Fulfills Gap 5: Admin-mediated credential recovery without customer self-service.
 */
export async function resetCustomerPassword(
  session: AdminSession,
  customerId: string,
  newPassword?: string
): Promise<{ ok: boolean; newPassword?: string; error?: string; message?: string }> {
  mockStore.loadFromStorage();

  const isSuper = session.role === 'super_admin';
  const canManage = Boolean(session.permissions?.can_create_customer);
  if (!isSuper && !canManage) {
    return {
      ok: false,
      error: 'FORBIDDEN',
      message: 'You do not have administrative permission to reset customer passwords.',
    };
  }

  const customer = mockStore.customers.find((c) => c.id === customerId);
  if (!customer) {
    return { ok: false, error: 'CUSTOMER_NOT_FOUND', message: 'Customer record not found.' };
  }

  let finalPassword = newPassword?.trim();
  if (finalPassword) {
    if (finalPassword.length < 8) {
      return {
        ok: false,
        error: 'PASSWORD_TOO_SHORT',
        message: 'Password must be at least 8 characters long.',
      };
    }
  } else {
    // Generate secure 8-character password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = 'PV-';
    for (let i = 0; i < 5; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    finalPassword = generated;
  }

  customer.passwordHash = finalPassword;
  mockStore.saveToStorage();

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'CUSTOMER_PASSWORD_RESET',
    entityType: 'customer',
    entityId: customer.id,
    details: `Admin ${session.fullName} reset portal password for Member ${customer.fullName} (${customer.membershipNo})`,
  });

  mockStore.broadcast({
    type: 'CUSTOMER_UPDATED',
    timestamp: new Date().toISOString(),
    customerId: customer.id,
  });

  return {
    ok: true,
    newPassword: finalPassword,
    message: `Password reset successfully for ${customer.fullName}.`,
  };
}

// ── Customer Directory & Strike System (Phase 3 Admin Portal) ──

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
  city?: string;
  mailingAddress: string;
  nokName: string;
  nokCnic: string;
  applicantPhotoUrl?: string;
  accountStatus: AccountStatus;
  registrationStatus?: 'minimal' | 'complete';
  credentialsPending?: boolean;
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

/**
 * Retrieve enriched list of customers for the Customer Management Directory.
 * Strictly block-scoped for Sub Admins: only customers who own plots in their assigned
 * blocks are visible, and out-of-scope plots are redacted for multi-plot owners.
 */
export async function getCustomersDirectory(
  session: AdminSession
): Promise<{ ok: boolean; customers: CustomerDirectoryEntry[]; error?: string; message?: string }> {
  mockStore.loadFromStorage();

  const isSuper = session.role === 'super_admin';
  const hasViewPerm = Boolean(session.permissions?.can_view_customers || session.permissions?.can_create_customer);

  if (!isSuper && !hasViewPerm) {
    return {
      ok: false,
      customers: [],
      error: 'FORBIDDEN',
      message: 'You do not have permission to access the customer directory.',
    };
  }

  let rawCustomers: any[] = mockStore.customers;
  if (session?.token) {
    const apiRes = await apiGet<any[]>('/customers', session.token);
    if (apiRes.ok && Array.isArray(apiRes.data)) {
      rawCustomers = apiRes.data;
    }
  }

  const assignedBlocks = new Set((session.assignedBlocks || []).map((b) => b.toString().toLowerCase()));

  const enrichedList: CustomerDirectoryEntry[] = [];

  for (const customer of rawCustomers) {
    // Collect all bookings and plots owned by this customer
    const customerBookings = mockStore.bookings.filter((b) => b.customerId === customer.id);

    // Map each booking to its plot and check block accessibility
    const visiblePlots: CustomerDirectoryPlot[] = [];
    let hasPlotInScope = isSuper;

    for (const booking of customerBookings) {
      const plot = mockStore.plots.find((p) => p.id === booking.plotId);
      if (!plot) continue;

      const plotBlockId = (plot.blockId || '').toString().toLowerCase();
      const inScope = isSuper || assignedBlocks.has(plotBlockId);

      if (inScope) {
        hasPlotInScope = true;
        const block = mockStore.blocks.find((b) => b.id.toLowerCase() === plotBlockId);
        visiblePlots.push({
          bookingId: booking.id,
          plotId: plot.id,
          plotNumber: plot.plotNumber,
          blockId: plot.blockId,
          blockName: block ? block.name : plot.blockId,
          category: plot.category,
          size: plot.size,
          price: plot.price,
          paymentType: booking.paymentType,
          bookingDate: booking.bookingDate,
        });
      }
    }

    // Sub-admin block scoping: customer is only listed if they own at least one in-scope plot
    if (!hasPlotInScope) {
      continue;
    }

    // Calculate installment and financial statistics for visible plots only
    const visibleBookingIds = new Set(visiblePlots.map((p) => p.bookingId));
    const relevantPayments = mockStore.payments.filter((p) => visibleBookingIds.has(p.bookingId));

    const installmentsPaidCount = relevantPayments.filter(
      (p) => p.feeType === 'plot_installment' && p.status === 'paid'
    ).length;

    const installmentsDueCount = relevantPayments.filter(
      (p) => p.feeType === 'plot_installment' && (p.status === 'pending' || p.status === 'overdue')
    ).length;

    const totalPaidAmount = relevantPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalOutstandingAmount = relevantPayments.reduce((sum, p) => {
      if (p.status !== 'paid') {
        return sum + (p.amount - (p.paidAmount || 0));
      }
      return sum;
    }, 0);

    enrichedList.push({
      id: customer.id,
      membershipNo: customer.membershipNo || (customer.registrationStatus === 'minimal' ? 'PENDING' : ''),
      fullName: customer.fullName,
      fatherOrHusbandName: customer.fatherOrHusbandName,
      cnic: customer.cnic,
      email: customer.email,
      phone: customer.phone,
      city: customer.city || '',
      mailingAddress: customer.mailingAddress,
      nokName: customer.nokName,
      nokCnic: customer.nokCnic,
      applicantPhotoUrl: customer.applicantPhotoUrl,
      accountStatus: customer.accountStatus,
      registrationStatus: customer.registrationStatus || 'complete',
      credentialsPending: Boolean(customer.credentialsPending),
      createdDate: customer.createdDate,
      lastLogin: customer.lastLogin,
      strikeCount: customer.strikeCount || 0,
      strikeHistory: customer.strikeHistory || [],
      plots: visiblePlots,
      plotsCount: visiblePlots.length,
      installmentsPaidCount,
      installmentsDueCount,
      totalPaidAmount,
      totalOutstandingAmount,
    });
  }

  // Sort by membership number or creation date
  enrichedList.sort((a, b) => a.membershipNo.localeCompare(b.membershipNo));

  return { ok: true, customers: enrichedList };
}

/**
 * Standalone action to assign an administrative strike to a customer with a reason.
 */
export async function assignCustomerStrike(
  session: AdminSession,
  input: { customerId: string; reason: string; receiptId?: string }
): Promise<{ ok: boolean; customer?: Customer; error?: string; message?: string }> {
  mockStore.loadFromStorage();

  const isSuper = session.role === 'super_admin';
  const canAct = Boolean(
    session.permissions?.can_create_customer ||
    session.permissions?.can_verify_receipts ||
    session.permissions?.can_view_customers
  );

  if (!isSuper && !canAct) {
    return {
      ok: false,
      error: 'FORBIDDEN',
      message: 'You do not have permission to assign strikes to customer accounts.',
    };
  }

  const customer = mockStore.customers.find((c) => c.id === input.customerId);
  if (!customer) {
    return { ok: false, error: 'CUSTOMER_NOT_FOUND', message: 'Customer record not found.' };
  }

  const reasonTrimmed = input.reason.trim();
  if (!reasonTrimmed) {
    return { ok: false, error: 'REASON_REQUIRED', message: 'A reason must be provided to assign a strike.' };
  }

  customer.strikeCount = (customer.strikeCount || 0) + 1;
  if (!customer.strikeHistory) {
    customer.strikeHistory = [];
  }

  const newStrike = {
    id: `strike-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    reason: reasonTrimmed,
    assignedBy: session.fullName,
    assignedAt: new Date().toISOString(),
    receiptId: input.receiptId,
  };
  customer.strikeHistory.push(newStrike);

  mockStore.saveToStorage();

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'STRIKE_ASSIGNED',
    entityType: 'strike',
    entityId: customer.id,
    details: `Assigned Strike #${customer.strikeCount} to Member ${customer.fullName} (${customer.membershipNo}). Reason: ${reasonTrimmed}`,
    newValue: JSON.stringify(newStrike),
  });

  mockStore.broadcast({
    type: 'STRIKE_ASSIGNED',
    timestamp: new Date().toISOString(),
    customerId: customer.id,
    strikeCount: customer.strikeCount,
    strike: newStrike,
  });

  mockStore.broadcast({
    type: 'CUSTOMER_UPDATED',
    timestamp: new Date().toISOString(),
    customerId: customer.id,
  });

  return {
    ok: true,
    customer,
    message: `Strike #${customer.strikeCount} assigned to ${customer.fullName} successfully.`,
  };
}

/**
 * Suspend or reactivate a Customer Portal account.
 * Setting accountStatus = 'suspended' blocks portal login and prevents adding new bookings.
 */
export async function toggleCustomerSuspension(
  session: AdminSession,
  customerId: string,
  action: 'suspend' | 'activate',
  reason?: string
): Promise<{ ok: boolean; customer?: Customer; error?: string; message?: string }> {
  mockStore.loadFromStorage();

  const isSuper = session.role === 'super_admin';
  const canAct = Boolean(session.permissions?.can_create_customer || session.permissions?.can_view_customers);

  if (!isSuper && !canAct) {
    return {
      ok: false,
      error: 'FORBIDDEN',
      message: 'You do not have administrative permission to modify customer portal suspension states.',
    };
  }

  const customer = mockStore.customers.find((c) => c.id === customerId);
  if (!customer) {
    return { ok: false, error: 'CUSTOMER_NOT_FOUND', message: 'Customer record not found.' };
  }

  const oldStatus = customer.accountStatus;
  const newStatus: AccountStatus = action === 'suspend' ? 'suspended' : 'active';

  if (oldStatus === newStatus) {
    return {
      ok: true,
      customer,
      message: `Customer portal is already ${newStatus}.`,
    };
  }

  customer.accountStatus = newStatus;
  mockStore.saveToStorage();

  const actionName = action === 'suspend' ? 'CUSTOMER_SUSPENDED' : 'CUSTOMER_ACTIVATED';
  const detailsMsg =
    action === 'suspend'
      ? `Suspended customer portal access for ${customer.fullName} (${customer.membershipNo}). Reason: ${reason || 'Administrative Compliance Enforcement'}`
      : `Reactivated customer portal access for ${customer.fullName} (${customer.membershipNo}). Reason: ${reason || 'Administrative Review Cleared'}`;

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: actionName,
    entityType: 'customer',
    entityId: customer.id,
    details: detailsMsg,
    oldValue: oldStatus,
    newValue: newStatus,
  });

  mockStore.broadcast({
    type: action === 'suspend' ? 'CUSTOMER_SUSPENDED' : 'CUSTOMER_ACTIVATED',
    timestamp: new Date().toISOString(),
    customerId: customer.id,
    status: newStatus,
  });

  mockStore.broadcast({
    type: 'CUSTOMER_UPDATED',
    timestamp: new Date().toISOString(),
    customerId: customer.id,
  });

  return {
    ok: true,
    customer,
    message:
      action === 'suspend'
        ? `Customer portal for ${customer.fullName} has been suspended.`
        : `Customer portal for ${customer.fullName} has been reactivated.`,
  };
}

/**
 * Issue Customer Portal Login Credentials (Change Request 05 §4 & CR 07).
 * Permission-gated: Strictly Super Admin only per Change Request 07.
 * Exception 4.13a: Rejected with MISSING_PERMISSION if called without authority.
 */
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
  mockStore.loadFromStorage();

  const isSuper = session.role === 'super_admin';
  if (!isSuper) {
    return {
      ok: false,
      error: 'FORBIDDEN',
      reason: 'SUPER_ADMIN_ONLY',
      message: 'Only Super Admin has authority to issue customer portal credentials.',
    };
  }

  const customer = mockStore.customers.find((c) => c.id === customerId);
  if (!customer) {
    return {
      ok: false,
      error: 'CUSTOMER_NOT_FOUND',
      message: 'Customer record not found.',
    };
  }

  // ============================================================================
  // SECURITY NOTICE / BACKEND MIGRATION NOTE:
  // 'password123' / 'Password123!' is a MOCK-DATA-ONLY PLACEHOLDER for prototype demo.
  // It is NOT a real credential policy. In the production backend phase, replace with
  // cryptographically secure one-time temporary passwords, SMS/Email OTP provisioning,
  // or a secure password-reset invitation link per 00 §5 and 03 §5.
  // ============================================================================
  const generatedPassword = 'password123';
  customer.credentialsPending = false;
  customer.passwordHash = generatedPassword;

  mockStore.saveToStorage();

  const now = new Date().toISOString();
  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'CUSTOMER_CREDENTIALS_ISSUED',
    entityType: 'customer',
    entityId: customer.id,
    details: `Super Admin ${session.fullName} issued customer portal login credentials for Member ${customer.fullName} (${customer.membershipNo})`,
  });

  mockStore.broadcast({
    type: 'CUSTOMER_UPDATED',
    timestamp: now,
    customerId: customer.id,
    membershipNo: customer.membershipNo,
  });

  return {
    ok: true,
    username: customer.membershipNo,
    password: generatedPassword,
    customer,
  };
}

export interface CreateMinimalBookingInput {
  plotId: string;
  customerName: string;
  cnic: string;
  city: string;
  lockToken?: string;
}

/**
 * Minimal Sub Admin Quick Booking Flow (Change Request 07 §5).
 * Only 3 fields: Customer Name, CNIC, City. Plot number and size auto-fill.
 * Creates Customer with registrationStatus: 'minimal', credentialsPending: true.
 * Flips Plot status immediately to 'booked' to prevent double-booking.
 * Statutory fees and installment plan are deferred to Super Admin completion.
 */
export async function createMinimalBooking(
  session: AdminSession,
  input: CreateMinimalBookingInput
): Promise<{
  ok: boolean;
  customer?: Customer;
  booking?: Booking;
  error?: string;
  message?: string;
}> {
  mockStore.loadFromStorage();

  // 1. Permission check
  const isSuper = session.role === 'super_admin';
  const canBook = Boolean(session.permissions?.can_book || session.permissions?.can_create_customer);
  if (!isSuper && !canBook) {
    return { ok: false, error: 'FORBIDDEN', message: 'You do not have permission to book plots.' };
  }

  // 2. Field validation
  const customerName = input.customerName?.trim();
  const cnic = input.cnic?.trim();
  const city = input.city?.trim();

  if (!customerName || !cnic || !city) {
    return {
      ok: false,
      error: 'MISSING_FIELDS',
      message: 'Customer Name, CNIC, and City are all required for quick booking.',
    };
  }

  // 3. Master Plan Prerequisite Check
  const { exists, plot } = verifyPlotRegistered(input.plotId);
  if (!exists || !plot) {
    return {
      ok: false,
      error: 'PLOT_NOT_REGISTERED',
      message: 'This plot is not registered on the master plan map. Kindly register the plot before proceeding.',
    };
  }

  // 4. Block Scoping Check
  if (!canAccessBlock(session, plot.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE', message: 'Plot is outside your assigned administrative block scope.' };
  }

  // 5. Non-Sellable Amenity Guard
  if (plot.category === 'amenity') {
    return { ok: false, error: 'AMENITY_NOT_SELLABLE', message: 'Amenity utility plots cannot be booked or sold.' };
  }

  if (plot.isAdjustment) {
    return { ok: false, error: 'PLOT_UNDER_ADJUSTMENT', message: 'This plot is under administrative adjustment/re-survey and cannot be booked.' };
  }

  // 6. Plot Availability Guard
  if (plot.status === 'booked') {
    return { ok: false, error: 'PLOT_ALREADY_BOOKED', message: 'This plot has already been committed to another owner.' };
  }

  // 7. Lock validation
  if (plot.lockedBy) {
    const isLockOwner = plot.lockedBy === session.adminId;
    const isTokenMatch = !input.lockToken || plot.lockToken === input.lockToken;
    const isUnexpired = plot.lockedAt && (Date.now() - plot.lockedAt <= 10 * 60 * 1000);
    if (!isLockOwner || !isTokenMatch || !isUnexpired) {
      return {
        ok: false,
        error: 'LOCK_EXPIRED',
        message: 'Your session to book this plot has expired, please try again.',
      };
    }
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const customerId = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newCustomer: Customer = {
    id: customerId,
    membershipNo: '',
    fullName: customerName,
    fatherOrHusbandName: '',
    cnic,
    email: '',
    phone: '',
    city,
    mailingAddress: city,
    nokName: '',
    nokCnic: '',
    applicantPhotoUrl: '/media/placeholder-applicant.jpg',
    cnicCopyUrl: '/media/placeholder-cnic.jpg',
    nokCnicCopyUrl: '/media/placeholder-nok.jpg',
    accountStatus: 'active',
    registrationStatus: 'minimal',
    createdDate: todayStr,
    passwordHash: '',
    credentialsPending: true,
    termsAccepted: false,
  };

  const newBooking: Booking = {
    id: bookingId,
    customerId,
    plotId: plot.id,
    paymentType: 'installment',
    status: 'active',
    registrationStatus: 'minimal',
    bookingDate: todayStr,
  };

  // Immediate plot status commit
  plot.status = 'booked';
  plot.currentOwnerId = customerId;
  plot.lockedBy = undefined;
  plot.lockedByName = undefined;
  plot.lockedAt = undefined;
  plot.lockToken = undefined;
  mockStore.clearLockTimeout(plot.id);

  mockStore.customers.push(newCustomer);
  mockStore.bookings.push(newBooking);

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'PLOT_BOOKED',
    entityType: 'booking',
    entityId: bookingId,
    details: `Quick Booking for Plot ${plot.plotNumber} created by ${session.fullName} for ${newCustomer.fullName} (Minimal Registration)`,
    newValue: JSON.stringify({
      plotNumber: plot.plotNumber,
      customerName: newCustomer.fullName,
      cnic: newCustomer.cnic,
      city: newCustomer.city,
    }),
  });

  mockStore.broadcast({
    type: 'PLOT_BOOKED',
    timestamp: new Date().toISOString(),
    plotId: plot.id,
    bookingId,
    customerId,
  });

  mockStore.broadcast({
    type: 'CUSTOMER_CREATED',
    timestamp: new Date().toISOString(),
    customerId,
  });

  return {
    ok: true,
    customer: newCustomer,
    booking: newBooking,
  };
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
  applicantPhotoUrl?: string;
  cnicCopyUrl?: string;
  nokCnicCopyUrl?: string;
  portalPassword?: string;
  paymentType: PaymentType;
  installmentPlan?: InstallmentPlanConfig;
  paperInstallmentRef?: string;
}

/**
 * Super Admin Action: Complete Member Registration (Change Request 07 §5).
 * Only Super Admin can complete registration for a customer with registrationStatus: 'minimal'.
 * Supplies full member paperwork, Membership No, issues portal credentials,
 * records statutory fees, and establishes the official payment schedule.
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
  message?: string;
}> {
  mockStore.loadFromStorage();

  // 1. Super Admin strictly required
  if (session.role !== 'super_admin') {
    return {
      ok: false,
      error: 'FORBIDDEN',
      message: 'Only Super Administrator has authority to complete member registrations and issue official membership numbers.',
    };
  }

  // 2. Customer Lookup
  const customer = mockStore.customers.find((c) => c.id === input.customerId);
  if (!customer) {
    return { ok: false, error: 'CUSTOMER_NOT_FOUND', message: 'Customer record not found.' };
  }

  // Check if already complete
  if (customer.registrationStatus === 'complete' && !customer.credentialsPending && customer.membershipNo) {
    return { ok: false, error: 'ALREADY_COMPLETE', message: 'Customer registration is already complete.' };
  }

  // 3. Membership number uniqueness
  const targetMembershipNo = input.membershipNo.trim();
  if (!targetMembershipNo) {
    return { ok: false, error: 'MEMBERSHIP_NO_REQUIRED', message: 'Official Membership Number is required.' };
  }

  const dupMem = mockStore.customers.find(
    (c) => c.id !== customer.id && c.membershipNo.toLowerCase() === targetMembershipNo.toLowerCase()
  );
  if (dupMem) {
    return {
      ok: false,
      error: 'MEMBERSHIP_EXISTS',
      message: `Membership Number "${targetMembershipNo}" is already assigned to ${dupMem.fullName}.`,
    };
  }

  // 4. Booking Lookup
  const booking = input.bookingId
    ? mockStore.bookings.find((b) => b.id === input.bookingId)
    : mockStore.bookings.find((b) => b.customerId === customer.id);

  if (!booking) {
    return { ok: false, error: 'BOOKING_NOT_FOUND', message: 'No associated booking found for this customer.' };
  }

  const plot = mockStore.plots.find((p) => p.id === booking.plotId);
  if (!plot) {
    return { ok: false, error: 'PLOT_NOT_FOUND', message: 'Associated plot record not found.' };
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 5. Credential generation
  const initialPassword = input.portalPassword?.trim() || 'password123';
  if (initialPassword.length < 8) {
    return {
      ok: false,
      error: 'INVALID_PASSWORD',
      message: 'Portal password must be at least 8 characters long.',
    };
  }

  // 6. Statutory Fees (Admission Fee PKR 2,000 + Share Subscription Fee PKR 10,000)
  const admissionFee: PaymentRecord = {
    id: `fee-adm-${booking.id}`,
    bookingId: booking.id,
    plotId: plot.id,
    feeType: 'admission_fee',
    dueDate: todayStr,
    amount: 2000,
    paidAmount: 2000,
    paidDate: todayStr,
    status: 'paid',
    transactionRef: `TXN-ADM-${Date.now().toString().slice(-6)}`,
  };

  const shareSubFee: PaymentRecord = {
    id: `fee-sub-${booking.id}`,
    bookingId: booking.id,
    plotId: plot.id,
    feeType: 'share_subscription_fee',
    dueDate: todayStr,
    amount: 10000,
    paidAmount: 10000,
    paidDate: todayStr,
    status: 'paid',
    transactionRef: `TXN-SUB-${Date.now().toString().slice(-6)}`,
  };

  const paymentRecords: PaymentRecord[] = [admissionFee, shareSubFee];

  // 7. Payment Schedule
  if (input.paymentType === 'one_time') {
    paymentRecords.push({
      id: `pay-one-${booking.id}`,
      bookingId: booking.id,
      plotId: plot.id,
      feeType: 'plot_one_time',
      dueDate: todayStr,
      amount: plot.price,
      paidAmount: plot.price,
      paidDate: todayStr,
      status: 'paid',
      transactionRef: `TXN-FULL-${Date.now().toString().slice(-6)}`,
    });
    booking.paymentType = input.paymentType;
  } else {
    // Dynamic Installment Plan Engine
    const plan = input.installmentPlan;
    const totalPayment = plan?.totalPayment || plot.price;
    const downpayment = plan ? Math.max(0, plan.downpayment) : Math.round(plot.price / 4);
    const planYears = plan?.planYears || plan?.years || 2;
    const paidAfterEvery = plan?.paidAfterEveryMonths || plan?.paidAfterEvery || 6;
    const numberOfInstallments = plan?.numberOfInstallments || Math.ceil((planYears * 12) / paidAfterEvery);

    if (downpayment >= totalPayment) {
      return {
        ok: false,
        error: 'INVALID_DOWNPAYMENT',
        message: 'Downpayment must be less than Total Payment price.',
      };
    }

    if (downpayment > 0) {
      paymentRecords.push({
        id: `pay-down-${booking.id}`,
        bookingId: booking.id,
        plotId: plot.id,
        feeType: 'plot_downpayment',
        installmentNumber: 0,
        dueDate: todayStr,
        amount: downpayment,
        paidAmount: downpayment,
        paidDate: todayStr,
        status: 'paid',
        transactionRef: `TXN-DOWN-${Date.now().toString().slice(-6)}`,
      });
    }

    const remainingBalance = totalPayment - downpayment;
    const baseInstallmentAmount = Math.floor(remainingBalance / numberOfInstallments);
    const roundingRemainder = remainingBalance - (baseInstallmentAmount * numberOfInstallments);

    for (let i = 1; i <= numberOfInstallments; i++) {
      // Due date strictly falls on 5th of the month following booking (Item 2)
      const dueDate = new Date(now.getFullYear(), now.getMonth() + (i * paidAfterEvery), 5);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const currentInstAmount = i === numberOfInstallments
        ? baseInstallmentAmount + roundingRemainder
        : baseInstallmentAmount;

      paymentRecords.push({
        id: `pay-inst-${booking.id}-${i}`,
        bookingId: booking.id,
        plotId: plot.id,
        feeType: 'plot_installment',
        installmentNumber: i,
        dueDate: dueDateStr,
        amount: currentInstAmount,
        paidAmount: 0,
        status: 'pending',
      });
    }

    booking.paymentType = 'installment';
    booking.installmentPlan = {
      totalPayment,
      downpayment,
      planYears,
      paidAfterEveryMonths: paidAfterEvery,
      numberOfInstallments,
    };
  }

  // 8. Documents generation
  const bookingDoc: SocietyDocument = {
    id: `doc-book-${booking.id}`,
    bookingId: booking.id,
    plotId: plot.id,
    type: 'booking_agreement',
    fileName: `Booking_Agreement_${targetMembershipNo}_${plot.plotNumber}.pdf`,
    uploadDate: todayStr,
    fileSizeKb: 340,
    mockFileUrl: `/docs/agreements/Booking_${plot.plotNumber}.pdf`,
  };

  // 9. Update Customer Record
  customer.membershipNo = targetMembershipNo;
  customer.fatherOrHusbandName = input.fatherOrHusbandName.trim();
  customer.phone = input.phone.trim();
  customer.email = input.email.trim();
  customer.mailingAddress = input.mailingAddress.trim();
  customer.nokName = input.nokName.trim();
  customer.nokCnic = input.nokCnic.trim();
  customer.applicantPhotoUrl = input.applicantPhotoUrl || customer.applicantPhotoUrl || '/media/placeholder-applicant.jpg';
  customer.cnicCopyUrl = input.cnicCopyUrl || customer.cnicCopyUrl || '/media/placeholder-cnic.jpg';
  customer.nokCnicCopyUrl = input.nokCnicCopyUrl || customer.nokCnicCopyUrl || '/media/placeholder-nok.jpg';
  customer.registrationStatus = 'complete';
  customer.credentialsPending = false;
  customer.passwordHash = initialPassword;

  // 10. Update Booking Record
  booking.registrationStatus = 'complete';
  booking.status = 'completed';
  booking.confirmationDate = todayStr;
  booking.paperInstallmentRef = input.paperInstallmentRef?.trim();

  // Commit payments and document
  mockStore.payments.push(...paymentRecords);
  mockStore.documents.push(bookingDoc);

  // Persist attached physical paperwork
  if (input.applicantPhotoUrl && input.applicantPhotoUrl.startsWith('data:')) {
    mockStore.customerDocuments.push({
      id: `cdoc-${Date.now()}-photo`,
      customerId: customer.id,
      bookingId: booking.id,
      type: 'applicant_photo',
      fileName: 'applicant_photo.jpg',
      fileSizeKb: Math.max(1, Math.round(input.applicantPhotoUrl.length / 1024)),
      fileUrl: input.applicantPhotoUrl,
      uploadedAt: new Date().toISOString(),
      uploadedByUserId: session.adminId,
      uploadedByUserName: session.fullName,
    });
  }
  if (input.cnicCopyUrl && input.cnicCopyUrl.startsWith('data:')) {
    const isPdf = input.cnicCopyUrl.startsWith('data:application/pdf');
    mockStore.customerDocuments.push({
      id: `cdoc-${Date.now()}-cnic`,
      customerId: customer.id,
      bookingId: booking.id,
      type: 'cnic_copy',
      fileName: isPdf ? 'applicant_cnic.pdf' : 'applicant_cnic.jpg',
      fileSizeKb: Math.max(1, Math.round(input.cnicCopyUrl.length / 1024)),
      fileUrl: input.cnicCopyUrl,
      uploadedAt: new Date().toISOString(),
      uploadedByUserId: session.adminId,
      uploadedByUserName: session.fullName,
    });
  }
  if (input.nokCnicCopyUrl && input.nokCnicCopyUrl.startsWith('data:')) {
    const isPdf = input.nokCnicCopyUrl.startsWith('data:application/pdf');
    mockStore.customerDocuments.push({
      id: `cdoc-${Date.now()}-nok`,
      customerId: customer.id,
      bookingId: booking.id,
      type: 'nok_cnic_copy',
      fileName: isPdf ? 'nok_cnic.pdf' : 'nok_cnic.jpg',
      fileSizeKb: Math.max(1, Math.round(input.nokCnicCopyUrl.length / 1024)),
      fileUrl: input.nokCnicCopyUrl,
      uploadedAt: new Date().toISOString(),
      uploadedByUserId: session.adminId,
      uploadedByUserName: session.fullName,
    });
  }

  mockStore.saveToStorage();

  // Audit and broadcast
  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'CUSTOMER_UPDATED',
    entityType: 'customer',
    entityId: customer.id,
    details: `Super Admin ${session.fullName} completed full registration for Member ${customer.fullName} (${customer.membershipNo}) on Plot ${plot.plotNumber}`,
    newValue: JSON.stringify({
      membershipNo: customer.membershipNo,
      plotNumber: plot.plotNumber,
      paymentType: booking.paymentType,
    }),
  });

  mockStore.broadcast({
    type: 'CUSTOMER_UPDATED',
    timestamp: new Date().toISOString(),
    customerId: customer.id,
    membershipNo: customer.membershipNo,
  });

  mockStore.broadcast({
    type: 'BOOKING_CREATED',
    timestamp: new Date().toISOString(),
    bookingId: booking.id,
    customerId: customer.id,
  });

  return {
    ok: true,
    customer,
    booking,
    credentials: {
      username: customer.membershipNo,
      password: initialPassword,
    },
    message: `Member registration completed successfully for ${customer.fullName} (${customer.membershipNo}).`,
  };
}


