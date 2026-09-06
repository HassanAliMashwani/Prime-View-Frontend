import { mockStore } from '../mock/store';
import { PaymentRecord, PaymentStatus, PaymentType } from '../mock/types';
import { requireMemberSession } from './auth';

export interface PlotPaymentSchedule {
  plotId: string;
  plotNumber: string;
  blockId: string;
  blockName: string;
  size: string;
  paymentType: PaymentType;
  totalPrice: number;
  paidAmount: number;
  remainingBalance: number;
  admissionFee?: PaymentRecord;
  shareSubscriptionFee?: PaymentRecord;
  schedule: PaymentRecord[];
}

export interface PaymentTransaction {
  id: string;
  date: string;
  plotId: string;
  plotNumber: string;
  description: string;
  amount: number;
  status: PaymentStatus;
  transactionRef?: string;
}

export async function getPaymentSchedule(
  plotId?: string
): Promise<{ ok: boolean; data: PlotPaymentSchedule[]; error?: string }> {
  try {
    const session = requireMemberSession();

    // Get bookings belonging to this member
    let userBookings = mockStore.bookings.filter((b) => b.customerId === session.customerId);

    // If specific plotId requested, verify ownership (Exception 5.4)
    if (plotId && plotId !== 'all') {
      userBookings = userBookings.filter((b) => b.plotId === plotId);
      if (userBookings.length === 0) {
        return { ok: false, data: [], error: 'NOT_FOUND' };
      }
    }

    const schedules: PlotPaymentSchedule[] = [];

    for (const booking of userBookings) {
      const plot = mockStore.plots.find((p) => p.id === booking.plotId);
      if (!plot) continue;

      const block = mockStore.blocks.find((b) => b.id === plot.blockId);

      // Scoped strictly to this booking (Exception 5.6)
      const bookingPayments = mockStore.payments.filter((p) => p.bookingId === booking.id);

      // Separate fixed statutory fees (PKR 2,000 + PKR 10,000, Section 2.5) from plot price
      const admissionFee = bookingPayments.find((p) => p.feeType === 'admission_fee');
      const shareSubscriptionFee = bookingPayments.find((p) => p.feeType === 'share_subscription_fee');

      // Plot price payments only - NEVER merge admission/share fees into plot total
      const plotPricePayments = bookingPayments.filter(
        (p) => p.feeType === 'plot_installment' || p.feeType === 'plot_one_time'
      );

      const paidAmount = plotPricePayments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.paidAmount, 0);

      const totalPrice = plot.price;
      const remainingBalance = Math.max(0, totalPrice - paidAmount);

      schedules.push({
        plotId: plot.id,
        plotNumber: plot.plotNumber,
        blockId: String(plot.blockId),
        blockName: block?.name || 'Block',
        size: plot.size,
        paymentType: booking.paymentType,
        totalPrice,
        paidAmount,
        remainingBalance,
        admissionFee,
        shareSubscriptionFee,
        schedule: plotPricePayments.sort((a, b) => {
          if (a.installmentNumber && b.installmentNumber) {
            return a.installmentNumber - b.installmentNumber;
          }
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }),
      });
    }

    return { ok: true, data: schedules };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return { ok: false, data: [], error: 'UNAUTHORIZED' };
    }
    return { ok: false, data: [], error: 'UNKNOWN_ERROR' };
  }
}

export async function getPaymentHistory(
  filterPlotId?: string
): Promise<{ ok: boolean; data: PaymentTransaction[]; error?: string }> {
  try {
    const session = requireMemberSession();
    let userBookings = mockStore.bookings.filter((b) => b.customerId === session.customerId);

    if (filterPlotId && filterPlotId !== 'all') {
      userBookings = userBookings.filter((b) => b.plotId === filterPlotId);
      if (userBookings.length === 0) {
        return { ok: false, data: [], error: 'NOT_FOUND' };
      }
    }

    const transactions: PaymentTransaction[] = [];

    for (const booking of userBookings) {
      const plot = mockStore.plots.find((p) => p.id === booking.plotId);
      const plotNumber = plot ? plot.plotNumber : 'Unknown';

      const bookingPayments = mockStore.payments.filter((p) => p.bookingId === booking.id);

      for (const payment of bookingPayments) {
        // Only include paid records in transaction history, or records with a transaction reference
        if (payment.status === 'paid' || payment.transactionRef) {
          let desc = 'Plot Payment';
          if (payment.feeType === 'admission_fee') {
            desc = 'Admission Fee';
          } else if (payment.feeType === 'share_subscription_fee') {
            desc = 'Share Subscription Fee';
          } else if (payment.feeType === 'plot_installment' && payment.installmentNumber) {
            desc = `Installment #${payment.installmentNumber} Payment`;
          } else if (payment.feeType === 'plot_one_time') {
            desc = 'Full / One-Time Payment';
          } else if (booking.paymentType === 'installment' && payment.installmentNumber) {
            desc = `Installment #${payment.installmentNumber} Payment`;
          } else {
            desc = 'Full / One-Time Payment';
          }

          transactions.push({
            id: payment.id,
            date: payment.paidDate || payment.dueDate,
            plotId: payment.plotId,
            plotNumber,
            description: desc,
            amount: payment.paidAmount || payment.amount,
            status: payment.status,
            transactionRef: payment.transactionRef,
          });
        }
      }
    }

    // Sort transactions descending by date
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { ok: true, data: transactions };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return { ok: false, data: [], error: 'UNAUTHORIZED' };
    }
    return { ok: false, data: [], error: 'UNKNOWN_ERROR' };
  }
}
