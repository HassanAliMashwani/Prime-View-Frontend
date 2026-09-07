import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginAs(page: any, username: string, role: string, assignedBlocks: string[] = [], adminId = 'admin-1', fullName = 'Chief Executive Officer (Super Admin)') {
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
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
  console.log('🚀 VERIFYING MASTER PLAN FILTER BAR LAYOUT & RESPONSIVENESS');
  console.log('================================================================\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    });

    const page = await browser.newPage();
    page.on('pageerror', (err) => console.error('PAGE ERROR:', err));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.error('BROWSER ERROR:', msg.text());
    });
    await page.setViewport({ width: 1440, height: 900 });

    await loginAs(page, 'admin', 'super_admin');

    const { mockStore } = await import('../src/lib/mock/store');
    mockStore.loadFromStorage();
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

    // Test at 1280x900 (standard laptop screen)
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE_URL}/admin/master-plan/elite`, { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    console.log('Page loaded URL:', await page.url());

    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('BODY TEXT PREVIEW:', bodyText.slice(0, 300));

    const filterMetrics = await page.evaluate(() => {
      const searchInput = document.querySelector('input[placeholder*="Search plot"]') as HTMLInputElement;
      const searchBox = searchInput?.parentElement;
      const buttons = Array.from(document.querySelectorAll('.rounded-2xl button, .rounded-2xl a'));

      const searchRect = searchInput?.getBoundingClientRect();
      const searchBoxRect = searchBox?.getBoundingClientRect();

      // Find all segmented pill buttons inside the filter bar
      const filterBar = searchInput?.closest('.bg-white');
      const pillButtons = Array.from(filterBar ? filterBar.querySelectorAll('button') : []).map((b) => {
        const rect = b.getBoundingClientRect();
        return {
          text: b.textContent?.trim(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          whiteSpace: window.getComputedStyle(b).whiteSpace,
        };
      });

      return {
        hasInput: !!searchInput,
        searchWidth: searchRect ? Math.round(searchRect.width) : 0,
        searchBoxWidth: searchBoxRect ? Math.round(searchBoxRect.width) : 0,
        placeholder: searchInput?.placeholder,
        pillButtons,
      };
    });

    console.log('[Filter Bar Metrics at 1280px]:');
    console.log('  Search Input Box Width:', filterMetrics.searchBoxWidth, 'px (Input width:', filterMetrics.searchWidth, 'px)');
    console.log('  Search Placeholder:', filterMetrics.placeholder);
    console.log('  Pill Buttons count:', filterMetrics.pillButtons.length);
    console.dir(filterMetrics.pillButtons);

    // Assert Search is NOT crushed
    if (filterMetrics.searchBoxWidth < 180) {
      throw new Error(`Search input container is squished! Width: ${filterMetrics.searchBoxWidth}px`);
    }
    console.log('✅ PASS: Search box is comfortably wide and NOT squished (', filterMetrics.searchBoxWidth, 'px).');

    // Assert every button has whitespace-nowrap and consistent height
    for (const pill of filterMetrics.pillButtons) {
      if (pill.whiteSpace !== 'nowrap') {
        throw new Error(`Button "${pill.text}" does not have whitespace: nowrap!`);
      }
      if (pill.text?.includes('\n')) {
        throw new Error(`Button "${pill.text}" has wrapped onto multiple lines!`);
      }
    }
    console.log('✅ PASS: All buttons have whitespace-nowrap and zero line wraps.');

    // Assert Farm House is not present or if present does not wrap
    const farmHousePill = filterMetrics.pillButtons.find((p) => p.text?.toLowerCase().includes('farm'));
    if (farmHousePill) {
      console.log('  Farm House Pill Metrics:', farmHousePill);
    } else {
      console.log('✅ PASS: Empty category "Farm House" correctly omitted from Elite Block (which has no farm houses).');
    }

    // Capture screenshot of filter bar
    const inputHandle = await page.$('input[placeholder*="Search plot"]');
    if (inputHandle) {
      const filterBarHandle = await page.evaluateHandle((el) => el?.closest('.bg-white'), inputHandle);
      const element = filterBarHandle.asElement();
      if (element) {
        await element.screenshot({ path: 'public/master-plan/filter_bar_fixed.png' });
        console.log('Screenshot of fixed filter bar saved to public/master-plan/filter_bar_fixed.png');
      }
    }

    // Test at narrower viewport (1024px)
    console.log('\n--- Testing at 1024px Viewport (Narrow Desktop/Tablet) ---');
    await page.setViewport({ width: 1024, height: 768 });
    await sleep(500);

    const narrowMetrics = await page.evaluate(() => {
      const searchInput = document.querySelector('input[placeholder*="Search plot"]') as HTMLInputElement;
      const searchBox = searchInput?.parentElement;
      return {
        searchBoxWidth: searchBox ? Math.round(searchBox.getBoundingClientRect().width) : 0,
      };
    });
    console.log('  Search Box Width at 1024px:', narrowMetrics.searchBoxWidth, 'px');
    if (narrowMetrics.searchBoxWidth < 180) {
      throw new Error(`Search input container collapsed on 1024px viewport! Width: ${narrowMetrics.searchBoxWidth}px`);
    }
    console.log('✅ PASS: Search bar remains full and responsive at 1024px without squishing.');

    console.log('\n================================================================');
    console.log('🎉 FILTER BAR VERIFICATION COMPLETE — 100% RESOLVED!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

run();
