import { AdminSession, ReceiptSubmission, ReceiptStatus } from '../mock/types';
import { apiGet, apiPost, getAdminToken, getMemberToken } from '../api';

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
 * Calls backend POST /receipts with member JWT token.
 */
export async function submitPaymentReceipt(
  _customerId: string,
  input: SubmitReceiptInput
): Promise<{ ok: boolean; receipt?: ReceiptSubmission; error?: string; message?: string }> {
  const token = getMemberToken();
  const bank = (input.depositoryBank || input.bankName || '').trim();

  const payload = {
    plotId: input.plotId,
    paymentType: input.paymentType,
    installmentNumber: input.installmentNumber ? Number(input.installmentNumber) : undefined,
    amount: Number(input.amount),
    depositoryBank: bank,
    transactionRef: input.transactionRef.trim(),
    paymentDate: input.paymentDate,
    receiptFileUrl: input.receiptFileUrl,
    receiptFileName: input.receiptFileName,
    notes: input.notes?.trim(),
  };

  const res = await apiPost<{ receipt: ReceiptSubmission }>('/receipts', payload, token || undefined);

  if (!res.ok) {
    return {
      ok: false,
      error: res.error || 'SUBMISSION_FAILED',
      message: res.message || 'Failed to submit payment receipt.',
    };
  }

  const receipt = (res.data as any)?.receipt || res.data;
  return { ok: true, receipt };
}

/**
 * Get all receipts submitted by the authenticated customer.
 * Calls backend GET /receipts/me.
 */
export async function getCustomerReceipts(_customerId?: string): Promise<ReceiptSubmission[]> {
  const token = getMemberToken();
  const res = await apiGet<{ receipts: ReceiptSubmission[] }>('/receipts/me', token || undefined);
  if (!res.ok || !res.data) {
    return [];
  }
  const list = Array.isArray(res.data) ? res.data : (res.data as any).receipts || [];
  return list;
}

/**
 * Get all receipts for admin verification (gated by Receipt Verification Authority).
 * Calls backend GET /receipts?status=...
 */
export async function getAdminReceipts(
  session: AdminSession,
  statusFilter?: ReceiptStatus
): Promise<{ ok: boolean; receipts?: ReceiptSubmission[]; error?: string; message?: string }> {
  const query = statusFilter && statusFilter !== ('all' as any) ? `?status=${statusFilter}` : '';
  const res = await apiGet<{ receipts: ReceiptSubmission[] }>(`/receipts${query}`, session.token || getAdminToken() || undefined);

  if (!res.ok) {
    return {
      ok: false,
      receipts: [],
      error: res.error || 'FETCH_FAILED',
      message: res.message || 'Failed to fetch receipts.',
    };
  }

  const list = Array.isArray(res.data) ? res.data : (res.data as any)?.receipts || [];
  return { ok: true, receipts: list };
}


/**
 * Verify and approve a submitted payment receipt.
 * Calls backend POST /receipts/:id/verify.
 */
export async function verifyReceipt(
  session: AdminSession,
  receiptId: string,
  notes?: string
): Promise<{ ok: boolean; receipt?: ReceiptSubmission; error?: string; message?: string }> {
  const res = await apiPost<{ receipt: ReceiptSubmission }>(
    `/receipts/${receiptId}/verify`,
    { notes },
    session.token || getAdminToken() || undefined
  );

  if (!res.ok) {
    return {
      ok: false,
      error: res.error || 'VERIFY_FAILED',
      message: res.message || 'Failed to verify payment slip.',
    };
  }

  const receipt = (res.data as any)?.receipt || res.data;
  return { ok: true, receipt };
}

export interface RejectReceiptOptions {
  reason: string;
  assignStrike?: boolean;
  strikeReason?: string;
}

/**
 * Reject a submitted payment receipt with reason.
 * Calls backend POST /receipts/:id/reject.
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
  const reasonStr = typeof options === 'string' ? options : options.reason;
  const shouldAssignStrike = typeof options === 'object' && Boolean(options.assignStrike);
  const strikeReasonStr =
    typeof options === 'object' && options.strikeReason
      ? options.strikeReason
      : reasonStr || 'Unverified / invalid payment deposit receipt';

  const payload = {
    reason: reasonStr.trim(),
    assignStrike: shouldAssignStrike,
    strikeReason: strikeReasonStr.trim(),
  };

  const res = await apiPost<{ receipt: ReceiptSubmission; strikeAssigned?: boolean }>(
    `/receipts/${receiptId}/reject`,
    payload,
    session.token || getAdminToken() || undefined
  );

  if (!res.ok) {
    return {
      ok: false,
      error: res.error || 'REJECT_FAILED',
      message: res.message || 'Failed to reject payment receipt.',
    };
  }

  const receipt = (res.data as any)?.receipt || res.data;
  const strikeAssigned = Boolean((res.data as any)?.strikeAssigned ?? shouldAssignStrike);
  return { ok: true, receipt, strikeAssigned };
}

/**
 * Verifies a receipt publicly using its slip number.
 * Calls backend GET /receipts/verify/:slipNumber (PUBLIC).
 */
export async function verifySlipPublic(
  slipNumber: string
): Promise<{ exists: boolean; status: ReceiptStatus | 'not_found'; amount?: number; paymentDate?: string; customerContext?: string }> {
  const res = await apiGet<{ exists: boolean; status: string; amount?: number; paymentDate?: string; customerContext?: string }>(`/receipts/verify/${slipNumber}`);
  if (!res.ok || !res.data) {
    return { exists: false, status: 'not_found' };
  }
  return res.data as any;
}
