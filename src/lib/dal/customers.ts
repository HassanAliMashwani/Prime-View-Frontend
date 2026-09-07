import { mockStore } from '../mock/store';
import { AdminSession, Customer, Booking, PaymentRecord, SocietyDocument, Plot, PaymentType, AccountStatus } from '../mock/types';
import { canAccessBlock } from './adminAuth';
import { getActiveSession } from './auth';

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
}

export interface AddBookingToCustomerInput {
  customerId: string;
  plotId: string;
  paymentType: PaymentType;
  paperInstallmentRef?: string;
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

  // 5. Layer 2 Atomic Commit Guard: verify plot availability
  if (plot.status === 'booked') {
    return { ok: false, error: 'PLOT_ALREADY_BOOKED', message: 'This plot has already been committed to another owner.' };
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
    createdDate: todayStr,
    passwordHash: 'password123',
  };

  const newBooking: Booking = {
    id: bookingId,
    customerId,
    plotId: plot.id,
    paymentType: input.paymentType,
    status: 'completed',
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

  const paymentRecords: PaymentRecord[] = [admissionFee, shareSubFee];

  // 8. Plot Price Payment Schedule
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
    // 24 equal monthly installments
    const installmentAmount = Math.round(plot.price / 24);
    for (let i = 1; i <= 24; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(now.getMonth() + (i - 1));
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const isDownPayment = i === 1;
      paymentRecords.push({
        id: `pay-inst-${bookingId}-${i}`,
        bookingId,
        plotId: plot.id,
        feeType: 'plot_installment',
        installmentNumber: i,
        dueDate: dueDateStr,
        amount: installmentAmount,
        paidAmount: isDownPayment ? installmentAmount : 0,
        paidDate: isDownPayment ? todayStr : undefined,
        status: isDownPayment ? 'paid' : 'pending',
        transactionRef: isDownPayment ? `TXN-INST-${Date.now().toString().slice(-6)}-1` : undefined,
      });
    }
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
  mockStore.clearLockTimeout(plot.id);

  mockStore.customers.push(newCustomer);
  mockStore.bookings.push(newBooking);
  mockStore.payments.push(...paymentRecords);
  mockStore.documents.push(bookingDoc);

  // 11. Audit Logging & Cross-tab Broadcast
  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'CUSTOMER_CREATED',
    entityType: 'customer',
    entityId: customerId,
    details: `Created customer account ${newCustomer.fullName} (${newCustomer.membershipNo}) with Plot ${plot.plotNumber}`,
    newValue: JSON.stringify({
      membershipNo: newCustomer.membershipNo,
      fullName: newCustomer.fullName,
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
    credentials: {
      username: newCustomer.membershipNo,
      password: 'password123',
    },
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

  // 5. Atomic commit check
  if (plot.status === 'booked') {
    return { ok: false, error: 'PLOT_ALREADY_BOOKED', message: 'This plot has already been committed to another owner.' };
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
    const installmentAmount = Math.round(plot.price / 24);
    for (let i = 1; i <= 24; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(now.getMonth() + (i - 1));
      const dueDateStr = dueDate.toISOString().split('T')[0];
      const isDownPayment = i === 1;

      paymentRecords.push({
        id: `pay-inst-${bookingId}-${i}`,
        bookingId,
        plotId: plot.id,
        feeType: 'plot_installment',
        installmentNumber: i,
        dueDate: dueDateStr,
        amount: installmentAmount,
        paidAmount: isDownPayment ? installmentAmount : 0,
        paidDate: isDownPayment ? todayStr : undefined,
        status: isDownPayment ? 'paid' : 'pending',
        transactionRef: isDownPayment ? `TXN-INST-${Date.now().toString().slice(-6)}-1` : undefined,
      });
    }
  }

  // Commit mutation
  plot.status = 'booked';
  plot.currentOwnerId = customer.id;
  plot.lockedBy = undefined;
  plot.lockedByName = undefined;
  plot.lockedAt = undefined;
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
 * Retrieve the current logged in customer's profile (Member Portal).
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
