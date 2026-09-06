import { mockStore } from '../mock/store';
import { AdminSession, Block, Plot, Booking, Customer, PaymentRecord, Reservation } from '../mock/types';
import { canAccessBlock } from './adminAuth';

export interface BlockSummary extends Block {
  totalCount: number;
  availableCount: number;
  reservedCount: number;
  bookedCount: number;
  amenityCount: number;
}

export interface PlotFilterOptions {
  search?: string;
  status?: 'all' | 'available' | 'reserved' | 'booked';
  category?: 'all' | 'residential' | 'commercial' | 'farm_house' | 'amenity';
}

/**
 * Level 1 Master Plan blocks view.
 * Super Admins see all 8 blocks.
 * Sub Admins strictly see their assigned blocks (Exception 5.4).
 */
export async function getAdminMasterPlanBlocks(session: AdminSession): Promise<{
  ok: boolean;
  blocks: BlockSummary[];
  error?: string;
}> {
  mockStore.cleanExpiredLocks();

  const accessibleBlocks = mockStore.blocks.filter((b) => canAccessBlock(session, b.id));

  const summaries: BlockSummary[] = accessibleBlocks.map((block) => {
    const blockPlots = mockStore.plots.filter((p) => p.blockId === block.id);
    const availableCount = blockPlots.filter((p) => p.status === 'available' && p.category !== 'amenity').length;
    const reservedCount = blockPlots.filter((p) => p.status === 'reserved').length;
    const bookedCount = blockPlots.filter((p) => p.status === 'booked' && p.category !== 'amenity').length;
    const amenityCount = blockPlots.filter((p) => p.category === 'amenity').length;

    return {
      ...block,
      totalCount: blockPlots.length,
      availableCount,
      reservedCount,
      bookedCount,
      amenityCount,
    };
  });

  return { ok: true, blocks: summaries };
}

/**
 * Level 2 Block detail with plot grid.
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
  if (!block) {
    return { ok: false, error: 'BLOCK_NOT_FOUND' };
  }

  let plots = mockStore.plots.filter((p) => p.blockId === blockId);

  if (filters?.search) {
    const s = filters.search.trim().toLowerCase();
    plots = plots.filter(
      (p) =>
        p.plotNumber.toLowerCase().includes(s) ||
        p.size.toLowerCase().includes(s) ||
        (p.amenityName && p.amenityName.toLowerCase().includes(s))
    );
  }

  if (filters?.status && filters.status !== 'all') {
    plots = plots.filter((p) => p.status === filters.status);
  }

  if (filters?.category && filters.category !== 'all') {
    plots = plots.filter((p) => p.category === filters.category);
  }

  return { ok: true, block, plots };
}

/**
 * Get full administrative plot details including lock status and active reservations.
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
  plot.lockedBy = session.adminId;
  plot.lockedByName = session.fullName;
  plot.lockedAt = now;

  mockStore.scheduleLockTimeout(plotId, 10 * 60 * 1000);

  mockStore.broadcast({
    type: 'PLOT_LOCKED',
    timestamp: new Date().toISOString(),
    plotId,
    lockedBy: session.adminId,
    lockedByName: session.fullName,
  });

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'PLOT_LOCK_ACQUIRED',
    entityType: 'lock',
    entityId: plotId,
    details: `Admin ${session.fullName} acquired 10m booking lock on ${plot.plotNumber}`,
  });

  return { ok: true, plot };
}

/**
 * Release an acquired soft lock manually.
 */
export async function releaseLock(
  session: AdminSession,
  plotId: string
): Promise<{ ok: boolean; error?: string }> {
  const plot = mockStore.plots.find((p) => p.id === plotId);
  if (!plot) return { ok: false, error: 'PLOT_NOT_FOUND' };

  if (plot.lockedBy === session.adminId || session.role === 'super_admin') {
    plot.lockedBy = undefined;
    plot.lockedByName = undefined;
    plot.lockedAt = undefined;
    mockStore.clearLockTimeout(plotId);

    mockStore.broadcast({
      type: 'PLOT_UNLOCKED',
      timestamp: new Date().toISOString(),
      plotId,
      reason: 'MANUAL_RELEASE',
    });

    mockStore.addAuditEntry({
      actorId: session.adminId,
      actorName: session.fullName,
      actorRole: session.role,
      action: 'PLOT_LOCK_RELEASED',
      entityType: 'lock',
      entityId: plotId,
      details: `Lock released on ${plot.plotNumber}`,
    });

    return { ok: true };
  }

  return { ok: false, error: 'NOT_LOCK_HOLDER' };
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
  if (!session.permissions.can_reserve) {
    return { ok: false, error: 'FORBIDDEN' };
  }

  const plot = mockStore.plots.find((p) => p.id === input.plotId);
  if (!plot) return { ok: false, error: 'PLOT_NOT_FOUND' };

  if (!canAccessBlock(session, plot.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE' };
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

  // Set plot status to reserved & release any soft lock
  plot.status = 'reserved';
  plot.lockedBy = undefined;
  plot.lockedByName = undefined;
  plot.lockedAt = undefined;
  mockStore.clearLockTimeout(plot.id);

  mockStore.reservations.push(reservation);

  mockStore.broadcast({
    type: 'PLOT_RESERVED',
    timestamp: new Date().toISOString(),
    plotId: plot.id,
    reservationId: reservation.id,
  });

  mockStore.addAuditEntry({
    actorId: session.adminId,
    actorName: session.fullName,
    actorRole: session.role,
    action: 'PLOT_RESERVED',
    entityType: 'reservation',
    entityId: reservation.id,
    details: `Plot ${plot.plotNumber} reserved for ${reservation.customerName} (Token: PKR ${reservation.tokenFee.toLocaleString()})`,
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
  if (!session.permissions.can_book) {
    return { ok: false, error: 'FORBIDDEN' };
  }

  const plot = mockStore.plots.find((p) => p.id === input.plotId);
  if (!plot) return { ok: false, error: 'PLOT_NOT_FOUND' };

  if (!canAccessBlock(session, plot.blockId)) {
    return { ok: false, error: 'OUT_OF_SCOPE' };
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
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + (i - 1) * 3);
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
    }
  });

  // Cross-tab broadcast & Audit Log
  mockStore.broadcast({
    type: 'PLOT_BOOKED',
    timestamp: new Date().toISOString(),
    plotId: plot.id,
    bookingId,
    customerId: customer.id,
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

  return { ok: true, booking, plot, customer };
}
