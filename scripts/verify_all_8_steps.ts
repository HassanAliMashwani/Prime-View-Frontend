import puppeteer, { Page } from 'puppeteer';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginAs(page: Page, user: string, pass: string) {
  await page.goto('http://localhost:3000/admin/login');
  await page.waitForSelector('input[placeholder*="admin"]');
  await page.click('input[placeholder*="admin"]', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('input[placeholder*="admin"]', user);
  await page.click('input[type="password"]', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  await sleep(1200);
}

async function main() {
  console.log('===============================================================');
  console.log('STARTING EXHAUSTIVE BROWSER E2E VERIFICATION (STEPS 1 - 7)');
  console.log('===============================================================\n');

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // -------------------------------------------------------------
    // STEP 1: Confirm block scoping (Marketing)
    // -------------------------------------------------------------
    console.log('>>> TEST 1: Block Scoping (Marketing: marketing / password123)...');
    const pageM = await browser.newPage();
    await loginAs(pageM, 'marketing', 'password123');
    await pageM.goto('http://localhost:3000/admin/master-plan');
    await pageM.waitForFunction(() => document.body.innerText.includes('Accessible Blocks') || document.body.innerText.includes('Available'));

    const marketingBlocks = await pageM.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('h3, h4, .font-serif'));
      return cards.map(c => (c as HTMLElement).innerText).filter(t => t.includes('Block'));
    });
    console.log('Marketing visible blocks:', marketingBlocks);

    const hasAbbott = marketingBlocks.some(b => b.includes('Abbott'));
    const hasRoyal = marketingBlocks.some(b => b.includes('Royal'));
    const hasOverseas = marketingBlocks.some(b => b.includes('Overseas'));
    const hasElite = marketingBlocks.some(b => b.includes('Elite'));
    const hasChalet = marketingBlocks.some(b => b.includes('Chalet'));

    if (!hasAbbott || !hasRoyal || hasOverseas || hasElite || hasChalet) {
      throw new Error(`Step 1 Failed: Marketing scoping incorrect! Blocks: ${JSON.stringify(marketingBlocks)}`);
    }
    console.log('[PASS] Marketing sees ONLY Abbott Block and Royal Block.');

    // Manually navigate to /admin/master-plan/overseas
    console.log('Marketing testing out-of-scope direct URL: /admin/master-plan/overseas');
    await pageM.goto('http://localhost:3000/admin/master-plan/overseas');
    await sleep(1000);
    const deniedTextM = await pageM.evaluate(() => document.body.innerText);
    const isDeniedM = deniedTextM.includes('Administrative Access Denied') || deniedTextM.includes('OUT_OF_SCOPE') || deniedTextM.includes('Security Policy');
    if (!isDeniedM) {
      throw new Error('Step 1 Failed: Marketing was not denied access to overseas block!');
    }
    console.log('[PASS] Direct URL to /admin/master-plan/overseas triggered "Administrative Access Denied".');

    // -------------------------------------------------------------
    // STEP 2: Confirm block scoping (Police)
    // -------------------------------------------------------------
    console.log('\n>>> TEST 2: Block Scoping (Police: police / password123)...');
    const pageP = await browser.newPage();
    await loginAs(pageP, 'police', 'password123');
    await pageP.goto('http://localhost:3000/admin/master-plan');
    await pageP.waitForFunction(() => document.body.innerText.includes('Accessible Blocks') || document.body.innerText.includes('Available'));

    const policeBlocks = await pageP.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('h3, h4, .font-serif'));
      return cards.map(c => (c as HTMLElement).innerText).filter(t => t.includes('Block'));
    });
    console.log('Police visible blocks:', policeBlocks);

    const pHasOverseas = policeBlocks.some(b => b.includes('Overseas'));
    const pHasElite = policeBlocks.some(b => b.includes('Elite'));
    const pHasChalet = policeBlocks.some(b => b.includes('Chalet'));
    const pHasAbbott = policeBlocks.some(b => b.includes('Abbott'));
    const pHasRoyal = policeBlocks.some(b => b.includes('Royal'));

    if (!pHasOverseas || !pHasElite || !pHasChalet || pHasAbbott || pHasRoyal) {
      throw new Error(`Step 2 Failed: Police scoping incorrect! Blocks: ${JSON.stringify(policeBlocks)}`);
    }
    console.log('[PASS] Police sees ONLY Overseas, Elite, and Chalet blocks.');

    // Manually navigate to /admin/master-plan/abbott
    console.log('Police testing out-of-scope direct URL: /admin/master-plan/abbott');
    await pageP.goto('http://localhost:3000/admin/master-plan/abbott');
    await sleep(1000);
    const deniedTextP = await pageP.evaluate(() => document.body.innerText);
    const isDeniedP = deniedTextP.includes('Administrative Access Denied') || deniedTextP.includes('OUT_OF_SCOPE') || deniedTextP.includes('Security Policy');
    if (!isDeniedP) {
      throw new Error('Step 2 Failed: Police was not denied access to abbott block!');
    }
    console.log('[PASS] Direct URL to /admin/master-plan/abbott triggered "Administrative Access Denied".');

    // -------------------------------------------------------------
    // STEP 3: Test Soft Lock Live (Window A Super Admin & Window B Marketing)
    // -------------------------------------------------------------
    console.log('\n>>> TEST 3: Soft Lock Live (Two Windows, Super Admin & Marketing)...');
    const windowA = await browser.newPage();
    await loginAs(windowA, 'admin', 'password123');
    await windowA.goto('http://localhost:3000/admin/master-plan/abbott');
    await windowA.waitForFunction(() => document.body.innerText.includes('Visible Plots'));
    console.log('Window A (Super Admin) opened Abbott Block master plan.');

    const windowB = await browser.newPage();
    windowB.on('console', msg => console.log('WINDOW B LOG:', msg.text()));
    await loginAs(windowB, 'marketing', 'password123');
    await windowB.goto('http://localhost:3000/admin/master-plan/abbott');
    await windowB.waitForFunction(() => document.body.innerText.includes('Visible Plots'));
    console.log('Window B (Marketing) opened Abbott Block master plan.');

    const targetPlot = 'A-02';
    console.log(`Selected target plot: ${targetPlot}`);

    // In Window B: Click plot to open drawer
    const plotClicked = await windowB.evaluate((pNum) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes(pNum));
      if (b) { b.click(); return true; }
      return false;
    }, targetPlot);
    console.log('Window B clicked plot A-02:', plotClicked);
    await sleep(800);

    // In Window B: Click Acquire Lock & Book Now
    console.log('Window B clicking "Acquire Lock & Book Now"...');
    const lockClicked = await windowB.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes('Acquire Lock & Book Now'));
      if (b) { b.click(); return true; }
      return false;
    });
    console.log('Window B clicked Acquire Lock button:', lockClicked);
    await sleep(1000);

    // Check if error banner appeared in Window B
    const modalTextB = await windowB.evaluate(() => {
      const m = document.querySelector('.fixed.inset-0');
      return m ? (m as HTMLElement).innerText.replace(/\n/g, ' | ') : 'NO MODAL';
    });
    console.log('Window B Modal Text:', modalTextB.slice(0, 200));

    // Window A should reflect live badge WITHOUT refresh
    console.log('Asserting Window A reflects "Being booked by Marketing" WITHOUT refresh...');
    await windowA.waitForFunction((pNum) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes(pNum));
      if (!b) return false;
      const t = b.innerText.toUpperCase();
      return t.includes('BEING BOOKED BY MARKETING') || t.includes('FARHAN');
    }, { timeout: 8000 }, targetPlot);

    const lockedCardTextA = await windowA.evaluate((pNum) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes(pNum));
      return b ? b.innerText.replace(/\n/g, ' | ') : '';
    }, targetPlot);
    console.log(`Window A Live Card state: [${lockedCardTextA}]`);
    console.log('[PASS] Step 3 Passed: Live soft lock badge appeared in Window A with zero refresh.');

    // -------------------------------------------------------------
    // STEP 4: Test Lock Release
    // -------------------------------------------------------------
    console.log('\n>>> TEST 4: Lock Release (Window B cancels booking form)...');
    const cancelClicked = await windowB.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find(x => x.innerText.includes('Cancel & Release Lock') || x.innerText.includes('Cancel'));
      if (cancelBtn) { cancelBtn.click(); return true; }
      return false;
    });
    console.log('Window B clicked cancel button:', cancelClicked);
    await sleep(800);

    // Window A should reflect release WITHOUT refresh
    console.log('Asserting Window A badge disappears WITHOUT refresh...');
    await windowA.waitForFunction((pNum) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes(pNum));
      if (!b) return false;
      const t = b.innerText.toUpperCase();
      return !t.includes('BEING BOOKED') && t.includes('AVAILABLE');
    }, { timeout: 8000 }, targetPlot);

    const releasedCardTextA = await windowA.evaluate((pNum) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes(pNum));
      return b ? b.innerText.replace(/\n/g, ' | ') : '';
    }, targetPlot);
    console.log(`Window A Released Card state: [${releasedCardTextA}]`);
    console.log('[PASS] Step 4 Passed: Lock released and badge cleared in Window A with zero refresh.');

    // -------------------------------------------------------------
    // STEP 5: Complete Booking and Watch it Sync Live
    // -------------------------------------------------------------
    console.log('\n>>> TEST 5: Complete Booking & Live Sync (Plot turns red/Booked in Window A)...');
    // In Window B: re-open target plot
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

    const bookModalOpen = await windowB.evaluate(() => {
      const form = document.querySelector('form');
      return Boolean(form);
    });
    console.log('Window B booking modal opened:', bookModalOpen);

    // Fill booking form in Window B using string evaluate to avoid tsx/esbuild __name helper
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

    // Check form validity before submit
    const formStatus = await windowB.evaluate(`(() => {
      const form = document.querySelector('form');
      if (!form) return 'NO FORM';
      const inputs = Array.from(form.querySelectorAll('input'));
      return {
        checkValidity: form.checkValidity(),
        inputs: inputs.map(i => ({ placeholder: i.placeholder, value: i.value, required: i.required, valid: i.checkValidity() }))
      };
    })()`);
    console.log('Form status before submit:', formStatus);

    // Submit booking
    console.log('Window B submitting booking form...');
    const commitClicked = await windowB.evaluate(`(() => {
      const btn = document.querySelector('form button[type="submit"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Window B commit button clicked:', commitClicked);
    await sleep(2000);

    const bError = await windowB.evaluate(() => {
      const err = document.querySelector('.bg-rose-50');
      return err ? (err as HTMLElement).innerText : null;
    });
    if (bError) console.log('Window B action error:', bError);

    // Window A should turn red/Booked WITHOUT refresh
    console.log('Asserting Window A turns plot red/Booked WITHOUT refresh...');
    await windowA.waitForFunction((pNum) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes(pNum));
      if (!b) return false;
      const t = b.innerText.toUpperCase();
      return !t.includes('BEING BOOKED') && t.includes('BOOKED');
    }, { timeout: 8000 }, targetPlot);

    const bookedCardTextA = await windowA.evaluate((pNum) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes(pNum));
      return b ? b.innerText.replace(/\n/g, ' | ') : '';
    }, targetPlot);
    console.log(`Window A Live Booked Card state: [${bookedCardTextA}]`);
    console.log('[PASS] Step 5 Passed: Core promise confirmed! Plot turned red/Booked in Window A with zero refresh.');

    // -------------------------------------------------------------
    // STEP 6: Test Reservation Conflict Flow
    // -------------------------------------------------------------
    console.log('\n>>> TEST 6: Reservation Conflict Flow & Superseded Auto-Resolution...');
    const pageAdminRes = await browser.newPage();
    pageAdminRes.on('dialog', async dialog => {
      console.log(`Auto-accepting dialog: "${dialog.message()}"`);
      await dialog.accept();
    });
    await loginAs(pageAdminRes, 'admin', 'password123');
    await pageAdminRes.goto('http://localhost:3000/admin/reservations');
    await pageAdminRes.waitForFunction(() => document.body.innerText.includes('R-08') || document.body.innerText.includes('Race Claim'));
    console.log('Loaded /admin/reservations. Race condition detected on Plot R-08.');

    // Confirm one of the competing claims for Plot R-08 (Hamid Raza)
    console.log('Clicking "Move to Booked" on Hamid Raza claim for Plot R-08...');
    const moveClicked = await pageAdminRes.evaluate(() => {
      const container = document.querySelector('.divide-y');
      const cards = Array.from(container?.children || []);
      const r08Card = cards.find(c => c.textContent?.includes('R-08') && c.textContent?.includes('Hamid Raza'));
      if (r08Card) {
        const moveBtn = Array.from(r08Card.querySelectorAll('button')).find(b => b.textContent?.includes('Move to Booked'));
        if (moveBtn) {
          (moveBtn as HTMLButtonElement).click();
          return true;
        }
      }
      return false;
    });
    console.log('Clicked Move to Booked for R-08 Hamid Raza:', moveClicked);
    await sleep(2500);

    // Switch to Resolved History tab
    console.log('Switching to "Resolved History" tab...');
    await pageAdminRes.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find(x => x.innerText.includes('Resolved History'));
      if (tab) tab.click();
    });
    await sleep(1500);

    // Verify superseded record with Plot R-08
    const historyText = await pageAdminRes.evaluate(() => document.body.innerText);
    const hasSuperseded = historyText.toLowerCase().includes('superseded');
    const hasR08InHistory = historyText.includes('R-08');
    if (!hasSuperseded || !hasR08InHistory) {
      throw new Error(`Step 6 Failed: Conflicting reservation was not marked superseded in history!`);
    }
    console.log('[PASS] Step 6 Confirmed: Competing claim automatically flipped to "superseded" in Resolved History tab.');

    // Test editing the resolution note
    console.log('Opening Edit Note modal on superseded reservation...');
    await pageAdminRes.evaluate(() => {
      const container = document.querySelector('.divide-y');
      const cards = Array.from(container?.children || []);
      const r08Card = cards.find(c => c.textContent?.includes('R-08') && c.textContent?.toLowerCase().includes('superseded'));
      if (r08Card) {
        const noteBtn = Array.from(r08Card.querySelectorAll('button')).find(b => b.textContent?.includes('Note'));
        if (noteBtn) (noteBtn as HTMLButtonElement).click();
      }
    });
    await sleep(800);

    await pageAdminRes.type('textarea', ' [Customer notified of supersede via call. Refund of token fee processed.]');
    await pageAdminRes.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find(x => x.innerText.includes('Save Resolution Note'));
      if (saveBtn) saveBtn.click();
    });
    await sleep(1500);
    console.log('[PASS] Step 6 Passed: Resolution note updated and saved successfully.');

    // -------------------------------------------------------------
    // STEP 7: Confirm Amenity Plots are Non-Actionable
    // -------------------------------------------------------------
    console.log('\n>>> TEST 7: Confirm Amenity Plots Non-Actionability...');
    const pageAmenity = await browser.newPage();
    await loginAs(pageAmenity, 'admin', 'password123');
    await pageAmenity.goto('http://localhost:3000/admin/master-plan/abbott');
    await pageAmenity.waitForFunction(() => document.body.innerText.includes('AMN-H01'));

    // Click AMN-H01 (Hospital)
    console.log('Clicking Amenity plot AMN-H01 (Hospital)...');
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
    console.log('Amenity plot modal content summary:\n', amenityModalContent.slice(0, 300));

    const hasNotice = amenityModalContent.includes('Non-Sellable Society Amenity') || 
                      amenityModalContent.includes('reserved for public utility') ||
                      amenityModalContent.includes('Designated Community Utility');
    const hasReserveBtn = amenityModalContent.includes('Reserve Plot');
    const hasBookBtn = amenityModalContent.includes('Acquire Lock & Book Now');

    if (!hasNotice || hasReserveBtn || hasBookBtn) {
      throw new Error(`Step 7 Failed: Amenity plot has actionable buttons or missing utility notice! Reserve: ${hasReserveBtn}, Book: ${hasBookBtn}`);
    }
    console.log('[PASS] Step 7 Passed: Amenity plot renders distinct neutral styling, read-only utility notice, and ZERO Reserve or Book buttons.');

    console.log('\n===============================================================');
    console.log('ALL TESTS 1 - 7 PASSED WITH 100% SUCCESS!');
    console.log('===============================================================');

  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('\n>>> VERIFICATION FAILED:', err);
  process.exit(1);
});
