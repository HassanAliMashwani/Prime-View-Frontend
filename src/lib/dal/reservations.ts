import { mockStore } from '../mock/store';
import { AdminSession, Reservation, ReservationStatus } from '../mock/types';
import { canAccessBlock } from './adminAuth';

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

  mockStore.broadcast({
    type: 'RESERVATION_UPDATED',
    timestamp: new Date().toISOString(),
    reservationId,
  });

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'RESERVATION_CANCELLED',
    entityType: 'reservation',
    entityId: reservationId,
    details: `Reservation cancelled for plot ${reservation.plotNumber}`,
  });

  return { ok: true, reservation };
}
