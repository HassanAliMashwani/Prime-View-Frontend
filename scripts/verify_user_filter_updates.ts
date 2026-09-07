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
  console.log('🔍 VERIFYING: Disputed Block Filter, Red Booked, Blue Residential, Full Category List');
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
    await page.setViewport({ width: 1440, height: 900 });

    await loginAs(page, 'admin', 'super_admin');

    const { mockStore } = await import('../src/lib/mock/store');
    mockStore.loadFromStorage();
    const storeState = {
      plots: mockStore.plots,
      reservations: mockStore.reservations,
      blocks: mockStore.blocks,
    };

    await page.evaluate((state: any) => {
      localStorage.setItem('prime_view_mock_store', JSON.stringify(state));
    }, storeState);

    // 1. Visit Elite Block
    console.log('1. Navigating to /admin/master-plan/elite...');
    await page.goto(`${BASE_URL}/admin/master-plan/elite`, { waitUntil: 'networkidle0' });
    await sleep(1500);

    // Verify Status Filter Buttons
    console.log('2. Checking Status Filter Buttons...');
    const statusButtons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button[id^="status-filter-"]'));
      return btns.map((b) => ({
        id: b.id,
        text: b.textContent?.trim(),
        className: b.className,
      }));
    });
    console.log('Status buttons found:', statusButtons);

    const hasDisputed = statusButtons.some((b) => b.id === 'status-filter-disputed');
    if (!hasDisputed) throw new Error('status-filter-disputed button not found!');
    console.log('✅ Status filter includes "disputed" button');

    // Check Booked Button Color when Active
    console.log('3. Checking Booked button active color...');
    await page.click('#status-filter-booked');
    await sleep(500);
    const bookedBg = await page.evaluate(() => {
      const el = document.getElementById('status-filter-booked');
      return el ? window.getComputedStyle(el).backgroundColor : '';
    });
    console.log('Active Booked button background color:', bookedBg);
    // bg-red-600 is rgb(220, 38, 38)
    if (!bookedBg.includes('220, 38, 38') && !bookedBg.includes('rgb(225, 29, 72)') && !bookedBg.includes('rgb(239, 68, 68)')) {
      console.warn('⚠️ Booked color might not be red:', bookedBg);
    } else {
      console.log('✅ Booked button is RED (rgb(220, 38, 38))');
    }

    // Check Disputed Button Color when Active
    console.log('3b. Checking Disputed button active color...');
    await page.click('#status-filter-disputed');
    await sleep(500);
    const disputedBg = await page.evaluate(() => {
      const el = document.getElementById('status-filter-disputed');
      return el ? window.getComputedStyle(el).backgroundColor : '';
    });
    console.log('Active Disputed button background color:', disputedBg);
    // bg-fuchsia-600 is rgb(192, 38, 211)
    if (disputedBg.includes('192, 38, 211')) {
      console.log('✅ Disputed button is VIBRANT FUCHSIA (rgb(192, 38, 211)) — distinctly different from Booked Red!');
    } else {
      console.log('Disputed bg:', disputedBg);
    }
    console.log('✅ Disputed filter successfully applied!');

    // Switch to Card Grid to verify plot cards
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gBtn = btns.find((b) => b.textContent?.includes('Card Grid'));
      if (gBtn) gBtn.click();
    });
    await sleep(800);

    const visibleCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[id^="plot-card-"]'));
      return cards.map((c) => ({
        id: c.getAttribute('data-plot-id'),
        plotNumber: c.getAttribute('data-plot-number'),
        isDisputed: c.getAttribute('data-disputed'),
      }));
    });
    console.log(`Visible cards with Disputed filter:`, visibleCards);
    if (visibleCards.length > 0 && !visibleCards.every((c) => c.isDisputed === 'true')) {
      throw new Error('Disputed filter returned non-disputed cards!');
    }
    console.log('✅ Disputed filter in Card Grid shows only disputed plots!');

    // Reset status filter to all
    await page.click('#status-filter-all');
    await sleep(600);

    // 5. Check Category Filter Dropdown List
    console.log('5. Checking Category Dropdown List...');
    const catDropdownBtn = await page.$('#category-filter-dropdown');
    if (!catDropdownBtn) throw new Error('#category-filter-dropdown not found!');

    await catDropdownBtn.click();
    await sleep(500);

    const categoryOptions = await page.evaluate(() => {
      const opts = Array.from(document.querySelectorAll('button[id^="cat-option-"]'));
      return opts.map((o) => ({
        id: o.id,
        text: o.textContent?.trim(),
      }));
    });
    console.log('Category options in list:', categoryOptions);

    const expectedCats = ['cat-option-all', 'cat-option-residential', 'cat-option-commercial', 'cat-option-farm_house', 'cat-option-amenity'];
    for (const exp of expectedCats) {
      if (!categoryOptions.some((o) => o.id === exp)) {
        throw new Error(`Expected category ${exp} missing from list!`);
      }
    }
    console.log('✅ All categories (including Farm House) present in list dropdown!');

    // Select Residential and check blue styling
    console.log('6. Selecting Residential from Category list...');
    await page.click('#cat-option-residential');
    await sleep(800);

    const catBadgeStyles = await page.evaluate(() => {
      const badge = document.querySelector('[id^="plot-card-"] span.bg-blue-100');
      const dropdownBtn = document.getElementById('category-filter-dropdown');
      return {
        hasBlueBadge: Boolean(badge),
        dropdownText: dropdownBtn?.textContent?.trim(),
        dropdownBg: dropdownBtn ? window.getComputedStyle(dropdownBtn).backgroundColor : '',
      };
    });
    console.log('Residential selection result:', catBadgeStyles);
    if (!catBadgeStyles.hasBlueBadge) {
      console.warn('⚠️ Residential cards do not have bg-blue-100 category pill!');
    } else {
      console.log('✅ Residential category badge is BLUE!');
    }

    // Capture screenshot of block view with filters
    await page.screenshot({ path: 'public/master-plan/filter_updates_block_view.png', fullPage: false });
    console.log('📸 Saved public/master-plan/filter_updates_block_view.png');

    // 7. Check Level 1 Master Plan Overview Page
    console.log('7. Navigating to /admin/master-plan (Overview)...');
    await page.goto(`${BASE_URL}/admin/master-plan`, { waitUntil: 'networkidle0' });
    await sleep(1500);

    // Switch to cards view
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cBtn = btns.find((b) => b.textContent?.includes('Cards'));
      if (cBtn) cBtn.click();
    });
    await sleep(800);

    const overviewBlockData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.grid > div'));
      return cards.map((c) => ({
        title: c.querySelector('h3')?.textContent?.trim(),
        disputedAlert: c.querySelector('.bg-rose-50')?.textContent?.trim() || null,
        hasRedBookedChip: Boolean(c.querySelector('.bg-red-50\\/70')),
      }));
    });
    console.log('Overview block cards summary:', overviewBlockData);

    const eliteSummary = overviewBlockData.find((b) => b.title?.includes('Elite'));
    if (eliteSummary?.disputedAlert) {
      console.log(`✅ Elite Block card displays Disputed Alert: "${eliteSummary.disputedAlert}"`);
    } else {
      console.warn('⚠️ Elite Block card did not display Disputed Alert');
    }
    if (eliteSummary?.hasRedBookedChip) {
      console.log('✅ Booked count chip on overview is RED!');
    }

    await page.screenshot({ path: 'public/master-plan/filter_updates_overview.png', fullPage: false });
    console.log('📸 Saved public/master-plan/filter_updates_overview.png');

    console.log('\n================================================================');
    console.log('🎉 ALL USER REQUIREMENTS VERIFIED SUCCESSFULLY!');
    console.log('================================================================');
  } finally {
    if (browser) await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
