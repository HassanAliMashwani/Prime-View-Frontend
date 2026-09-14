import { mockStore } from '../mock/store';
import { PaymentRecord, PaymentStatus, PaymentType } from '../mock/types';
import { requireMemberSession } from './auth';
import { apiGet } from '../api';

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
  downpaymentFee?: PaymentRecord;
  installmentPlan?: import('../mock/types').InstallmentPlanConfig;
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
    mockStore.loadFromStorage();
    const session = requireMemberSession();

    // Primary: Real Backend API call (GET /me/payments)
    let apiPayments: any[] | null = null;
    if (session.token) {
      const apiRes = await apiGet<any[]>('/me/payments', session.token);
      if (apiRes.ok && Array.isArray(apiRes.data)) {
        apiPayments = apiRes.data;
      }
    }

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

      // Scoped strictly to this booking (Exception 5.6) - uses real API payments when available
      const bookingPayments = apiPayments
        ? apiPayments
            .filter((p) => p.bookingId === booking.id)
            .map((p) => ({
              ...p,
              amount: Number(p.amount) || 0,
              paidAmount: Number(p.paidAmount) || 0,
            }))
        : mockStore.payments.filter((p) => p.bookingId === booking.id);

      // Separate fixed statutory fees (PKR 2,000 + PKR 10,000, Section 2.5) from plot price
      const admissionFee = bookingPayments.find((p) => p.feeType === 'admission_fee');
      const shareSubscriptionFee = bookingPayments.find((p) => p.feeType === 'share_subscription_fee');
      const downpaymentFee = bookingPayments.find((p) => p.feeType === 'plot_downpayment');

      // Plot price payments only - NEVER merge admission/share fees into plot total
      const plotPricePayments = bookingPayments.filter(
        (p) => p.feeType === 'plot_installment' || p.feeType === 'plot_one_time' || p.feeType === 'plot_downpayment'
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
        downpaymentFee,
        installmentPlan: booking.installmentPlan,
        schedule: plotPricePayments.sort((a, b) => {
          const numA = a.installmentNumber ?? (a.feeType === 'plot_downpayment' ? 0 : 999);
          const numB = b.installmentNumber ?? (b.feeType === 'plot_downpayment' ? 0 : 999);
          if (numA !== numB) {
            return numA - numB;
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
    mockStore.loadFromStorage();
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
          } else if (payment.feeType === 'plot_downpayment') {
            desc = 'Plot Upfront Downpayment';
          } else if (payment.feeType === 'plot_installment' && payment.installmentNumber) {
            desc = `Installment #${payment.installmentNumber} Payment`;
          } else if (payment.feeType === 'plot_one_time') {
            desc = 'Full Payment';
          } else if (booking.paymentType === 'installment' && payment.installmentNumber) {
            desc = `Installment #${payment.installmentNumber} Payment`;
          } else {
            desc = 'Full Payment';
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

export interface BookingProgressData {
  paymentType: PaymentType;
  percent: number;
  paidInstallments?: number;
  totalInstallments?: number;
  paidAmount: number;
  totalAmount: number;
  remainingAmount: number;
  isCompleted: boolean;
}

/**
 * Derive exact real-time progress from PaymentRecord data.
 * - installment: paid installments / total installments
 * - full payment: paidAmount vs amount
 * Clamped strictly between 0 and 100 without hardcoded values.
 */
export function getBookingProgress(bookingId: string): BookingProgressData {
  mockStore.loadFromStorage();
  const booking = mockStore.bookings.find((b) => b.id === bookingId);
  const plot = booking ? mockStore.plots.find((p) => p.id === booking.plotId) : undefined;
  const payments = mockStore.payments.filter((p) => p.bookingId === bookingId);

  const totalAmount = plot?.price || 0;
  const paidAmount = payments
    .filter((p) => p.status === 'paid' && (p.feeType === 'plot_installment' || p.feeType === 'plot_one_time' || p.feeType === 'plot_downpayment'))
    .reduce((sum, p) => sum + (p.paidAmount || 0), 0);

  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  if (booking?.paymentType === 'installment') {
    const installments = payments.filter((p) => p.feeType === 'plot_installment');
    const totalInstallments = installments.length;
    const paidInstallments = installments.filter((p) => p.status === 'paid').length;
    const percent = totalInstallments > 0 ? Math.min(100, Math.max(0, Math.round((paidInstallments / totalInstallments) * 100))) : 0;

    return {
      paymentType: 'installment',
      percent,
      paidInstallments,
      totalInstallments,
      paidAmount,
      totalAmount,
      remainingAmount,
      isCompleted: paidInstallments === totalInstallments && totalInstallments > 0,
    };
  }

  // Full Payment / One-Time
  const percent = totalAmount > 0 ? Math.min(100, Math.max(0, Math.round((paidAmount / totalAmount) * 100))) : 0;
  return {
    paymentType: booking?.paymentType || 'one_time',
    percent,
    paidAmount,
    totalAmount,
    remainingAmount,
    isCompleted: paidAmount >= totalAmount && totalAmount > 0,
  };
}

export function getCustomerPortfolioProgress(customerId: string): {
  totalPlots: number;
  totalVolume: number;
  totalPaid: number;
  overallPercent: number;
} {
  mockStore.loadFromStorage();
  const bookings = mockStore.bookings.filter((b) => b.customerId === customerId);
  let totalVolume = 0;
  let totalPaid = 0;

  for (const b of bookings) {
    const prog = getBookingProgress(b.id);
    totalVolume += prog.totalAmount;
    totalPaid += prog.paidAmount;
  }

  const overallPercent = totalVolume > 0 ? Math.min(100, Math.max(0, Math.round((totalPaid / totalVolume) * 100))) : 0;
  return {
    totalPlots: bookings.length,
    totalVolume,
    totalPaid,
    overallPercent,
  };
}
