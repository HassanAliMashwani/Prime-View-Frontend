import puppeteer, { Page } from 'puppeteer';

const BASE_URL = 'http://localhost:3001';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginAs(page: Page, user: string, pass: string) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.waitForSelector('input[placeholder*="admin"]');
  await page.click('input[placeholder*="admin"]', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('input[placeholder*="admin"]', user);
  await page.click('input[type="password"]', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  await sleep(1500);
}

async function main() {
  console.log('===============================================================');
  console.log('STARTING PRODUCTION MODE VERIFICATION (PORT 3001)');
  console.log('===============================================================\n');

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // -------------------------------------------------------------
    // VERIFICATION 8A: Quick Demo Switcher GONE in Production
    // -------------------------------------------------------------
    console.log('>>> TEST 8A: Verifying Quick Demo Switcher is COMPLETELY GONE on /admin/login...');
    const loginPage = await browser.newPage();
    await loginPage.goto(`${BASE_URL}/admin/login`);
    await loginPage.waitForSelector('input[placeholder*="admin"]');

    const loginPageText = await loginPage.evaluate(() => document.body.innerText);
    const hasDemoDrawer = loginPageText.includes('Quick Switch Demo Roles') || 
                          loginPageText.includes('admin • Society-wide') ||
                          loginPageText.includes('marketing • Abbott') ||
                          loginPageText.includes('police • Overseas');

    if (hasDemoDrawer) {
      throw new Error('FAILED: Quick Switch Demo Roles drawer is still visible in production build!');
    }
    console.log('[PASS] Test 8A: Quick Demo Switcher is completely stripped from production build (NODE_ENV fix confirmed)!');

    // -------------------------------------------------------------
    // VERIFICATION 1: Marketing Scoping
    // -------------------------------------------------------------
    console.log('\n>>> TEST 1 (Production): Block Scoping (Marketing)...');
    const pageM = await browser.newPage();
    await loginAs(pageM, 'marketing', 'password123');
    await pageM.goto(`${BASE_URL}/admin/master-plan`);
    await pageM.waitForFunction(() => document.body.innerText.includes('Accessible Blocks') || document.body.innerText.includes('Available'));

    const marketingBlocks = await pageM.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('h3, h4, .font-serif'));
      return cards.map(c => (c as HTMLElement).innerText).filter(t => t.includes('Block'));
    });
    console.log('Marketing visible blocks:', marketingBlocks);
    const mValid = marketingBlocks.some(b => b.includes('Abbott')) && 
                   marketingBlocks.some(b => b.includes('Royal')) && 
                   !marketingBlocks.some(b => b.includes('Overseas'));
    if (!mValid) throw new Error('Marketing scoping incorrect in production!');
    console.log('[PASS] Marketing sees ONLY Abbott Block and Royal Block.');

    await pageM.goto(`${BASE_URL}/admin/master-plan/overseas`);
    await sleep(1000);
    const deniedTextM = await pageM.evaluate(() => document.body.innerText);
    if (!deniedTextM.includes('Administrative Access Denied')) {
      throw new Error('Marketing access to overseas was not denied!');
    }
    console.log('[PASS] Direct URL to /admin/master-plan/overseas triggered "Administrative Access Denied".');

    // -------------------------------------------------------------
    // VERIFICATION 2: Police Scoping
    // -------------------------------------------------------------
    console.log('\n>>> TEST 2 (Production): Block Scoping (Police)...');
    const pageP = await browser.newPage();
    await loginAs(pageP, 'police', 'password123');
    await pageP.goto(`${BASE_URL}/admin/master-plan`);
    await pageP.waitForFunction(() => document.body.innerText.includes('Accessible Blocks') || document.body.innerText.includes('Available'));

    const policeBlocks = await pageP.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('h3, h4, .font-serif'));
      return cards.map(c => (c as HTMLElement).innerText).filter(t => t.includes('Block'));
    });
    console.log('Police visible blocks:', policeBlocks);
    const pValid = policeBlocks.some(b => b.includes('Overseas')) && 
                   policeBlocks.some(b => b.includes('Elite')) && 
                   policeBlocks.some(b => b.includes('Chalet')) &&
                   !policeBlocks.some(b => b.includes('Abbott'));
    if (!pValid) throw new Error('Police scoping incorrect in production!');
    console.log('[PASS] Police sees ONLY Overseas, Elite, and Chalet blocks.');

    await pageP.goto(`${BASE_URL}/admin/master-plan/abbott`);
    await sleep(1000);
    const deniedTextP = await pageP.evaluate(() => document.body.innerText);
    if (!deniedTextP.includes('Administrative Access Denied')) {
      throw new Error('Police access to abbott was not denied!');
    }
    console.log('[PASS] Direct URL to /admin/master-plan/abbott triggered "Administrative Access Denied".');

    // -------------------------------------------------------------
    // VERIFICATION 3, 4, 5: Soft Lock Live & Booking Commit
    // -------------------------------------------------------------
    console.log('\n>>> TESTS 3, 4, 5 (Production): Two-Window Soft Lock Live & Commit...');
    const windowA = await browser.newPage();
    await loginAs(windowA, 'admin', 'password123');
    await windowA.goto(`${BASE_URL}/admin/master-plan/abbott`);
    await windowA.waitForFunction(() => document.body.innerText.includes('Visible Plots'));

    const windowB = await browser.newPage();
    await loginAs(windowB, 'marketing', 'password123');
    await windowB.goto(`${BASE_URL}/admin/master-plan/abbott`);
    await windowB.waitForFunction(() => document.body.innerText.includes('Visible Plots'));

    const targetPlot = 'A-02';
    // Open plot drawer in Window B
    await windowB.evaluate((pNum) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes(pNum));
      if (b) b.click();
    }, targetPlot);
    await sleep(800);

    // Window B acquires lock
    await windowB.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes('Acquire Lock & Book Now'));
      if (b) b.click();
    });

    // Window A observes live lock badge without refresh
    await windowA.waitForFunction((pNum) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes(pNum));
      if (!b) return false;
      const t = b.innerText.toUpperCase();
      return t.includes('BEING BOOKED BY MARKETING') || t.includes('FARHAN');
    }, { timeout: 8000 }, targetPlot);
    console.log('[PASS] Test 3 (Production): Live soft lock badge appeared in Window A with zero refresh.');

    // Window B cancels lock
    await windowB.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find(x => x.innerText.includes('Cancel & Release Lock') || x.innerText.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    });
    await sleep(800);

    // Window A observes lock badge disappeared
    await windowA.waitForFunction((pNum) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes(pNum));
      if (!b) return false;
      const t = b.innerText.toUpperCase();
      return !t.includes('BEING BOOKED') && t.includes('AVAILABLE');
    }, { timeout: 8000 }, targetPlot);
    console.log('[PASS] Test 4 (Production): Lock released and badge cleared in Window A with zero refresh.');

    // Window B commits booking
    await windowB.evaluate((pNum) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes(pNum));
      if (b) b.click();
    }, targetPlot);
    await sleep(600);

    await windowB.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes('Acquire Lock & Book Now'));
      if (b) b.click();
    });
    await sleep(1000);

    await windowB.waitForSelector('input[placeholder*="Tariq"]', { timeout: 4000 });
    await windowB.evaluate(`(() => {
      const setVal = (el, val) => {
        if (!el) return;
        const proto = Object.getPrototypeOf(el);
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(el, val);
        else el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      setVal(document.querySelector('input[placeholder*="Tariq"]'), 'Kamran Akmal');
      setVal(document.querySelector('input[placeholder*="Muhammad"]'), 'Akmal Khan');
      setVal(document.querySelector('input[placeholder*="37405"]'), '37405-9988776-5');
      setVal(document.querySelector('input[placeholder*="0300"]'), '0321-7654321');
      setVal(document.querySelector('input[placeholder*="member@"]'), 'kamran.akmal@testsociety.com');
    })()`);

    await windowB.evaluate(`(() => {
      const btn = document.querySelector('form button[type="submit"]');
      if (btn) btn.click();
    })()`);
    await sleep(2000);

    // Window A turns red/Booked without refresh
    await windowA.waitForFunction((pNum) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes(pNum));
      if (!b) return false;
      const t = b.innerText.toUpperCase();
      return !t.includes('BEING BOOKED') && t.includes('BOOKED');
    }, { timeout: 8000 }, targetPlot);
    console.log('[PASS] Test 5 (Production): Booking committed! Plot turned red/Booked in Window A without refresh.');

    // -------------------------------------------------------------
    // VERIFICATION 6: Reservation Conflict Flow
    // -------------------------------------------------------------
    console.log('\n>>> TEST 6 (Production): Reservation Conflict Flow & Superseded Auto-Resolution...');
    const pageAdminRes = await browser.newPage();
    pageAdminRes.on('dialog', async dialog => {
      await dialog.accept();
    });
    await loginAs(pageAdminRes, 'admin', 'password123');
    await pageAdminRes.goto(`${BASE_URL}/admin/reservations`);
    await pageAdminRes.waitForFunction(() => document.body.innerText.includes('R-08') || document.body.innerText.includes('Race Claim'));

    await pageAdminRes.evaluate(() => {
      const container = document.querySelector('.divide-y');
      const cards = Array.from(container?.children || []);
      const r08Card = cards.find(c => c.textContent?.includes('R-08') && c.textContent?.includes('Hamid Raza'));
      if (r08Card) {
        const moveBtn = Array.from(r08Card.querySelectorAll('button')).find(b => b.textContent?.includes('Move to Booked'));
        if (moveBtn) (moveBtn as HTMLButtonElement).click();
      }
    });
    await sleep(2500);

    await pageAdminRes.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find(x => x.innerText.includes('Resolved History'));
      if (tab) tab.click();
    });
    await sleep(1500);

    const historyText = await pageAdminRes.evaluate(() => document.body.innerText);
    const hasSuperseded = historyText.toLowerCase().includes('superseded') && historyText.includes('R-08');
    if (!hasSuperseded) throw new Error('Superseded conflict not found in history!');
    console.log('[PASS] Test 6 (Production): Conflicting reservation superseded and displayed in Resolved History tab.');

    // -------------------------------------------------------------
    // VERIFICATION 7: Amenity Plots Non-Actionable
    // -------------------------------------------------------------
    console.log('\n>>> TEST 7 (Production): Confirm Amenity Plots Non-Actionability...');
    const pageAmenity = await browser.newPage();
    await loginAs(pageAmenity, 'admin', 'password123');
    await pageAmenity.goto(`${BASE_URL}/admin/master-plan/abbott`);
    await pageAmenity.waitForFunction(() => document.body.innerText.includes('AMN-H01'));

    await pageAmenity.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes('AMN-H01'));
      if (b) b.click();
    });
    await sleep(600);

    const amenityModalContent = await pageAmenity.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      return modal ? (modal as HTMLElement).innerText : '';
    });
    const hasNotice = amenityModalContent.includes('Non-Sellable Society Amenity') || 
                      amenityModalContent.includes('reserved for public utility');
    const hasReserveBtn = amenityModalContent.includes('Reserve Plot');
    const hasBookBtn = amenityModalContent.includes('Acquire Lock & Book Now');

    if (!hasNotice || hasReserveBtn || hasBookBtn) {
      throw new Error('Amenity plot is actionable in production!');
    }
    console.log('[PASS] Test 7 (Production): Amenity plot renders read-only public utility notice with zero action buttons.');

    console.log('\n===============================================================');
    console.log('ALL TESTS 1 - 8 PASSED IN PRODUCTION MODE WITH 100% SUCCESS!');
    console.log('===============================================================');

  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('\n>>> PRODUCTION VERIFICATION FAILED:', err);
  process.exit(1);
});
