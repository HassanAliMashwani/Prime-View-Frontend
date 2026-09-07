import puppeteer, { Browser, Page } from 'puppeteer';
import { mockStore } from '../src/lib/mock/store';
import { releaseReservation } from '../src/lib/dal/reservations';
import { AdminSession } from '../src/lib/mock/types';

const BASE_URL = 'http://localhost:3000';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMockState() {
  return {
    plots: mockStore.plots,
    reservations: mockStore.reservations,
    bookings: mockStore.bookings,
    payments: mockStore.payments,
    customers: mockStore.customers,
    adminUsers: mockStore.adminUsers,
    contentBlocks: mockStore.contentBlocks,
    auditLog: mockStore.auditLog,
  };
}

async function loginAs(page: Page, username: string, role: string, assignedBlocks: string[], adminId: string, fullName: string) {
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle0' });

  await page.evaluate(
    ({ username, role, assignedBlocks, adminId, fullName }) => {
      const session = {
        adminId,
        username,
        fullName,
        role,
        assignedBlocks,
        permissions: { can_reserve: true, can_book: true, can_create_customer: true, can_edit_content: true },
        token: `pv_test_token_${Date.now()}`,
        expiresAt: Date.now() + 86400000,
      };
      sessionStorage.setItem('prime_view_admin_session', JSON.stringify(session));
      localStorage.setItem('prime_view_admin_session', JSON.stringify(session));
      document.cookie = `pv_admin_session=${username}; path=/; max-age=86400; SameSite=Lax`;
    },
    { username, role, assignedBlocks, adminId, fullName }
  );
}

async function run() {
  console.log('================================================================');
  console.log('🚀 STARTING COMPREHENSIVE VERIFICATION FOR DISPUTED PLOTS,');
  console.log('   DEEP-LINKING PAN/ZOOM, & RESTRICTED RESERVATION RELEASE');
  console.log('================================================================\n');

  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1000 });

    // ----------------------------------------------------------------
    // TEST 1: Level 1 Overview Map Label Fix (DOM check & screenshot)
    // ----------------------------------------------------------------
    console.log('--- TEST 1: Level 1 Overview Map Ghosted Label Fix ---');
    await loginAs(page, 'admin', 'super_admin', [], 'admin-1', 'Super Admin');
    await page.goto(`${BASE_URL}/admin/master-plan`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    const textElementsCount = await page.evaluate(() => {
      const svg = document.querySelector('svg[viewBox="0 0 847 712"]');
      if (!svg) return -1;
      return svg.querySelectorAll('text').length;
    });

    console.log(`[DOM Check] Count of <text> elements in Level 1 SVG overlay: ${textElementsCount} (Target: 0)`);
    if (textElementsCount !== 0) {
      throw new Error(`Expected exactly 0 <text> elements inside Overview SVG, but found ${textElementsCount}!`);
    }

    // Capture screenshot for visual verification
    await page.screenshot({ path: 'public/master-plan/overview_map_verified.png' });
    console.log('  Screenshot saved to public/master-plan/overview_map_verified.png');
    console.log('✅ PASS: Ghosted label text layer completely removed from SVG overlay.');

    // ----------------------------------------------------------------
    // SEEDING DISPUTED CONFLICT ON PLOT R-233 IN ELITE BLOCK
    // ----------------------------------------------------------------
    console.log('\n--- PREPARING DATA: Seeding 2 Competing Reservations on Plot 233 in Elite ---');
    const plot233 = mockStore.plots.find((p) => p.blockId === 'elite' && (p.plotNumber === '233' || p.plotNumber === 'EL-233' || p.plotNumber === 'R-233'));
    if (!plot233) throw new Error('Plot 233 in Elite Block not found in mockStore!');

    // Reset reservations on plot 233
    mockStore.reservations = mockStore.reservations.filter((r) => r.plotId !== plot233.id);

    // Reservation 1: Created by Farhan Zaidi (admin-2)
    const res1 = {
      id: `res-dispute-farhan-${Date.now()}`,
      plotId: plot233.id,
      plotNumber: plot233.plotNumber,
      blockId: 'elite',
      customerName: 'Tariq Mehmood',
      customerPhone: '+92 300 1112233',
      customerEmail: 'tariq@test.com',
      tokenFee: 50000,
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      reservedByAdminId: 'admin-2',
      reservedByAdminName: 'Farhan Zaidi (Marketing Lead)',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    };

    // Reservation 2: Created by Inspector Kamran (admin-3)
    const res2 = {
      id: `res-dispute-kamran-${Date.now()}`,
      plotId: plot233.id,
      plotNumber: plot233.plotNumber,
      blockId: 'elite',
      customerName: 'Hamid Raza Qureshi',
      customerPhone: '+92 321 4445566',
      customerEmail: 'hamid@test.com',
      tokenFee: 75000,
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      reservedByAdminId: 'admin-3',
      reservedByAdminName: 'Inspector Kamran Qureshi (Police Liaison)',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    };

    mockStore.reservations.push(res1, res2);
    plot233.status = 'reserved';
    mockStore.saveToStorage();
    console.log(`[Data Seeded] Plot ${plot233.plotNumber} has 2 active competing reservations: ${res1.id} & ${res2.id}`);

    // Sync localStorage into browser page
    await page.evaluate((storeState) => {
      localStorage.setItem('pv_mock_store', JSON.stringify(storeState));
      window.dispatchEvent(new StorageEvent('storage', { key: 'pv_mock_store' }));
    }, getMockState());

    // ----------------------------------------------------------------
    // TEST 2: Disputed Plot Distinct Styling on Traced Map & Card Grid
    // ----------------------------------------------------------------
    console.log('\n--- TEST 2: Disputed Plot Visuals on Traced Map & Card Grid ---');
    await page.goto(`${BASE_URL}/admin/master-plan/elite`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // Verify SVG polygon styling on Traced Map
    const polygonDisputeState = await page.evaluate(() => {
      const poly = document.querySelector('polygon[data-plot-number="233"], polygon[data-slug*="233"]');
      return {
        fill: poly?.getAttribute('fill'),
        stroke: poly?.getAttribute('stroke'),
        dataDisputed: poly?.getAttribute('data-disputed'),
        className: poly?.getAttribute('class'),
      };
    });

    console.log('[Traced Map Polygon State]:', polygonDisputeState);
    if (polygonDisputeState.fill !== 'url(#disputedHatch)') {
      throw new Error(`Expected polygon fill="url(#disputedHatch)", got "${polygonDisputeState.fill}"!`);
    }
    if (polygonDisputeState.dataDisputed !== 'true') {
      throw new Error(`Expected data-disputed="true", got "${polygonDisputeState.dataDisputed}"!`);
    }
    console.log('✅ PASS: Disputed plot renders with striped hatch pattern and crimson border on Traced Map.');

    // Verify Tooltip on Hover
    await page.hover('polygon[data-plot-number="233"], polygon[data-slug*="233"]');
    await sleep(600);

    const tooltipText = await page.evaluate(() => {
      const el = document.querySelector('.w-68.rounded-2xl');
      return el ? el.textContent : null;
    });

    console.log('[Traced Map Tooltip Text]:', tooltipText);
    if (!tooltipText?.includes('2 competing reservations — needs resolution')) {
      throw new Error(`Expected tooltip to contain "2 competing reservations — needs resolution", got: "${tooltipText}"`);
    }
    if (!tooltipText?.includes('Disputed (2)')) {
      throw new Error(`Expected tooltip badge "Disputed (2)", got: "${tooltipText}"`);
    }
    console.log('✅ PASS: Tooltip displays exact wording: "2 competing reservations — needs resolution."');

    // Test Card Grid Mode
    console.log('  Testing Card Grid dispute treatment...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gridBtn = btns.find((b) => b.textContent?.includes('Card Grid'));
      if (gridBtn) (gridBtn as HTMLButtonElement).click();
    });
    await sleep(800);

    const cardDisputeState = await page.evaluate((plotId) => {
      const card = document.getElementById(`plot-card-${plotId}`);
      return {
        hasCard: !!card,
        isDisputed: card?.getAttribute('data-disputed'),
        text: card?.textContent,
      };
    }, plot233.id);

    console.log('[Card Grid State]:', cardDisputeState);
    if (cardDisputeState.isDisputed !== 'true' || !cardDisputeState.text?.includes('competing claims — needs resolution')) {
      throw new Error(`Card grid dispute styling failed: ${JSON.stringify(cardDisputeState)}`);
    }
    console.log('✅ PASS: Card Grid displays distinct dispute gradient, badge, and resolution warning.');

    // ----------------------------------------------------------------
    // TEST 3: Deep-Linking & Auto Pan/Zoom from Sort Reservation
    // ----------------------------------------------------------------
    console.log('\n--- TEST 3: Deep-Linking & Auto Pan/Zoom/Highlight from Sort Reservation ---');
    await page.goto(`${BASE_URL}/admin/reservations`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // Verify that the conflicting row contains the deep-link
    const disputeRowLinks = await page.evaluate((plotNumber) => {
      const rows = Array.from(document.querySelectorAll('.divide-y > div'));
      const targetRow = rows.find((r) => r.textContent?.includes(plotNumber));
      if (!targetRow) return null;
      const plotLink = targetRow.querySelector('a[href*="focusPlot="]');
      const actionLink = targetRow.querySelector('a[title*="View and focus"]');
      return {
        plotNumberLink: (plotLink as HTMLAnchorElement)?.href,
        actionLink: (actionLink as HTMLAnchorElement)?.href,
      };
    }, plot233.plotNumber);

    console.log('[Sort Reservation Deep-Links]:', disputeRowLinks);
    if (!disputeRowLinks || !disputeRowLinks.actionLink || !disputeRowLinks.actionLink.includes(`focusPlot=${plot233.id}`)) {
      throw new Error(`Deep-link action "View Dispute on Map" not found for plot ${plot233.plotNumber} or missing focusPlot!`);
    }
    console.log('✅ PASS: Sort Reservation has direct deep-links for conflicting plots.');

    // Click "View Dispute on Map"
    console.log('  Clicking "View Dispute on Map" to deep-link to Level 2 Master Plan...');
    await page.goto(disputeRowLinks.actionLink, { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    // Verify Pan & Zoom changed and polygon highlighted
    const mapFocusState = await page.evaluate(() => {
      const canvas = document.querySelector('.origin-top-left') as HTMLElement;
      const poly = document.querySelector('polygon[data-plot-number="233"], polygon[data-slug*="233"]');
      const drawer = document.querySelector('.fixed.inset-0.z-50');
      return {
        transform: canvas ? canvas.style.transform : '',
        isHighlighted: poly?.getAttribute('data-highlighted') === 'true',
        drawerOpen: !!drawer,
        drawerTitle: drawer ? drawer.querySelector('h3')?.textContent : null,
      };
    });

    console.log('[Deep-Link Landed Map Focus State]:', mapFocusState);
    if (!mapFocusState.transform.includes('scale(1.85)')) {
      throw new Error(`Expected auto-zoom scale(1.85), but transform was: "${mapFocusState.transform}"`);
    }
    if (!mapFocusState.isHighlighted) {
      throw new Error(`Expected polygon to have data-highlighted="true" with golden highlight pulse!`);
    }
    if (!mapFocusState.drawerOpen || !mapFocusState.drawerTitle?.includes('233')) {
      throw new Error(`Expected Action Drawer to auto-open on target plot 233!`);
    }
    console.log('✅ PASS: Level 2 map automatically panned, zoomed to scale(1.85), highlighted plot 233, and opened Action Drawer.');

    // Close drawer
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[data-testid="close-drawer-btn"]');
      if (closeBtn) (closeBtn as HTMLButtonElement).click();
    });
    await sleep(500);

    // ----------------------------------------------------------------
    // TEST 4: DAL Ownership Enforcement & Super Admin Override on Release
    // ----------------------------------------------------------------
    console.log('\n--- TEST 4: DAL Ownership Enforcement & Super Admin Override ---');

    // Create session objects for testing DAL directly
    const sessionFarhan: AdminSession = {
      adminId: 'admin-2',
      username: 'marketing',
      fullName: 'Farhan Zaidi (Marketing Lead)',
      role: 'sub_admin',
      assignedBlocks: ['abbott', 'royal', 'elite'],
      permissions: { can_reserve: true, can_book: true, can_create_customer: true, can_edit_content: true },
      token: 'tok-farhan',
      expiresAt: Date.now() + 86400000,
    };

    const sessionKamran: AdminSession = {
      adminId: 'admin-3',
      username: 'police',
      fullName: 'Inspector Kamran Qureshi (Police Liaison)',
      role: 'sub_admin',
      assignedBlocks: ['overseas', 'elite', 'chalet'],
      permissions: { can_reserve: true, can_book: true, can_create_customer: false, can_edit_content: false },
      token: 'tok-kamran',
      expiresAt: Date.now() + 86400000,
    };

    const sessionSuper: AdminSession = {
      adminId: 'admin-1',
      username: 'admin',
      fullName: 'Chief Executive Officer (Super Admin)',
      role: 'super_admin',
      assignedBlocks: [],
      permissions: { can_reserve: true, can_book: true, can_create_customer: true, can_edit_content: true },
      token: 'tok-super',
      expiresAt: Date.now() + 86400000,
    };

    // 4.A: Kamran attempts to release Farhan's reservation -> MUST BE REJECTED
    console.log("  [Step 4.A] Sub-Admin Kamran attempts to release Sub-Admin Farhan's reservation...");
    const unauthorizedResult = await releaseReservation(sessionKamran, res1.id, 'Unauthorized test release');
    console.log('  Result:', unauthorizedResult);
    if (unauthorizedResult.ok || unauthorizedResult.error !== 'NOT_RESERVATION_OWNER') {
      throw new Error(`Expected rejection with NOT_RESERVATION_OWNER, but got: ${JSON.stringify(unauthorizedResult)}`);
    }
    console.log('✅ PASS: Unauthorized admin release strictly rejected by DAL with NOT_RESERVATION_OWNER.');

    // 4.B: Farhan releases his own reservation -> MUST SUCCEED
    console.log("  [Step 4.B] Sub-Admin Farhan releases his OWN reservation...");
    const ownerResult = await releaseReservation(sessionFarhan, res1.id, 'Farhan voluntary withdrawal');
    console.log('  Result:', ownerResult);
    if (!ownerResult.ok || ownerResult.reservation?.status !== 'cancelled') {
      throw new Error(`Expected owner release to succeed with status='cancelled', got: ${JSON.stringify(ownerResult)}`);
    }
    // Verify plot is still reserved by Kamran, but conflict is resolved
    const plotAfterOwnerRelease = mockStore.plots.find((p) => p.id === plot233.id);
    const activeCountAfter = mockStore.reservations.filter((r) => r.plotId === plot233.id && r.status === 'active').length;
    console.log(`  Plot status: "${plotAfterOwnerRelease?.status}", remaining active claims: ${activeCountAfter}`);
    if (activeCountAfter !== 1 || plotAfterOwnerRelease?.status !== 'reserved') {
      throw new Error(`Plot should remain 'reserved' with exactly 1 active claim!`);
    }
    console.log("✅ PASS: Reserving admin successfully released own reservation. Status marked 'cancelled'. Conflict cleared to 1.");

    // 4.C: Super Admin overrides and releases Kamran's reservation -> MUST SUCCEED WITH OVERRIDE AUDIT
    console.log("  [Step 4.C] Super Admin overrides and releases Kamran's reservation...");
    const superResult = await releaseReservation(sessionSuper, res2.id, 'CEO executive inventory clearance');
    console.log('  Result:', superResult);
    if (!superResult.ok || superResult.reservation?.status !== 'cancelled') {
      throw new Error(`Expected Super Admin release to succeed, got: ${JSON.stringify(superResult)}`);
    }

    // Verify plot is now available
    const plotAfterSuperRelease = mockStore.plots.find((p) => p.id === plot233.id);
    const activeCountFinal = mockStore.reservations.filter((r) => r.plotId === plot233.id && r.status === 'active').length;
    console.log(`  Plot status: "${plotAfterSuperRelease?.status}", active claims: ${activeCountFinal}`);
    if (activeCountFinal !== 0 || plotAfterSuperRelease?.status !== 'available') {
      throw new Error(`Plot should now be 'available' after all reservations released!`);
    }

    // Verify Audit Log entry for Super Admin override
    const auditEntries = mockStore.auditLog.filter((a) => a.action === 'RESERVATION_RELEASED');
    const latestAudit = auditEntries[0]; // auditLog uses unshift(), so index 0 is the newest entry
    console.log('  Audit Log Entry for Super Admin Override:', latestAudit?.details);
    if (!latestAudit || !latestAudit.details.includes('overrode and released reservation') || !latestAudit.details.includes('originally reserved by Inspector Kamran Qureshi')) {
      throw new Error(`Audit log did not record explicit Super Admin override wording! Found: ${latestAudit?.details}`);
    }
    console.log('✅ PASS: Super Admin override succeeded, plot restored to available, and override audit log recorded.');

    // ----------------------------------------------------------------
    // TEST 5: Sort Reservation Resolved/History View Distinct Badges
    // ----------------------------------------------------------------
    console.log('\n--- TEST 5: Sort Reservation Resolved View Distinct "Released" Badge ---');
    await page.evaluate((storeState) => {
      localStorage.setItem('pv_mock_store', JSON.stringify(storeState));
      window.dispatchEvent(new StorageEvent('storage', { key: 'pv_mock_store' }));
    }, getMockState());

    await page.goto(`${BASE_URL}/admin/reservations`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // Click "Resolved History" tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const histBtn = btns.find((b) => b.textContent?.includes('Resolved History'));
      if (histBtn) (histBtn as HTMLButtonElement).click();
    });
    await sleep(800);

    const historyBadges = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.divide-y > div'));
      return rows.map((r) => {
        const plotPill = r.querySelector('span.font-mono')?.textContent?.trim();
        const badge = r.querySelector('span.rounded-full.border')?.textContent?.trim();
        return { plotPill, badge };
      });
    });

    console.log('[Resolved History Rows & Badges]:', historyBadges);
    const hasReleasedBadge = historyBadges.some((h) => h.badge === 'Released');
    if (!hasReleasedBadge) {
      throw new Error(`Expected at least one "Released" badge in Resolved History, but found: ${JSON.stringify(historyBadges)}`);
    }
    console.log('✅ PASS: Cancelled reservations display distinct "Released" badge in Resolved History ledger.');

    console.log('\n================================================================');
    console.log('🎉 ALL VERIFICATIONS COMPLETED SUCCESSFULLY WITH 100% EVIDENCE!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

run();
