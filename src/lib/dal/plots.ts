import { mockStore } from '../mock/store';
import { Booking, PaymentType, Plot } from '../mock/types';
import { requireMemberSession } from './auth';

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
    // Resolve bookings belonging to this customer only
    const userBookings = mockStore.bookings.filter((b) => b.customerId === session.customerId);

    const enrichedPlots: EnrichedPlot[] = [];

    for (const booking of userBookings) {
      const plot = mockStore.plots.find((p) => p.id === booking.plotId);
      if (!plot) continue;

      // Scoped strictly to this booking's payments (Exception 5.6)
      const bookingPayments = mockStore.payments.filter((p) => p.bookingId === booking.id);
      const paidAmount = bookingPayments
        .filter((p) => p.status === 'paid' && (p.feeType === 'plot_installment' || p.feeType === 'plot_one_time'))
        .reduce((sum, p) => sum + p.paidAmount, 0);

      const totalAmount = plot.price;
      const remainingAmount = Math.max(0, totalAmount - paidAmount);

      let installmentProgress = undefined;
      if (booking.paymentType === 'installment') {
        const installments = bookingPayments.filter((p) => p.feeType === 'plot_installment');
        const paidCount = installments.filter((p) => p.status === 'paid').length;
        const totalCount = installments.length;
        const hasOverdue = installments.some((p) => p.status === 'overdue');
        const nextPending = installments.find((p) => p.status === 'pending' || p.status === 'overdue');

        installmentProgress = {
          paidCount,
          totalCount,
          nextDueDate: nextPending?.dueDate,
          hasOverdue,
        };
      }

      enrichedPlots.push({
        ...plot,
        booking: { ...booking },
        paymentSummary: {
          paymentType: booking.paymentType,
          totalAmount,
          paidAmount,
          remainingAmount,
          installmentProgress,
        },
      });
    }

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
    const session = requireMemberSession();

    // Verify ownership: customer owns the booking for this plot (Exception 5.4)
    const booking = mockStore.bookings.find(
      (b) => b.plotId === plotId && b.customerId === session.customerId
    );

    if (!booking) {
      // Return NOT_FOUND to avoid leaking whether the plot exists or belongs to someone else
      return { ok: false, error: 'NOT_FOUND' };
    }

    const plot = mockStore.plots.find((p) => p.id === plotId);
    if (!plot) {
      return { ok: false, error: 'NOT_FOUND' };
    }

    const bookingPayments = mockStore.payments.filter((p) => p.bookingId === booking.id);
    const paidAmount = bookingPayments
      .filter((p) => p.status === 'paid' && (p.feeType === 'plot_installment' || p.feeType === 'plot_one_time'))
      .reduce((sum, p) => sum + p.paidAmount, 0);

    const totalAmount = plot.price;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    let installmentProgress = undefined;
    if (booking.paymentType === 'installment') {
      const installments = bookingPayments.filter((p) => p.feeType === 'plot_installment');
      const paidCount = installments.filter((p) => p.status === 'paid').length;
      const totalCount = installments.length;
      const hasOverdue = installments.some((p) => p.status === 'overdue');
      const nextPending = installments.find((p) => p.status === 'pending' || p.status === 'overdue');

      installmentProgress = {
        paidCount,
        totalCount,
        nextDueDate: nextPending?.dueDate,
        hasOverdue,
      };
    }

    return {
      ok: true,
      data: {
        ...plot,
        booking: { ...booking },
        paymentSummary: {
          paymentType: booking.paymentType,
          totalAmount,
          paidAmount,
          remainingAmount,
          installmentProgress,
        },
      },
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return { ok: false, error: 'UNAUTHORIZED' };
    }
    return { ok: false, error: 'UNKNOWN_ERROR' };
  }
}
