export interface FrontendScheduleRow {
  seq: number;
  feeType: 'plot_downpayment' | 'plot_installment' | 'plot_biannual' | 'plot_possession';
  label: string;
  installmentNumber: number | null;
  year: number;
  dueDate: Date;
  dueDateStr: string;
  amount: number;
  cumulativePaid: number;
  balance: number;
  status: 'paid' | 'pending';
  paidAmount: number;
}

export interface GenerateFrontendScheduleOptions {
  plotPriceRupees: number;
  planYears: number; // 1, 2, 3, 4, or 5
  bookingDate?: Date | string;
}

export function generateFrontendSchedule(options: GenerateFrontendScheduleOptions): FrontendScheduleRow[] {
  const { plotPriceRupees, planYears, bookingDate = new Date() } = options;

  if (![1, 2, 3, 4, 5].includes(planYears)) {
    throw new Error('Invalid planYears: must be 1, 2, 3, 4, or 5');
  }

  const pricePaisa = Math.round(plotPriceRupees * 100);
  const downpaymentPaisa = Math.floor((pricePaisa * 250) / 1000);
  const monthlyPoolPaisa = Math.floor((pricePaisa * 382) / 1000);
  const biannualPoolPaisa = Math.floor((pricePaisa * 288) / 1000);
  const possessionPaisa = pricePaisa - (downpaymentPaisa + monthlyPoolPaisa + biannualPoolPaisa);

  const monthlyCount = planYears * 12;
  const biannualCount = planYears * 2;

  const baseMonthlyPaisa = Math.floor(monthlyPoolPaisa / monthlyCount);
  const lastMonthlyPaisa = monthlyPoolPaisa - baseMonthlyPaisa * (monthlyCount - 1);

  const baseBiannualPaisa = Math.floor(biannualPoolPaisa / biannualCount);
  const lastBiannualPaisa = biannualPoolPaisa - baseBiannualPaisa * (biannualCount - 1);

  const bDate = typeof bookingDate === 'string' ? new Date(bookingDate) : bookingDate;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(bDate);
  const bYear = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
  const bMonth = parseInt(parts.find((p) => p.type === 'month')!.value, 10);
  const bDay = parseInt(parts.find((p) => p.type === 'day')!.value, 10);

  const makeUtcNoonDate = (y: number, m: number, d: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return new Date(`${y}-${pad(m)}-${pad(d)}T12:00:00.000Z`);
  };

  const getLastDayOfMonth = (y: number, m: number) => {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
  };

  const schedule: FrontendScheduleRow[] = [];
  let cumulativePaisa = 0;

  // 1. Downpayment
  const downpaymentDate = makeUtcNoonDate(bYear, bMonth, bDay);
  cumulativePaisa += downpaymentPaisa;
  schedule.push({
    seq: schedule.length + 1,
    feeType: 'plot_downpayment',
    label: 'Down payment',
    installmentNumber: 0,
    year: 0,
    dueDate: downpaymentDate,
    dueDateStr: downpaymentDate.toISOString().split('T')[0],
    amount: downpaymentPaisa / 100,
    cumulativePaid: cumulativePaisa / 100,
    balance: (pricePaisa - cumulativePaisa) / 100,
    status: 'paid',
    paidAmount: downpaymentPaisa / 100,
  });

  // Generate monthly and bi-annual bills
  let biannualIdx = 0;
  for (let mIdx = 1; mIdx <= monthlyCount; mIdx++) {
    // Bi-annual bill inserted before monthly 6, 12, 18, 24, 30, 36, 42, 48, 54, 60
    if (mIdx % 6 === 0 && biannualIdx < biannualCount) {
      biannualIdx++;
      const precTotalMonths = bMonth - 1 + (mIdx - 1);
      const precYear = bYear + Math.floor(precTotalMonths / 12);
      const precMonth = (precTotalMonths % 12) + 1;
      const lastDay = getLastDayOfMonth(precYear, precMonth);
      const biDueDate = makeUtcNoonDate(precYear, precMonth, lastDay);

      const isLastBi = biannualIdx === biannualCount;
      const biAmountPaisa = isLastBi ? lastBiannualPaisa : baseBiannualPaisa;
      cumulativePaisa += biAmountPaisa;

      const billYear = Math.ceil((mIdx - 1) / 12);

      schedule.push({
        seq: schedule.length + 1,
        feeType: 'plot_biannual',
        label: `Bi-annual installment #${biannualIdx}`,
        installmentNumber: biannualIdx,
        year: billYear,
        dueDate: biDueDate,
        dueDateStr: biDueDate.toISOString().split('T')[0],
        amount: biAmountPaisa / 100,
        cumulativePaid: cumulativePaisa / 100,
        balance: (pricePaisa - cumulativePaisa) / 100,
        status: 'pending',
        paidAmount: 0,
      });
    }

    // Monthly bill
    const totalMonths = bMonth - 1 + mIdx;
    const curYear = bYear + Math.floor(totalMonths / 12);
    const curMonth = (totalMonths % 12) + 1;
    const mDueDate = makeUtcNoonDate(curYear, curMonth, 1);

    const isLastMonthly = mIdx === monthlyCount;
    const mAmountPaisa = isLastMonthly ? lastMonthlyPaisa : baseMonthlyPaisa;
    cumulativePaisa += mAmountPaisa;

    const billYear = Math.ceil(mIdx / 12);

    schedule.push({
      seq: schedule.length + 1,
      feeType: 'plot_installment',
      label: `Monthly installment #${mIdx}`,
      installmentNumber: mIdx,
      year: billYear,
      dueDate: mDueDate,
      dueDateStr: mDueDate.toISOString().split('T')[0],
      amount: mAmountPaisa / 100,
      cumulativePaid: cumulativePaisa / 100,
      balance: (pricePaisa - cumulativePaisa) / 100,
      status: 'pending',
      paidAmount: 0,
    });
  }

  // Possession bill
  const possTotalMonths = bMonth - 1 + monthlyCount + 1;
  const possYear = bYear + Math.floor(possTotalMonths / 12);
  const possMonth = (possTotalMonths % 12) + 1;
  const possDueDate = makeUtcNoonDate(possYear, possMonth, 1);

  cumulativePaisa += possessionPaisa;
  schedule.push({
    seq: schedule.length + 1,
    feeType: 'plot_possession',
    label: 'Possession',
    installmentNumber: null,
    year: planYears,
    dueDate: possDueDate,
    dueDateStr: possDueDate.toISOString().split('T')[0],
    amount: possessionPaisa / 100,
    cumulativePaid: cumulativePaisa / 100,
    balance: (pricePaisa - cumulativePaisa) / 100,
    status: 'pending',
    paidAmount: 0,
  });

  return schedule;
}
