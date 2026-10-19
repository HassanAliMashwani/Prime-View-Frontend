/**
 * Sorts installment ledger rows by due date for every customer, old and new.
 * - Downpayment stays first.
 * - Possession fee stays last.
 * - Rows are ordered chronologically by due date.
 * - Bi-annual rows sit between monthly rows around their own due date.
 * - Tie-breaker: monthly before bi-annual if due on the same date, then installment number.
 */
export function sortLedgerBills<T extends { feeType?: string; dueDate?: string | Date; installmentNumber?: number | null }>(
  bills: T[]
): T[] {
  if (!Array.isArray(bills) || bills.length <= 1) return bills ? [...bills] : [];

  return [...bills].sort((a, b) => {
    // 1. Downpayment always first
    const isDownA = a.feeType === 'plot_downpayment';
    const isDownB = b.feeType === 'plot_downpayment';
    if (isDownA && !isDownB) return -1;
    if (!isDownA && isDownB) return 1;

    // 2. Possession fee always last
    const isPossA = a.feeType === 'plot_possession';
    const isPossB = b.feeType === 'plot_possession';
    if (isPossA && !isPossB) return 1;
    if (!isPossA && isPossB) return -1;

    // 3. Chronological by Due Date
    const timeA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const timeB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // 4. Same due date: monthly before bi-annual
    if (a.feeType === 'plot_installment' && b.feeType === 'plot_biannual') return -1;
    if (a.feeType === 'plot_biannual' && b.feeType === 'plot_installment') return 1;

    // 5. Secondary tie-breaker: installment number
    const numA = a.installmentNumber ?? 0;
    const numB = b.installmentNumber ?? 0;
    return numA - numB;
  });
}
