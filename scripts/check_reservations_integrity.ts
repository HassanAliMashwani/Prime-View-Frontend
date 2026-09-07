import { initialReservations, initialPlots, initialBookings, initialBlocks } from '../src/lib/mock/seed';
import { eliteSeedPlots } from '../src/lib/map/eliteSeedPlots';

console.log('--- RESERVATIONS INTEGRITY AUDIT ---');
console.log('Total initialPlots in seed:', initialPlots.length);
console.log('Total initialReservations in seed:', initialReservations.length);

const plotMap = new Map(initialPlots.map((p) => [p.id, p]));

const missingReservations: any[] = [];

for (const r of initialReservations) {
  const p = plotMap.get(r.plotId);
  if (!p) {
    missingReservations.push(r);
    console.log(`❌ MISSING PLOT: Reservation ${r.id} (${r.customerName}) points to plotId="${r.plotId}" (Plot #${r.plotNumber}, Block="${r.blockId}") which DOES NOT EXIST in mockStore.plots!`);
  } else {
    console.log(`✅ FOUND: Reservation ${r.id} (${r.customerName}) -> Plot #${r.plotNumber} (${p.size}, ${p.category}) in ${p.blockId} Block.`);
  }
}

console.log('\n--- SUMMARY ---');
console.log('Total missing reservations:', missingReservations.length);
if (missingReservations.length > 0) {
  console.log('Missing items details:', JSON.stringify(missingReservations, null, 2));
}

// Also check if any initialBookings reference missing plots
console.log('\n--- BOOKINGS INTEGRITY AUDIT ---');
for (const b of initialBookings) {
  const p = plotMap.get(b.plotId);
  if (!p) {
    console.log(`❌ MISSING PLOT IN BOOKING: Booking ${b.id} points to plotId="${b.plotId}"!`);
  } else {
    console.log(`✅ FOUND IN BOOKING: Booking ${b.id} -> Plot #${p.plotNumber} (${p.size}, ${p.category}) in ${p.blockId} Block.`);
  }
}
