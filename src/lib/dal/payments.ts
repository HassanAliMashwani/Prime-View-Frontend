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
    const session = requireMemberSession();

    const [plotsRes, paymentsRes] = await Promise.all([
      apiGet<any[]>('/me/plots', session.token),
      apiGet<any[]>('/me/payments', session.token),
    ]);

    if (!plotsRes.ok || !Array.isArray(plotsRes.data)) {
      return { ok: false, data: [], error: plotsRes.error || 'FETCH_PLOTS_FAILED' };
    }

    const allPayments: any[] = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
    let plots = plotsRes.data;

    if (plotId && plotId !== 'all') {
      plots = plots.filter((p) => p.id === plotId || p.plotNumber === plotId);
      if (plots.length === 0) {
        return { ok: false, data: [], error: 'NOT_FOUND' };
      }
    }

    const schedules: PlotPaymentSchedule[] = [];

    for (const plot of plots) {
      const booking = plot.bookings && plot.bookings.length > 0 ? plot.bookings[0] : null;
      if (!booking) continue;

      const bookingPayments = allPayments
        .filter((p) => p.bookingId === booking.id || p.plotId === plot.id)
        .map((p) => ({
          ...p,
          amount: Number(p.amount) || 0,
          paidAmount: Number(p.paidAmount) || 0,
        }));

      // Fixed statutory fees
      const admissionFee = bookingPayments.find((p) => p.feeType === 'admission_fee');
      const shareSubscriptionFee = bookingPayments.find((p) => p.feeType === 'share_subscription_fee');
      const downpaymentFee = bookingPayments.find((p) => p.feeType === 'plot_downpayment');

      // Plot price payments only
      const plotPricePayments = bookingPayments.filter(
        (p) =>
          p.feeType === 'plot_installment' ||
          p.feeType === 'plot_one_time' ||
          p.feeType === 'plot_downpayment'
      );

      const paidAmount = plotPricePayments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.paidAmount, 0);

      const totalPrice = Number(plot.price) || 0;
      const remainingBalance = Math.max(0, totalPrice - paidAmount);

      schedules.push({
        plotId: plot.id,
        plotNumber: plot.plotNumber || 'Plot',
        blockId: String(plot.blockId || ''),
        blockName: plot.block?.name || plot.blockName || 'Prime View Block',
        size: plot.size || '',
        paymentType: booking.paymentType || 'installment',
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
    const session = requireMemberSession();

    const [plotsRes, paymentsRes] = await Promise.all([
      apiGet<any[]>('/me/plots', session.token),
      apiGet<any[]>('/me/payments', session.token),
    ]);

    if (!paymentsRes.ok || !Array.isArray(paymentsRes.data)) {
      return { ok: false, data: [], error: paymentsRes.error || 'FETCH_PAYMENTS_FAILED' };
    }

    const plots = Array.isArray(plotsRes.data) ? plotsRes.data : [];
    const plotMap = new Map<string, any>(plots.map((p) => [p.id, p]));

    let payments = paymentsRes.data;

    if (filterPlotId && filterPlotId !== 'all') {
      payments = payments.filter((p) => {
        const plot = plotMap.get(p.plotId);
        return p.plotId === filterPlotId || (plot && plot.plotNumber === filterPlotId);
      });
    }

    const transactions: PaymentTransaction[] = [];

    for (const payment of payments) {
      if (payment.status === 'paid' || payment.transactionRef) {
        const plot = plotMap.get(payment.plotId);
        const plotNumber = plot ? plot.plotNumber : 'Plot';

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
        } else {
          desc = 'Plot Payment';
        }

        transactions.push({
          id: payment.id,
          date: payment.paidDate || payment.dueDate || new Date().toISOString(),
          plotId: payment.plotId || '',
          plotNumber,
          description: desc,
          amount: Number(payment.paidAmount) || Number(payment.amount) || 0,
          status: payment.status as PaymentStatus,
          transactionRef: payment.transactionRef,
        });
      }
    }

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

export function getBookingProgress(_bookingId: string): BookingProgressData {
  return {
    paymentType: 'installment',
    percent: 0,
    paidAmount: 0,
    totalAmount: 0,
    remainingAmount: 0,
    isCompleted: false,
  };
}

export function getCustomerPortfolioProgress(_customerId: string): {
  totalPlots: number;
  totalVolume: number;
  totalPaid: number;
  overallPercent: number;
} {
  return {
    totalPlots: 0,
    totalVolume: 0,
    totalPaid: 0,
    overallPercent: 0,
  };
}
