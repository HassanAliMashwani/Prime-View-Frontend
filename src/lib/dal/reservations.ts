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
  }
): Promise<{
  ok: boolean;
  reservations: ReservationWithConflict[];
  error?: string;
}> {
  const plotsRes = await apiGet<any[]>('/plots', session.token);

  if (!plotsRes.ok || !Array.isArray(plotsRes.data)) {
    return {
      ok: false,
      reservations: [],
      error: plotsRes.error || 'FETCH_PLOTS_FAILED',
    };
  }

  // Flatten all reservations from plots
  const rawReservations: (Reservation & { plot: Plot })[] = [];
  const plotMap = new Map<string, Plot>();

  for (const plot of plotsRes.data) {
    plotMap.set(plot.id, plot);
    if (plot.reservations && Array.isArray(plot.reservations)) {
      for (const r of plot.reservations) {
        rawReservations.push({
          id: r.id,
          plotId: r.plotId || plot.id,
          plotNumber: plot.plotNumber || 'Unknown',
          blockId: plot.blockId || '',
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
          plot,
        });
      }
    }
  }

  // 1. Filter by block accessibility (Exception 5.4)
  let accessible = rawReservations.filter((r) =>
    canAccessBlock(session, r.blockId)
  );

  // 2. Count active reservations per plot to detect race-condition duplicates
  const activePlotCounts = new Map<string, number>();
  accessible.forEach((r) => {
    if (r.status === 'active') {
      activePlotCounts.set(r.plotId, (activePlotCounts.get(r.plotId) || 0) + 1);
    }
  });

  // 3. Apply optional filters
  if (filters?.blockId && filters.blockId !== 'all') {
    accessible = accessible.filter((r) => r.blockId === filters.blockId);
  }

  if (filters?.status && filters.status !== 'all') {
    accessible = accessible.filter((r) => r.status === filters.status);
  }

  if (filters?.search) {
    const s = filters.search.trim().toLowerCase();
    accessible = accessible.filter(
      (r) =>
        r.plotNumber.toLowerCase().includes(s) ||
        r.customerName.toLowerCase().includes(s) ||
        r.customerPhone.toLowerCase().includes(s) ||
        (r.customerEmail && r.customerEmail.toLowerCase().includes(s)) ||
        r.reservedByAdminName.toLowerCase().includes(s)
    );
  }

  // 4. Attach conflict indicators & live plot details
  const results: ReservationWithConflict[] = accessible.map((r) => {
    const conflictCount = r.status === 'active' ? activePlotCounts.get(r.plotId) || 0 : 0;
    return {
      ...r,
      hasDuplicateConflict: conflictCount > 1,
      conflictCount,
      plot: r.plot,
    };
  });

  return { ok: true, reservations: results };
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
