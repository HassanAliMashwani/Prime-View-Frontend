import { mockStore } from '../mock/store';
import { AdminSession, Block, Plot, Booking, Customer, PaymentRecord, Reservation } from '../mock/types';
import { canAccessBlock } from './adminAuth';

export interface BlockSummary extends Block {
  totalCount: number;
  availableCount: number;
  reservedCount: number;
  bookedCount: number;
  amenityCount: number;
  disputedCount?: number;
}

export interface PlotFilterOptions {
  search?: string;
  status?: 'all' | 'available' | 'reserved' | 'booked' | 'disputed' | 'adjustment';
  category?: 'all' | 'residential' | 'commercial' | 'farm_house' | 'amenity';
}

import { apiGet } from '../api';

/**
 * Level 1 Master Plan blocks view via real API (GET /blocks).
 * Super Admins see all 8 blocks.
 * Sub Admins strictly see their assigned blocks (Exception 5.4).
 */
export async function getAdminMasterPlanBlocks(session: AdminSession): Promise<{
  ok: boolean;
  blocks: BlockSummary[];
  error?: string;
}> {
  mockStore.cleanExpiredLocks();

  if (session?.token) {
    const apiRes = await apiGet<Block[]>('/blocks', session.token);
    if (apiRes.ok && Array.isArray(apiRes.data)) {
      const accessibleBlocks = apiRes.data.filter((b) => canAccessBlock(session, b.id));
      const summaries: BlockSummary[] = accessibleBlocks.map((block: any) => {
        return {
          id: block.id,
          name: block.name,
          description: block.description || '',
          totalPlots: block.totalPlots, // descriptive capacity
          amenities: block.amenities && block.amenities.length > 0 ? block.amenities : ['Central Park', 'Community Mosque'],
          totalCount: typeof block.totalCount === 'number' ? block.totalCount : 0,
          availableCount: typeof block.availableCount === 'number' ? block.availableCount : 0,
          reservedCount: typeof block.reservedCount === 'number' ? block.reservedCount : 0,
          bookedCount: typeof block.bookedCount === 'number' ? block.bookedCount : 0,
          amenityCount: typeof block.amenityCount === 'number' ? block.amenityCount : 0,
          disputedCount: typeof block.disputedCount === 'number' ? block.disputedCount : 0,
        };
      });
      return { ok: true, blocks: summaries };
    }
  }

  const accessibleBlocks = mockStore.blocks.filter((b) => canAccessBlock(session, b.id));

  const summaries: BlockSummary[] = accessibleBlocks.map((block) => {
    const blockPlots = mockStore.plots.filter((p) => p.blockId === block.id);
    const availableCount = blockPlots.filter((p) => p.status === 'available' && p.category !== 'amenity').length;
    const reservedCount = blockPlots.filter((p) => p.status === 'reserved').length;
    const bookedCount = blockPlots.filter((p) => p.status === 'booked' && p.category !== 'amenity').length;
    const amenityCount = blockPlots.filter((p) => p.category === 'amenity').length;

    // Track active competing reservations for dispute count
    const activeResCounts = new Map<string, number>();
    mockStore.reservations.forEach((r) => {
      if (r.status === 'active' && r.blockId === block.id) {
        activeResCounts.set(r.plotId, (activeResCounts.get(r.plotId) || 0) + 1);
      }
    });
    let disputedCount = 0;
    activeResCounts.forEach((count) => {
      if (count > 1) disputedCount++;
    });

    return {
      ...block,
      totalCount: blockPlots.filter((p) => p.category !== 'amenity').length,
      availableCount,
      reservedCount,
      bookedCount,
      amenityCount,
      disputedCount,
    };
  });

  return { ok: true, blocks: summaries };
}

/**
 * Level 2 Block detail with plot grid via real API (GET /plots?blockId=...).
 * Out-of-scope block requests are strictly rejected (Exception 5.4).
 */
export async function getAdminBlockPlots(
  session: AdminSession,
  blockId: string,
  filters?: PlotFilterOptions
): Promise<{
  ok: boolean;
  block?: Block;
  plots?: Plot[];
  error?: string;
}> {
  if (!canAccessBlock(session, blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE' };
  }

  mockStore.cleanExpiredLocks();

  const block = mockStore.blocks.find((b) => b.id === blockId);

  if (session?.token) {
    const apiRes = await apiGet<Plot[]>(`/plots?blockId=${blockId}`, session.token);
    if (apiRes.ok && Array.isArray(apiRes.data)) {
      let plots: Plot[] = apiRes.data.map((p: any) => ({
        ...p,
        price: Number(p.price) || 0,
      }));

      // Search filtering
      if (filters?.search) {
        const s = filters.search.trim().toLowerCase();
        plots = plots.filter(
          (p) =>
            p.plotNumber.toLowerCase().includes(s) ||
            p.size.toLowerCase().includes(s) ||
            (p.amenityName && p.amenityName.toLowerCase().includes(s))
        );
      }

      // Status filtering
      if (filters?.status && filters.status !== 'all') {
        if (filters.status === 'adjustment') {
          plots = plots.filter((p) => Boolean(p.isAdjustment));
        } else if (filters.status === 'disputed') {
          plots = plots.filter((p) => Boolean(p.isDisputed));
        } else {
          plots = plots.filter((p) => p.status === filters.status);
        }
      }

      // Category filtering
      if (filters?.category && filters.category !== 'all') {
        plots = plots.filter((p) => p.category === filters.category);
      }

      return { ok: true, block, plots };
    }
  }

  if (!block) {
    return { ok: false, error: 'BLOCK_NOT_FOUND' };
  }

  let plots = mockStore.plots.filter((p) => p.blockId === blockId);

  // 1. Calculate active reservation counts for dispute tracking first
  const activeReservationCounts = new Map<string, number>();
  mockStore.reservations.forEach((r) => {
    if (r.status === 'active' && r.blockId === blockId) {
      activeReservationCounts.set(r.plotId, (activeReservationCounts.get(r.plotId) || 0) + 1);
    }
  });

  plots = plots.map((p) => {
    const count = activeReservationCounts.get(p.id) || 0;
    return {
      ...p,
      activeReservationCount: count,
      isDisputed: count > 1,
    };
  });

  // 2. Search filtering
  if (filters?.search) {
    const s = filters.search.trim().toLowerCase();
    plots = plots.filter(
      (p) =>
        p.plotNumber.toLowerCase().includes(s) ||
        p.size.toLowerCase().includes(s) ||
        (p.amenityName && p.amenityName.toLowerCase().includes(s))
    );
  }

  // 3. Status filtering (including disputed and adjustment)
  if (filters?.status && filters.status !== 'all') {
    if (filters.status === 'adjustment') {
      plots = plots.filter((p) => Boolean(p.isAdjustment));
    } else if (filters.status === 'disputed') {
      plots = plots.filter((p) => p.isDisputed);
    } else {
      plots = plots.filter((p) => p.status === filters.status);
    }
  }

  // 4. Category filtering
  if (filters?.category && filters.category !== 'all') {
    plots = plots.filter((p) => p.category === filters.category);
  }

  return { ok: true, block, plots };
}

/**
 * Get full administrative plot details via real API (GET /plots/:id).
 */
export async function getAdminPlotDetails(
  session: AdminSession,
  plotId: string
): Promise<{
  ok: boolean;
  plot?: Plot;
  reservations?: Reservation[];
  owner?: Customer;
  booking?: Booking;
  error?: string;
}> {
  mockStore.cleanExpiredLocks();

  if (session?.token) {
    const apiRes = await apiGet<any>(`/plots/${plotId}`, session.token);
    if (apiRes.ok) {
      if (apiRes.data) {
        const p = apiRes.data;
        if (!canAccessBlock(session, p.blockId)) {
          return { ok: false, error: 'OUT_OF_SCOPE' };
        }
        const plot: Plot = {
          ...p,
          price: Number(p.price) || 0,
        };
        const reservations: Reservation[] = (p.reservations || []).map((r: any) => ({
          ...r,
          tokenFee: Number(r.tokenFee) || 0,
        }));
        let owner: Customer | undefined = undefined;
        let booking: Booking | undefined = undefined;

        if (plot.currentOwnerId) {
          owner = mockStore.customers.find((c) => c.id === plot.currentOwnerId);
          booking = mockStore.bookings.find((b) => b.plotId === plotId);
        }

        return { ok: true, plot, reservations, owner, booking };
      }
    } else {
      if (apiRes.error === 'OUT_OF_SCOPE' || apiRes.status === 403) {
        return { ok: false, error: 'OUT_OF_SCOPE' };
      }
      if (apiRes.status === 404) {
        return { ok: false, error: 'PLOT_NOT_FOUND' };
      }
    }
  }

  const plot = mockStore.plots.find((p) => p.id === plotId);
  if (!plot) {
    return { ok: false, error: 'PLOT_NOT_FOUND' };
  }

  if (!canAccessBlock(session, plot.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE' };
  }

  const reservations = mockStore.reservations.filter(
    (r) => r.plotId === plotId && r.status === 'active'
  );

  let owner: Customer | undefined = undefined;
  let booking: Booking | undefined = undefined;

  if (plot.currentOwnerId) {
    owner = mockStore.customers.find((c) => c.id === plot.currentOwnerId);
    booking = mockStore.bookings.find((b) => b.plotId === plotId);
  }

  return { ok: true, plot, reservations, owner, booking };
}

/**
 * Acquire a 10-minute soft lock on a plot for booking (Layer 1 Soft Lock).
 * Exception 5.1: If locked by another admin and unexpired, lock acquisition is rejected.
 */
export async function acquireLock(
  session: AdminSession,
  plotId: string
): Promise<{
  ok: boolean;
  plot?: Plot;
  lockToken?: string;
  error?: string;
  lockedByName?: string;
  lockedAt?: number;
}> {
  mockStore.cleanExpiredLocks();

  const plot = mockStore.plots.find((p) => p.id === plotId);
  if (!plot) return { ok: false, error: 'PLOT_NOT_FOUND' };

  if (!canAccessBlock(session, plot.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE' };
  }

  if (plot.isAdjustment) {
    return {
      ok: false,
      error: 'PLOT_UNDER_ADJUSTMENT',
      lockedByName: 'Adjustment',
    };
  }

  if (plot.category === 'amenity') {
    return { ok: false, error: 'AMENITY_NOT_SELLABLE' };
  }

  if (plot.status === 'booked') {
    return { ok: false, error: 'PLOT_ALREADY_BOOKED' };
  }

  const now = Date.now();
  if (plot.lockedBy && plot.lockedBy !== session.adminId) {
    if (plot.lockedAt && now - plot.lockedAt <= 10 * 60 * 1000) {
      return {
        ok: false,
        error: 'LOCKED_BY_ANOTHER',
        lockedByName: plot.lockedByName,
        lockedAt: plot.lockedAt,
      };
    }
  }

  // Acquire lock
  const lockToken = `lock-${plotId}-${session.adminId}-${now}`;
  plot.lockedBy = session.adminId;
  plot.lockedByName = session.fullName;
  plot.lockedAt = now;
  plot.lockToken = lockToken;

  mockStore.scheduleLockTimeout(plotId, 10 * 60 * 1000);

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'PLOT_LOCK_ACQUIRED',
    entityType: 'lock',
    entityId: plotId,
    details: `Admin ${session.fullName} acquired 10m booking lock on ${plot.plotNumber}`,
  });

  mockStore.broadcast({
    type: 'PLOT_LOCKED',
    timestamp: new Date().toISOString(),
    plotId,
    lockedBy: session.adminId,
    lockedByName: session.fullName,
  });

  return { ok: true, plot, lockToken };
}

/**
 * Release an acquired soft lock manually.
 */
export async function releaseLock(
  session: AdminSession,
  plotId: string
): Promise<{ ok: boolean; error?: string }> {
  mockStore.loadFromStorage();
  const plot = mockStore.plots.find((p) => p.id === plotId);
  if (!plot) return { ok: false, error: 'PLOT_NOT_FOUND' };

  if (plot.lockedBy === session.adminId || session.role === 'super_admin') {
    plot.lockedBy = undefined;
    plot.lockedByName = undefined;
    plot.lockedAt = undefined;
    plot.lockToken = undefined;
    mockStore.clearLockTimeout(plotId);

    mockStore.addAuditEntry({
      actorId: session.adminId,
      actorName: session.fullName,
      actorRole: session.role,
      action: 'PLOT_LOCK_RELEASED',
      entityType: 'lock',
      entityId: plotId,
      details: `Lock released on ${plot.plotNumber}`,
    });

    mockStore.broadcast({
      type: 'PLOT_UNLOCKED',
      timestamp: new Date().toISOString(),
      plotId,
      reason: 'MANUAL_RELEASE',
    });

    return { ok: true };
  }

  return { ok: false, error: 'UNAUTHORIZED_RELEASE' };
}

/**
 * Synchronous lock release utility for pagehide / beforeunload / popstate events.
 * Guarantees that closing a browser tab or hitting Back doesn't leave an orphaned 10-minute lock.
 */
export function releaseLockSync(plotId: string, adminId: string): void {
  try {
    mockStore.loadFromStorage();
    const plot = mockStore.plots.find((p) => p.id === plotId);
    if (plot && plot.lockedBy === adminId) {
      plot.lockedBy = undefined;
      plot.lockedByName = undefined;
      plot.lockedAt = undefined;
      plot.lockToken = undefined;
      mockStore.clearLockTimeout(plotId);
      mockStore.saveToStorage();
      mockStore.broadcast({
        type: 'PLOT_UNLOCKED',
        timestamp: new Date().toISOString(),
        plotId,
        reason: 'PAGE_UNLOAD',
      });
    }
  } catch (e) {
    console.warn('releaseLockSync failed:', e);
  }
}

/**
 * Broadcast non-blocking PLOT_RESERVING status when an admin opens the Reserve form.
 * Other admins can still open their own Reserve form on the same plot (informational only).
 */
export async function startReservingPlot(
  session: AdminSession,
  plotId: string
): Promise<{ ok: boolean; plot?: Plot; error?: string }> {
  mockStore.loadFromStorage();
  const plot = mockStore.plots.find((p) => p.id === plotId);
  if (!plot) return { ok: false, error: 'PLOT_NOT_FOUND' };

  if (!canAccessBlock(session, plot.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE' };
  }

  if (plot.isAdjustment) {
    return { ok: false, error: 'PLOT_UNDER_ADJUSTMENT' };
  }

  if (!plot.reservingUsers) {
    plot.reservingUsers = [];
  }

  const now = Date.now();
  // Filter out any stale reservations older than 10 minutes
  plot.reservingUsers = plot.reservingUsers.filter((u) => now - u.timestamp <= 10 * 60 * 1000);

  const existingIdx = plot.reservingUsers.findIndex((u) => u.adminId === session.adminId);
  if (existingIdx >= 0) {
    plot.reservingUsers[existingIdx].timestamp = now;
    plot.reservingUsers[existingIdx].adminName = session.fullName;
  } else {
    plot.reservingUsers.push({
      adminId: session.adminId,
      adminName: session.fullName,
      timestamp: now,
    });
  }

  plot.reservingBy = session.adminId;
  plot.reservingByName = session.fullName;
  plot.reservingAt = now;

  mockStore.broadcast({
    type: 'PLOT_RESERVING',
    timestamp: new Date().toISOString(),
    plotId: plot.id,
    reservingBy: session.adminId,
    reservingByName: session.fullName,
    reservingUsers: plot.reservingUsers,
  });

  return { ok: true, plot };
}

/**
 * Release/Cancel reserving state when an admin closes the Reserve form without submitting.
 * Maintains other concurrent admins' reserving badges if present.
 */
export async function cancelReservingPlot(
  session: AdminSession,
  plotId: string
): Promise<{ ok: boolean; error?: string }> {
  mockStore.loadFromStorage();
  const plot = mockStore.plots.find((p) => p.id === plotId);
  if (!plot) return { ok: false, error: 'PLOT_NOT_FOUND' };

  if (plot.reservingUsers && plot.reservingUsers.length > 0) {
    plot.reservingUsers = plot.reservingUsers.filter((u) => u.adminId !== session.adminId);
  }

  if (plot.reservingUsers && plot.reservingUsers.length > 0) {
    const latest = plot.reservingUsers[plot.reservingUsers.length - 1];
    plot.reservingBy = latest.adminId;
    plot.reservingByName = latest.adminName;
    plot.reservingAt = latest.timestamp;
  } else {
    plot.reservingUsers = undefined;
    plot.reservingBy = undefined;
    plot.reservingByName = undefined;
    plot.reservingAt = undefined;
  }

  mockStore.broadcast({
    type: 'PLOT_RESERVING_CANCELLED',
    timestamp: new Date().toISOString(),
    plotId: plot.id,
    reservingUsers: plot.reservingUsers,
  });

  return { ok: true };
}

/**
 * Reserve a plot with an admin-adjustable token fee (Sort Reservation, Phase 2).
 */
export async function reservePlot(
  session: AdminSession,
  input: {
    plotId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    tokenFee: number;
    validDays?: number;
    note?: string;
  }
): Promise<{
  ok: boolean;
  reservation?: Reservation;
  plot?: Plot;
  error?: string;
}> {
  mockStore.loadFromStorage();
  if (!session.permissions.can_reserve) {
    return { ok: false, error: 'FORBIDDEN' };
  }

  const plot = mockStore.plots.find((p) => p.id === input.plotId);
  if (!plot) return { ok: false, error: 'PLOT_NOT_FOUND' };

  if (!canAccessBlock(session, plot.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE' };
  }

  if (plot.isAdjustment) {
    return { ok: false, error: 'PLOT_UNDER_ADJUSTMENT' };
  }

  if (plot.category === 'amenity') {
    return { ok: false, error: 'AMENITY_NOT_SELLABLE' };
  }

  if (plot.status === 'booked') {
    return { ok: false, error: 'PLOT_ALREADY_BOOKED' };
  }

  const now = Date.now();
  if (plot.lockedBy && plot.lockedBy !== session.adminId) {
    if (plot.lockedAt && now - plot.lockedAt <= 10 * 60 * 1000) {
      return { ok: false, error: 'LOCKED_BY_ANOTHER' };
    }
  }

  const validUntil = new Date(
    now + (input.validDays || 7) * 24 * 60 * 60 * 1000
  ).toISOString();

  const reservation: Reservation = {
    id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    plotId: plot.id,
    plotNumber: plot.plotNumber,
    blockId: plot.blockId,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerEmail: input.customerEmail.trim(),
    tokenFee: input.tokenFee || 50000,
    validUntil,
    reservedByAdminId: session.adminId,
    reservedByAdminName: session.fullName,
    status: 'active',
    createdAt: new Date().toISOString(),
    resolutionNote: input.note?.trim() || '',
  };

  // Set plot status to reserved & release any soft lock and reserving tracking
  plot.status = 'reserved';
  plot.lockedBy = undefined;
  plot.lockedByName = undefined;
  plot.lockedAt = undefined;
  plot.reservingBy = undefined;
  plot.reservingByName = undefined;
  plot.reservingAt = undefined;
  plot.reservingUsers = undefined;
  mockStore.clearLockTimeout(plot.id);

  mockStore.reservations.push(reservation);

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'PLOT_RESERVED',
    entityType: 'reservation',
    entityId: reservation.id,
    details: `Plot ${plot.plotNumber} reserved for ${reservation.customerName} (Token: PKR ${reservation.tokenFee.toLocaleString()})`,
  });

  mockStore.broadcast({
    type: 'PLOT_RESERVED',
    timestamp: new Date().toISOString(),
    plotId: plot.id,
    reservationId: reservation.id,
  });

  return { ok: true, reservation, plot };
}

/**
 * Commit a Booking (Layer 2 Atomic Commit Guard).
 * Canonical customer creation + isolated payment records generation.
 */
export async function bookPlot(
  session: AdminSession,
  input: {
    plotId: string;
    paymentType: 'one_time' | 'installment';
    customer: {
      fullName: string;
      email: string;
      phone: string;
      cnic?: string;
      fatherOrHusbandName?: string;
      mailingAddress?: string;
      nokName?: string;
      nokCnic?: string;
    };
    reservationId?: string;
  }
): Promise<{
  ok: boolean;
  booking?: Booking;
  plot?: Plot;
  customer?: Customer;
  error?: string;
}> {
  mockStore.loadFromStorage();

  if (!session.permissions.can_book) {
    return { ok: false, error: 'FORBIDDEN' };
  }

  const plot = mockStore.plots.find((p) => p.id === input.plotId);
  if (!plot) return { ok: false, error: 'PLOT_NOT_FOUND' };

  if (!canAccessBlock(session, plot.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE' };
  }

  if (plot.isAdjustment) {
    return { ok: false, error: 'PLOT_UNDER_ADJUSTMENT' };
  }

  if (plot.category === 'amenity') {
    return { ok: false, error: 'AMENITY_NOT_SELLABLE' };
  }

  // Layer 2 Atomic Commit Guard:
  if (plot.status === 'booked') {
    return { ok: false, error: 'ALREADY_BOOKED' };
  }

  const now = Date.now();
  if (plot.lockedBy && plot.lockedBy !== session.adminId) {
    if (plot.lockedAt && now - plot.lockedAt <= 10 * 60 * 1000) {
      return { ok: false, error: 'LOCK_LOST' };
    }
  }

  // Lookup or create customer
  let customer = mockStore.customers.find(
    (c) =>
      (input.customer.email && c.email.toLowerCase() === input.customer.email.toLowerCase()) ||
      (input.customer.phone && c.phone === input.customer.phone) ||
      (input.customer.cnic && c.cnic !== 'Pending' && c.cnic === input.customer.cnic)
  );

  if (!customer) {
    customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      membershipNo: `PV-M-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: input.customer.fullName.trim(),
      fatherOrHusbandName: input.customer.fatherOrHusbandName?.trim() || 'Pending Information',
      cnic: input.customer.cnic?.trim() || 'Pending',
      email: input.customer.email.trim(),
      phone: input.customer.phone.trim(),
      mailingAddress: input.customer.mailingAddress?.trim() || '',
      nokName: input.customer.nokName?.trim() || '',
      nokCnic: input.customer.nokCnic?.trim() || '',
      accountStatus: 'active',
      createdDate: new Date().toISOString().split('T')[0],
      passwordHash: 'password123',
    };
    mockStore.customers.push(customer);
  }

  // Update plot status
  plot.status = 'booked';
  plot.currentOwnerId = customer.id;
  plot.lockedBy = undefined;
  plot.lockedByName = undefined;
  plot.lockedAt = undefined;
  plot.reservingBy = undefined;
  plot.reservingByName = undefined;
  plot.reservingAt = undefined;
  plot.reservingUsers = undefined;
  mockStore.clearLockTimeout(plot.id);

  // Create booking record
  const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const bookingDate = new Date().toISOString().split('T')[0];

  const booking: Booking = {
    id: bookingId,
    customerId: customer.id,
    plotId: plot.id,
    paymentType: input.paymentType,
    status: 'completed',
    bookingDate,
    confirmationDate: bookingDate,
  };
  mockStore.bookings.push(booking);

  // Generate statutory fees (PKR 2,000 Admission, PKR 10,000 Share Subscription)
  const admissionFeeRecord: PaymentRecord = {
    id: `fee-adm-${bookingId}`,
    bookingId,
    plotId: plot.id,
    feeType: 'admission_fee',
    dueDate: bookingDate,
    amount: 2000,
    paidAmount: 2000,
    paidDate: bookingDate,
    status: 'paid',
    transactionRef: `TXN-ADM-${Date.now().toString().slice(-6)}`,
  };

  const shareSubFeeRecord: PaymentRecord = {
    id: `fee-sub-${bookingId}`,
    bookingId,
    plotId: plot.id,
    feeType: 'share_subscription_fee',
    dueDate: bookingDate,
    amount: 10000,
    paidAmount: 10000,
    paidDate: bookingDate,
    status: 'paid',
    transactionRef: `TXN-SUB-${Date.now().toString().slice(-6)}`,
  };

  mockStore.payments.push(admissionFeeRecord, shareSubFeeRecord);

  // Generate plot price payment records
  if (input.paymentType === 'one_time') {
    const oneTimePayment: PaymentRecord = {
      id: `pay-one-${bookingId}`,
      bookingId,
      plotId: plot.id,
      feeType: 'plot_one_time',
      dueDate: bookingDate,
      amount: plot.price,
      paidAmount: plot.price,
      paidDate: bookingDate,
      status: 'paid',
      transactionRef: `TXN-FULL-${Date.now().toString().slice(-6)}`,
    };
    mockStore.payments.push(oneTimePayment);
  } else {
    // 8 equal quarterly installments
    const installmentAmount = Math.round(plot.price / 8);
    const startDate = new Date();

    for (let i = 1; i <= 8; i++) {
      // Due date strictly falls on 5th of the month following booking (Item 2)
      const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + (i * 3), 5);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const isFirst = i === 1;
      const installmentRecord: PaymentRecord = {
        id: `pay-inst-${bookingId}-${i}`,
        bookingId,
        plotId: plot.id,
        feeType: 'plot_installment',
        installmentNumber: i,
        dueDate: dueDateStr,
        amount: installmentAmount,
        paidAmount: isFirst ? installmentAmount : 0,
        paidDate: isFirst ? bookingDate : undefined,
        status: isFirst ? 'paid' : 'pending',
        transactionRef: isFirst ? `TXN-INST-${Date.now().toString().slice(-6)}-1` : undefined,
      };
      mockStore.payments.push(installmentRecord);
    }
  }

  // Resolve reservations on this plot
  const activeReservations = mockStore.reservations.filter(
    (r) => r.plotId === plot.id && r.status === 'active'
  );

  activeReservations.forEach((res) => {
    if (input.reservationId && res.id === input.reservationId) {
      res.status = 'confirmed';
      res.confirmedAt = new Date().toISOString();
      res.confirmedByBookingId = bookingId;
      res.resolutionNote = `Confirmed into booking ${bookingId}`;
    } else {
      res.status = 'superseded';
      res.supersededAt = new Date().toISOString();
      res.supersededByBookingId = bookingId;
      res.resolutionNote = `Superseded by direct purchase commitment ${bookingId}`;
      mockStore.addAuditEntry({
        actorId: session.adminId,
        actorName: session.fullName,
        actorRole: session.role,
        action: 'RESERVATION_SUPERSEDED',
        entityType: 'reservation',
        entityId: res.id,
        details: `Reservation ${res.id} for ${res.customerName} on plot ${plot.plotNumber} superseded by booking ${bookingId}`,
      });
    }
  });

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'PLOT_BOOKED',
    entityType: 'booking',
    entityId: bookingId,
    details: `Committed booking ${bookingId} for plot ${plot.plotNumber} to ${customer.fullName}`,
  });

  // Cross-tab broadcast & Audit Log
  mockStore.broadcast({
    type: 'PLOT_BOOKED',
    timestamp: new Date().toISOString(),
    plotId: plot.id,
    bookingId,
    customerId: customer.id,
  });

  return { ok: true, booking, plot, customer };
}

/**
 * Toggle Master Plan Adjustment (Town Planning Re-Survey Freeze) state on a plot.
 * Super Administrator exclusive capability (strictly no Sub Admin override).
 */
export async function togglePlotAdjustment(
  session: AdminSession,
  plotId: string,
  isAdjustment: boolean,
  reason?: string
): Promise<{ ok: boolean; plot?: Plot; error?: string; message?: string }> {
  mockStore.loadFromStorage();

  if (session.role !== 'super_admin') {
    return {
      ok: false,
      error: 'FORBIDDEN',
      message: 'Only Super Administrators have authority to modify Master Plan plot adjustments.',
    };
  }

  const plot = mockStore.plots.find((p) => p.id === plotId);
  if (!plot) {
    return { ok: false, error: 'PLOT_NOT_FOUND', message: 'Plot not found in Master Plan.' };
  }

  plot.isAdjustment = isAdjustment;
  if (isAdjustment) {
    plot.adjustmentReason = reason?.trim() || 'Town Planning re-survey and boundary adjustment';
    plot.adjustmentDate = new Date().toISOString();
    plot.adjustmentBy = session.fullName;
    // Clear any soft locks or active reserving tracking on this plot
    plot.lockedBy = undefined;
    plot.lockedByName = undefined;
    plot.lockedAt = undefined;
    plot.reservingBy = undefined;
    plot.reservingByName = undefined;
    plot.reservingAt = undefined;
    plot.reservingUsers = undefined;
    mockStore.clearLockTimeout(plot.id);
  } else {
    plot.adjustmentReason = undefined;
    plot.adjustmentDate = undefined;
    plot.adjustmentBy = undefined;
  }

  mockStore.saveToStorage();

  const detailsMsg = isAdjustment
    ? `Plot ${plot.plotNumber} (${plot.blockId}) placed under Administrative Adjustment / Re-Survey Freeze. Reason: ${plot.adjustmentReason}`
    : `Plot ${plot.plotNumber} (${plot.blockId}) released from Administrative Adjustment / Re-Survey Freeze`;

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'PLOT_ADJUSTMENT_TOGGLED',
    entityType: 'plot',
    entityId: plot.id,
    details: detailsMsg,
    newValue: JSON.stringify({ isAdjustment, reason: plot.adjustmentReason }),
  });

  mockStore.broadcast({
    type: 'PLOT_ADJUSTMENT_TOGGLED',
    timestamp: new Date().toISOString(),
    plotId: plot.id,
    isAdjustment,
    reason: plot.adjustmentReason,
  });

  mockStore.broadcast({
    type: 'PLOT_STATUS_CHANGED',
    timestamp: new Date().toISOString(),
    plotId: plot.id,
    newStatus: plot.status,
  });

  return {
    ok: true,
    plot,
    message: isAdjustment
      ? `Plot ${plot.plotNumber} flagged for Master Plan Adjustment.`
      : `Plot ${plot.plotNumber} adjustment hold released.`,
  };
}

/**
 * Super Admin Action: Update Official Plot Price.
 * Modifies the official society inventory price for a plot,
 * synchronizing across the Master Plan Map and customer booking calculations.
 */
export async function updatePlotPrice(
  session: AdminSession,
  plotId: string,
  newPrice: number
): Promise<{ ok: boolean; plot?: Plot; error?: string; message?: string }> {
  mockStore.loadFromStorage();

  if (session.role !== 'super_admin') {
    return {
      ok: false,
      error: 'FORBIDDEN',
      message: 'Only Super Administrator has authority to modify official plot prices.',
    };
  }

  const plot = mockStore.plots.find((p) => p.id === plotId);
  if (!plot) {
    return { ok: false, error: 'NOT_FOUND', message: 'Plot record not found.' };
  }

  const parsedPrice = Number(newPrice);
  if (!parsedPrice || parsedPrice <= 0 || !Number.isFinite(parsedPrice)) {
    return { ok: false, error: 'INVALID_PRICE', message: 'Plot price must be a valid positive amount.' };
  }

  const oldPrice = plot.price;
  plot.price = Math.round(parsedPrice);
  mockStore.saveToStorage();

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'PLOT_PRICE_UPDATED',
    entityType: 'plot',
    entityId: plot.id,
    details: `Super Admin ${session.fullName} updated official price of Plot ${plot.plotNumber} (${plot.blockId}) from PKR ${oldPrice.toLocaleString()} to PKR ${plot.price.toLocaleString()}`,
    newValue: JSON.stringify({ oldPrice, newPrice: plot.price }),
  });

  mockStore.broadcast({
    type: 'PLOT_UPDATED',
    timestamp: new Date().toISOString(),
    plotId: plot.id,
  });

  return {
    ok: true,
    plot,
    message: `Official price for Plot ${plot.plotNumber} successfully updated to PKR ${plot.price.toLocaleString()}.`,
  };
}

