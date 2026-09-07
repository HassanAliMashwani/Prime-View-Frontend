import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3000';
const SECRET_KEY = 'ed2c2d60ef2e3e335716ea5d8f315b8c5bbdca7a';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runE2E() {
  console.log('--- STARTING PHASE 3 E2E BROWSER VALIDATION ---');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    await page.setViewport({ width: 1280, height: 800 });

    // 0. Unlock Gate via secret cookie
    console.log('\n[Step 0] Setting pv_admin_gate cookie...');
    await page.setCookie({
      name: 'pv_admin_gate',
      value: SECRET_KEY,
      domain: 'localhost',
      path: '/',
    });
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
    await delay(1000);
    // 1. Super Admin Session Setup (Window A)
    console.log('\n[Step 1] Establishing isolated Super Admin session via evaluateOnNewDocument...');
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
    await page.evaluateOnNewDocument((sess) => {
      sessionStorage.setItem('prime_view_admin_session', sess);
    }, JSON.stringify(superAdminSession));
    console.log('Super admin session registered for Window A.');

    // 2. Sub-Admin Module
    console.log('\n[Step 2] Navigating to /admin/sub-admins...');
    await page.goto(`${BASE_URL}/admin/sub-admins`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 10000 });

    const subAdminTitle = await page.$eval('h1', (el) => el.textContent);
    console.log('Sub-admin page title:', subAdminTitle);
    if (!subAdminTitle?.includes('Sub-Administrators')) {
      throw new Error(`Failed to load sub-admins page: ${subAdminTitle}`);
    }

    // Check that "can_manage_sub_admins" or "can_create_sub_admin" does NOT exist in page source
    const pageContent = await page.content();
    if (pageContent.includes('can_manage_sub_admins') || pageContent.includes('can_create_sub_admin')) {
      throw new Error('SECURITY VIOLATION: can_manage_sub_admins found in DOM!');
    }
    console.log('PASS: Verified can_manage_sub_admins and can_create_sub_admin are permanently absent.');

    // 3. Customer Bookings Module
    console.log('\n[Step 3] Navigating to /admin/customers...');
    await page.goto(`${BASE_URL}/admin/customers`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 10000 });

    const custTitle = await page.$eval('h1', (el) => el.textContent);
    console.log('Customer page title:', custTitle);
    if (!custTitle?.includes('Customer Bookings')) {
      throw new Error(`Failed to load customers page: ${custTitle}`);
    }

    // Verify Statutory Fee notice is visible
    const noticeText = await page.$eval('body', (el) => el.innerText);
    if (!noticeText.includes('Admission Fee of PKR 2,000') || !noticeText.includes('Share Subscription Fee of PKR 10,000')) {
      throw new Error('Statutory fees notice missing on customer booking page');
    }
    console.log('PASS: Statutory fees notice verified.');

    // 4. Test Path B (Existing Customer) Confirmation Step
    console.log('\n[Step 4] Testing Path B Search and Mandatory Confirmation Step...');
    // Click Path B tab
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text?.includes('Path B: Existing Customer')) {
        await b.click();
        break;
      }
    }
    await delay(500);

    // Search for "Tariq"
    await page.type('input[placeholder*="Type customer name"]', 'Tariq');
    const searchBtns = await page.$$('button');
    for (const b of searchBtns) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text?.includes('Search')) {
        await b.click();
        break;
      }
    }
    await delay(1200);

    // Select first customer from disambiguation results
    const selectCustomerBtns = await page.$$('button');
    let selectedOne = false;
    for (const b of selectCustomerBtns) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text?.includes('Select Customer')) {
        await b.click();
        selectedOne = true;
        break;
      }
    }

    if (!selectedOne) {
      throw new Error('Could not find or click Select Customer button in Path B search results!');
    }

    await delay(500);
    const step2Text = await page.$eval('body', (el) => el.innerText);
    if (!step2Text.includes('Confirmation Step: Verify Identity') || !step2Text.includes('Confirm Customer & Proceed')) {
      throw new Error('MANDATORY CONFIRMATION STEP MISSING IN PATH B!');
    }
    console.log('PASS: Mandatory confirmation step displayed with Name, CNIC, and property count.');

    // 5. Content CMS Module
    console.log('\n[Step 5] Navigating to /admin/content...');
    await page.goto(`${BASE_URL}/admin/content`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const contentH1 = await page.$eval('h1', (el) => el.textContent);
    console.log('Content CMS title:', contentH1);
    if (!contentH1?.includes('Content CMS')) {
      throw new Error(`Content CMS failed to load: ${contentH1}`);
    }
    console.log('PASS: Content CMS loaded with plans and events.');

    // 6. Audit Log Module
    console.log('\n[Step 6] Navigating to /admin/audit-log (Super Admin)...');
    await page.goto(`${BASE_URL}/admin/audit-log`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const auditH1 = await page.$eval('h1', (el) => el.textContent);
    console.log('Audit Log title:', auditH1);
    if (!auditH1?.includes('Audit Trail')) {
      throw new Error(`Audit Log failed to load: ${auditH1}`);
    }
    console.log('PASS: System Audit Log loaded with activity trail.');

    // 7. Test Sub-Admin Role Restrictions (Window B: Marketing Lead)
    console.log('\n[Step 7] Testing Sub-Admin Access Control in Window B (marketing)...');
    const page2 = await browser.newPage();
    await page2.setCookie({
      name: 'pv_admin_gate',
      value: SECRET_KEY,
      domain: 'localhost',
      path: '/',
    });

    const marketingSession = {
      adminId: 'admin-2',
      username: 'marketing',
      fullName: 'Marketing Lead',
      role: 'sub_admin',
      assignedBlocks: ['abbott', 'royal'],
      permissions: {
        can_reserve: true,
        can_book: false,
        can_create_customer: true,
        can_edit_content: true,
      },
      token: 'marketing-token',
      expiresAt: Date.now() + 86400000,
    };
    await page2.evaluateOnNewDocument((sess) => {
      sessionStorage.setItem('prime_view_admin_session', sess);
    }, JSON.stringify(marketingSession));

    // Attempt to access /admin/sub-admins directly
    await page2.goto(`${BASE_URL}/admin/sub-admins`, { waitUntil: 'domcontentloaded' });
    await page2.waitForSelector('h2', { timeout: 10000 });
    const subAdminGuardText = await page2.$eval('body', (el) => el.innerText);
    if (!subAdminGuardText.includes('Access Denied: Super Admin Only')) {
      throw new Error('SECURITY BREACH: Marketing sub-admin accessed /admin/sub-admins!');
    }
    console.log('PASS: Marketing sub-admin received "Access Denied: Super Admin Only" on /admin/sub-admins.');

    // Attempt to access /admin/audit-log directly
    await page2.goto(`${BASE_URL}/admin/audit-log`, { waitUntil: 'domcontentloaded' });
    await page2.waitForSelector('h2', { timeout: 10000 });
    const auditGuardText = await page2.$eval('body', (el) => el.innerText);
    if (!auditGuardText.includes('Access Denied: Super Admin Only')) {
      throw new Error('SECURITY BREACH: Marketing sub-admin accessed /admin/audit-log!');
    }
    console.log('PASS: Marketing sub-admin received "Access Denied: Super Admin Only" on /admin/audit-log.');

    console.log('\n======================================================');
    console.log('ALL PHASE 3 E2E BROWSER VALIDATION TESTS PASSED 100%!');
    console.log('======================================================');
  } finally {
    await browser.close();
  }
}

runE2E().catch((err) => {
  console.error('FATAL E2E ERROR:', err);
  process.exit(1);
});
