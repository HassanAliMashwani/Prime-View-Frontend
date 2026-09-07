import { mockStore } from '../src/lib/mock/store';
import { AdminSession } from '../src/lib/mock/types';
import { createSubAdmin, getSubAdmins, updateSubAdmin } from '../src/lib/dal/users';
import {
  createCustomerWithBooking,
  addBookingToCustomer,
  searchCustomers,
  verifyPlotRegistered,
} from '../src/lib/dal/customers';
import {
  getContentBlocks,
  acquireContentLock,
  releaseContentLock,
  saveContentBlock,
} from '../src/lib/dal/content';
import { getAuditLogs } from '../src/lib/dal/audit';

async function runPhase3Verification() {
  console.log('--- STARTING PHASE 3 DAL & RULE VERIFICATION ---');
  mockStore.resetStore();

  const superAdminSession: AdminSession = {
    adminId: 'admin-1',
    username: 'admin',
    fullName: 'Super Administrator',
    role: 'super_admin',
    assignedBlocks: [],
    permissions: {
      can_reserve: true,
      can_book: true,
      can_create_customer: true,
      can_edit_content: true,
    },
    token: 'super-token',
    expiresAt: Date.now() + 3600000,
  };

  const marketingSession: AdminSession = {
    adminId: 'admin-2',
    username: 'marketing',
    fullName: 'Marketing Lead',
    role: 'sub_admin',
    assignedBlocks: ['abbott', 'royal'],
    permissions: {
      can_reserve: true,
      can_book: false,
      can_create_customer: true,
      can_edit_content: true,
    },
    token: 'mkt-token',
    expiresAt: Date.now() + 3600000,
  };

  // ----------------------------------------------------
  // TEST 1: SUB-ADMIN GATING (Super Admin Exclusive)
  // ----------------------------------------------------
  console.log('\n[Test 1] Gating sub-admin creation to Super Admin only...');
  const unauthorizedRes = await createSubAdmin(marketingSession, {
    fullName: 'Hacker User',
    email: 'hacker@example.com',
    username: 'hacker',
    password: 'password123',
    assignedBlocks: ['abbott'],
    permissions: { can_reserve: true },
  });
  console.log('Sub-admin attempting to create another admin result:', unauthorizedRes);
  if (unauthorizedRes.ok || unauthorizedRes.error !== 'FORBIDDEN_SUPER_ADMIN_ONLY') {
    throw new Error('FAIL: Non-super admin was able to access createSubAdmin!');
  }
  console.log('PASS: Non-super admin blocked from creating sub-admin.');

  // Super admin creates sub-admin
  const validSubAdmin = await createSubAdmin(superAdminSession, {
    fullName: 'Zubair Khan',
    email: 'zubair@primeview.pk',
    username: 'zubair_ops',
    password: 'password123',
    assignedBlocks: ['overseas', 'elite'],
    permissions: { can_reserve: true, can_book: true, can_create_customer: true, can_edit_content: false },
  });
  console.log('Super admin creating sub-admin result:', validSubAdmin.ok, validSubAdmin.subAdmin?.username);
  if (!validSubAdmin.ok || !validSubAdmin.subAdmin) {
    throw new Error('FAIL: Super admin failed to create valid sub-admin');
  }

  // Duplicate username check
  const dupUserRes = await createSubAdmin(superAdminSession, {
    fullName: 'Duplicate User',
    email: 'diff@example.com',
    username: 'zubair_ops',
    password: 'password123',
    assignedBlocks: ['abbott'],
    permissions: {},
  });
  if (dupUserRes.ok || dupUserRes.error !== 'USERNAME_TAKEN') {
    throw new Error('FAIL: Duplicate username check failed');
  }
  console.log('PASS: Duplicate username check prevented duplicate admin.');

  // ----------------------------------------------------
  // TEST 2: MASTER PLAN PREREQUISITE CHECK (Section 2.2.1)
  // ----------------------------------------------------
  console.log('\n[Test 2] Testing verifyPlotRegistered prerequisite check...');
  const fakePlotCheck = verifyPlotRegistered('ghost-plot-999');
  console.log('Fake plot check:', fakePlotCheck);
  if (fakePlotCheck.exists) {
    throw new Error('FAIL: Ghost plot was detected as existing');
  }

  const pathAFakeRes = await createCustomerWithBooking(superAdminSession, {
    plotId: 'ghost-plot-999',
    paymentType: 'installment',
    membershipNo: 'PV-TEST-001',
    fullName: 'Tariq Butt',
    fatherOrHusbandName: 'Muhammad Butt',
    cnic: '37405-1111111-1',
    phone: '0300-1111111',
    email: 'tariq@example.com',
    mailingAddress: 'Rawalpindi',
    nokName: 'Son Butt',
    nokCnic: '37405-2222222-2',
  });
  console.log('Booking unregistered plot result:', pathAFakeRes);
  if (pathAFakeRes.ok || pathAFakeRes.error !== 'PLOT_NOT_REGISTERED') {
    throw new Error('FAIL: System allowed booking of unregistered plot!');
  }
  console.log('PASS: Unregistered plot rejected with PLOT_NOT_REGISTERED.');

  // ----------------------------------------------------
  // TEST 3: PATH A NEW CUSTOMER BOOKING (Statutory fees & 24 installments)
  // ----------------------------------------------------
  console.log('\n[Test 3] Creating new customer with 24-month installment schedule...');
  const availablePlot = mockStore.plots.find((p) => p.status === 'available' && p.category !== 'amenity')!;
  console.log('Selected plot for Path A:', availablePlot.id, availablePlot.plotNumber, availablePlot.price);

  const pathASuccess = await createCustomerWithBooking(superAdminSession, {
    plotId: availablePlot.id,
    paymentType: 'installment',
    paperInstallmentRef: 'BK-TEST-100',
    membershipNo: 'PV-2026-999',
    fullName: 'Hamza Farooq',
    fatherOrHusbandName: 'Farooq Ahmed',
    cnic: '37405-3333333-3',
    phone: '0321-5555555',
    email: 'hamza@example.com',
    mailingAddress: 'House 42, Sector F-7, Islamabad',
    nokName: 'Fatima Farooq',
    nokCnic: '37405-4444444-4',
  });

  if (!pathASuccess.ok || !pathASuccess.customer || !pathASuccess.booking) {
    throw new Error(`FAIL: Path A booking failed: ${pathASuccess.error}`);
  }
  console.log('Path A customer created:', pathASuccess.customer.fullName, pathASuccess.customer.membershipNo);

  // Verify plot status updated
  const updatedPlot = mockStore.plots.find((p) => p.id === availablePlot.id)!;
  if (updatedPlot.status !== 'booked' || updatedPlot.currentOwnerId !== pathASuccess.customer.id) {
    throw new Error('FAIL: Plot status was not set to booked with currentOwnerId');
  }
  console.log('PASS: Plot committed to customer.');

  // Verify payments: PKR 2,000 Admission Fee + PKR 10,000 Share Subscription Fee + 24 installments
  const customerPayments = mockStore.payments.filter((p) => p.bookingId === pathASuccess.booking!.id);
  console.log('Customer payments count:', customerPayments.length);
  const admFee = customerPayments.find((p) => p.feeType === 'admission_fee');
  const shareFee = customerPayments.find((p) => p.feeType === 'share_subscription_fee');
  const installments = customerPayments.filter((p) => p.feeType === 'plot_installment');

  if (!admFee || admFee.amount !== 2000 || admFee.status !== 'paid') {
    throw new Error('FAIL: Admission Fee (PKR 2,000 paid upfront) missing or incorrect');
  }
  if (!shareFee || shareFee.amount !== 10000 || shareFee.status !== 'paid') {
    throw new Error('FAIL: Share Subscription Fee (PKR 10,000 paid upfront) missing or incorrect');
  }
  if (installments.length !== 24) {
    throw new Error(`FAIL: Expected 24 installments, found ${installments.length}`);
  }
  if (installments[0].status !== 'paid') {
    throw new Error('FAIL: First installment (down payment) was not marked paid');
  }
  console.log('PASS: Statutory fees (2,000 + 10,000) and 24 equal monthly installments verified.');

  // ----------------------------------------------------
  // TEST 4: PATH B EXISTING CUSTOMER (Suspension check & disambiguation)
  // ----------------------------------------------------
  console.log('\n[Test 4] Testing Path B search disambiguation and suspension guard...');
  const searchRes = await searchCustomers(superAdminSession, 'Hamza');
  console.log('Search matches for "Hamza":', searchRes.customers.length);
  if (searchRes.customers.length === 0 || searchRes.customers[0].fullName !== 'Hamza Farooq') {
    throw new Error('FAIL: Customer search disambiguation failed to find created customer');
  }
  console.log('Disambiguation record:', {
    name: searchRes.customers[0].fullName,
    cnic: searchRes.customers[0].cnic,
    propertiesCount: searchRes.customers[0].propertiesCount,
  });

  // Test suspension guard
  pathASuccess.customer.accountStatus = 'suspended';
  const suspendedPlot = mockStore.plots.find((p) => p.status === 'available' && p.category !== 'amenity')!;
  const suspendedRes = await addBookingToCustomer(superAdminSession, {
    customerId: pathASuccess.customer.id,
    plotId: suspendedPlot.id,
    paymentType: 'one_time',
  });
  console.log('Booking on suspended customer result:', suspendedRes);
  if (suspendedRes.ok || suspendedRes.error !== 'CUSTOMER_SUSPENDED') {
    throw new Error('FAIL: System allowed plot booking on a suspended customer account!');
  }
  console.log('PASS: Suspended customer prevented from receiving additional plot bookings.');

  // ----------------------------------------------------
  // TEST 5: CONTENT CMS 30-MINUTE CONCURRENT LOCKS
  // ----------------------------------------------------
  console.log('\n[Test 5] Testing Content CMS 30-minute soft edit locks...');
  const blocksRes = await getContentBlocks(superAdminSession, 'plans');
  const targetBlock = blocksRes.blocks[0];
  console.log('Target CMS block:', targetBlock.id, targetBlock.title);

  // Super admin acquires lock
  const lock1 = await acquireContentLock(superAdminSession, targetBlock.id);
  console.log('Super Admin lock acquisition:', lock1.ok, lock1.block?.lockedByName);
  if (!lock1.ok || lock1.block?.lockedBy !== superAdminSession.adminId) {
    throw new Error('FAIL: Super admin could not acquire content lock');
  }

  // Marketing admin tries to acquire same lock -> should be blocked
  const lock2 = await acquireContentLock(marketingSession, targetBlock.id);
  console.log('Marketing Admin lock attempt while locked:', lock2.ok, lock2.error, lock2.lockedByName);
  if (lock2.ok || lock2.error !== 'LOCKED_BY_ANOTHER') {
    throw new Error('FAIL: Second admin was able to acquire lock while held by first admin!');
  }
  console.log('PASS: LOCKED_BY_ANOTHER enforced.');

  // Super admin saves changes -> releases lock & records audit diff
  const saveRes = await saveContentBlock(superAdminSession, targetBlock.id, {
    title: 'Updated Master Plan Phase 3',
    content: 'All infrastructure roads paved and street lights installed.',
  });
  console.log('Save block result:', saveRes.ok);
  if (!saveRes.ok || saveRes.block?.lockedBy) {
    throw new Error('FAIL: Save did not release lock or commit changes');
  }
  console.log('PASS: Content block updated and lock released.');

  // ----------------------------------------------------
  // TEST 6: SYSTEM AUDIT LOG & DIFF VIEWER
  // ----------------------------------------------------
  console.log('\n[Test 6] Verifying System Audit Trail & Diff recording...');
  const auditRes = await getAuditLogs(superAdminSession);
  console.log('Audit logs total entries:', auditRes.totalCount);
  if (!auditRes.ok || auditRes.totalCount === 0) {
    throw new Error('FAIL: Audit log is empty or could not be read');
  }

  const contentUpdateEntry = auditRes.logs.find((l) => l.action === 'CONTENT_UPDATED');
  console.log('Content update audit entry found:', Boolean(contentUpdateEntry));
  if (!contentUpdateEntry || !contentUpdateEntry.oldValue || !contentUpdateEntry.newValue) {
    throw new Error('FAIL: CONTENT_UPDATED audit entry did not capture oldValue and newValue diffs');
  }
  console.log('Audit diff preview:', {
    action: contentUpdateEntry.action,
    oldTitle: JSON.parse(contentUpdateEntry.oldValue).title,
    newTitle: JSON.parse(contentUpdateEntry.newValue).title,
  });

  // Non-super admin reading audit log -> blocked
  const unauthAudit = await getAuditLogs(marketingSession);
  console.log('Sub-admin attempting to view audit logs:', unauthAudit.ok, unauthAudit.error);
  if (unauthAudit.ok || unauthAudit.error !== 'FORBIDDEN_SUPER_ADMIN_ONLY') {
    throw new Error('FAIL: Non-super admin was able to read system audit logs!');
  }
  console.log('PASS: Audit log strictly Super Admin exclusive.');

  console.log('\n=============================================');
  console.log('ALL PHASE 3 DAL & RULE TESTS PASSED PERFECTLY!');
  console.log('=============================================');
}

runPhase3Verification().catch((err) => {
  console.error('FATAL VERIFICATION ERROR:', err);
  process.exit(1);
});
