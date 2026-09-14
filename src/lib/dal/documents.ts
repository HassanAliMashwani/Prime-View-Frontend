import { AdminSession, CustomerDocument, CustomerDocumentType } from '../mock/types';
import { mockStore } from '../mock/store';
import { canAccessBlock } from './adminAuth';
import { requireMemberSession } from './auth';
import { compressAndEncodeReceipt } from '../utils/imageCompression';

export interface UploadCustomerDocumentInput {
  customerId: string;
  bookingId?: string;
  file: File;
  type: CustomerDocumentType;
  label?: string;
}

/**
 * Upload a physical customer document attachment (Change Request 05 §2).
 * Enforces two-check permission pattern (can_create_customer + Sub Admin block scope).
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
  mockStore.loadFromStorage();

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

  // 2. Customer validation
  const customer = mockStore.customers.find((c) => c.id === input.customerId);
  if (!customer) {
    return {
      ok: false,
      error: 'CUSTOMER_NOT_FOUND',
      message: 'Customer not found.',
    };
  }

  // 3. Block Scope Verification (Exception 4.13c)
  if (!isSuper) {
    let blockIdToCheck: string | undefined;

    if (input.bookingId) {
      const booking = mockStore.bookings.find((b) => b.id === input.bookingId);
      if (booking) {
        const plot = mockStore.plots.find((p) => p.id === booking.plotId);
        if (plot) blockIdToCheck = plot.blockId;
      }
    } else {
      // Find customer's first active booking plot
      const customerBookings = mockStore.bookings.filter((b) => b.customerId === customer.id);
      for (const cb of customerBookings) {
        const plot = mockStore.plots.find((p) => p.id === cb.plotId);
        if (plot) {
          blockIdToCheck = plot.blockId;
          break;
        }
      }
    }

    if (blockIdToCheck && !canAccessBlock(session, blockIdToCheck)) {
      return {
        ok: false,
        error: 'OUT_OF_SCOPE',
        message: 'This customer booking belongs to a block outside your assigned administrative scope.',
      };
    }
  }

  // 4. Validate document type and label
  if (input.type === 'other' && (!input.label || !input.label.trim())) {
    return {
      ok: false,
      error: 'LABEL_REQUIRED',
      message: 'A descriptive label is required when document type is "other".',
    };
  }

  // 5. File format validation
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!validMimeTypes.includes(input.file.type)) {
    return {
      ok: false,
      error: 'INVALID_FILE_TYPE',
      message: 'Supported document formats are JPEG, PNG, WEBP, and PDF only.',
    };
  }

  // 6. Max size 15MB
  if (input.file.size > 15 * 1024 * 1024) {
    return {
      ok: false,
      error: 'FILE_TOO_LARGE',
      message: 'Document file size must not exceed 15 MB.',
    };
  }

  // 7. Compress images or read PDF as Data URL
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

  // 8. Create CustomerDocument record
  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newDoc: CustomerDocument = {
    id: docId,
    customerId: customer.id,
    bookingId: input.bookingId,
    type: input.type,
    label: input.type === 'other' ? input.label?.trim() : undefined,
    fileUrl,
    fileName: input.file.name,
    fileSizeKb: Math.max(1, Math.round(input.file.size / 1024)),
    uploadedAt: now,
    uploadedByUserId: session.adminId,
    uploadedByUserName: session.fullName,
  };

  if (!mockStore.customerDocuments) {
    mockStore.customerDocuments = [];
  }
  mockStore.customerDocuments.unshift(newDoc);
  mockStore.saveToStorage();

  // 9. Audit trail
  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'CUSTOMER_DOCUMENT_UPLOADED',
    entityType: 'document',
    entityId: newDoc.id,
    details: `Uploaded ${newDoc.type} document "${newDoc.fileName}" for Member ${customer.fullName} (${customer.membershipNo})`,
  });

  // 10. Cross-tab sync
  mockStore.broadcast({
    type: 'DOCUMENT_UPLOADED',
    timestamp: now,
    documentId: newDoc.id,
    customerId: customer.id,
  });

  return {
    ok: true,
    document: newDoc,
  };
}

/**
 * Retrieve all physical documents uploaded for a customer (Change Request 05 §2).
 * Requires can_view_customers (or can_create_customer) and respects Sub Admin block scope.
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
  mockStore.loadFromStorage();

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

  const customer = mockStore.customers.find((c) => c.id === customerId);
  if (!customer) {
    return {
      ok: false,
      documents: [],
      error: 'CUSTOMER_NOT_FOUND',
      message: 'Customer not found.',
    };
  }

  // Block scope check for Sub Admins
  if (!isSuper) {
    const customerBookings = mockStore.bookings.filter((b) => b.customerId === customer.id);
    if (customerBookings.length > 0) {
      const hasAccessibleBooking = customerBookings.some((cb) => {
        const plot = mockStore.plots.find((p) => p.id === cb.plotId);
        return plot && canAccessBlock(session, plot.blockId);
      });

      if (!hasAccessibleBooking) {
        return {
          ok: false,
          documents: [],
          error: 'OUT_OF_SCOPE',
          message: 'Customer records are outside your assigned administrative block scope.',
        };
      }
    }
  }

  const docs = (mockStore.customerDocuments || []).filter((d) => d.customerId === customerId);
  return {
    ok: true,
    documents: docs,
  };
}

/**
 * Delete a customer document attachment (Change Request 05 §2).
 * Requires can_create_customer and Sub Admin block scope.
 */
export async function deleteCustomerDocument(
  session: AdminSession,
  documentId: string
): Promise<{
  ok: boolean;
  error?: string;
  message?: string;
}> {
  mockStore.loadFromStorage();

  const isSuper = session.role === 'super_admin';
  const hasPerm = isSuper || Boolean(session.permissions?.can_create_customer);
  if (!hasPerm) {
    return {
      ok: false,
      error: 'FORBIDDEN',
      message: 'You do not have permission to delete customer documents.',
    };
  }

  const doc = (mockStore.customerDocuments || []).find((d) => d.id === documentId);
  if (!doc) {
    return {
      ok: false,
      error: 'DOCUMENT_NOT_FOUND',
      message: 'Document record not found.',
    };
  }

  // Block scope check on associated booking/customer
  if (!isSuper) {
    let blockIdToCheck: string | undefined;
    if (doc.bookingId) {
      const booking = mockStore.bookings.find((b) => b.id === doc.bookingId);
      if (booking) {
        const plot = mockStore.plots.find((p) => p.id === booking.plotId);
        if (plot) blockIdToCheck = plot.blockId;
      }
    } else {
      const customerBookings = mockStore.bookings.filter((b) => b.customerId === doc.customerId);
      if (customerBookings.length > 0) {
        const plot = mockStore.plots.find((p) => p.id === customerBookings[0].plotId);
        if (plot) blockIdToCheck = plot.blockId;
      }
    }

    if (blockIdToCheck && !canAccessBlock(session, blockIdToCheck)) {
      return {
        ok: false,
        error: 'OUT_OF_SCOPE',
        message: 'Cannot delete document: Associated plot is outside your assigned administrative scope.',
      };
    }
  }

  mockStore.customerDocuments = mockStore.customerDocuments.filter((d) => d.id !== documentId);
  mockStore.saveToStorage();

  const now = new Date().toISOString();
  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'CUSTOMER_DOCUMENT_DELETED',
    entityType: 'document',
    entityId: documentId,
    details: `Deleted ${doc.type} document "${doc.fileName}" (ID: ${documentId})`,
  });

  mockStore.broadcast({
    type: 'DOCUMENT_DELETED',
    timestamp: now,
    documentId,
    customerId: doc.customerId,
  });

  return { ok: true };
}

export interface PlotDocuments {
  plotId: string;
  plotNumber: string;
  documents: CustomerDocument[];
}

/**
 * Retrieve verified customer paperwork and deeds for the authenticated member.
 */
export async function getMyDocuments(): Promise<{ ok: boolean; data: PlotDocuments[]; error?: string }> {
  try {
    mockStore.loadFromStorage();
    const session = requireMemberSession();
    const docs = mockStore.customerDocuments.filter((d) => d.customerId === session.customerId);
    const userBookings = mockStore.bookings.filter((b) => b.customerId === session.customerId);

    const results: PlotDocuments[] = [];
    for (const b of userBookings) {
      const plot = mockStore.plots.find((p) => p.id === b.plotId);
      const plotDocs = docs.filter((d) => !d.bookingId || d.bookingId === b.id);
      results.push({
        plotId: b.plotId,
        plotNumber: plot?.plotNumber || 'Plot',
        documents: plotDocs,
      });
    }
    return { ok: true, data: results };
  } catch {
    return { ok: false, data: [] };
  }
}
