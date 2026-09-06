import { mockStore } from '../src/lib/mock/store';
import { adminLogin } from '../src/lib/dal/adminAuth';
import { getAdminMasterPlanBlocks, getAdminBlockPlots, acquireLock, releaseLock, bookPlot, reservePlot } from '../src/lib/dal/adminPlots';
import { getReservations } from '../src/lib/dal/reservations';

async function runTests() {
  console.log('=== STARTING PHASE 2 DAL VERIFICATION ===\n');
  mockStore.resetStore();

  // 1. Administrative Authentication
  console.log('1. Testing Admin Authentication...');
  const superLogin = await adminLogin('admin', 'password123');
  if (!superLogin.ok || !superLogin.session) throw new Error('Super Admin login failed');
  console.log('  [PASS] Super Admin logged in:', superLogin.session.fullName, 'Role:', superLogin.session.role);

  const mktLogin = await adminLogin('marketing', 'password123');
  if (!mktLogin.ok || !mktLogin.session) throw new Error('Marketing Sub-Admin login failed');
  console.log('  [PASS] Marketing Sub-Admin logged in:', mktLogin.session.fullName, 'Blocks:', mktLogin.session.assignedBlocks);

  const policeLogin = await adminLogin('police', 'password123');
  if (!policeLogin.ok || !policeLogin.session) throw new Error('Police Sub-Admin login failed');
  console.log('  [PASS] Police Sub-Admin logged in:', policeLogin.session.fullName, 'Blocks:', policeLogin.session.assignedBlocks);

  // 2. Block-Scoped Access Control (Exceptions 5.4 & 5.9)
  console.log('\n2. Testing Block-Scoped Master Plan & Block Access...');
  const superBlocks = await getAdminMasterPlanBlocks(superLogin.session);
  if (superBlocks.blocks.length !== 8) throw new Error(`Super admin expected 8 blocks, got ${superBlocks.blocks.length}`);
  console.log('  [PASS] Super Admin sees all 8 blocks');

  const mktBlocks = await getAdminMasterPlanBlocks(mktLogin.session);
  if (mktBlocks.blocks.length !== 2) throw new Error(`Marketing admin expected 2 blocks, got ${mktBlocks.blocks.length}`);
  console.log('  [PASS] Marketing Sub-Admin strictly sees assigned 2 blocks:', mktBlocks.blocks.map(b => b.name).join(', '));

  const policeBlocks = await getAdminMasterPlanBlocks(policeLogin.session);
  if (policeBlocks.blocks.length !== 3) throw new Error(`Police admin expected 3 blocks, got ${policeBlocks.blocks.length}`);
  console.log('  [PASS] Police Sub-Admin strictly sees assigned 3 blocks:', policeBlocks.blocks.map(b => b.name).join(', '));

  // Test Out-of-scope rejection
  const mktUnauthorizedBlock = await getAdminBlockPlots(mktLogin.session, 'overseas');
  if (mktUnauthorizedBlock.ok || mktUnauthorizedBlock.error !== 'OUT_OF_SCOPE') {
    throw new Error('Marketing admin should be rejected from overseas block with OUT_OF_SCOPE');
  }
  console.log('  [PASS] Marketing Sub-Admin accessing Overseas block rejected with OUT_OF_SCOPE');

  // 3. Two-Layer Locking & Concurrency
  console.log('\n3. Testing Two-Layer Locking & Concurrency (Exceptions 5.1 & 5.2)...');
  // Admin 1 acquires lock on plot-a-01
  const lock1 = await acquireLock(superLogin.session, 'plot-a-01');
  if (!lock1.ok) throw new Error('Admin 1 failed to acquire lock on plot-a-01');
  console.log('  [PASS] Super Admin acquired lock on A-01');

  // Admin 2 (Marketing) attempts to acquire lock on same plot
  const lock2 = await acquireLock(mktLogin.session, 'plot-a-01');
  if (lock2.ok || lock2.error !== 'LOCKED_BY_ANOTHER') {
    throw new Error(`Expected LOCKED_BY_ANOTHER, got ${JSON.stringify(lock2)}`);
  }
  console.log('  [PASS] Marketing Sub-Admin blocked from locked plot A-01 by:', lock2.lockedByName);

  // Marketing tries to commit booking on A-01 while locked by Super Admin (Layer 2 guard)
  const bookingRace = await bookPlot(mktLogin.session, {
    plotId: 'plot-a-01',
    paymentType: 'one_time',
    customer: {
      fullName: 'Race Tester',
      email: 'race@test.com',
      phone: '0300-9999999',
    },
  });
  if (bookingRace.ok || bookingRace.error !== 'LOCK_LOST') {
    throw new Error(`Expected LOCK_LOST, got ${JSON.stringify(bookingRace)}`);
  }
  console.log('  [PASS] Atomic Commit Guard rejected booking commit with LOCK_LOST');

  // Admin 1 releases lock
  const release = await releaseLock(superLogin.session, 'plot-a-01');
  if (!release.ok) throw new Error('Super Admin release lock failed');
  console.log('  [PASS] Super Admin released lock on A-01');

  // Now Marketing can acquire lock
  const lock3 = await acquireLock(mktLogin.session, 'plot-a-01');
  if (!lock3.ok) throw new Error('Marketing admin failed to acquire lock after release');
  console.log('  [PASS] Marketing Sub-Admin successfully acquired lock after release');

  // 4. Booking Commit & Statutory Fees Generation
  console.log('\n4. Testing Booking Commit & Canonical Generation...');
  const bookingSuccess = await bookPlot(mktLogin.session, {
    plotId: 'plot-a-01',
    paymentType: 'installment',
    customer: {
      fullName: 'Nasir Iqbal',
      email: 'nasir.iqbal@example.com',
      phone: '0333-1122334',
      cnic: '37405-3344556-7',
      fatherOrHusbandName: 'Muhammad Iqbal',
    },
  });
  if (!bookingSuccess.ok || !bookingSuccess.booking) throw new Error('Booking commit failed');
  console.log('  [PASS] Booking committed successfully:', bookingSuccess.booking.id);

  // Verify statutory fees and installments
  const bookingPayments = mockStore.payments.filter(p => p.bookingId === bookingSuccess.booking?.id);
  const admFee = bookingPayments.find(p => p.feeType === 'admission_fee');
  const subFee = bookingPayments.find(p => p.feeType === 'share_subscription_fee');
  const installments = bookingPayments.filter(p => p.feeType === 'plot_installment');

  if (!admFee || admFee.amount !== 2000 || admFee.status !== 'paid') throw new Error('Admission fee record invalid');
  if (!subFee || subFee.amount !== 10000 || subFee.status !== 'paid') throw new Error('Share subscription fee record invalid');
  if (installments.length !== 8) throw new Error(`Expected 8 installments, got ${installments.length}`);
  console.log('  [PASS] Generated isolated PKR 2,000 Admission Fee, PKR 10,000 Share Fee, and 8 installments');

  // 5. Amenity Non-Sellable Guard
  console.log('\n5. Testing Amenity Non-Sellable Guard...');
  const lockAmenity = await acquireLock(superLogin.session, 'plot-amn-hosp-ab');
  if (lockAmenity.ok || lockAmenity.error !== 'AMENITY_NOT_SELLABLE') {
    throw new Error('Amenity locking should fail with AMENITY_NOT_SELLABLE');
  }
  const bookAmenity = await bookPlot(superLogin.session, {
    plotId: 'plot-amn-hosp-ab',
    paymentType: 'one_time',
    customer: { fullName: 'Illegal Buyer', email: 'illegal@buy.com', phone: '0300-0000000' },
  });
  if (bookAmenity.ok || bookAmenity.error !== 'AMENITY_NOT_SELLABLE') {
    throw new Error('Amenity booking should fail with AMENITY_NOT_SELLABLE');
  }
  console.log('  [PASS] Non-sellable amenity protection verified for Hospital');

  // 6. Sort Reservation & Duplicate Conflict Scenario
  console.log('\n6. Testing Sort Reservation & Duplicate Conflict Detection on Plot R-08...');
  const reservationsRes = await getReservations(superLogin.session);
  if (!reservationsRes.ok) throw new Error('Failed to get reservations');
  const r08Reservations = reservationsRes.reservations.filter(r => r.plotNumber === 'R-08');
  if (r08Reservations.length !== 2) throw new Error(`Expected 2 reservations on R-08, got ${r08Reservations.length}`);
  if (!r08Reservations[0].hasDuplicateConflict || !r08Reservations[1].hasDuplicateConflict) {
    throw new Error('Duplicate conflict flag not set for R-08 reservations');
  }
  console.log('  [PASS] Detected duplicate race conflict on Plot R-08 (2 active claims flagged)');

  // Confirm res-2 into booking: res-2 should become confirmed, res-3 should become superseded
  const bookR08 = await bookPlot(mktLogin.session, {
    plotId: 'plot-r-08',
    paymentType: 'one_time',
    customer: {
      fullName: 'Hamid Raza',
      email: 'hamid.raza@example.com',
      phone: '0301-4455667',
    },
    reservationId: 'res-2',
  });
  if (!bookR08.ok) throw new Error('Failed to book R-08 from res-2');

  const afterRes = await getReservations(superLogin.session);
  const confirmedRes = afterRes.reservations.find(r => r.id === 'res-2');
  const supersededRes = afterRes.reservations.find(r => r.id === 'res-3');

  if (confirmedRes?.status !== 'confirmed') throw new Error(`Expected res-2 confirmed, got ${confirmedRes?.status}`);
  if (supersededRes?.status !== 'superseded') throw new Error(`Expected res-3 superseded, got ${supersededRes?.status}`);
  console.log('  [PASS] Confirmed res-2 to booking, and auto-superseded duplicate claim res-3');

  // 7. Token Fee admin adjustment
  console.log('\n7. Testing Admin-Adjustable Token Fee...');
  const customTokenRes = await reservePlot(policeLogin.session, {
    plotId: 'plot-ov-01',
    customerName: 'Tariq Mehmood Jr',
    customerPhone: '0300-1112223',
    customerEmail: 'tariq.jr@example.com',
    tokenFee: 85000, // Custom admin adjusted fee
    validDays: 14,
    note: 'Custom VIP token agreed at reception',
  });
  if (!customTokenRes.ok || !customTokenRes.reservation) throw new Error('Custom token reserve failed');
  if (customTokenRes.reservation.tokenFee !== 85000) throw new Error('Token fee was not adjusted to 85,000');
  console.log('  [PASS] Custom admin token fee of PKR 85,000 saved successfully');

  console.log('\n=== ALL PHASE 2 DAL TESTS PASSED CLEANLY! ===\n');
}

runTests().catch(err => {
  console.error('DAL Test Failure:', err);
  process.exit(1);
});
