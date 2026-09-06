import { mockStore } from '../mock/store';
import { Customer } from '../mock/types';
import { requireMemberSession } from './auth';

export interface UpdateProfileInput {
  fullName: string;
  cnic: string;
  email: string;
  phone: string;
  mailingAddress?: string;
}

export async function getCustomerProfile(): Promise<{ ok: boolean; data?: Customer; error?: string }> {
  try {
    const session = requireMemberSession();
    const customer = mockStore.customers.find((c) => c.id === session.customerId);

    if (!customer) {
      return { ok: false, error: 'CUSTOMER_NOT_FOUND' };
    }

    // Return a clone to prevent direct outside mutations
    return { ok: true, data: { ...customer } };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return { ok: false, error: 'UNAUTHORIZED' };
    }
    return { ok: false, error: 'UNKNOWN_ERROR' };
  }
}

export async function updateProfile(
  data: UpdateProfileInput
): Promise<{ ok: boolean; data?: Customer; error?: string }> {
  try {
    const session = requireMemberSession();
    const customerIndex = mockStore.customers.findIndex((c) => c.id === session.customerId);

    if (customerIndex === -1) {
      return { ok: false, error: 'CUSTOMER_NOT_FOUND' };
    }

    const currentCustomer = mockStore.customers[customerIndex];

    // Build the updated object atomically
    const updatedCustomer: Customer = {
      ...currentCustomer,
      fullName: data.fullName.trim(),
      cnic: data.cnic.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      mailingAddress: data.mailingAddress !== undefined ? data.mailingAddress.trim() : currentCustomer.mailingAddress,
    };

    // Commit single state update (last-write-wins per Section 5.8)
    mockStore.customers[customerIndex] = updatedCustomer;

    // Record audit entry
    mockStore.addAuditEntry({
      actorId: session.customerId,
      actorName: updatedCustomer.fullName,
      actorRole: 'customer',
      action: 'UPDATE_PROFILE',
      entityType: 'customer',
      entityId: session.customerId,
      details: `Profile updated by member: ${updatedCustomer.fullName}`,
    });

    // Broadcast change
    mockStore.broadcast({
      type: 'PROFILE_UPDATED',
      timestamp: new Date().toISOString(),
      customerId: session.customerId,
    });

    return { ok: true, data: { ...updatedCustomer } };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return { ok: false, error: 'UNAUTHORIZED' };
    }
    return { ok: false, error: 'UNKNOWN_ERROR' };
  }
}
