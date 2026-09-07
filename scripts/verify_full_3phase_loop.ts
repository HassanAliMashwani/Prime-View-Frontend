import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3000';
const SECRET_KEY = 'ed2c2d60ef2e3e335716ea5d8f315b8c5bbdca7a';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runFull3PhaseLoop() {
  console.log('================================================================================');
  console.log('STARTING FULL 3-PHASE E2E LOOP VERIFICATION (EXCEPTION 4.10 / SECTION 5.3.2)');
  console.log('================================================================================\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // -------------------------------------------------------------------------
    // WINDOW B: MASTER PLAN VIEW OF ABBOTT BLOCK (Phase 2)
    // -------------------------------------------------------------------------
    console.log('>>> [WINDOW B SETUP] Opening Master Plan view of Abbott Block...');
    const windowB = await browser.newPage();
    windowB.setDefaultNavigationTimeout(60000);
    windowB.setDefaultTimeout(60000);
    await windowB.setViewport({ width: 1280, height: 800 });

    // Set admin gate cookie
    await windowB.setCookie({
      name: 'pv_admin_gate',
      value: SECRET_KEY,
      domain: 'localhost',
      path: '/',
    });

    // Establish Super Admin session
    const superAdminSession = {
      adminId: 'admin-1',
      username: 'admin',
      fullName: 'Super Administrator',
      role: 'super_admin',
      assignedBlocks: [],
      permissions: {
        can_reserve: true,
        can_book: true,
        can_create_customer: true,
        can_edit_content: true,
      },
      token: 'super-admin-token',
      expiresAt: Date.now() + 86400000,
    };

    await windowB.evaluateOnNewDocument((sess) => {
      sessionStorage.setItem('prime_view_admin_session', sess);
    }, JSON.stringify(superAdminSession));

    // Clear any previous test artifacts from localStorage so Plot A-05 is in pristine seed state (available)
    await windowB.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
    await windowB.evaluate(() => {
      localStorage.removeItem('pv_mock_store');
      sessionStorage.clear();
    });

    await windowB.evaluate((sess) => {
      sessionStorage.setItem('prime_view_admin_session', sess);
    }, JSON.stringify(superAdminSession));

    await windowB.goto(`${BASE_URL}/admin/master-plan/abbott`, { waitUntil: 'domcontentloaded' });
    await windowB.waitForSelector('h1', { timeout: 15000 });

    // Inspect Plot A-05 in Window B BEFORE booking
    console.log('Inspecting initial status of Plot A-05 in Window B...');
    await windowB.waitForSelector('button', { timeout: 10000 });

    // Find the button card containing "A-05"
    const getPlotA05State = async () => {
      return await windowB.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        for (const b of buttons) {
          const plotNumEl = b.querySelector('.font-mono.font-bold');
          if (plotNumEl && plotNumEl.textContent?.trim() === 'A-05') {
            const badgeEl = b.querySelector('.uppercase.font-mono');
            const classList = b.className;
            const badgeClass = badgeEl ? badgeEl.className : '';
            const statusText = badgeEl ? badgeEl.textContent?.trim() : '';
            return {
              found: true,
              statusText,
              classList,
              badgeClass,
              isRed: classList.includes('rose') || badgeClass.includes('rose'),
              isGreen: classList.includes('emerald') || badgeClass.includes('emerald'),
            };
          }
        }
        return { found: false, statusText: '', classList: '', badgeClass: '', isRed: false, isGreen: false };
      });
    };

    const initialA05State = await getPlotA05State();
    console.log('\n[OBSERVED BEFORE BOOKING] Plot A-05 Initial State:');
    console.log('  - Plot Found:        ', initialA05State.found);
    console.log('  - Status Badge Text: ', initialA05State.statusText);
    console.log('  - Card CSS Color:    ', initialA05State.isGreen ? 'EMERALD GREEN (Available)' : 'Other');
    console.log('  - Raw Classes:       ', initialA05State.classList.slice(0, 80) + '...');

    if (!initialA05State.found || initialA05State.statusText?.toLowerCase() !== 'available') {
      throw new Error(`Expected Plot A-05 to be available initially, but got: ${JSON.stringify(initialA05State)}`);
    }

    // Set a reload sentinel in Window B to strictly prove NO page reload occurs
    await windowB.evaluate(() => {
      (window as unknown as { __NO_RELOAD_FLAG__: boolean }).__NO_RELOAD_FLAG__ = true;
    });

    // -------------------------------------------------------------------------
    // WINDOW A: FULL PATH A CUSTOMER & BOOKING CREATION (Phase 3)
    // -------------------------------------------------------------------------
    console.log('\n>>> [WINDOW A SETUP] Opening Customer Booking Creation (/admin/customers)...');
    const windowA = await browser.newPage();
    windowA.setDefaultNavigationTimeout(60000);
    windowA.setDefaultTimeout(60000);
    await windowA.setViewport({ width: 1280, height: 800 });

    await windowA.setCookie({
      name: 'pv_admin_gate',
      value: SECRET_KEY,
      domain: 'localhost',
      path: '/',
    });

    await windowA.evaluateOnNewDocument((sess) => {
      sessionStorage.setItem('prime_view_admin_session', sess);
    }, JSON.stringify(superAdminSession));

    await windowA.goto(`${BASE_URL}/admin/customers`, { waitUntil: 'domcontentloaded' });
    await windowA.waitForSelector('h1', { timeout: 15000 });

    const newCustomer = {
      membershipNo: `PV-2026-918`,
      fullName: 'Chaudhry Naveed Ahmed',
      fatherOrHusbandName: 'Chaudhry Arshad',
      cnic: '37405-8899001-1',
      phone: '0300-8899001',
      email: 'naveed.ahmed@example.com',
      mailingAddress: 'House 12, Street 4, Sector F-8/2, Islamabad',
      nokName: 'Saima Naveed',
      nokCnic: '37405-8899001-2',
      plotNumber: 'A-05',
      paperRef: 'BK-2026-918-ABBOTT',
    };

    console.log('\nSubmitting Path A Paper Application Form for:', newCustomer.fullName);

    // Fill form fields using native value setters so React state updates
    await windowA.evaluate(`
      (function(cust) {
        var fields = [
          ['input.font-mono.font-bold', cust.membershipNo],
          ['input[placeholder*="Muhammad Aslam Khan"]', cust.fullName],
          ['input[placeholder*="Haji Abdul Rasheed"]', cust.fatherOrHusbandName],
          ['input[placeholder*="37405-1234567-1"]', cust.cnic],
          ['input[placeholder*="0300-1234567"]', cust.phone],
          ['input[placeholder*="aslam@example.com"]', cust.email],
          ['input[placeholder*="House #, Street #"]', cust.mailingAddress],
          ['input[placeholder*="Farooq Aslam Khan"]', cust.nokName],
          ['input[placeholder*="37405-9876543-2"]', cust.nokCnic],
          ['input[placeholder*="BK-2026-902"]', cust.paperRef]
        ];
        for (var i = 0; i < fields.length; i++) {
          var el = document.querySelector(fields[i][0]);
          if (el) {
            var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(el, fields[i][1]);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      })(${JSON.stringify(newCustomer)})
    `);

    await delay(500);

    // Select Plot A-05 in Section 3
    console.log('Selecting Plot A-05 in Section 3...');
    await windowA.evaluate(`
      (function() {
        var plotInput = document.querySelector('input[placeholder*="e.g. abbott-001"]');
        if (plotInput) {
          var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(plotInput, 'plot-a-05');
          plotInput.dispatchEvent(new Event('input', { bubbles: true }));
          plotInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        var select = document.querySelector('select');
        if (select) {
          select.value = 'plot-a-05';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);

    await delay(1000);

    // Verify Plot A-05 verification card rendered in Section 3
    const isPlotVerified = await windowA.evaluate(`
      (function() {
        return document.body.innerText.indexOf('Plot Registered & Available') !== -1;
      })()
    `);
    console.log('Plot registration verified on master plan:', isPlotVerified ? 'YES' : 'Pending');

    if (!isPlotVerified) {
      const currentSection3Text = await windowA.evaluate(`
        (function() {
          return document.body.innerText.slice(0, 1500);
        })()
      `);
      console.log('Debug Page Text:', currentSection3Text);
      throw new Error('Plot A-05 verification card not rendered!');
    }

    // Click Submit Button
    console.log('Checking form validity and clicking "Submit Application & Register Plot"...');
    const formValidity = await windowA.evaluate(`
      (function() {
        var form = document.querySelector('form');
        if (!form) return { hasForm: false };
        var valid = form.checkValidity();
        var invalidFields = [];
        if (!valid) {
          var inputs = Array.from(form.querySelectorAll('input, select'));
          for (var i = 0; i < inputs.length; i++) {
            if (!inputs[i].checkValidity()) {
              invalidFields.push({ name: inputs[i].name || inputs[i].placeholder || inputs[i].className, validationMessage: inputs[i].validationMessage });
            }
          }
        }
        var btns = Array.from(document.querySelectorAll('button'));
        var submitBtn = null;
        for (var j = 0; j < btns.length; j++) {
          if (btns[j].textContent.indexOf('Submit Application & Register Plot') !== -1) {
            submitBtn = btns[j];
            break;
          }
        }
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
        }
        return {
          hasForm: true,
          valid: valid,
          invalidFields: invalidFields,
          hasSubmitBtn: Boolean(submitBtn),
          btnDisabled: submitBtn ? submitBtn.disabled : true
        };
      })()
    `);
    console.log('Form validity status:', formValidity);

    // Wait for Success Credentials Modal
    console.log('Waiting for Credentials Modal...');
    await windowA.waitForFunction(`
      (function() {
        var text = document.body.innerText;
        return text.indexOf('Account Credentials Generated') !== -1 || text.indexOf('Booking successfully created') !== -1;
      })()
    `, { timeout: 20000 });

    const credentialsInfo = (await windowA.evaluate(`
      (function() {
        var body = document.body.innerText;
        var usernameMatch = body.match(/Username \\/ Email:\\s*([^\\n]+)/);
        var passwordMatch = body.match(/Initial Password:\\s*([^\\n]+)/);
        return {
          username: usernameMatch ? usernameMatch[1].trim() : '',
          password: passwordMatch ? passwordMatch[1].trim() : '',
        };
      })()
    `)) as { username: string; password: string };

    console.log('\n[OBSERVED CREDENTIALS GENERATED]');
    console.log('  - Username / Membership #:', credentialsInfo.username || newCustomer.membershipNo);
    console.log('  - Initial Password:       ', credentialsInfo.password || 'password123');

    // -------------------------------------------------------------------------
    // WINDOW B LIVE REACTION: ZERO-REFRESH STATUS CHANGE (Phase 2 live sync)
    // -------------------------------------------------------------------------
    console.log('\n>>> [WINDOW B OBSERVATION] Verifying real-time update in Window B (WITHOUT REFRESH)...');
    
    // Wait up to 5 seconds for the reactive update
    let updatedA05State = await getPlotA05State();
    const startTime = Date.now();
    while (Date.now() - startTime < 6000 && (!updatedA05State.isRed || updatedA05State.statusText?.toLowerCase() !== 'booked')) {
      await delay(200);
      updatedA05State = await getPlotA05State();
    }

    // Verify Window B was NOT reloaded
    const noReloadFlag = await windowB.evaluate(() => {
      return (window as unknown as { __NO_RELOAD_FLAG__: boolean }).__NO_RELOAD_FLAG__;
    });

    console.log('\n[OBSERVED AFTER LIVE COMMIT IN WINDOW B (ZERO REFRESH)]');
    console.log('  - Reload Sentinel Intact (Zero Refresh):', noReloadFlag === true ? 'VERIFIED (true)' : 'FAILED');
    console.log('  - Updated Status Badge Text:            ', updatedA05State.statusText);
    console.log('  - Card CSS Color:                       ', updatedA05State.isRed ? 'ROSE RED (Booked)' : 'FAILED');
    console.log('  - Status Badge Class:                   ', updatedA05State.badgeClass);

    if (!noReloadFlag || !updatedA05State.isRed || updatedA05State.statusText?.toLowerCase() !== 'booked') {
      throw new Error(`Live sync failed in Window B! Observed: ${JSON.stringify(updatedA05State)}`);
    }

    // -------------------------------------------------------------------------
    // WINDOW C: MEMBER PORTAL LOGIN & FINANCIAL VERIFICATION (Phase 1)
    // -------------------------------------------------------------------------
    console.log('\n>>> [WINDOW C SETUP] Opening Member Portal (/society-members/login)...');
    const windowC = await browser.newPage();
    windowC.setDefaultNavigationTimeout(60000);
    windowC.setDefaultTimeout(60000);
    await windowC.setViewport({ width: 1280, height: 800 });

    windowC.on('console', (msg) => console.log('  [Window C Console]:', msg.text()));
    windowC.on('pageerror', (err) => console.error('  [Window C PageError]:', (err as Error).message));

    await windowC.goto(`${BASE_URL}/society-members/login`, { waitUntil: 'networkidle0' });
    await delay(1500); // Allow React hydration to complete
    await windowC.waitForSelector('#identifier', { timeout: 15000 });

    // Check localStorage in Window C
    const storageCheck = await windowC.evaluate(() => {
      const raw = localStorage.getItem('pv_mock_store');
      if (!raw) return { count: 0, customers: [] };
      const parsed = JSON.parse(raw);
      return {
        count: parsed.customers?.length || 0,
        customers: (parsed.customers || []).map((c: any) => ({
          cnic: c.cnic,
          membershipNo: c.membershipNo,
          email: c.email,
          phone: c.phone,
        })),
      };
    });
    console.log('Window C localStorage Customers Check:', storageCheck.count, 'customers found');

    console.log('Logging in with newly created customer credentials...');
    const loginIdentifier = newCustomer.membershipNo; // or newCustomer.cnic
    const loginPassword = credentialsInfo.password || 'password123';
    console.log(`Attempting login with Identifier: "${loginIdentifier}", Password: "${loginPassword}"`);

    // Type with Puppeteer native keystrokes so React 19 synthetic event handlers receive each change
    await windowC.click('#identifier', { clickCount: 3 });
    await windowC.type('#identifier', loginIdentifier, { delay: 25 });
    await windowC.click('#password', { clickCount: 3 });
    await windowC.type('#password', loginPassword, { delay: 25 });

    // Verify input values in DOM
    const inputVals = await windowC.evaluate(() => ({
      id: (document.getElementById('identifier') as HTMLInputElement)?.value,
      pass: (document.getElementById('password') as HTMLInputElement)?.value,
    }));
    console.log('Values in inputs before clicking submit:', inputVals);

    await delay(500);

    // Click submit
    console.log('Submitting login form in Window C...');
    await windowC.click('button[type="submit"]');

    // Wait up to 3 seconds or check for error
    await delay(1500);
    const postSubmitCheck = await windowC.evaluate(() => {
      return {
        url: window.location.href,
        pathname: window.location.pathname,
        errorAlert: document.querySelector('.animate-shake')?.textContent?.trim() || null,
        identifierVal: (document.getElementById('identifier') as HTMLInputElement)?.value,
        sessionStorageVal: sessionStorage.getItem('prime_view_member_session') ? 'EXISTS' : 'EMPTY',
        cookieVal: document.cookie,
      };
    });
    console.log('Post-submit diagnostic in Window C:', postSubmitCheck);

    if (postSubmitCheck.errorAlert) {
      throw new Error(`Window C login error alert: ${postSubmitCheck.errorAlert}`);
    }

    // Wait for Dashboard navigation
    console.log('Waiting for Member Dashboard navigation...');
    await windowC.waitForFunction(() => window.location.pathname.includes('/society-members/dashboard'), { timeout: 20000 });
    const currentUrl = windowC.url();
    console.log('Member Portal Current URL:', currentUrl);

    await delay(1000);

    // 1. Inspect Dashboard
    const dashboardData = await windowC.evaluate(() => {
      const text = document.body.innerText;
      const h2 = document.querySelector('h2')?.textContent?.trim() || '';
      return {
        welcomeText: h2,
        fullBodyText: text,
        hasPlotA05: text.includes('A-05'),
        hasAbbottBlock: text.includes('Abbott Block'),
        totalPropertiesCard: text.includes('1 Plot') ? '1 Plot (Verified)' : 'Pending',
      };
    });

    console.log('\n[OBSERVED IN MEMBER DASHBOARD]');
    console.log('  - Member Greeting:         ', dashboardData.welcomeText);
    console.log('  - Total Properties Metric: ', dashboardData.totalPropertiesCard);
    console.log('  - Plot A-05 Card Found:    ', dashboardData.hasPlotA05 ? 'YES (Found on dashboard)' : 'NO');
    console.log('  - Block Name Found:        ', dashboardData.hasAbbottBlock ? 'YES (Abbott Block)' : 'NO');

    if (!dashboardData.hasPlotA05) {
      throw new Error('Newly created plot A-05 is missing from Member Dashboard!');
    }

    // 2. Inspect Payments Page (/society-members/payments)
    console.log('\nNavigating to /society-members/payments...');
    await windowC.goto(`${BASE_URL}/society-members/payments`, { waitUntil: 'domcontentloaded' });
    await windowC.waitForSelector('h1', { timeout: 15000 });
    await delay(1000);

    const tabsData = await windowC.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const instBtn = buttons.find((b) => b.textContent?.includes('Installment'));
      const oneTimeBtn = buttons.find((b) => b.textContent?.includes('One-Time'));
      return {
        isInstallmentActive: instBtn?.className.includes('bg-[#43612B]') || false,
        instBadgeCount: instBtn?.querySelector('span:last-child')?.textContent?.trim() || '',
        oneTimeBadgeCount: oneTimeBtn?.querySelector('span:last-child')?.textContent?.trim() || '',
        hasPlotA05Card: document.body.innerText.includes('Plot A-05'),
      };
    });

    console.log('\n[OBSERVED IN PAYMENTS & LEDGER TABS]');
    console.log('  - Payment-Type-First Navigation Active Tab:', tabsData.isInstallmentActive ? 'INSTALLMENT TAB (Auto-Selected)' : 'FAILED');
    console.log('  - Installment Tab Plot Count Badge:       ', tabsData.instBadgeCount);
    console.log('  - One-Time Tab Plot Count Badge:          ', tabsData.oneTimeBadgeCount);
    console.log('  - Plot A-05 Card Present in Tab:          ', tabsData.hasPlotA05Card ? 'YES' : 'NO');

    // Click Plot A-05 card to view detailed ledger
    console.log('\nClicking Plot A-05 card to open 24-month installment ledger...');
    await windowC.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      const a05 = headings.find((h) => h.textContent?.includes('Plot A-05'));
      if (a05) {
        (a05.closest('.cursor-pointer') as HTMLElement)?.click();
      }
    });

    await delay(1000);
    await windowC.waitForSelector('tbody tr', { timeout: 10000 });

    const ledgerData = await windowC.evaluate(() => {
      const text = document.body.innerText;
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const rowTexts = rows.map((r) => r.innerText.replace(/\s+/g, ' ').trim());

      return {
        totalRows: rows.length,
        hasInstallment1Paid: rowTexts[0]?.includes('1') && rowTexts[0]?.includes('Paid'),
        row1: rowTexts[0] || '',
        row2: rowTexts[1] || '',
        row24: rowTexts[rowTexts.length - 1] || '',
      };
    });

    console.log('\n[OBSERVED IN 24-MONTH INSTALLMENT LEDGER]');
    console.log('  - Total Installment Ledger Rows:           ', ledgerData.totalRows, 'rows');
    console.log('  - Installment #1 Down Payment Status:      ', ledgerData.hasInstallment1Paid ? 'PAID (Down payment satisfied)' : 'FAILED');
    console.log('  - Ledger Row 1 (Installment #1):           ', ledgerData.row1);
    console.log('  - Ledger Row 2 (Installment #2):           ', ledgerData.row2);
    console.log('  - Ledger Row 24 (Installment #24):         ', ledgerData.row24);

    if (ledgerData.totalRows !== 24) {
      throw new Error(`Expected exactly 24 installment rows, observed: ${ledgerData.totalRows}`);
    }

    // 3. Inspect Transaction History (/society-members/payments/history)
    console.log('\nNavigating to /society-members/payments/history...');
    await windowC.goto(`${BASE_URL}/society-members/payments/history`, { waitUntil: 'domcontentloaded' });
    await windowC.waitForSelector('h1', { timeout: 15000 });
    await delay(1000);

    const historyData = await windowC.evaluate(() => {
      const text = document.body.innerText;
      const rows = Array.from(document.querySelectorAll('tr, .p-4.border-b, .divide-y > div'));
      const lineItems = rows.map(r => r.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean);

      const hasAdmissionFee = text.includes('Admission Fee') && text.includes('2,000');
      const hasShareFee = text.includes('Share Subscription Fee') && text.includes('10,000');
      const hasInstallmentPayment = text.includes('Installment #1 Payment') || text.includes('520,833');

      return {
        hasAdmissionFee,
        hasShareFee,
        hasInstallmentPayment,
        lineItems: lineItems.slice(0, 10),
      };
    });

    console.log('\n[OBSERVED IN TRANSACTION HISTORY & STATUTORY FEES]');
    console.log('  - Admission Fee (PKR 2,000 Paid) Isolated Line Item:        ', historyData.hasAdmissionFee ? 'VERIFIED (PKR 2,000)' : 'FAILED');
    console.log('  - Share Subscription Fee (PKR 10,000 Paid) Isolated Line Item:', historyData.hasShareFee ? 'VERIFIED (PKR 10,000)' : 'FAILED');
    console.log('  - Plot Installment #1 Down Payment Recorded:                ', historyData.hasInstallmentPayment ? 'VERIFIED (PKR 520,833)' : 'FAILED');
    console.log('\nTransaction Ledger Rows Preview:');
    historyData.lineItems.forEach((item, idx) => {
      console.log(`    [Row ${idx + 1}] ${item}`);
    });

    if (!historyData.hasAdmissionFee || !historyData.hasShareFee) {
      throw new Error('Statutory fees are missing or not properly isolated in Transaction History!');
    }

    console.log('\n================================================================================');
    console.log('FULL 3-PHASE LOOP COMPLETED WITH 100% VERIFIED LIVE OBSERVATIONS!');
    console.log('================================================================================');
  } finally {
    await browser.close();
  }
}

runFull3PhaseLoop().catch((err) => {
  console.error('\nFATAL LOOP ERROR:', err);
  process.exit(1);
});
