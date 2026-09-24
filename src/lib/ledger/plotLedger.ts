/**
 * Single Canonical Formula for Plot Ledger Calculations
 * P3-LIVE-LEDGER
 *
 * Rules:
 * 1. Total Plot Price = Plot.price only. Balloon never changes it.
 * 2. Total Paid to Date = sum(paidAmount) on plot-price rows, ALL statuses (including partially_paid).
 * 3. Remaining = max(0, price - paid).
 * 4. Statutory fees (admission_fee, share_subscription_fee) stay OUT of plot price cards.
 */

export const PLOT_PRICE_FEE_TYPES = new Set([
  'plot_installment',
  'plot_one_time',
  'plot_downpayment',
]);

export interface PlotLedgerPaymentRow {
  feeType: string;
  amount: number | string;
  paidAmount?: number | string | null;
  status: string;
}

export interface PlotLedgerResult {
  totalPlotPrice: number;
  totalPaidToDate: number;
  remainingBalance: number;
  percentSettled: number;
}

export function computePlotLedger(
  plotPrice: number | string,
  payments: PlotLedgerPaymentRow[],
): PlotLedgerResult {
  const totalPlotPrice = Number(plotPrice) || 0;
  const plotRows = (payments || []).filter((p) => PLOT_PRICE_FEE_TYPES.has(p.feeType));

  // INCLUDE partially_paid and any paidAmount > 0. Do NOT require status === 'paid'.
  const totalPaidToDate = plotRows.reduce(
    (sum, p) => sum + (Number(p.paidAmount) || 0),
    0,
  );

  const remainingBalance = Math.max(0, totalPlotPrice - totalPaidToDate);
  const percentSettled =
    totalPlotPrice > 0
      ? Math.min(100, Math.round((totalPaidToDate / totalPlotPrice) * 100))
      : 0;

  return { totalPlotPrice, totalPaidToDate, remainingBalance, percentSettled };
}
