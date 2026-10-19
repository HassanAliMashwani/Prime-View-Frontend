const jwt = require('e:/Prime View/Prime view backend/node_modules/jsonwebtoken');
const puppeteer = require('e:/Prime View/Prime View frontend/node_modules/puppeteer');

const JWT_SECRET = "65d1d082-dee0-40a5-8ea1-8d3d47736285";

const payload = {
  adminId: 'admin-1',
  username: 'admin',
  role: 'super_admin',
  fullName: 'Chief Executive Officer (Super Admin)',
  status: 'active',
  permissions: {
    can_reserve: true,
    can_book: true,
    can_create_customer: true,
    can_view_customers: true,
    can_view_sales_reports: true,
    can_view_sales_history: true,
    can_edit_content: true,
    can_verify_receipts: true,
    can_view_inventory: true,
    can_view_master_plan: true,
  },
  assignedBlocks: ['abbott', 'royal', 'overseas', 'elite', 'commercial', 'npf-phase-1', 'npf-phase-2'],
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

const superAdminSession = {
  ...payload,
  token,
  expiresAt: Date.now() + 86400000,
};

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  await page.setCookie({
    name: 'pv_admin_gate',
    value: 'ed2c2d60ef2e3e335716ea5d8f315b8c5bbdca7a',
    domain: 'localhost',
    path: '/',
  });

  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });
  await page.evaluate((sess) => {
    localStorage.setItem('prime_view_admin_session', sess);
    sessionStorage.setItem('prime_view_admin_session', sess);
  }, JSON.stringify(superAdminSession));

  await page.goto('http://localhost:3000/admin/master-plan/abbott', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));

  await page.screenshot({ path: 'C:/Users/it center/.gemini/antigravity-ide/brain/dceb519d-4ae6-4376-9be3-9d121e76507d/abbott_desktop.png' });
  console.log('Saved abbott_desktop.png');

  await page.setViewport({ width: 375, height: 667 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:/Users/it center/.gemini/antigravity-ide/brain/dceb519d-4ae6-4376-9be3-9d121e76507d/abbott_mobile.png' });
  console.log('Saved abbott_mobile.png');

  await browser.close();
})();
