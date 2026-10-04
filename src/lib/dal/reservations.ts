import { AdminSession, Reservation, ReservationStatus, Booking, Plot } from '../mock/types';
import { canAccessBlock } from './adminAuth';
import { apiGet, apiPost, apiPatch } from '../api';

export interface ReservationWithConflict extends Reservation {
  hasDuplicateConflict: boolean;
  conflictCount: number;
  plot?: Plot;
}

/**
 * Retrieve reservations filtered by administrative block access.
 * Extracted from real backend GET /plots (which includes reservations: true on every plot).
 * Automatically identifies and flags duplicate/race-condition reservations on the same plot.
 */
export async function getReservations(
  session: AdminSession,
  filters?: {
    status?: ReservationStatus | 'all';
    blockId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<{
  ok: boolean;
  reservations: ReservationWithConflict[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
}> {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.blockId) query.set('blockId', filters.blockId);
  if (filters?.search) query.set('search', filters.search);
  if (filters?.page) query.set('page', String(filters.page));
  if (filters?.pageSize) query.set('pageSize', String(filters.pageSize));

  const res = await apiGet<any>(`/reservations?${query.toString()}`, session.token);

  if (!res.ok) {
    return {
      ok: false,
      reservations: [],
      total: 0,
      page: 1,
      pageSize: 10,
      error: res.error || 'FETCH_RESERVATIONS_FAILED',
    };
  }

  const results: ReservationWithConflict[] = (res.data.items || []).map((r: any) => {
    const activeCount = r.plot?.reservations?.length || 0;
    return {
      id: r.id,
      plotId: r.plotId || r.plot?.id,
      plotNumber: r.plot?.plotNumber || 'Unknown',
      blockId: r.plot?.blockId || '',
      customerName: r.customerName || '',
      customerPhone: r.customerPhone || '',
      customerEmail: r.customerEmail || undefined,
      tokenFee: Number(r.tokenFee) || 50000,
      validUntil: r.validUntil || new Date(Date.now() + 24 * 3600000).toISOString(),
      reservedByAdminId: r.reservedByAdminId || '',
      reservedByAdminName: r.reservedByAdminName || 'Admin Officer',
      status: (r.status || 'active') as ReservationStatus,
      createdAt: r.createdAt || new Date().toISOString(),
      confirmedAt: r.confirmedAt || undefined,
      confirmedByBookingId: r.confirmedByBookingId || undefined,
      supersededAt: r.supersededAt || undefined,
      supersededByBookingId: r.supersededByBookingId || undefined,
      cancelledAt: r.cancelledAt || undefined,
      cancelledByAdminId: r.cancelledByAdminId || undefined,
      resolutionNote: r.resolutionNote || undefined,
      plot: r.plot,
      hasDuplicateConflict: r.status === 'active' && activeCount > 1,
      conflictCount: r.status === 'active' ? activeCount : 0,
    };
  });

  return { 
    ok: true, 
    reservations: results,
    total: res.data.total || 0,
    page: res.data.page || 1,
    pageSize: res.data.pageSize || 10
  };
}

/**
 * Update the dispute/resolution note on an active or superseded reservation.
 * Calls PATCH /reservations/:id/note.
 */
export async function updateReservationNote(
  session: AdminSession,
  reservationId: string,
  note: string
): Promise<{ ok: boolean; reservation?: Reservation; error?: string }> {
  const res = await apiPatch<any>(
    `/reservations/${reservationId}/note`,
    { note: note.trim() },
    session.token
  );

  if (!res.ok) {
    return { ok: false, error: res.error || 'UPDATE_FAILED' };
  }

  const reservation = res.data?.updatedReservation || res.data;
  return { ok: true, reservation };
}

/**
 * Release / cancel an active reservation back to society inventory.
 * Calls POST /reservations/:id/release.
 */
export async function releaseReservation(
  session: AdminSession,
  reservationId: string,
  reason?: string
): Promise<{ ok: boolean; reservation?: Reservation; error?: string }> {
  const res = await apiPost<any>(
    `/reservations/${reservationId}/release`,
    { reason },
    session.token
  );

  if (!res.ok) {
    return { ok: false, error: res.error || 'RELEASE_FAILED' };
  }

  const reservation = res.data?.updatedReservation || res.data;
  return { ok: true, reservation };
}

export const cancelReservation = releaseReservation;

/**
 * Confirm an active reservation into an official plot booking.
 * Calls POST /reservations/:id/confirm.
 */
export async function confirmReservation(
  session: AdminSession,
  reservationId: string,
  paymentType: 'one_time' | 'installment' = 'one_time'
): Promise<{ ok: boolean; booking?: Booking; error?: string }> {
  const res = await apiPost<any>(
    `/reservations/${reservationId}/confirm`,
    { paymentType },
    session.token
  );

  if (!res.ok) {
    return { ok: false, error: res.error || 'CONFIRM_FAILED' };
  }

  const booking = res.data?.booking || res.data;
  return { ok: true, booking };
}
