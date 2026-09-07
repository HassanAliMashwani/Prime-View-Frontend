import { mockStore } from '../src/lib/mock/store';
import { AdminSession } from '../src/lib/mock/types';
import { acquireLock, releaseLock, reservePlot, bookPlot } from '../src/lib/dal/adminPlots';
import { confirmReservation, updateReservationNote } from '../src/lib/dal/reservations';

async function verifyAuditLogs() {
  console.log('===============================================================');
  console.log('PHASE 2 AUDIT LOG VERIFICATION: MUTATING ACTIONS TRACEABILITY');
  console.log('===============================================================\n');

  // Reset store to pristine initial state
  mockStore.resetStore();

  const superAdminSession: AdminSession = {
    adminId: 'admin-1',
    username: 'admin',
    fullName: 'Chief Executive Officer (Super Admin)',
    role: 'super_admin',
    assignedBlocks: [],
    permissions: {
      can_reserve: true,
      can_book: true,
      can_create_customer: true,
    },
    token: 'test-tok-admin',
    expiresAt: Date.now() + 3600000,
  };

  const marketingSession: AdminSession = {
    adminId: 'admin-2',
    username: 'marketing',
    fullName: 'Farhan Zaidi (Marketing Lead)',
    role: 'sub_admin',
    assignedBlocks: ['abbott', 'royal'],
    permissions: {
      can_reserve: true,
      can_book: true,
      can_create_customer: true,
    },
    token: 'test-tok-marketing',
    expiresAt: Date.now() + 3600000,
  };

  // 1. Action: acquireLock
  console.log('1. Executing acquireLock on Plot A-01 (by Marketing)...');
  const lockRes = await acquireLock(marketingSession, 'plot-a-01');
  if (!lockRes.ok) throw new Error(`acquireLock failed: ${lockRes.error}`);

  // 2. Action: releaseLock
  console.log('2. Executing releaseLock on Plot A-01 (by Marketing)...');
  const releaseRes = await releaseLock(marketingSession, 'plot-a-01');
  if (!releaseRes.ok) throw new Error(`releaseLock failed: ${releaseRes.error}`);

  // 3. Action: reservePlot (Claim 1)
  console.log('3. Executing reservePlot (Claim 1) on Plot A-01 (by Marketing)...');
  const res1 = await reservePlot(marketingSession, {
    plotId: 'plot-a-01',
    customerName: 'Tariq Mahmood',
    customerPhone: '0300-1112233',
    customerEmail: 'tariq.m@example.com',
    tokenFee: 50000,
    validDays: 7,
    note: 'Initial marketing branch walk-in customer',
  });
  if (!res1.ok || !res1.reservation) throw new Error(`reservePlot 1 failed: ${res1.error}`);

  // 4. Action: reservePlot (Claim 2 - Conflict race condition)
  console.log('4. Executing reservePlot (Claim 2 - Conflict) on Plot A-01 (by Super Admin)...');
  const res2 = await reservePlot(superAdminSession, {
    plotId: 'plot-a-01',
    customerName: 'Asad Malik',
    customerPhone: '0321-9988776',
    customerEmail: 'asad.malik@example.com',
    tokenFee: 75000,
    validDays: 5,
    note: 'Direct phone reservation with executive desk',
  });
  if (!res2.ok || !res2.reservation) throw new Error(`reservePlot 2 failed: ${res2.error}`);

  // 5. Action: updateReservationNote
  console.log('5. Executing updateReservationNote on Claim 2 (by Super Admin)...');
  const updateNoteRes = await updateReservationNote(
    superAdminSession,
    res2.reservation.id,
    'Client will decide payment method by Monday morning 10 AM'
  );
  if (!updateNoteRes.ok) throw new Error(`updateReservationNote failed: ${updateNoteRes.error}`);

  // 6. Action: confirmReservation (Confirm Claim 1 -> triggers auto-supersede on Claim 2)
  console.log('6. Executing confirmReservation on Claim 1 (by Marketing)...');
  const confirmRes = await confirmReservation(marketingSession, res1.reservation.id, 'one_time');
  if (!confirmRes.ok) throw new Error(`confirmReservation failed: ${confirmRes.error}`);

  // 7. Action: bookPlot (Direct booking on Plot A-03)
  console.log('7. Executing direct bookPlot on Plot A-03 (by Super Admin)...');
  const directBookRes = await bookPlot(superAdminSession, {
    plotId: 'plot-a-03',
    paymentType: 'installment',
    customer: {
      fullName: 'Dr. Bilal Sheikh',
      email: 'dr.bilal@hospital.org',
      phone: '0333-5544332',
      cnic: '37405-9988776-1',
    },
  });
  if (!directBookRes.ok) throw new Error(`direct bookPlot failed: ${directBookRes.error}`);

  // -------------------------------------------------------------
  // PRINT AND AUDIT THE STORE LOGS
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`RECORDED AUDIT LOG ENTRIES (${mockStore.auditLog.length} TOTAL ENTRIES)`);
  console.log('===============================================================\n');

  mockStore.auditLog.forEach((entry, idx) => {
    console.log(`[ENTRY #${idx + 1}]`);
    console.log(`  ID:        ${entry.id}`);
    console.log(`  Timestamp: ${entry.timestamp}`);
    console.log(`  Action:    ${entry.action}`);
    console.log(`  Actor:     ${entry.actorName} (${entry.actorRole}, ID: ${entry.actorId})`);
    console.log(`  Target:    ${entry.entityType} (ID: ${entry.entityId})`);
    console.log(`  Details:   ${entry.details}`);
    console.log('---------------------------------------------------------------');
  });

  // Verification Assertions
  const actions = mockStore.auditLog.map(e => e.action);
  const requiredActions = [
    'PLOT_LOCK_ACQUIRED',
    'PLOT_LOCK_RELEASED',
    'PLOT_RESERVED',
    'RESERVATION_NOTE_UPDATED',
    'RESERVATION_CONFIRMED',
    'RESERVATION_SUPERSEDED',
    'PLOT_BOOKED',
  ];

  console.log('\n>>> VERIFYING ACTION COVERAGE:');
  for (const act of requiredActions) {
    const found = actions.includes(act);
    console.log(`  - ${act.padEnd(25)} : ${found ? 'FOUND [OK]' : 'MISSING [FAIL]'}`);
    if (!found) throw new Error(`Audit log is missing required action: ${act}`);
  }

  console.log('\n[SUCCESS] All 7 mutating actions produced genuine timestamped, attributed audit records.');
}

verifyAuditLogs().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
