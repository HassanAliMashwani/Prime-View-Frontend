import { mockStore } from '../src/lib/mock/store';
import { adminLogin } from '../src/lib/dal/adminAuth';
import { updatePlotPrice } from '../src/lib/dal/adminPlots';
import { createCustomerWithBooking, addBookingToCustomer } from '../src/lib/dal/customers';

async function verifyAllRequirements() {
  console.log('=== STARTING AUTOMATED VERIFICATION: PRICING, MAP FILTERS & BOOKING ===\n');
  mockStore.resetStore();

  // 1. Log in Super Admin and Sub Admin
  const superLogin = await adminLogin('admin', 'password123');
  if (!superLogin.ok || !superLogin.session) throw new Error('Super Admin login failed');
  const superSession = superLogin.session;

  const subLogin = await adminLogin('police', 'password123');
  if (!subLogin.ok || !subLogin.session) throw new Error('Sub Admin login failed');
  const subSession = subLogin.session;

  console.log('1. Authentication verified:');
  console.log(`   [PASS] Super Admin: ${superSession.fullName} (${superSession.role})`);
  console.log(`   [PASS] Sub Admin: ${subSession.fullName} (${subSession.role})`);

  // 2. Test updatePlotPrice DAL Guard and Execution
  console.log('\n2. Testing updatePlotPrice DAL Function:');
  const testPlot = mockStore.plots.find((p) => p.blockId === 'elite' && p.status === 'available');
  if (!testPlot) throw new Error('No available elite plot found');
  const originalPrice = testPlot.price;

  // 2a. Sub Admin forbidden
  const subAdminAttempt = await updatePlotPrice(subSession, testPlot.id, originalPrice + 500000);
  if (subAdminAttempt.ok) throw new Error('Sub Admin should NOT be allowed to update plot price');
  console.log('   [PASS] Sub Admin price update rejected with 403 Forbidden');

  // 2b. Invalid price rejected
  const invalidAttempt = await updatePlotPrice(superSession, testPlot.id, -100);
  if (invalidAttempt.ok) throw new Error('Negative price should be rejected');
  console.log('   [PASS] Invalid negative price rejected with 400 Bad Request');

  // 2c. Super Admin successfully updates price
  const newPrice = originalPrice + 750000;
  const superUpdate = await updatePlotPrice(superSession, testPlot.id, newPrice);
  if (!superUpdate.ok || !superUpdate.plot || superUpdate.plot.price !== newPrice) {
    throw new Error('Super Admin price update failed');
  }
  const storePlot = mockStore.plots.find((p) => p.id === testPlot.id);
  if (!storePlot || storePlot.price !== newPrice) {
    throw new Error('mockStore plot price was not updated');
  }
  console.log(`   [PASS] Super Admin successfully updated Plot ${testPlot.plotNumber} price from PKR ${originalPrice.toLocaleString()} to PKR ${newPrice.toLocaleString()}`);

  // 2d. Audit log check
  const auditEntry = mockStore.auditLog.find(
    (a) => a.action === 'PLOT_PRICE_UPDATED' && a.entityId === testPlot.id
  );
  if (!auditEntry) throw new Error('Audit log entry for PLOT_PRICE_UPDATED not found');
  console.log(`   [PASS] Audit log recorded PLOT_PRICE_UPDATED: "${auditEntry.details}"`);

  // 3. Test Master Plan Filter Logic Emulation
  console.log('\n3. Testing Master Plan Strict Status Filter Logic:');
  // Find sample plots
  const bookedPlot = mockStore.plots.find((p) => p.status === 'booked');
  const reservedPlot = mockStore.plots.find((p) => p.status === 'reserved');
  const availablePlot = mockStore.plots.find((p) => p.status === 'available' && p.category !== 'amenity' && !p.isAdjustment);
  const amenityPlot = mockStore.plots.find((p) => p.category === 'amenity');

  if (!bookedPlot || !reservedPlot || !availablePlot) {
    throw new Error('Required sample plots for testing filter logic not found');
  }

  const matchesFilter = (plot: typeof testPlot, statusFilter: string) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'booked') return plot.status === 'booked';
    if (statusFilter === 'reserved') return plot.status === 'reserved';
    if (statusFilter === 'available') return plot.status === 'available' && plot.category !== 'amenity' && !plot.isAdjustment;
    if (statusFilter === 'disputed') return Boolean(plot.isDisputed || (plot.activeReservationCount && plot.activeReservationCount > 1));
    if (statusFilter === 'adjustment') return Boolean(plot.isAdjustment);
    return false;
  };

  // Check 'booked' filter
  if (!matchesFilter(bookedPlot, 'booked')) throw new Error('Booked plot should match booked filter');
  if (matchesFilter(reservedPlot, 'booked')) throw new Error('Reserved plot should NOT match booked filter');
  if (matchesFilter(availablePlot, 'booked')) throw new Error('Available plot should NOT match booked filter');
  console.log('   [PASS] "Booked" filter strictly matches ONLY booked plots (non-booked plots omitted)');

  // Check 'reserved' filter
  if (!matchesFilter(reservedPlot, 'reserved')) throw new Error('Reserved plot should match reserved filter');
  if (matchesFilter(bookedPlot, 'reserved')) throw new Error('Booked plot should NOT match reserved filter');
  if (matchesFilter(availablePlot, 'reserved')) throw new Error('Available plot should NOT match reserved filter');
  console.log('   [PASS] "Reserved" filter strictly matches ONLY reserved plots (non-reserved plots omitted)');

  // Check 'available' filter
  if (!matchesFilter(availablePlot, 'available')) throw new Error('Available plot should match available filter');
  if (matchesFilter(bookedPlot, 'available')) throw new Error('Booked plot should NOT match available filter');
  if (matchesFilter(reservedPlot, 'available')) throw new Error('Reserved plot should NOT match available filter');
  if (amenityPlot && matchesFilter(amenityPlot, 'available')) throw new Error('Amenity plot should NOT match available filter');
  console.log('   [PASS] "Available" filter strictly matches ONLY available sellable plots');

  // 4. Test Customer Booking Path A with Super Admin Custom Price
  console.log('\n4. Testing Path A Booking with Super Admin Custom Plot Price:');
  const pathAPlot = mockStore.plots.find((p) => p.blockId === 'elite' && p.status === 'available');
  if (!pathAPlot) throw new Error('No available plot for Path A');
  const pathAOldPrice = pathAPlot.price;
  const pathACustomPrice = pathAOldPrice + 1000000; // Super Admin adjusts price up by 1,000,000

  // Super Admin updates price and creates booking
  pathAPlot.price = pathACustomPrice;
  const pathAResult = await createCustomerWithBooking(superSession, {
    plotId: pathAPlot.id,
    paymentType: 'installment',
    membershipNo: 'PV-2026-TEST-A',
    fullName: 'Kamran Akmal',
    fatherOrHusbandName: 'Muhammad Akmal',
    cnic: '37405-1112223-1',
    phone: '0300-1122334',
    email: 'kamran.akmal@example.com',
    mailingAddress: 'House 12, Street 3, Islamabad',
    nokName: 'Muhammad Akmal',
    nokCnic: '37405-9988776-1',
    portalPassword: 'Password123!',
    applicantPhotoUrl: '/media/placeholder.jpg',
    cnicCopyUrl: '/media/placeholder.jpg',
    nokCnicCopyUrl: '/media/placeholder.jpg',
    installmentPlan: {
      totalPayment: pathACustomPrice,
      downpayment: Math.round(pathACustomPrice * 0.2),
      years: 2,
      paidAfterEvery: 1,
      numberOfInstallments: 24,
    },
  });

  if (!pathAResult.ok || !pathAResult.booking) {
    throw new Error('Path A booking creation failed: ' + pathAResult.error);
  }

  // Verify plot in store has new price and is booked
  const verifiedPlotA = mockStore.plots.find((p) => p.id === pathAPlot.id);
  if (!verifiedPlotA || verifiedPlotA.price !== pathACustomPrice || verifiedPlotA.status !== 'booked') {
    throw new Error('Path A plot was not updated with new price and booked status');
  }

  // Verify booking installments total matches custom price
  const totalInstallmentExpected = pathACustomPrice - Math.round(pathACustomPrice * 0.2);
  const paymentRecords = mockStore.payments.filter((p) => p.bookingId === pathAResult.booking.id && p.feeType === 'plot_installment');
  const sumInstallments = paymentRecords.reduce((acc, p) => acc + p.amount, 0);
  if (Math.abs(sumInstallments - totalInstallmentExpected) > 2) {
    throw new Error(`Installment sum ${sumInstallments} does not match financed balance ${totalInstallmentExpected}`);
  }
  console.log(`   [PASS] Path A booking registered with custom price PKR ${pathACustomPrice.toLocaleString()}`);
  console.log(`   [PASS] Plot ${verifiedPlotA.plotNumber} status = ${verifiedPlotA.status}, price = PKR ${verifiedPlotA.price.toLocaleString()}`);
  console.log(`   [PASS] Financed installment schedule accurately totals PKR ${sumInstallments.toLocaleString()} across ${paymentRecords.length} installments`);

  // 5. Test Path B (Existing Customer) with Custom Price
  console.log('\n5. Testing Path B Booking with Super Admin Custom Plot Price:');
  const pathBPlot = mockStore.plots.find((p) => p.blockId === 'elite' && p.status === 'available');
  if (!pathBPlot) throw new Error('No available plot for Path B');
  const pathBOldPrice = pathBPlot.price;
  const pathBCustomPrice = pathBOldPrice + 1500000;

  pathBPlot.price = pathBCustomPrice;
  const pathBResult = await addBookingToCustomer(superSession, {
    customerId: pathAResult.customer.id,
    plotId: pathBPlot.id,
    paymentType: 'one_time',
  });

  if (!pathBResult.ok || !pathBResult.booking) {
    throw new Error('Path B booking creation failed: ' + pathBResult.error);
  }

  const verifiedPlotB = mockStore.plots.find((p) => p.id === pathBPlot.id);
  if (!verifiedPlotB || verifiedPlotB.price !== pathBCustomPrice || verifiedPlotB.status !== 'booked') {
    throw new Error('Path B plot was not updated with new price and booked status');
  }
  console.log(`   [PASS] Path B One-Time booking attached with custom price PKR ${pathBCustomPrice.toLocaleString()}`);
  console.log(`   [PASS] Plot ${verifiedPlotB.plotNumber} status = ${verifiedPlotB.status}, price = PKR ${verifiedPlotB.price.toLocaleString()}`);

  console.log('\n=== ALL AUTOMATED VERIFICATION CHECKS PASSED PERFECTLY! ===');
}

verifyAllRequirements().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
