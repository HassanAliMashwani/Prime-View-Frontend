import { Booking, PaymentType, Plot } from '../mock/types';
import { requireMemberSession } from './auth';
import { apiGet } from '../api';

export interface EnrichedPlot extends Plot {
  booking: Booking;
  paymentSummary: {
    paymentType: PaymentType;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    installmentProgress?: {
      paidCount: number;
      totalCount: number;
      nextDueDate?: string;
      hasOverdue: boolean;
    };
  };
}

export async function getMyPlots(): Promise<{ ok: boolean; data: EnrichedPlot[]; error?: string }> {
  try {
    const session = requireMemberSession();
    const apiRes = await apiGet<any[]>('/me/plots', session.token);

    if (!apiRes.ok || !Array.isArray(apiRes.data)) {
      return { ok: false, data: [], error: apiRes.error || 'FETCH_FAILED' };
    }

    const enrichedPlots: EnrichedPlot[] = apiRes.data.map((plot: any) => {
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

      // All paid PaymentRecords (including statutory fees)
      const allPaidAmount = bookingPayments
        .filter((p: any) => p.status === 'paid')
        .reduce((sum: number, p: any) => sum + (Number(p.paidAmount) || Number(p.amount) || 0), 0);

      // Plot-only payments for remaining balance calculation
      const plotPricePaid = bookingPayments
        .filter((p: any) => p.status === 'paid' && (p.feeType === 'plot_installment' || p.feeType === 'plot_one_time' || p.feeType === 'plot_downpayment'))
        .reduce((sum: number, p: any) => sum + (Number(p.paidAmount) || Number(p.amount) || 0), 0);

      const totalAmount = Number(plot.price) || 0;
      const remainingAmount = Math.max(0, totalAmount - plotPricePaid);

      let installmentProgress = undefined;
      if (booking.paymentType === 'installment') {
        const installments = bookingPayments.filter((p: any) => p.feeType === 'plot_installment');
        const paidCount = installments.filter((p: any) => p.status === 'paid').length;
        const totalCount = installments.length;
        const hasOverdue = installments.some((p: any) => p.status === 'overdue');
        const nextPending = installments.find((p: any) => p.status === 'pending' || p.status === 'overdue');

        installmentProgress = {
          paidCount,
          totalCount,
          nextDueDate: nextPending?.dueDate ? new Date(nextPending.dueDate).toISOString().split('T')[0] : undefined,
          hasOverdue,
        };
      }

      return {
        ...plot,
        price: totalAmount,
        booking,
        paymentSummary: {
          paymentType: booking.paymentType,
          totalAmount,
          paidAmount: allPaidAmount,
          remainingAmount,
          installmentProgress,
        },
      };
    });

    return { ok: true, data: enrichedPlots };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return { ok: false, data: [], error: 'UNAUTHORIZED' };
    }
    return { ok: false, data: [], error: 'UNKNOWN_ERROR' };
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
