import { mockStore } from '../mock/store';
import { AdminSession, Reservation, ReservationStatus, Booking } from '../mock/types';
import { canAccessBlock } from './adminAuth';
import { bookPlot } from './adminPlots';

export interface ReservationWithConflict extends Reservation {
  hasDuplicateConflict: boolean;
  conflictCount: number;
}

/**
 * Retrieve reservations filtered by administrative block access.
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
  mockStore.loadFromStorage();

  // 1. Filter by block accessibility (Exception 5.4)
  let accessible = mockStore.reservations.filter((r) =>
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
        r.customerEmail.toLowerCase().includes(s) ||
        r.reservedByAdminName.toLowerCase().includes(s)
    );
  }

  // 4. Attach conflict indicators
  const results: ReservationWithConflict[] = accessible.map((r) => {
    const conflictCount = r.status === 'active' ? activePlotCounts.get(r.plotId) || 0 : 0;
    return {
      ...r,
      hasDuplicateConflict: conflictCount > 1,
      conflictCount,
    };
  });

  return { ok: true, reservations: results };
}

/**
 * Update the dispute/resolution note on an active or superseded reservation.
 */
export async function updateReservationNote(
  session: AdminSession,
  reservationId: string,
  note: string
): Promise<{ ok: boolean; reservation?: Reservation; error?: string }> {
  mockStore.loadFromStorage();
  const reservation = mockStore.reservations.find((r) => r.id === reservationId);
  if (!reservation) return { ok: false, error: 'RESERVATION_NOT_FOUND' };

  if (!canAccessBlock(session, reservation.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE' };
  }

  reservation.resolutionNote = note.trim();

  mockStore.broadcast({
    type: 'RESERVATION_UPDATED',
    timestamp: new Date().toISOString(),
    reservationId,
  });

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'RESERVATION_NOTE_UPDATED',
    entityType: 'reservation',
    entityId: reservationId,
    details: `Updated resolution note for plot ${reservation.plotNumber}: "${note.trim()}"`,
  });

  return { ok: true, reservation };
}

/**
 * Cancel or expire an active reservation
 */
export async function cancelReservation(
  session: AdminSession,
  reservationId: string,
  reason?: string
): Promise<{ ok: boolean; reservation?: Reservation; error?: string }> {
  mockStore.loadFromStorage();
  const reservation = mockStore.reservations.find((r) => r.id === reservationId);
  if (!reservation) return { ok: false, error: 'RESERVATION_NOT_FOUND' };

  if (!canAccessBlock(session, reservation.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE' };
  }

  reservation.status = 'expired';
  if (reason) {
    reservation.resolutionNote = (reservation.resolutionNote ? reservation.resolutionNote + ' | ' : '') + reason;
  }

  // Check if any other active reservation exists for this plot
  const otherActive = mockStore.reservations.some(
    (r) => r.plotId === reservation.plotId && r.status === 'active' && r.id !== reservationId
  );

  const plot = mockStore.plots.find((p) => p.id === reservation.plotId);
  if (plot && !otherActive && plot.status === 'reserved') {
    plot.status = 'available';
  }

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'RESERVATION_CANCELLED',
    entityType: 'reservation',
    entityId: reservationId,
    details: `Reservation cancelled for plot ${reservation.plotNumber}${reason ? ` (${reason})` : ''}`,
  });

  mockStore.broadcast({
    type: 'RESERVATION_UPDATED',
    timestamp: new Date().toISOString(),
    reservationId,
    plotId: reservation.plotId,
  });

  return { ok: true, reservation };
}

/**
 * Confirm an active reservation into an official plot booking.
 * Automatically supersedes any competing active reservations on the same plot and records audit logs.
 */
export async function confirmReservation(
  session: AdminSession,
  reservationId: string,
  paymentType: 'one_time' | 'installment' = 'one_time'
): Promise<{ ok: boolean; booking?: Booking; error?: string }> {
  mockStore.loadFromStorage();
  const reservation = mockStore.reservations.find((r) => r.id === reservationId);
  if (!reservation) return { ok: false, error: 'RESERVATION_NOT_FOUND' };

  if (!canAccessBlock(session, reservation.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE' };
  }

  const res = await bookPlot(session, {
    plotId: reservation.plotId,
    reservationId: reservation.id,
    paymentType,
    customer: {
      fullName: reservation.customerName,
      phone: reservation.customerPhone,
      email: reservation.customerEmail,
    },
  });

  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'RESERVATION_CONFIRMED',
    entityType: 'reservation',
    entityId: reservation.id,
    details: `Confirmed reservation ${reservation.id} for ${reservation.customerName} on plot ${reservation.plotNumber} into booking ${res.booking?.id}`,
  });

  return { ok: true, booking: res.booking };
}

