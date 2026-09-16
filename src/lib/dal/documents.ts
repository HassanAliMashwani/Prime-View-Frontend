import { AdminSession, CustomerDocument, CustomerDocumentType } from '../mock/types';
import { requireMemberSession } from './auth';
import { compressAndEncodeReceipt } from '../utils/imageCompression';
import { apiGet, apiPost, apiDelete } from '../api';

export interface UploadCustomerDocumentInput {
  customerId: string;
  bookingId?: string;
  file: File;
  type: CustomerDocumentType;
  label?: string;
}

/**
 * Upload a physical customer document attachment (Change Request 05 §2).
 * Enforces permission pattern via real backend CustomersController.
 */
export async function uploadCustomerDocument(
  session: AdminSession,
  input: UploadCustomerDocumentInput
): Promise<{
  ok: boolean;
  document?: CustomerDocument;
  error?: string;
  message?: string;
}> {
  // 1. Permission check
  const isSuper = session.role === 'super_admin';
  const hasPerm = isSuper || Boolean(session.permissions?.can_create_customer);
  if (!hasPerm) {
    return {
      ok: false,
      error: 'FORBIDDEN',
      message: 'You do not have permission to upload customer documents.',
    };
  }

  // 2. Validate document type and label
  if (input.type === 'other' && (!input.label || !input.label.trim())) {
    return {
      ok: false,
      error: 'LABEL_REQUIRED',
      message: 'A descriptive label is required when document type is "other".',
    };
  }

  // 3. File format validation
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!validMimeTypes.includes(input.file.type)) {
    return {
      ok: false,
      error: 'INVALID_FILE_TYPE',
      message: 'Supported document formats are JPEG, PNG, WEBP, and PDF only.',
    };
  }

  // 4. Max size 15MB
  if (input.file.size > 15 * 1024 * 1024) {
    return {
      ok: false,
      error: 'FILE_TOO_LARGE',
      message: 'Document file size must not exceed 15 MB.',
    };
  }

  // 5. Compress images or read PDF as Data URL
  let fileUrl: string;
  try {
    fileUrl = await compressAndEncodeReceipt(input.file, 1000, 0.75);
  } catch {
    return {
      ok: false,
      error: 'COMPRESSION_FAILED',
      message: 'Failed to process and compress document attachment.',
    };
  }

  const payload = {
    customerId: input.customerId,
    bookingId: input.bookingId,
    type: input.type,
    label: input.type === 'other' ? input.label?.trim() : undefined,
    fileUrl,
    fileName: input.file.name,
    fileSizeKb: Math.max(1, Math.round(input.file.size / 1024)),
  };

  const res = await apiPost<{ document: CustomerDocument }>(
    `/customers/${input.customerId}/documents`,
    payload,
    session.token
  );

  if (!res.ok) {
    return {
      ok: false,
      error: res.error || 'UPLOAD_FAILED',
      message: res.message || 'Failed to upload customer document.',
    };
  }

  const doc = (res.data as any)?.document || res.data;
  return {
    ok: true,
    document: doc as CustomerDocument,
  };
}

/**
 * Retrieve all physical documents uploaded for a customer (Change Request 05 §2).
 * Fetches real customer record from backend.
 */
export async function getCustomerDocuments(
  session: AdminSession,
  customerId: string
): Promise<{
  ok: boolean;
  documents: CustomerDocument[];
  error?: string;
  message?: string;
}> {
  const isSuper = session.role === 'super_admin';
  const hasPerm =
    isSuper ||
    Boolean(session.permissions?.can_view_customers || session.permissions?.can_create_customer);

  if (!hasPerm) {
    return {
      ok: false,
      documents: [],
      error: 'FORBIDDEN',
      message: 'You do not have permission to view customer documents.',
    };
  }

  const res = await apiGet<{ documents?: CustomerDocument[] }>(
    `/customers/${customerId}`,
    session.token
  );

  if (!res.ok) {
    return {
      ok: false,
      documents: [],
      error: res.error || 'CUSTOMER_NOT_FOUND',
      message: res.message || 'Could not retrieve customer documents.',
    };
  }

  const docs = res.data?.documents || [];
  return {
    ok: true,
    documents: docs,
  };
}

/**
 * Delete a customer document attachment (Change Request 05 §2).
 * Calls real backend deletion route with Super Admin or block scoping.
 */
export async function deleteCustomerDocument(
  session: AdminSession,
  documentId: string,
  customerId?: string
): Promise<{
  ok: boolean;
  error?: string;
  message?: string;
}> {
  const isSuper = session.role === 'super_admin';
  const hasPerm = isSuper || Boolean(session.permissions?.can_create_customer);
  if (!hasPerm) {
    return {
      ok: false,
      error: 'FORBIDDEN',
      message: 'You do not have permission to delete customer documents.',
    };
  }

  const path = customerId
    ? `/customers/${customerId}/documents/${documentId}`
    : `/customers/documents/${documentId}`;

  const res = await apiDelete(path, session.token);

  if (!res.ok) {
    return {
      ok: false,
      error: res.error || 'DELETE_FAILED',
      message: res.message || 'Failed to delete customer document.',
    };
  }

  return { ok: true, message: 'Document deleted successfully.' };
}

export interface PlotDocuments {
  plotId: string;
  plotNumber: string;
  documents: CustomerDocument[];
}

/**
 * Retrieve verified customer paperwork and deeds for the authenticated member.
 * Fetches real plots and deeds from GET /me/plots.
 */
export async function getMyDocuments(): Promise<{ ok: boolean; data: PlotDocuments[]; error?: string }> {
  try {
    const session = requireMemberSession();
    const res = await apiGet<any[]>('/me/plots', session.token);

    if (!res.ok || !Array.isArray(res.data)) {
      return { ok: false, data: [], error: res.error || 'FETCH_FAILED' };
    }

    const results: PlotDocuments[] = [];
    for (const plot of res.data) {
      const docs: CustomerDocument[] = [];
      if (plot.bookings) {
        for (const b of plot.bookings) {
          if (b.societyDocuments) {
            for (const sd of b.societyDocuments) {
              docs.push({
                id: sd.id,
                customerId: sd.customerId,
                bookingId: sd.bookingId,
                type: sd.type,
                label: undefined,
                fileUrl: sd.fileUrl,
                fileName: sd.fileName,
                fileSizeKb: sd.fileSizeKb,
                uploadedAt: sd.uploadedAt || new Date().toISOString(),
                uploadedByUserId: sd.uploadedById || 'system',
              });
            }
          }
        }
      }
      results.push({
        plotId: plot.id,
        plotNumber: plot.plotNumber || 'Plot',
        documents: docs,
      });
    }

    return { ok: true, data: results };
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return { ok: false, data: [], error: 'UNAUTHORIZED' };
    }
    return { ok: false, data: [], error: 'UNKNOWN_ERROR' };
  }
}
