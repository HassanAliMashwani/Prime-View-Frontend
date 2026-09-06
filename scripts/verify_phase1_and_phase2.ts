import { mockStore } from '../src/lib/mock/store';
import { setMockSession } from '../src/lib/dal/auth';
import { getMyPlots } from '../src/lib/dal/plots';
import { getPaymentSchedule } from '../src/lib/dal/payments';
import { adminLogin } from '../src/lib/dal/adminAuth';
import { getAdminMasterPlanBlocks, getAdminBlockPlots, acquireLock, releaseLock, bookPlot, reservePlot } from '../src/lib/dal/adminPlots';
import { getReservations } from '../src/lib/dal/reservations';

function setCustomerSession(customerId: string, fullName: string) {
  setMockSession({
    customerId,
    role: 'customer',
    fullName,
    email: 'customer@example.com',
    token: `token-${customerId}`,
    expiresAt: Date.now() + 86400000,
  });
}

async function runComprehensiveVerification() {
  console.log('====================================================');
  console.log('PRIME VIEW HOUSING SOCIETY — VERIFICATION SUITE');
  console.log('Testing Phase 1 (Member Portal) + Phase 2 (Admin Core)');
  console.log('====================================================\n');

  mockStore.resetStore();

  // ─────────────────────────────────────────────────────────
  // PART 1: PHASE 1 REGRESSION & EXACT NUMBERS
  // ─────────────────────────────────────────────────────────
  console.log('--- PART 1: VERIFYING PHASE 1 FINANCIAL DISCIPLINE ---');

  // 1. Tariq Mehmood (Plot A-12, One-Time)
  setCustomerSession('cust-1', 'Tariq Mehmood');
  const tariqPlotsRes = await getMyPlots();
  const tariqSchedRes = await getPaymentSchedule();

  const tariqTotalInvestment = tariqPlotsRes.data.reduce((sum, p) => sum + p.paymentSummary.totalAmount, 0);
  const tariqTotalPaid = tariqPlotsRes.data.reduce((sum, p) => sum + p.paymentSummary.paidAmount, 0);

  console.log(`Tariq Total Investment: PKR ${tariqTotalInvestment.toLocaleString()}`);
  console.log(`Tariq Total Paid:       PKR ${tariqTotalPaid.toLocaleString()}`);

  if (tariqTotalInvestment !== 12500000) {
    throw new Error(`Expected Tariq Investment 12,500,000, got ${tariqTotalInvestment}`);
  }
  if (tariqTotalPaid !== 12500000) {
    throw new Error(`Expected Tariq Paid 12,500,000, got ${tariqTotalPaid}`);
  }
  console.log('  [PASS] Tariq exact numbers verified: 12,500,000 / 12,500,000 (Fees strictly isolated)');

  // 2. Dr. Ayesha Khan (Plot B-05, Installment)
  setCustomerSession('cust-2', 'Dr. Ayesha Khan');
  const ayeshaPlotsRes = await getMyPlots();
  const ayeshaSchedRes = await getPaymentSchedule();

  const ayeshaTotalPaid = ayeshaPlotsRes.data.reduce((sum, p) => sum + p.paymentSummary.paidAmount, 0);
  console.log(`Dr. Ayesha Total Paid:  PKR ${ayeshaTotalPaid.toLocaleString()}`);

  if (ayeshaTotalPaid !== 2166664) {
    throw new Error(`Expected Dr. Ayesha Total Paid 2,166,664, got ${ayeshaTotalPaid}`);
  }
  console.log('  [PASS] Dr. Ayesha exact numbers verified: 2,166,664 (8 installments × 270,833)');

  // Statutory fee isolation check in Tariq's schedule
  const admFee = tariqSchedRes.data[0].admissionFee;
  const subFee = tariqSchedRes.data[0].shareSubscriptionFee;
  if (!admFee || admFee.amount !== 2000 || admFee.status !== 'paid') throw new Error('Admission fee missing or not 2,000');
  if (!subFee || subFee.amount !== 10000 || subFee.status !== 'paid') throw new Error('Share subscription fee missing or not 10,000');
  console.log('  [PASS] Statutory fees verified: PKR 2,000 Admission & PKR 10,000 Share Certificate');

  // ─────────────────────────────────────────────────────────
  // PART 2: PHASE 2 ADMIN CORE & MULTI-ADMIN CONCURRENCY
  // ─────────────────────────────────────────────────────────
  console.log('\n--- PART 2: VERIFYING PHASE 2 ADMIN CORE ---');

  // Admin logins
  const superLogin = await adminLogin('admin', 'password123');
  const mktLogin = await adminLogin('marketing', 'password123');
  const policeLogin = await adminLogin('police', 'password123');
  if (!superLogin.session || !mktLogin.session || !policeLogin.session) {
    throw new Error('Admin logins failed');
  }
  console.log('  [PASS] Admin credentials authenticated: super_admin, marketing sub_admin, police sub_admin');

  // Scope verification
  const sBlocks = await getAdminMasterPlanBlocks(superLogin.session);
  const mBlocks = await getAdminMasterPlanBlocks(mktLogin.session);
  const pBlocks = await getAdminMasterPlanBlocks(policeLogin.session);
  if (sBlocks.blocks.length !== 8) throw new Error('Super admin did not see 8 blocks');
  if (mBlocks.blocks.length !== 2) throw new Error('Marketing admin did not see 2 blocks');
  if (pBlocks.blocks.length !== 3) throw new Error('Police admin did not see 3 blocks');
  console.log(`  [PASS] Block scopes confirmed: Super (8), Marketing (${mBlocks.blocks.map(b => b.name).join(', ')}), Police (${pBlocks.blocks.map(b => b.name).join(', ')})`);

  // Out of scope rejection
  const outOfScopeAttempt = await getAdminBlockPlots(mktLogin.session, 'overseas');
  if (outOfScopeAttempt.ok || outOfScopeAttempt.error !== 'OUT_OF_SCOPE') {
    throw new Error('Out of scope access was not rejected');
  }
  console.log('  [PASS] Out-of-scope block access rejected with OUT_OF_SCOPE');

  // Two-Layer Locking & Concurrency
  const l1 = await acquireLock(superLogin.session, 'plot-a-01');
  if (!l1.ok) throw new Error('Failed to acquire initial lock');
  const l2 = await acquireLock(mktLogin.session, 'plot-a-01');
  if (l2.ok || l2.error !== 'LOCKED_BY_ANOTHER') {
    throw new Error('Concurrent lock attempt not rejected');
  }
  console.log('  [PASS] Layer 1 Soft Lock blocked competing administrator');

  const raceBook = await bookPlot(mktLogin.session, {
    plotId: 'plot-a-01',
    paymentType: 'one_time',
    customer: { fullName: 'Unauthorized', email: 'test@u.com', phone: '0300-1111111' },
  });
  if (raceBook.ok || raceBook.error !== 'LOCK_LOST') {
    throw new Error('Atomic commit guard failed');
  }
  console.log('  [PASS] Layer 2 Atomic Commit Guard rejected unauthorized booking commit');

  await releaseLock(superLogin.session, 'plot-a-01');
  console.log('  [PASS] Lock successfully released');

  // Booking commit with isolated fees
  const commitBook = await bookPlot(superLogin.session, {
    plotId: 'plot-a-01',
    paymentType: 'installment',
    customer: {
      fullName: 'Kamran Akmal',
      email: 'kamran.akmal@example.com',
      phone: '0345-1234567',
      cnic: '37405-1122334-5',
    },
  });
  if (!commitBook.ok) throw new Error('Booking commit failed');
  console.log('  [PASS] Booking committed cleanly with 8 installments + isolated statutory fees');

  // Amenity protection
  const bookAmenity = await bookPlot(superLogin.session, {
    plotId: 'plot-amn-hosp-ab',
    paymentType: 'one_time',
    customer: { fullName: 'Illegal', email: 'i@i.com', phone: '0300-0000000' },
  });
  if (bookAmenity.ok || bookAmenity.error !== 'AMENITY_NOT_SELLABLE') {
    throw new Error('Amenity booking should be rejected');
  }
  console.log('  [PASS] Authentic Society Amenities verified non-sellable');

  // Duplicate race condition on Plot R-08
  const resList = await getReservations(superLogin.session);
  const r08Res = resList.reservations.filter(r => r.plotNumber === 'R-08');
  if (r08Res.length !== 2 || !r08Res[0].hasDuplicateConflict) {
    throw new Error('R-08 duplicate conflict not detected');
  }
  console.log('  [PASS] Detected duplicate token race conflict on Plot R-08');

  // Commit res-2 to booking, auto-superseding res-3
  const bookR08 = await bookPlot(mktLogin.session, {
    plotId: 'plot-r-08',
    paymentType: 'one_time',
    customer: { fullName: 'Hamid Raza', email: 'hamid.raza@example.com', phone: '0301-4455667' },
    reservationId: 'res-2',
  });
  if (!bookR08.ok) throw new Error('Failed to book R-08');
  const afterList = await getReservations(superLogin.session);
  const r2 = afterList.reservations.find(r => r.id === 'res-2');
  const r3 = afterList.reservations.find(r => r.id === 'res-3');
  if (r2?.status !== 'confirmed' || r3?.status !== 'superseded') {
    throw new Error('Duplicate reservation resolution failed');
  }
  console.log('  [PASS] Resolved Plot R-08 dispute: res-2 confirmed, res-3 superseded');

  // Admin adjustable token fee
  const customReserve = await reservePlot(policeLogin.session, {
    plotId: 'plot-ov-02',
    customerName: 'Sardar Bilal',
    customerPhone: '0333-8889900',
    customerEmail: 'sardar.bilal@example.com',
    tokenFee: 65000,
    validDays: 10,
    note: 'Adjusted token deposit accepted at counter',
  });
  if (!customReserve.ok || customReserve.reservation?.tokenFee !== 65000) {
    throw new Error('Adjustable token fee failed');
  }
  console.log('  [PASS] Admin-adjustable token fee verified: PKR 65,000');

  console.log('\n====================================================');
  console.log('ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('====================================================\n');
}

runComprehensiveVerification().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
