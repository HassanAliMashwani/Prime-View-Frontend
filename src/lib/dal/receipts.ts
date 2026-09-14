import { mockStore } from '../mock/store';
import { AdminSession, ReceiptSubmission, ReceiptStatus } from '../mock/types';

export interface SubmitReceiptInput {
  plotId: string;
  paymentType: 'installment' | 'one_time';
  installmentNumber?: number;
  amount: number;
  depositoryBank: string;
  bankName?: string;
  transactionRef: string;
  paymentDate: string;
  receiptFileUrl: string;
  receiptFileName: string;
  notes?: string;
}

/**
 * Submit a customer payment receipt for verification.
 * Scoped strictly to the authenticated customerId.
 */
export async function submitPaymentReceipt(
  customerId: string,
  input: SubmitReceiptInput
): Promise<{ ok: boolean; receipt?: ReceiptSubmission; error?: string; message?: string }> {
  mockStore.loadFromStorage();

  const customer = mockStore.customers.find((c) => c.id === customerId);
  if (!customer) {
    return { ok: false, error: 'CUSTOMER_NOT_FOUND', message: 'Customer account not found.' };
  }

  const bank = (input.depositoryBank || input.bankName || '').trim();
  if (!bank) {
    return { ok: false, error: 'BANK_REQUIRED', message: 'Depository Bank is required.' };
  }

  // Verify plot ownership
  const booking = mockStore.bookings.find(
    (b) => b.customerId === customerId && b.plotId === input.plotId
  );
  if (!booking) {
    return { ok: false, error: 'UNAUTHORIZED_PLOT', message: 'You do not own this property.' };
  }

  const plot = mockStore.plots.find((p) => p.id === input.plotId);
  const block = mockStore.blocks.find((b) => b.id === plot?.blockId);
  const blockName = block ? block.name : 'Abbott Block';
  const plotNumber = plot ? plot.plotNumber : 'Unknown';

  // Guard 1: Check if the target installment/payment is already marked paid in ledger
  if (input.paymentType === 'installment' && input.installmentNumber !== undefined) {
    const existingPayment = mockStore.payments.find(
      (p) =>
        p.bookingId === booking.id &&
        p.feeType === 'plot_installment' &&
        p.installmentNumber === Number(input.installmentNumber)
    );
    if (existingPayment && existingPayment.status === 'paid') {
      return {
        ok: false,
        error: 'ALREADY_PAID',
        message: `Installment #${input.installmentNumber} has already been settled and marked paid in the society ledger.`,
      };
    }
  } else if (input.paymentType === 'one_time') {
    const existingPayment = mockStore.payments.find(
      (p) => p.bookingId === booking.id && p.feeType === 'plot_one_time'
    );
    if (existingPayment && existingPayment.status === 'paid') {
      return {
        ok: false,
        error: 'ALREADY_PAID',
        message: 'This full payment has already been settled and marked paid in the society ledger.',
      };
    }
  }

  // Guard 2: Check if there is already a pending receipt submission awaiting verification
  const pendingSubmission = mockStore.receiptSubmissions.find((r) => {
    if (r.customerId !== customerId || r.plotId !== input.plotId || r.status !== 'pending') {
      return false;
    }
    if (input.paymentType === 'installment') {
      return r.paymentType === 'installment' && Number(r.installmentNumber) === Number(input.installmentNumber);
    } else {
      return r.paymentType === 'one_time';
    }
  });

  if (pendingSubmission) {
    return {
      ok: false,
      error: 'RECEIPT_ALREADY_PENDING',
      message:
        input.paymentType === 'installment'
          ? `A receipt for Installment #${input.installmentNumber} has already been submitted and is currently pending verification.`
          : 'A receipt for this plot purchase is already pending verification by the society desk.',
    };
  }

  const newReceipt: ReceiptSubmission = {
    id: `rcpt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    customerId: customer.id,
    membershipNo: customer.membershipNo,
    customerName: customer.fullName,
    customerPhone: customer.phone,
    customerCnic: customer.cnic,
    plotId: input.plotId,
    plotNumber,
    blockName,
    paymentType: input.paymentType,
    installmentNumber: input.installmentNumber,
    amount: Number(input.amount),
    depositoryBank: bank,
    bankName: bank,
    transactionRef: input.transactionRef.trim(),
    paymentDate: input.paymentDate,
    uploadedAt: new Date().toISOString(),
    receiptFileUrl: input.receiptFileUrl,
    receiptFileName: input.receiptFileName || 'receipt_document.jpg',
    notes: input.notes?.trim(),
    status: 'pending',
  };

  mockStore.receiptSubmissions.unshift(newReceipt);

  mockStore.addAuditEntry({
    actorId: customer.id,
    actorName: customer.fullName,
    actorRole: 'customer',
    action: 'RECEIPT_SUBMITTED',
    entityType: 'receipt',
    entityId: newReceipt.id,
    details: `Customer submitted deposit receipt for Plot ${plotNumber} (${input.paymentType === 'installment' ? `Inst. #${input.installmentNumber}` : 'Full Payment'}) - PKR ${Number(input.amount).toLocaleString()} via Depository Bank: ${bank}`,
  });

  mockStore.broadcast({
    type: 'RECEIPT_SUBMITTED',
    timestamp: new Date().toISOString(),
    receiptId: newReceipt.id,
    customerId: customer.id,
  });

  return { ok: true, receipt: newReceipt };
}

/**
 * Get all receipts submitted by a specific customer.
 */
export async function getCustomerReceipts(customerId: string): Promise<ReceiptSubmission[]> {
  mockStore.loadFromStorage();
  return mockStore.receiptSubmissions
    .filter((r) => r.customerId === customerId)
    .map((r) => ({
      ...r,
      depositoryBank: r.depositoryBank || r.bankName || 'N/A',
    }));
}

/**
 * Get all receipts for admin verification (gated by Receipt Verification Authority).
 * Enriched with customer strikeCount and recent strikeHistory.
 */
export async function getAdminReceipts(
  session: AdminSession,
  statusFilter?: ReceiptStatus
): Promise<{ ok: boolean; receipts?: ReceiptSubmission[]; error?: string; message?: string }> {
  mockStore.loadFromStorage();

  const isSuper = session.role === 'super_admin';
  const hasAuth = Boolean(session.permissions?.can_verify_receipts);

  if (!isSuper && !hasAuth) {
    return {
      ok: false,
      error: 'FORBIDDEN',
      message: 'You do not have Receipt Verification Authority.',
    };
  }

  let list = mockStore.receiptSubmissions.map((r) => {
    const cust = mockStore.customers.find((c) => c.id === r.customerId);
    const depositoryBank = r.depositoryBank || r.bankName || 'N/A';
    return {
      ...r,
      depositoryBank,
      bankName: depositoryBank,
      customerStrikeCount: cust?.strikeCount || 0,
      customerStrikeHistory: cust?.strikeHistory || [],
    };
  });

  if (statusFilter && statusFilter !== ('all' as any)) {
    list = list.filter((r) => r.status === statusFilter);
  }

  return { ok: true, receipts: list };
}

/**
 * Verify and approve a submitted payment receipt.
 * Automatically generates the official two-part A4 Slip and syncs the plot ledger.
 */
export async function verifyReceipt(
  session: AdminSession,
  receiptId: string,
  notes?: string
): Promise<{ ok: boolean; receipt?: ReceiptSubmission; error?: string; message?: string }> {
  mockStore.loadFromStorage();

  const isSuper = session.role === 'super_admin';
  const hasAuth = Boolean(session.permissions?.can_verify_receipts);

  if (!isSuper && !hasAuth) {
    return {
      ok: false,
      error: 'FORBIDDEN',
      message: 'You do not have Receipt Verification Authority to approve payment slips.',
    };
  }

  const receipt = mockStore.receiptSubmissions.find((r) => r.id === receiptId);
  if (!receipt) {
    return { ok: false, error: 'RECEIPT_NOT_FOUND', message: 'Receipt submission not found.' };
  }

  if (receipt.status !== 'pending') {
    return {
      ok: false,
      error: 'ALREADY_PROCESSED',
      message: `Receipt has already been ${receipt.status}.`,
    };
  }

  const now = new Date();
  const year = now.getFullYear();
  const randomSerial = Math.floor(1000 + Math.random() * 9000);
  const slipNumber = `PV-SLIP-${year}-${randomSerial}`;
  const hexA = Math.random().toString(16).substring(2, 6).toUpperCase();
  const hexB = Math.random().toString(16).substring(2, 6).toUpperCase();
  const securityHash = `PV-SEC-${hexA}-${hexB}-${Date.now().toString().slice(-4)}`;

  receipt.status = 'verified';
  receipt.verifiedByAdminId = session.adminId;
  receipt.verifiedByAdminName = session.fullName;
  receipt.verifiedAt = now.toISOString();
  if (notes) receipt.notes = notes;

  receipt.slip = {
    slipNumber,
    securityHash,
    generatedAt: now.toISOString(),
    qrPayload: `VERIFIED|PRIME-VIEW|${receipt.membershipNo}|${receipt.plotNumber}|${receipt.paymentType === 'installment' ? `INST-${receipt.installmentNumber}` : 'FULL'}|${receipt.amount}|${slipNumber}|${securityHash}`,
    societyAuthorityStamp: `OFFICIAL SOCIETY VERIFICATION • REG NO 411 KPK • VERIFIED BY ${session.fullName.toUpperCase()}`,
  };

  // Sync to Ledger PaymentRecord
  const booking = mockStore.bookings.find(
    (b) => b.customerId === receipt.customerId && b.plotId === receipt.plotId
  );

  if (booking) {
    if (receipt.paymentType === 'installment' && receipt.installmentNumber) {
      const paymentRec = mockStore.payments.find(
        (p) =>
          p.bookingId === booking.id &&
          p.feeType === 'plot_installment' &&
          p.installmentNumber === receipt.installmentNumber
      );
      if (paymentRec) {
        paymentRec.status = 'paid';
        paymentRec.paidAmount = receipt.amount;
        paymentRec.paidDate = receipt.paymentDate;
        paymentRec.transactionRef = receipt.transactionRef;
      }
    } else if (receipt.paymentType === 'one_time') {
      const paymentRec = mockStore.payments.find(
        (p) => p.bookingId === booking.id && p.feeType === 'plot_one_time'
      );
      if (paymentRec) {
        paymentRec.status = 'paid';
        paymentRec.paidAmount = receipt.amount;
        paymentRec.paidDate = receipt.paymentDate;
        paymentRec.transactionRef = receipt.transactionRef;
      }
    }
  }

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'RECEIPT_VERIFIED',
    entityType: 'receipt',
    entityId: receipt.id,
    details: `Verified payment receipt ${receipt.id} (${slipNumber}) for Member ${receipt.customerName} (${receipt.membershipNo}) - PKR ${receipt.amount.toLocaleString()}`,
    newValue: JSON.stringify({
      slipNumber,
      securityHash,
      verifiedBy: session.fullName,
    }),
  });

  mockStore.broadcast({
    type: 'RECEIPT_VERIFIED',
    timestamp: now.toISOString(),
    receiptId: receipt.id,
    plotId: receipt.plotId,
    customerId: receipt.customerId,
    slipNumber,
  });

  mockStore.broadcast({
    type: 'PAYMENT_RECORD_UPDATED',
    timestamp: now.toISOString(),
    plotId: receipt.plotId,
    customerId: receipt.customerId,
  });

  return { ok: true, receipt };
}

export interface RejectReceiptOptions {
  reason: string;
  assignStrike?: boolean;
  strikeReason?: string;
}

/**
 * Reject a submitted payment receipt with reason.
 * Optionally assigns a strike to the member (pre-wired to Strike System).
 */
export async function rejectReceipt(
  session: AdminSession,
  receiptId: string,
  options: RejectReceiptOptions | string
): Promise<{
  ok: boolean;
  receipt?: ReceiptSubmission;
  strikeAssigned?: boolean;
  error?: string;
  message?: string;
}> {
  mockStore.loadFromStorage();

  const isSuper = session.role === 'super_admin';
  const hasAuth = Boolean(session.permissions?.can_verify_receipts);

  if (!isSuper && !hasAuth) {
    return {
      ok: false,
      error: 'FORBIDDEN',
      message: 'You do not have Receipt Verification Authority to reject receipts.',
    };
  }

  const receipt = mockStore.receiptSubmissions.find((r) => r.id === receiptId);
  if (!receipt) {
    return { ok: false, error: 'RECEIPT_NOT_FOUND', message: 'Receipt submission not found.' };
  }

  const reasonStr = typeof options === 'string' ? options : options.reason;
  const shouldAssignStrike = typeof options === 'object' && Boolean(options.assignStrike);
  const strikeReasonStr =
    typeof options === 'object' && options.strikeReason
      ? options.strikeReason
      : reasonStr || 'Unverified / invalid payment deposit receipt';

  receipt.status = 'rejected';
  receipt.rejectionReason =
    reasonStr.trim() || 'Payment details could not be reconciled with bank statements.';
  receipt.verifiedByAdminId = session.adminId;
  receipt.verifiedByAdminName = session.fullName;
  receipt.verifiedAt = new Date().toISOString();

  let strikeAssigned = false;
  if (shouldAssignStrike) {
    const customer = mockStore.customers.find((c) => c.id === receipt.customerId);
    if (customer) {
      customer.strikeCount = (customer.strikeCount || 0) + 1;
      if (!customer.strikeHistory) {
        customer.strikeHistory = [];
      }
      customer.strikeHistory.push({
        id: `strike-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        reason: strikeReasonStr.trim(),
        assignedBy: session.fullName,
        assignedAt: new Date().toISOString(),
        receiptId: receipt.id,
      });
      strikeAssigned = true;

      mockStore.addAuditEntry({
        actorId: session.adminId,
        actorName: session.fullName,
        actorRole: session.role,
        action: 'STRIKE_ASSIGNED',
        entityType: 'strike',
        entityId: customer.id,
        details: `Assigned strike #${customer.strikeCount} to Member ${customer.fullName} (${customer.membershipNo}) upon receipt rejection. Reason: ${strikeReasonStr.trim()}`,
      });

      mockStore.broadcast({
        type: 'STRIKE_ASSIGNED',
        timestamp: new Date().toISOString(),
        customerId: customer.id,
        strikeCount: customer.strikeCount,
        receiptId: receipt.id,
      });
    }
  }

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'RECEIPT_REJECTED',
    entityType: 'receipt',
    entityId: receipt.id,
    details: `Rejected receipt ${receipt.id} for Member ${receipt.customerName}. Reason: ${receipt.rejectionReason}${
      strikeAssigned ? ' (Strike assigned)' : ''
    }`,
  });

  mockStore.broadcast({
    type: 'RECEIPT_REJECTED',
    timestamp: new Date().toISOString(),
    receiptId: receipt.id,
    customerId: receipt.customerId,
  });

  mockStore.saveToStorage();

  return { ok: true, receipt, strikeAssigned };
}
