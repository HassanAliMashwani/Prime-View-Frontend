import puppeteer from 'puppeteer';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAuditSyncTest() {
  console.log('Testing cross-admin reservation audit trail synchronization...');
  const browser = await puppeteer.launch({ headless: 'new' });

  try {
    // -------------------------------------------------------------
    // Tab 1: Super Admin on Dashboard
    // -------------------------------------------------------------
    const tab1 = await browser.newPage();
    await tab1.setViewport({ width: 1280, height: 800 });
    await tab1.evaluateOnNewDocument(() => {
      sessionStorage.setItem('prime_view_admin_session', JSON.stringify({
        adminId: 'admin-1',
        username: 'admin',
        fullName: 'Super Administrator',
        role: 'super_admin',
        permissions: { can_reserve: true, can_book: true, can_create_customer: true, can_edit_content: true },
        token: 'super-tok',
        expiresAt: Date.now() + 86400000,
      }));
    });
    await tab1.goto('http://localhost:3000/admin/dashboard', { waitUntil: 'networkidle0' });

    // -------------------------------------------------------------
    // Tab 2: Marketing Sub-Admin on Royal Block
    // -------------------------------------------------------------
    const tab2 = await browser.newPage();
    await tab2.setViewport({ width: 1280, height: 800 });
    await tab2.evaluateOnNewDocument(() => {
      sessionStorage.setItem('prime_view_admin_session', JSON.stringify({
        adminId: 'admin-2',
        username: 'marketing',
        fullName: 'Marketing Sub-Admin',
        role: 'sub_admin',
        assignedBlocks: ['abbott', 'royal'],
        permissions: { can_reserve: true, can_book: false, can_create_customer: true, can_edit_content: false },
        token: 'mkt-tok',
        expiresAt: Date.now() + 86400000,
      }));
    });
    await tab2.goto('http://localhost:3000/admin/master-plan/royal', { waitUntil: 'networkidle0' });

    console.log('Tab 2: Selecting Plot R-03 in Royal Block...');
    await tab2.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('button'));
      const r03 = cards.find((b) => b.innerText.includes('R-03'));
      if (r03) r03.click();
    });
    await delay(800);

    console.log('Tab 2: Clicking "Reserve Plot" button...');
    await tab2.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const resBtn = btns.find((b) => b.innerText.includes('Reserve Plot'));
      if (resBtn) resBtn.click();
    });
    await delay(800);

    console.log('Tab 2: Filling reservation particulars for customer Malik Tariq...');
    await tab2.evaluate(`
      (function() {
        var inputs = Array.from(document.querySelectorAll('input'));
        var setVal = function(el, val) {
          if (!el) return;
          var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          if (setter) setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        if (inputs[0]) setVal(inputs[0], 'Malik Tariq');
        if (inputs[1]) setVal(inputs[1], '0300-5544332');
        if (inputs[2]) setVal(inputs[2], 'tariq.malik@example.com');
      })()
    `);

    await delay(500);

    console.log('Tab 2: Submitting reservation form...');
    await tab2.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        const submitBtn = Array.from(form.querySelectorAll('button')).find(
          (b) => b.type === 'submit' || b.innerText.includes('Confirm') || b.innerText.includes('Place')
        );
        if (submitBtn) submitBtn.click();
      }
    });

    // Wait 2 seconds for broadcast message to reach Tab 1 and trigger loadData
    await delay(2000);

    // Inspect Tab 1's Audit Feed WITHOUT REFRESH!
    const auditEntriesInTab1 = await tab1.evaluate(() => {
      const feed = document.querySelectorAll('.bg-slate-50.border.border-slate-200');
      return Array.from(feed).map((el) => (el as HTMLElement).innerText.replace(/\s+/g, ' ').trim());
    });

    console.log('\n[OBSERVED AUDIT FEED IN TAB 1 (SUPER ADMIN - ZERO REFRESH)]');
    auditEntriesInTab1.slice(0, 5).forEach((e, idx) => console.log(`  [Entry ${idx + 1}] ${e}`));

    const foundR03 = auditEntriesInTab1.some((e) => e.includes('R-03') || e.includes('PLOT_RESERVED'));
    console.log('\nPlot R-03 reservation visible in Super Admin Audit Trail:', foundR03 ? 'VERIFIED (YES)' : 'FAILED');

    if (!foundR03) {
      throw new Error('Audit feed in Tab 1 did not update with the new reservation!');
    }
    console.log('SUCCESS: Cross-admin audit trail synchronization verified 100%!');
  } finally {
    await browser.close();
  }
}

runAuditSyncTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
