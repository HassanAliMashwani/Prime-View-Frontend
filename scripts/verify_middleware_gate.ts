import puppeteer from 'puppeteer';

const SECRET = 'ed2c2d60ef2e3e335716ea5d8f315b8c5bbdca7a';
const BASE_URL = 'http://localhost:3000';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testFetchCases() {
  console.log('--- 1. HTTP Fetch Level Tests ---');

  // Case 1: No key, no cookie -> expect 404
  const res1 = await fetch(`${BASE_URL}/admin/login`, { redirect: 'manual' });
  console.log(`[TEST 1] GET /admin/login (no key, no cookie) -> Status: ${res1.status} (Expected: 404)`);
  if (res1.status !== 404) throw new Error(`Test 1 Failed: Expected 404, got ${res1.status}`);

  // Case 2: Wrong key -> expect 404
  const res2 = await fetch(`${BASE_URL}/admin/login?key=invalidsecret`, { redirect: 'manual' });
  console.log(`[TEST 2] GET /admin/login?key=invalidsecret -> Status: ${res2.status} (Expected: 404)`);
  if (res2.status !== 404) throw new Error(`Test 2 Failed: Expected 404, got ${res2.status}`);

  // Case 3: Valid key -> expect redirect + Set-Cookie
  const res3 = await fetch(`${BASE_URL}/admin/login?key=${SECRET}`, { redirect: 'manual' });
  console.log(`[TEST 3] GET /admin/login?key=${SECRET} -> Status: ${res3.status} (Expected: 307 or 308)`);
  if (res3.status !== 307 && res3.status !== 308) {
    throw new Error(`Test 3 Failed: Expected 307/308 redirect, got ${res3.status}`);
  }

  const setCookie = res3.headers.get('set-cookie');
  const location = res3.headers.get('location');
  console.log(`  Location header: ${location}`);
  console.log(`  Set-Cookie header: ${setCookie}`);

  if (!location || location.includes('key=')) {
    throw new Error(`Test 3 Failed: Redirect location should have stripped ?key=. Got: ${location}`);
  }
  if (!setCookie || !setCookie.includes('pv_admin_gate=')) {
    throw new Error(`Test 3 Failed: Set-Cookie missing pv_admin_gate! Got: ${setCookie}`);
  }

  // Case 4: Request with cookie -> expect 200
  const cookieVal = setCookie.split(';')[0];
  const res4 = await fetch(`${BASE_URL}/admin/login`, {
    headers: { Cookie: cookieVal },
  });
  console.log(`[TEST 4] GET /admin/login with Cookie "${cookieVal}" -> Status: ${res4.status} (Expected: 200)`);
  if (res4.status !== 200) throw new Error(`Test 4 Failed: Expected 200, got ${res4.status}`);

  console.log('[PASS] All HTTP Fetch tests passed successfully!\n');
}

async function testBrowserUserExperience() {
  console.log('--- 2. Live Browser Navigation Tests ---');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  try {
    const page = await browser.newPage();

    // 1. Visit /admin/login directly without unlock
    console.log('Browser visiting /admin/login directly (unauthorized)...');
    const directRes = await page.goto(`${BASE_URL}/admin/login`);
    const directStatus = directRes?.status();
    console.log(`Response status: ${directStatus} (Expected: 404)`);
    if (directStatus !== 404) {
      throw new Error(`Browser test failed: expected 404 on unauthenticated /admin/login, got ${directStatus}`);
    }

    // 2. Visit secret unlock link: /admin/login?key=<secret>
    const unlockUrl = `${BASE_URL}/admin/login?key=${SECRET}`;
    console.log(`\nBrowser visiting secret unlock link: ${unlockUrl}...`);
    const unlockRes = await page.goto(unlockUrl);
    await sleep(1500);

    const finalUrl = page.url();
    const finalStatus = unlockRes?.status();
    console.log(`Final address bar URL: ${finalUrl}`);
    console.log(`Final page status: ${finalStatus}`);

    // Verify key was stripped from address bar
    if (finalUrl.includes('key=')) {
      throw new Error(`Browser test failed: ?key= was not stripped from visible address bar! Got: ${finalUrl}`);
    }
    if (!finalUrl.endsWith('/admin/login')) {
      throw new Error(`Browser test failed: expected redirect to ${BASE_URL}/admin/login, got ${finalUrl}`);
    }

    // Verify login form is visible
    const hasSignInHeading = await page.evaluate(() => {
      return document.body.innerText.includes('Official Administration Sign In');
    });
    console.log(`Login form rendered: ${hasSignInHeading}`);
    if (!hasSignInHeading) {
      throw new Error('Browser test failed: Login form heading not found after unlock!');
    }

    // Verify HTTP-only cookie exists in browser context
    const cookies = await page.cookies();
    const gateCookie = cookies.find(c => c.name === 'pv_admin_gate');
    console.log(`Gate cookie verified:`, {
      name: gateCookie?.name,
      httpOnly: gateCookie?.httpOnly,
      valueLength: gateCookie?.value?.length,
    });
    if (!gateCookie || !gateCookie.httpOnly) {
      throw new Error('Browser test failed: pv_admin_gate HTTP-only cookie missing or invalid!');
    }

    console.log('\n[PASS] Browser secret link unlocked the portal, stripped the key from address bar, and set HTTP-only cookie!');
  } finally {
    await browser.close();
  }
}

async function main() {
  await testFetchCases();
  await testBrowserUserExperience();
  console.log('\n===============================================================');
  console.log('MIDDLEWARE GATE & ONE-TIME UNLOCK VERIFICATION COMPLETE');
  console.log('===============================================================');
}

main().catch(err => {
  console.error('MIDDLEWARE VERIFICATION ERROR:', err);
  process.exit(1);
});
