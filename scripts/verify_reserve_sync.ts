import puppeteer from 'puppeteer';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runReserveSyncTest() {
  console.log('================================================================');
  console.log('🚀 STARTING LIVE CROSS-TAB RESERVE PLOT BROADCAST VERIFICATION');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // -------------------------------------------------------------
    // Page A: Super Admin (Chief Executive Officer)
    // -------------------------------------------------------------
    const pageA = await browser.newPage();
    await pageA.setViewport({ width: 1280, height: 800 });
    await pageA.evaluateOnNewDocument(() => {
      sessionStorage.setItem(
        'prime_view_admin_session',
        JSON.stringify({
          adminId: 'admin-1',
          username: 'admin',
          fullName: 'Chief Executive Officer (Super Admin)',
          role: 'super_admin',
          assignedBlocks: [],
          permissions: {
            can_reserve: true,
            can_book: true,
            can_create_customer: true,
            can_edit_content: true,
          },
          token: 'super-tok',
          expiresAt: Date.now() + 86400000,
        })
      );
    });

    // -------------------------------------------------------------
    // Page B: Sub Admin (Farhan Zaidi - Marketing Lead)
    // -------------------------------------------------------------
    const pageB = await browser.newPage();
    await pageB.setViewport({ width: 1280, height: 800 });
    await pageB.evaluateOnNewDocument(() => {
      sessionStorage.setItem(
        'prime_view_admin_session',
        JSON.stringify({
          adminId: 'admin-2',
          username: 'marketing',
          fullName: 'Farhan Zaidi (Marketing Lead)',
          role: 'sub_admin',
          assignedBlocks: ['abbott', 'royal'],
          permissions: {
            can_reserve: true,
            can_book: true,
            can_create_customer: true,
            can_edit_content: true,
          },
          token: 'mkt-tok',
          expiresAt: Date.now() + 86400000,
        })
      );
    });

    console.log('\n[1/6] Navigating both windows to Abbott Block Master Plan...');
    await pageA.goto('http://localhost:3000/admin/master-plan/abbott', { waitUntil: 'networkidle0' });
    await pageB.goto('http://localhost:3000/admin/master-plan/abbott', { waitUntil: 'networkidle0' });
    await delay(1000);

    // Verify initial tile text for Plot A-02 on both windows
    const getPlotText = async (page: any, plotNum: string) => {
      return await page.evaluate((num: string) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const plotBtn = buttons.find((b) => b.innerText.includes(num));
        return plotBtn ? plotBtn.innerText.replace(/\s+/g, ' ').trim() : null;
      }, plotNum);
    };

    const initialTextA = await getPlotText(pageA, 'A-02');
    const initialTextB = await getPlotText(pageB, 'A-02');
    console.log(`Initial Window A Plot A-02 text: "${initialTextA}"`);
    console.log(`Initial Window B Plot A-02 text: "${initialTextB}"`);

    if (!initialTextB?.toLowerCase().includes('available')) {
      console.log('Plot A-02 is not currently available, resetting localStorage...');
      await pageA.evaluate(() => localStorage.removeItem('pv_mock_store'));
      await pageA.reload({ waitUntil: 'networkidle0' });
      await pageB.reload({ waitUntil: 'networkidle0' });
      await delay(1000);
    }

    // -------------------------------------------------------------
    // STEP 2: Window A opens Reserve Plot Form on A-02
    // -------------------------------------------------------------
    console.log('\n[2/6] Window A: Selecting Plot A-02 and opening "Reserve Plot (Token)" form...');
    await pageA.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const plotBtn = buttons.find((b) => b.innerText.includes('A-02'));
      if (plotBtn) plotBtn.click();
    });
    await delay(600);

    await pageA.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resBtn = buttons.find((b) => b.innerText.includes('Reserve Plot (Token)'));
      if (resBtn) resBtn.click();
    });
    await delay(800);

    // Verify Window B (without reload!) sees the live badge
    const liveTextB_reserving = await getPlotText(pageB, 'A-02');
    const timestampStep2 = new Date().toISOString();
    console.log(`[${timestampStep2}] Window B Plot A-02 DOM text: "${liveTextB_reserving}"`);

    const hasReservingBadgeB = liveTextB_reserving?.toLowerCase().includes('being reserved by chief');
    if (hasReservingBadgeB) {
      console.log('✅ PASS: Window B observed "Being reserved by Chief" live badge without page refresh!');
    } else {
      throw new Error(`❌ FAIL: Expected Window B to have 'Being reserved by Chief', got: "${liveTextB_reserving}"`);
    }

    // -------------------------------------------------------------
    // STEP 3: Non-blocking test: Window B clicks A-02 and opens drawer
    // -------------------------------------------------------------
    console.log('\n[3/6] Window B: Verifying non-blocking behavior on Plot A-02...');
    await pageB.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const plotBtn = buttons.find((b) => b.innerText.includes('A-02'));
      if (plotBtn) plotBtn.click();
    });
    await delay(600);

    const drawerCheckB = await pageB.evaluate(() => {
      const bodyText = document.body.innerText;
      const hasBanner = bodyText.includes('Reserve Form In Progress') && bodyText.includes('Chief');
      const buttons = Array.from(document.querySelectorAll('button'));
      const resBtn = buttons.find((b) => b.innerText.includes('Reserve Plot (Token)'));
      const isEnabled = resBtn ? !resBtn.disabled : false;
      return { hasBanner, isEnabled };
    });

    console.log(`Window B Drawer Status Banner: ${drawerCheckB.hasBanner ? 'Present' : 'Missing'}`);
    console.log(`Window B "Reserve Plot (Token)" Button Enabled: ${drawerCheckB.isEnabled}`);

    if (drawerCheckB.hasBanner && drawerCheckB.isEnabled) {
      console.log('✅ PASS: Reserve is strictly non-blocking! Other admins can open drawer and click Reserve.');
    } else {
      throw new Error(`❌ FAIL: Non-blocking validation failed. Banner: ${drawerCheckB.hasBanner}, Enabled: ${drawerCheckB.isEnabled}`);
    }

    // -------------------------------------------------------------
    // STEP 4: Concurrent reserving & cancellation test
    // -------------------------------------------------------------
    console.log('\n[4/6] Window B opens Reserve modal (concurrent) then cancels...');
    await pageB.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resBtn = buttons.find((b) => b.innerText.includes('Reserve Plot (Token)'));
      if (resBtn) resBtn.click();
    });
    await delay(800);

    const concurrentTextA = await getPlotText(pageA, 'A-02');
    console.log(`Concurrent Reserving Tile Text in Window A: "${concurrentTextA}"`);

    // Window B closes/cancels reserve modal
    console.log('Window B cancels Reserve modal...');
    await pageB.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find((b) => b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    });
    await delay(800);

    // Verify Window A still holds reserving badge
    const afterCancelTextB = await getPlotText(pageB, 'A-02');
    console.log(`Tile Text in Window B after Window B cancel: "${afterCancelTextB}"`);
    if (afterCancelTextB?.toLowerCase().includes('being reserved by chief')) {
      console.log('✅ PASS: Concurrent cancellation safely preserved Window A active reserving badge!');
    } else {
      throw new Error(`❌ FAIL: Expected Window B to still show 'Being reserved by Chief', got: "${afterCancelTextB}"`);
    }

    // Window A closes/cancels reserve modal
    console.log('Window A cancels Reserve modal...');
    await pageA.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find((b) => b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    });
    await delay(800);

    const clearedTextB = await getPlotText(pageB, 'A-02');
    console.log(`Tile Text in Window B after Window A cancel: "${clearedTextB}"`);
    if (clearedTextB?.toLowerCase().includes('available') && !clearedTextB.toLowerCase().includes('being reserved')) {
      console.log('✅ PASS: Reserving badge cleared live across cross-tab broadcast!');
    } else {
      throw new Error(`❌ FAIL: Expected badge to clear to available, got: "${clearedTextB}"`);
    }

    // -------------------------------------------------------------
    // STEP 5: Complete reservation submission & live yellow tile
    // -------------------------------------------------------------
    console.log('\n[5/6] Window A: Re-opening Reserve form and submitting a reservation for Zubair Ahmed...');
    await pageA.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const plotBtn = buttons.find((b) => b.innerText.includes('A-02'));
      if (plotBtn) plotBtn.click();
    });
    await delay(600);

    await pageA.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resBtn = buttons.find((b) => b.innerText.includes('Reserve Plot (Token)'));
      if (resBtn) resBtn.click();
    });
    await delay(600);

    await pageA.evaluate(`
      (function() {
        var form = document.querySelector('form');
        if (!form) return;
        var inputs = Array.from(form.querySelectorAll('input'));
        var setVal = function(el, val) {
          if (!el) return;
          var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          if (setter) setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        if (inputs[0]) setVal(inputs[0], 'Zubair Ahmed');
        if (inputs[1]) setVal(inputs[1], '0300-9876543');
        if (inputs[2]) setVal(inputs[2], 'zubair.ahmed@example.com');
        if (inputs[3]) setVal(inputs[3], '60000');
      })()
    `);
    await delay(600);

    console.log('Window A clicking "Confirm Reservation"...');
    await pageA.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find((b) => b.innerText.includes('Confirm Reservation'));
      if (submitBtn) submitBtn.click();
    });
    await delay(1200);

    // Verify live update on Window B
    const finalTimestamp = new Date().toISOString();
    const finalTileTextB = await getPlotText(pageB, 'A-02');
    console.log(`[${finalTimestamp}] Window B Plot A-02 DOM text after submit: "${finalTileTextB}"`);

    const isReservedB = finalTileTextB?.toLowerCase().includes('reserved');
    if (isReservedB) {
      console.log('✅ PASS: Plot A-02 turned yellow/reserved live in Window B via PLOT_RESERVED broadcast!');
    } else {
      throw new Error(`❌ FAIL: Expected Plot A-02 to be reserved in Window B, got: "${finalTileTextB}"`);
    }

    // Open drawer on Window B to verify active reservation details
    await pageB.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const plotBtn = buttons.find((b) => b.innerText.includes('A-02'));
      if (plotBtn) plotBtn.click();
    });
    await delay(600);

    const drawerDetailsB = await pageB.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasCustomer: text.includes('Zubair Ahmed'),
        hasFee: text.includes('60,000'),
        hasActiveHeader: text.includes('Active Reservations'),
      };
    });

    console.log('Window B Drawer Details for A-02:', drawerDetailsB);
    if (drawerDetailsB.hasCustomer && drawerDetailsB.hasFee) {
      console.log('✅ PASS: Window B displays full active reservation particulars (Zubair Ahmed, PKR 60,000)!');
    } else {
      throw new Error('❌ FAIL: Window B drawer did not display confirmed reservation details.');
    }

    console.log('\n================================================================');
    console.log('🎉 ALL LIVE CROSS-TAB RESERVE BROADCAST TESTS PASSED PERFECTLY!');
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

runReserveSyncTest().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
