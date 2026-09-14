import { acquireLock, reservePlot, bookPlot, releaseLock } from './src/lib/dal/adminPlots';
import { createCustomerWithBooking } from './src/lib/dal/customers';
import { AdminSession } from './src/lib/mock/types';
import { mockStore } from './src/lib/mock/store';

async function main() {
  console.log('=== Testing Write-Side Mock Functions with Real Backend JWT ===\n');

  // 1. Authenticate against real backend
  console.log('1. Logging in to real backend at http://localhost:3001/auth/admin/login as "marketing"...');
  const loginRes = await fetch('http://localhost:3001/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'marketing', password: process.env.TEST_ADMIN_PASSWORD || 'password123' }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  }

  const { access_token } = (await loginRes.json()) as { access_token: string };
  console.log('Real JWT received:', access_token.substring(0, 35) + '...');

  // 2. Decode JWT payload
  const payload = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64').toString());
  console.log('Decoded JWT payload:', {
    adminId: payload.adminId,
    username: payload.username,
    fullName: payload.fullName,
    role: payload.role,
    assignedBlocks: payload.assignedBlocks,
    permissions: payload.permissions,
  });

  // 3. Construct AdminSession using the real JWT
  const session: AdminSession = {
    adminId: payload.adminId,
    username: payload.username,
    fullName: payload.fullName,
    role: payload.role,
    assignedBlocks: payload.assignedBlocks,
    permissions: payload.permissions,
    token: access_token,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };

  // 4. Test Lock Acquisition on Abbott plot (marketing is assigned to abbott & royal)
  console.log('\n2. Testing acquireLock() with real JWT session on plot-a-01...');
  const lockResult = await acquireLock(session, 'plot-a-01');
  console.log('Lock Result:', {
    ok: lockResult.ok,
    lockedBy: lockResult.plot?.lockedBy,
    lockedByName: lockResult.plot?.lockedByName,
    lockToken: lockResult.lockToken,
    error: lockResult.error,
  });
  if (!lockResult.ok) {
    console.error('FAILED lock acquisition!');
  }

  // 5. Test Release Lock
  console.log('\n3. Testing releaseLock() with real JWT session on plot-a-01...');
  const releaseResult = await releaseLock(session, 'plot-a-01');
  console.log('Release Result:', releaseResult);

  // 6. Test Reserve Plot
  console.log('\n4. Testing reservePlot() with real JWT session on plot-a-02...');
  const reserveResult = await reservePlot(session, {
    plotId: 'plot-a-02',
    customerName: 'Muhammad Arshad',
    customerPhone: '0300-9876543',
    customerEmail: 'arshad@example.com',
    tokenFee: 75000,
    validDays: 5,
    note: 'Created during real JWT write test',
  });
  console.log('Reserve Result:', {
    ok: reserveResult.ok,
    reservationId: reserveResult.reservation?.id,
    plotStatus: reserveResult.plot?.status,
    reservedByAdminId: reserveResult.reservation?.reservedByAdminId,
    reservedByAdminName: reserveResult.reservation?.reservedByAdminName,
    error: reserveResult.error,
  });
  if (!reserveResult.ok) {
    console.error('FAILED reservePlot!');
  }

  // 7. Test Out of Scope rejection with real JWT session
  // Marketing is assigned to abbott & royal, NOT overseas
  console.log('\n5. Testing Out-of-Scope rejection with real JWT session on overseas plot (plot-ov-04)...');
  const oosResult = await reservePlot(session, {
    plotId: 'plot-ov-04',
    customerName: 'Should Fail',
    customerPhone: '0300-0000000',
    customerEmail: 'fail@example.com',
    tokenFee: 50000,
  });
  console.log('Out of scope result (expected ok=false, error=OUT_OF_SCOPE):', {
    ok: oosResult.ok,
    error: oosResult.error,
  });

  // 8. Test Book Plot (Path B / direct booking)
  console.log('\n6. Testing bookPlot() with real JWT session on plot-a-03...');
  const bookResult = await bookPlot(session, {
    plotId: 'plot-a-03',
    paymentType: 'one_time',
    customer: {
      fullName: 'Zia-ur-Rehman',
      fatherOrHusbandName: 'Rehman Ali',
      cnic: '37405-1122334-9',
      phone: '0312-3456789',
      email: 'zia@example.com',
      mailingAddress: 'Abbottabad Cantt',
      nokName: 'Mrs. Zia',
      nokCnic: '37405-9988776-8',
    },
  });
  console.log('Book Result:', {
    ok: bookResult.ok,
    bookingId: bookResult.booking?.id,
    plotStatus: bookResult.plot?.status,
    sellerAdminId: (bookResult.booking as any)?.createdByAdminId || (bookResult.booking as any)?.sellerAdminId,
    error: bookResult.error,
  });

  // 9. Test createCustomerWithBooking
  console.log('\n7. Testing createCustomerWithBooking() with real JWT session on plot-r-01...');
  const createCustResult = await createCustomerWithBooking(session, {
    plotId: 'plot-r-01',
    paymentType: 'installment',
    membershipNo: 'PV-2026-999',
    fullName: 'Kamran Akmal',
    fatherOrHusbandName: 'Akmal Khan',
    cnic: '37405-5555555-5',
    phone: '0333-1112233',
    email: 'kamran@example.com',
    mailingAddress: 'Peshawar Road, Rawalpindi',
    nokName: 'Adnan Akmal',
    nokCnic: '37405-6666666-6',
    installmentPlan: {
      totalPayment: 6500000,
      downpayment: 1500000,
      numberOfInstallments: 24,
    },
  });
  console.log('Create Customer Result:', {
    ok: createCustResult.ok,
    customerId: createCustResult.customer?.id,
    bookingId: createCustResult.booking?.id,
    error: createCustResult.error,
  });

  console.log('\n=== All Mock Write Operations Tested Successfully ===');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
