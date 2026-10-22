import { Booking, PaymentType, Plot } from '../mock/types';
import { requireMemberSession } from './auth';
import { handleMemberSessionExpired } from './auth';
import { apiGet } from '../api';
import { computePlotLedger } from '../ledger/plotLedger';
import { fetchWith60sCache } from './apiCache';

export interface EnrichedPlot extends Plot {
  booking: Booking;
  hasPaymentPlan?: boolean;
  billsCount?: number;
  paymentSummary: {
    paymentType: PaymentType;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    percentSettled?: number;
    installmentProgress?: {
      paidCount: number;
      totalCount: number;
      nextDueDate?: string;
      hasOverdue: boolean;
    };
  };
}

export async function getMemberRawPlots(token: string, customerId: string, signal?: AbortSignal): Promise<any[]> {
  const cacheKey = `/me/plots:${customerId}`;
  return fetchWith60sCache(cacheKey, async () => {
    const apiRes = await apiGet<any[]>('/me/plots', token, signal);

    if (!apiRes.ok) {
      if (apiRes.error === 'REQUEST_ABORTED') {
        throw new Error('REQUEST_ABORTED');
      }
      if (apiRes.status === 401) {
        handleMemberSessionExpired();
        throw new Error('MEMBER_SESSION_EXPIRED');
      }
      // Other failure (network, 5xx): throw so caller keeps existing data
      throw new Error(apiRes.error || 'FETCH_FAILED');
    }

    return Array.isArray(apiRes.data) ? apiRes.data : [];
  });
}

export async function getMyPlots(signal?: AbortSignal): Promise<{ ok: boolean; data: EnrichedPlot[]; error?: string }> {
  try {
    const session = requireMemberSession();
    const rawPlots = await getMemberRawPlots(session.token, session.customerId, signal);

    const enrichedPlots: EnrichedPlot[] = rawPlots.map((plot: any) => {
      const apiBooking = plot.bookings && plot.bookings.length > 0 ? plot.bookings[0] : null;
      const booking = apiBooking || {
        id: `book-${plot.id}`,
        customerId: session.customerId,
        plotId: plot.id,
        paymentType: 'installment' as PaymentType,
        status: 'completed' as const,
        bookingDate: new Date().toISOString().split('T')[0],
      };

      const bookingPayments = apiBooking?.payments && Array.isArray(apiBooking.payments)
        ? apiBooking.payments
        : [];

      const computedBillsCount = bookingPayments.filter((p: any) =>
        ['plot_installment', 'plot_one_time', 'plot_downpayment', 'plot_biannual', 'plot_possession'].includes(p.feeType),
      ).length;

      const billsCount = typeof plot.billsCount === 'number'
        ? plot.billsCount
        : (typeof apiBooking?.billsCount === 'number' ? apiBooking.billsCount : computedBillsCount);

      const hasPaymentPlan = typeof plot.hasPaymentPlan === 'boolean'
        ? plot.hasPaymentPlan
        : (typeof apiBooking?.hasPaymentPlan === 'boolean' ? apiBooking.hasPaymentPlan : billsCount > 0);

      const effectivePrice = apiBooking?.installmentPlan?.totalPayment
        ? Number(apiBooking.installmentPlan.totalPayment)
        : plot.price;
      const ledger = computePlotLedger(effectivePrice, bookingPayments);

      let installmentProgress = undefined;
      if (booking.paymentType === 'installment' && hasPaymentPlan && billsCount > 0) {
        const installments = bookingPayments.filter((p: any) => p.feeType === 'plot_installment');
        const paidCount = installments.filter((p: any) => p.status === 'paid').length;
        const totalCount = installments.length;
        const hasOverdue = installments.some((p: any) => p.status === 'overdue');
        const nextPending = installments.find((p: any) => p.status === 'pending' || p.status === 'overdue' || p.status === 'partially_paid');

        installmentProgress = {
          paidCount,
          totalCount,
          nextDueDate: nextPending?.dueDate ? new Date(nextPending.dueDate).toISOString().split('T')[0] : undefined,
          hasOverdue,
        };
      }

      return {
        ...plot,
        hasPaymentPlan,
        billsCount,
        price: ledger.totalPlotPrice,
        booking: {
          ...booking,
          hasPaymentPlan,
          billsCount,
        },
        paymentSummary: {
          paymentType: booking.paymentType,
          totalAmount: hasPaymentPlan && billsCount > 0 ? ledger.totalPlotPrice : 0,
          paidAmount: hasPaymentPlan && billsCount > 0 ? ledger.totalPaidToDate : 0,
          remainingAmount: hasPaymentPlan && billsCount > 0 ? ledger.remainingBalance : 0,
          percentSettled: hasPaymentPlan && billsCount > 0 ? ledger.percentSettled : 0,
          installmentProgress,
        },
      };
    });

    return { ok: true, data: enrichedPlots };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'MEMBER_SESSION_EXPIRED') {
      return { ok: false, data: [], error: 'UNAUTHORIZED' };
    }
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      handleMemberSessionExpired();
      return { ok: false, data: [], error: 'UNAUTHORIZED' };
    }
    if (err instanceof Error && err.message === 'REQUEST_ABORTED') {
      return { ok: false, data: [], error: 'REQUEST_ABORTED' };
    }
    return { ok: false, data: [], error: 'FETCH_FAILED' };
  }
}

export async function getPlotDetails(
  plotId: string
): Promise<{ ok: boolean; data?: EnrichedPlot; error?: string }> {
  try {
    const res = await getMyPlots();
    if (!res.ok) {
      return { ok: false, error: res.error };
    }

    const plot = res.data.find((p) => p.id === plotId || p.plotNumber === plotId);
    if (!plot) {
      return { ok: false, error: 'NOT_FOUND' };
    }

    return { ok: true, data: plot };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return { ok: false, error: 'UNAUTHORIZED' };
    }
    return { ok: false, error: 'UNKNOWN_ERROR' };
  }
}
