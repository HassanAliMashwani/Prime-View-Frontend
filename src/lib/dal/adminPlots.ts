import { AdminSession, Block, Plot, Booking, Customer, Reservation } from '../mock/types';
import { canAccessBlock } from './adminAuth';
import { apiGet, apiPost, apiDelete, API_BASE_URL } from '../api';
import { setRegisteredPlotsCache } from './customers';

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

/**
 * Level 1 Master Plan blocks view via real API (GET /blocks).
 * Super Admins see all blocks.
 * Sub Admins strictly see their assigned blocks (Exception 5.4).
 */
export async function getAdminMasterPlanBlocks(session: AdminSession): Promise<{
  ok: boolean;
  blocks: BlockSummary[];
  error?: string;
}> {
  const apiRes = await apiGet<any[]>('/blocks', session?.token);
  if (!apiRes.ok || !Array.isArray(apiRes.data)) {
    return { ok: false, blocks: [], error: apiRes.error || 'Failed to fetch blocks' };
  }

  const accessibleBlocks = apiRes.data.filter((b) => canAccessBlock(session, b.id));
  const summaries: BlockSummary[] = accessibleBlocks.map((block: any) => {
    return {
      id: block.id,
      name: block.name,
      description: block.description || '',
      totalPlots: block.totalPlots || 0,
      amenities:
        block.amenities && block.amenities.length > 0
          ? block.amenities
          : ['Central Park', 'Community Mosque'],
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

/**
 * Level 2 Block detail with plot grid via real API (GET /plots?blockId=...).
 * Out-of-scope block requests are strictly rejected (Exception 5.4).
 */
export async function getAdminAllPlots(session: AdminSession): Promise<{
  ok: boolean;
  plots?: Plot[];
  error?: string;
}> {
  const apiRes = await apiGet<any[]>('/plots', session?.token);
  if (!apiRes.ok || !Array.isArray(apiRes.data)) {
    return { ok: false, error: apiRes.error || 'Failed to fetch all plots' };
  }

  const plots: Plot[] = apiRes.data.map((p: any) => ({
    ...p,
    price: Number(p.price) || 0,
    dimensions: p.dimensions || '',
  }));

  return { ok: true, plots };
}

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

  // Fetch block info from /blocks
  const blocksRes = await apiGet<any[]>('/blocks', session?.token);
  let block: Block | undefined = undefined;
  if (blocksRes.ok && Array.isArray(blocksRes.data)) {
    const rawBlock = blocksRes.data.find((b: any) => b.id === blockId);
    if (rawBlock) {
      block = {
        id: rawBlock.id,
        name: rawBlock.name,
        description: rawBlock.description || '',
        totalPlots: rawBlock.totalPlots || 0,
        amenities: rawBlock.amenities || ['Central Park', 'Community Mosque'],
      };
    }
  }

  const apiRes = await apiGet<any[]>(`/plots?blockId=${blockId}`, session?.token);
  if (!apiRes.ok || !Array.isArray(apiRes.data)) {
    return { ok: false, error: apiRes.error || 'Failed to fetch plots' };
  }

  let plots: Plot[] = apiRes.data.map((p: any) => ({
    ...p,
    price: Number(p.price) || 0,
  }));

  // Update in-memory cache for synchronous plot checks
  setRegisteredPlotsCache(plots);

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
  const apiRes = await apiGet<any>(`/plots/${plotId}`, session?.token);
  if (!apiRes.ok || !apiRes.data) {
    if (apiRes.error === 'OUT_OF_SCOPE' || apiRes.status === 403) {
      return { ok: false, error: 'OUT_OF_SCOPE' };
    }
    if (apiRes.status === 404) {
      return { ok: false, error: 'PLOT_NOT_FOUND' };
    }
    return { ok: false, error: apiRes.error || 'PLOT_NOT_FOUND' };
  }

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
    const custRes = await apiGet<any>(`/customers/${plot.currentOwnerId}`, session?.token);
    if (custRes.ok && custRes.data) {
      owner = custRes.data;
      const ownerAny = owner as any;
      if (ownerAny && Array.isArray(ownerAny.bookings)) {
        booking = ownerAny.bookings.find((b: any) => b.plotId === plotId);
      }
    }
  }

  return { ok: true, plot, reservations, owner, booking };
}

/**
 * Acquire a 10-minute soft lock on a plot for booking (Layer 1 Soft Lock).
 */
export async function acquireLock(
  session: AdminSession,
  plotId: string
): Promise<{
  ok: boolean;
  plot?: Plot;
  lockToken?: string;
  error?: string;
  reason?: string;
  lockedBy?: string;
  lockedByName?: string;
  message?: string;
}> {
  const res = await apiPost<any>(`/plots/${plotId}/lock`, {}, session?.token);
  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error,
      reason: res.error,
      lockedBy: res.data?.lockedBy,
      lockedByName: res.data?.lockedByName,
      message: res.error || 'Failed to acquire plot lock.',
    };
  }

  return {
    ok: true,
    plot: {
      ...res.data.plot,
      price: Number(res.data.plot?.price) || 0,
    },
    lockToken: res.data.lockToken,
    lockedBy: res.data.plot?.lockedBy,
  };
}

/**
 * Release an active soft lock on a plot.
 */
export async function releaseLock(
  session: AdminSession,
  plotId: string
): Promise<{
  ok: boolean;
  plot?: Plot;
  error?: string;
  message?: string;
}> {
  const res = await apiDelete<any>(`/plots/${plotId}/lock`, session?.token);
  if (!res.ok) {
    return {
      ok: false,
      error: res.error,
      message: res.error || 'Failed to release lock.',
    };
  }

  return {
    ok: true,
    plot: res.data?.plot
      ? { ...res.data.plot, price: Number(res.data.plot.price) || 0 }
      : undefined,
  };
}

/**
 * Synchronous / fire-and-forget lock release on page navigation or modal dismiss.
 */
export function releaseLockSync(plotId: string, adminId: string): void {
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      fetch(`${API_BASE_URL}/plots/${plotId}/lock`, {
        method: 'DELETE',
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Ignore background unload failure
    }
  }
}

/**
 * Helper: Start reserving a plot by acquiring lock first.
 */
export async function startReservingPlot(
  session: AdminSession,
  plotId: string
): Promise<{
  ok: boolean;
  plot?: Plot;
  lockToken?: string;
  error?: string;
  message?: string;
}> {
  return acquireLock(session, plotId);
}

/**
 * Helper: Cancel reserving a plot by releasing lock.
 */
export async function cancelReservingPlot(
  session: AdminSession,
  plotId: string
): Promise<{
  ok: boolean;
  plot?: Plot;
  error?: string;
  message?: string;
}> {
  return releaseLock(session, plotId);
}

/**
 * Reserve a Plot (POST /plots/:id/reserve).
 * Accepts either (session, plotId, data) or (session, { plotId, ...data }).
 */
export async function reservePlot(
  session: AdminSession,
  plotIdOrInput:
    | string
    | {
        plotId: string;
        customerName: string;
        customerPhone: string;
        customerEmail?: string;
        tokenFee?: number;
        validDays?: number;
        note?: string;
        customerId?: string;
      },
  data?: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    tokenFee?: number;
    validDays?: number;
    note?: string;
    customerId?: string;
  }
): Promise<{
  ok: boolean;
  reservation?: Reservation;
  plot?: Plot;
  error?: string;
  reason?: string;
  message?: string;
}> {
  const plotId = typeof plotIdOrInput === 'string' ? plotIdOrInput : plotIdOrInput.plotId;
  const payload = typeof plotIdOrInput === 'string' ? data : plotIdOrInput;

  const res = await apiPost<any>(`/plots/${plotId}/reserve`, payload, session?.token);
  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error,
      reason: res.error,
      message: res.error || 'Failed to reserve plot.',
    };
  }

  return {
    ok: true,
    reservation: {
      ...res.data.reservation,
      tokenFee: Number(res.data.reservation?.tokenFee) || 0,
    },
    plot: {
      ...res.data.plot,
      price: Number(res.data.plot?.price) || 0,
    },
  };
}

/**
 * Book a Plot (POST /plots/:id/book).
 * Accepts either (session, plotId, data) or (session, { plotId, ...data }).
 */
export async function bookPlot(
  session: AdminSession,
  plotIdOrInput: string | ({ plotId: string } & Record<string, any>),
  data?: any
): Promise<{
  ok: boolean;
  booking?: Booking;
  plot?: Plot;
  customer?: Customer;
  error?: string;
  reason?: string;
  message?: string;
}> {
  const plotId = typeof plotIdOrInput === 'string' ? plotIdOrInput : plotIdOrInput.plotId;
  const payload = typeof plotIdOrInput === 'string' ? data : plotIdOrInput;

  const res = await apiPost<any>(`/plots/${plotId}/book`, payload, session?.token);
  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error,
      reason: res.error,
      message: res.error || 'Failed to book plot.',
    };
  }

  return {
    ok: true,
    booking: res.data.booking,
    plot: {
      ...res.data.plot,
      price: Number(res.data.plot?.price) || 0,
    },
    customer: res.data.customer,
  };
}

/**
 * Toggle Master Plan Adjustment (POST /plots/:id/adjustment).
 */
export async function togglePlotAdjustment(
  session: AdminSession,
  plotId: string,
  isAdjustment: boolean,
  reason?: string
): Promise<{
  ok: boolean;
  plot?: Plot;
  error?: string;
  message?: string;
}> {
  const res = await apiPost<any>(
    `/plots/${plotId}/adjustment`,
    { isAdjustment, reason },
    session?.token
  );

  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error,
      message: res.error || 'Failed to update plot adjustment status.',
    };
  }

  return {
    ok: true,
    plot: {
      ...res.data.plot,
      price: Number(res.data.plot?.price) || 0,
    },
    message: res.data.message,
  };
}

/**
 * Deferred per user requirement: Super Admin plot price update.
 */
export async function updatePlotPrice(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _session: AdminSession,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _plotId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _newPrice: number
): Promise<{
  ok: boolean;
  plot?: Plot;
  error?: string;
  message?: string;
}> {
  return {
    ok: false,
    error: 'NOT_YET_IMPLEMENTED',
    message: 'Plot price editing is deferred and not yet available on the backend.',
  };
}
