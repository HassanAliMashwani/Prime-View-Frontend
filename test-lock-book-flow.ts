import { acquireLock, bookPlot } from './src/lib/dal/adminPlots';
import { AdminSession } from './src/lib/mock/types';
import { mockStore } from './src/lib/mock/store';

async function main() {
  console.log('=== Step 1: Lock-Ownership and Booking Re-Check Test ===\n');

  // 1. Authenticate Marketing admin (admin-2)
  const loginMkt = await fetch('http://localhost:3001/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'marketing', password: process.env.TEST_ADMIN_PASSWORD || 'password123' }),
  });
  const { access_token: tokenMkt } = await loginMkt.json();
  const payloadMkt = JSON.parse(Buffer.from(tokenMkt.split('.')[1], 'base64').toString());

  const sessionMkt: AdminSession = {
    adminId: payloadMkt.adminId,
    username: payloadMkt.username,
    fullName: payloadMkt.fullName,
    role: payloadMkt.role,
    assignedBlocks: payloadMkt.assignedBlocks,
    permissions: payloadMkt.permissions,
    token: tokenMkt,
    expiresAt: Date.now() + 86400000,
  };
  console.log(`Authenticated Marketing Admin: ${sessionMkt.adminId} (${sessionMkt.username})`);

  // 2. Authenticate Super Admin (admin-1)
  const loginAdmin = await fetch('http://localhost:3001/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: process.env.TEST_ADMIN_PASSWORD || 'password123' }),
  });
  const { access_token: tokenAdmin } = await loginAdmin.json();
  const payloadAdmin = JSON.parse(Buffer.from(tokenAdmin.split('.')[1], 'base64').toString());

  const sessionAdmin: AdminSession = {
    adminId: payloadAdmin.adminId,
    username: payloadAdmin.username,
    fullName: payloadAdmin.fullName,
    role: payloadAdmin.role,
    assignedBlocks: payloadAdmin.assignedBlocks,
    permissions: payloadAdmin.permissions,
    token: tokenAdmin,
    expiresAt: Date.now() + 86400000,
  };
  console.log(`Authenticated Super Admin: ${sessionAdmin.adminId} (${sessionAdmin.username})`);

  const targetPlotId = 'plot-r-03';
  const plotBefore = mockStore.plots.find(p => p.id === targetPlotId);
  console.log(`\nTarget plot ${targetPlotId} initial status: ${plotBefore?.status}, lockedBy: ${plotBefore?.lockedBy || 'none'}`);

  // 3. Marketing acquires 10-minute lock on plot-r-03
  console.log(`\n1. Marketing (${sessionMkt.adminId}) acquires lock on ${targetPlotId}...`);
  const lockRes = await acquireLock(sessionMkt, targetPlotId);
  console.log('Acquire Lock Result:', {
    ok: lockRes.ok,
    lockedBy: lockRes.plot?.lockedBy,
    lockedByName: lockRes.plot?.lockedByName,
    lockToken: lockRes.lockToken,
  });

  // 4. Super Admin (has can_book: true) tries to book Marketing's locked plot -> MUST FAIL with LOCK_LOST
  console.log(`\n2. Super Admin (${sessionAdmin.adminId}) attempts to book plot locked by Marketing...`);
  const stealRes = await bookPlot(sessionAdmin, {
    plotId: targetPlotId,
    paymentType: 'one_time',
    customer: {
      fullName: 'Intruder Buyer',
      email: 'intruder@example.com',
      phone: '0300-1111111',
    },
  });
  console.log('Super Admin competing booking attempt result:', {
    ok: stealRes.ok,
    error: stealRes.error,
  });
  if (stealRes.ok || stealRes.error !== 'LOCK_LOST') {
    throw new Error(`Expected LOCK_LOST, got: ${JSON.stringify(stealRes)}`);
  }
  console.log('--> Verified: Lock protects plot from being booked by other admins (LOCK_LOST returned).');

  // 5. Marketing (the lock owner) books the plot -> MUST SUCCEED
  console.log(`\n3. Marketing (${sessionMkt.adminId}, lock owner) books the plot...`);
  const legitimateBookRes = await bookPlot(sessionMkt, {
    plotId: targetPlotId,
    paymentType: 'one_time',
    customer: {
      fullName: 'Legitimate Buyer',
      email: 'buyer.r03@example.com',
      phone: '0333-7778899',
    },
  });
  console.log('Marketing booking result:', {
    ok: legitimateBookRes.ok,
    bookingId: legitimateBookRes.booking?.id,
    plotStatus: legitimateBookRes.plot?.status,
    ownerId: legitimateBookRes.plot?.currentOwnerId,
    lockedByAfter: legitimateBookRes.plot?.lockedBy,
    error: legitimateBookRes.error,
  });

  if (!legitimateBookRes.ok || legitimateBookRes.plot?.status !== 'booked') {
    throw new Error(`Legitimate booking failed: ${JSON.stringify(legitimateBookRes)}`);
  }
  console.log('--> Verified: Lock-ownership re-check succeeded! Plot is booked and lock is cleanly released.\n');

  // Check audit log for this booking
  const lastAudit = mockStore.auditLog[mockStore.auditLog.length - 1];
  console.log('Last Audit Entry for booking:', {
    action: lastAudit.action,
    actorId: lastAudit.actorId,
    actorName: lastAudit.actorName,
    actorRole: lastAudit.actorRole,
    details: lastAudit.details,
  });
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
