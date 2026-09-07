import puppeteer from 'puppeteer-core';
import { mockStore } from '../src/lib/mock/store';
import { initialPlots, initialReservations } from '../src/lib/mock/seed';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginAs(page: any, username: string, role: string, assignedBlocks: string[] = [], adminId = 'admin-1', fullName = 'Chief Executive Officer (Super Admin)') {
  const sessionData = {
    token: `tok-${username}-${Date.now()}`,
    adminId,
    username,
    fullName,
    role,
    assignedBlocks,
    permissions: {
      can_reserve: true,
      can_book: true,
      can_create_customer: true,
      can_edit_content: true,
    },
    expiresAt: Date.now() + 86400000,
  };

  await page.evaluate((data: any) => {
    sessionStorage.setItem('prime_view_admin_session', JSON.stringify(data));
    localStorage.setItem('prime_view_admin_session', JSON.stringify(data));
    document.cookie = `pv_admin_session=${data.username}; path=/; max-age=86400; SameSite=Lax`;
  }, sessionData);
}

async function run() {
  console.log('================================================================');
  console.log('🚀 VERIFYING /admin/reservations DISPLAY FIXES & DATA INTEGRITY');
  console.log('================================================================\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Seed/sync localStorage with latest mockStore data
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
    await loginAs(page, 'admin', 'super_admin', [], 'admin-1', 'Super Admin');

    mockStore.loadFromStorage();
    // Ensure mockStore in Node is loaded and updated
    const storeState = {
      plots: mockStore.plots,
      reservations: mockStore.reservations,
      bookings: mockStore.bookings,
      payments: mockStore.payments,
      customers: mockStore.customers,
      adminUsers: mockStore.adminUsers,
      contentBlocks: mockStore.contentBlocks,
      auditLog: mockStore.auditLog,
    };

    await page.evaluate((state) => {
      localStorage.setItem('pv_mock_store', JSON.stringify(state));
      window.dispatchEvent(new StorageEvent('storage', { key: 'pv_mock_store' }));
    }, storeState);

    // Navigate to /admin/reservations
    console.log('Navigating to http://localhost:3000/admin/reservations...');
    await page.goto(`${BASE_URL}/admin/reservations`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // 1. Inspect rendered reservation rows
    const rows = await page.evaluate(() => {
      const rowElements = Array.from(document.querySelectorAll('.divide-y > div'));
      return rowElements.map((el) => {
        const plotPill = el.querySelector('a[href*="focusPlot="]');
        const blockBadge = el.querySelector('span.rounded-md.border');
        const customerName = el.querySelector('.flex.flex-wrap.items-center.gap-x-4 .text-slate-900')?.textContent?.trim();
        return {
          customer: customerName,
          plotPillText: plotPill?.textContent?.trim()?.replace(/\s+/g, ' '),
          blockBadgeText: blockBadge?.textContent?.trim(),
        };
      });
    });

    console.log('\n--- OBSERVED RESERVATION ROWS ---');
    console.dir(rows, { depth: null });

    // VERIFICATION 1: Block Names
    console.log('\n--- VERIFICATION 1: Block Names Proper Display ---');
    const rawSlugFound = rows.some((r) => r.blockBadgeText?.includes('royal Block') || r.blockBadgeText?.includes('elite Block') || r.blockBadgeText?.includes('overseas Block'));
    if (rawSlugFound) {
      throw new Error(`Found lowercase raw slug block name! Rows: ${JSON.stringify(rows)}`);
    }

    const expectedBlockNames = ['Royal Block', 'Elite Block'];
    for (const name of expectedBlockNames) {
      const found = rows.some((r) => r.blockBadgeText === name);
      if (!found) {
        throw new Error(`Expected block badge "${name}" not found in rendered rows!`);
      }
      console.log(`✅ PASS: Block badge properly rendered as "${name}"`);
    }

    // Check Block Select options
    const selectOptions = await page.evaluate(() => {
      const select = document.querySelector('select');
      return select ? Array.from(select.options).map((o) => o.text) : [];
    });
    console.log('Filter Select Options:', selectOptions);
    if (selectOptions.some((opt) => opt.includes('ROYAL Block') || opt.includes('royal Block'))) {
      throw new Error(`Select options still have raw/caps slug: ${JSON.stringify(selectOptions)}`);
    }
    console.log('✅ PASS: Block dropdown options correctly formatted.');

    // VERIFICATION 2: Plot Details (Size and Category)
    console.log('\n--- VERIFICATION 2: Real Registered Plot Details ---');
    const barePlotFound = rows.some((r) => {
      // Check if it only has the plot number without "— [Size], [Category]"
      return r.plotPillText && !r.plotPillText.includes('—');
    });
    if (barePlotFound) {
      throw new Error(`Found bare plot code without registered details! Rows: ${JSON.stringify(rows)}`);
    }

    // Check specific rows
    const r06Row = rows.find((r) => r.plotPillText?.includes('R-06'));
    console.log('R-06 Row Details:', r06Row);
    if (!r06Row?.plotPillText?.includes('R-06 — 10 Marla, Residential')) {
      throw new Error(`Expected "R-06 — 10 Marla, Residential", got: "${r06Row?.plotPillText}"`);
    }
    console.log('✅ PASS: R-06 renders registered details: "R-06 — 10 Marla, Residential"');

    const eliteRow = rows.find((r) => r.customer?.includes('Sardar Tariq Abbasi'));
    console.log('Elite Reservation Row (Sardar Tariq Abbasi):', eliteRow);
    if (!eliteRow?.plotPillText?.includes('235 — 2 Kanal, Residential')) {
      throw new Error(`Expected Elite plot "235 — 2 Kanal, Residential", got: "${eliteRow?.plotPillText}"`);
    }
    if (eliteRow?.blockBadgeText !== 'Elite Block') {
      throw new Error(`Expected block badge "Elite Block", got: "${eliteRow?.blockBadgeText}"`);
    }
    console.log('✅ PASS: Sardar Tariq Abbasi reservation references real traced plot: "235 — 2 Kanal, Residential" in "Elite Block"');

    // VERIFICATION 3: Edit Note Modal Target Plot Display
    console.log('\n--- VERIFICATION 3: Edit Note Modal Block Label ---');
    await page.evaluate(() => {
      const noteBtns = Array.from(document.querySelectorAll('button'));
      const noteBtn = noteBtns.find((b) => b.textContent?.includes('Note'));
      if (noteBtn) (noteBtn as HTMLButtonElement).click();
    });
    await sleep(500);

    const modalTargetText = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0.z-50');
      return modal?.querySelector('strong.text-slate-900')?.textContent?.trim();
    });
    console.log('Modal Target Plot Text:', modalTargetText);
    if (modalTargetText?.includes('royal Block') || modalTargetText?.includes('elite Block')) {
      throw new Error(`Modal target plot has raw lowercase slug! Found: "${modalTargetText}"`);
    }
    console.log('✅ PASS: Edit Note modal renders proper block name:', modalTargetText);

    // Take screenshot for visual proof
    await page.screenshot({ path: 'public/master-plan/reservations_display_fixed.png', fullPage: true });
    console.log('Screenshot saved to public/master-plan/reservations_display_fixed.png');

    console.log('\n================================================================');
    console.log('🎉 ALL DISPLAY AND DATA INTEGRITY VERIFICATIONS PASSED 100%!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

run();
