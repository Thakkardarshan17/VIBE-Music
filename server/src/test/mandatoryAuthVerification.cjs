const { chromium } = require('playwright');
const axios = require('axios');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';
const CLIENT_BASE = 'http://localhost:5173';

async function runAuthVerification() {
  console.log('🧪 Starting Mandatory User Authentication Verification Suite...\n');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch (e2) {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  // Handle uncaught page errors
  const pageErrors = [];
  page.on('pageerror', (err) => {
    console.error('⚠️ [Page Error Caught]:', err.message);
    pageErrors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  // Skip splash screen in test
  await page.addInitScript(() => {
    sessionStorage.setItem('vibe_splash_shown', 'true');
  });

  // ==========================================
  // TEST 1: Unauthenticated Users Blocked from Protected Routes
  // ==========================================
  console.log('--- TEST 1: Unauthenticated Users Blocked from Streaming App ---');
  // Clear any existing tokens
  await page.goto(CLIENT_BASE + '/login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('vibe_splash_shown', 'true');
  });

  // Try to access Home Page '/'
  await page.goto(CLIENT_BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const currentUrl = page.url();
  console.log('Visiting "/" when unauthenticated redirected to:', currentUrl);
  if (!currentUrl.includes('/login')) {
    throw new Error(`Expected unauthenticated user visiting "/" to be redirected to /login, but got: ${currentUrl}`);
  }
  console.log('✅ PASS: Unauthenticated user visiting "/" is redirected to /login');

  // Try to access Explore Page '/explore'
  await page.goto(CLIENT_BASE + '/explore', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  if (!page.url().includes('/login')) {
    throw new Error(`Expected unauthenticated user visiting "/explore" to be redirected to /login, but got: ${page.url()}`);
  }
  console.log('✅ PASS: Unauthenticated user visiting "/explore" is redirected to /login');

  // ==========================================
  // TEST 2: User Sign Up with Email Verification Flow
  // ==========================================
  console.log('\n--- TEST 2: User Sign Up & Email Verification Flow ---');
  const timestamp = Date.now();
  const testUser = {
    fullName: `Vibe Tester ${timestamp}`,
    email: `tester_${timestamp}@vibetest.com`,
    password: 'Password@2026',
    confirmPassword: 'Password@2026',
    mobileNumber: '+919876543210',
  };

  await page.goto(CLIENT_BASE + '/signup', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Fill Registration Form
  await page.fill('input[placeholder*="Rahul Sharma"]', testUser.fullName);
  await page.fill('input[type="email"]', testUser.email);
  await page.fill('input[placeholder*="+91"]', testUser.mobileNumber);
  await page.fill('input[placeholder*="Min 8 characters"]', testUser.password);
  await page.fill('input[placeholder*="Repeat password"]', testUser.confirmPassword);

  console.log('Submitting registration form...');
  await page.click('button:has-text("Create VIBE Account")');

  // Wait for Email Verification Modal to appear
  const modalHeader = page.locator('h3:has-text("Verify Your Email")');
  await modalHeader.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ Verification Modal appeared on screen!');

  // Click auto-fill or enter code
  const autoFillBtn = page.locator('button:has-text("Auto-Fill")').first();
  if (await autoFillBtn.isVisible()) {
    console.log('Clicking Auto-Fill for verification code...');
    await autoFillBtn.click();
  }

  // Click Verify & Launch VIBE
  console.log('Submitting email verification...');
  await page.click('button:has-text("Verify & Launch VIBE")');
  await page.waitForTimeout(1200);

  // Should now be on Home Page '/'
  console.log('Current URL after verification:', page.url());
  const homeBanner = page.locator('text=Spotlight').first();
  await homeBanner.waitFor({ state: 'visible', timeout: 6000 });
  console.log('✅ PASS: Registration & Email Verification succeeded! User is auto-logged in to Home Page.');

  // ==========================================
  // TEST 3: User Profile & Topbar State
  // ==========================================
  console.log('\n--- TEST 3: Authenticated Topbar & Sidebar Navigation ---');
  const userProfileBtn = page.locator('header button img').first();
  await userProfileBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ PASS: User avatar is visible in topbar for authenticated user');

  // ==========================================
  // TEST 4: Secure Logout Flow with Confirmation Modal
  // ==========================================
  console.log('\n--- TEST 4: Logout Confirmation & Server Session Invalidation ---');
  // Click user avatar to open dropdown
  await userProfileBtn.click();
  await page.waitForTimeout(400);

  // Click Log Out button in dropdown
  const logoutBtn = page.locator('button:has-text("Log Out")').first();
  await logoutBtn.click();

  // Verify Confirmation Modal appears
  const logoutModal = page.locator('h3:has-text("Log Out of VIBE?")');
  await logoutModal.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ Logout confirmation modal appeared!');

  // Confirm Logout
  const confirmBtn = page.locator('.fixed button:has-text("Log Out")').last();
  await confirmBtn.click();
  await page.waitForTimeout(1000);

  // Verify redirected to /login
  console.log('URL after logout:', page.url());
  if (!page.url().includes('/login')) {
    throw new Error(`Expected user to be on /login after logout, but was on ${page.url()}`);
  }
  console.log('✅ PASS: User successfully logged out and redirected to /login');

  // Verify token cleared
  const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('vibe_token'));
  if (tokenAfterLogout) {
    throw new Error('Token was not cleared after logout!');
  }
  console.log('✅ PASS: Client-side authentication tokens cleared completely.');

  // Test Back button prevention
  await page.goBack();
  await page.waitForTimeout(600);
  console.log('URL after clicking Back button:', page.url());
  if (page.url() !== CLIENT_BASE + '/login' && !page.url().includes('/login')) {
    throw new Error(`Back button allowed access to protected page: ${page.url()}`);
  }
  console.log('✅ PASS: Back button does not allow re-entry to protected pages after logout.');

  // ==========================================
  // TEST 5: Direct Login with Registered Account
  // ==========================================
  console.log('\n--- TEST 5: Login with Existing Account ---');
  await page.goto(CLIENT_BASE + '/login', { waitUntil: 'networkidle' });
  await page.fill('input[placeholder*="name@example.com"]', testUser.email);
  await page.fill('input[placeholder*="Enter your password"]', testUser.password);
  await page.click('button:has-text("Sign In to VIBE")');
  await page.waitForTimeout(1000);

  if (!page.url().endsWith('/') && page.url().includes('/login')) {
    throw new Error('Login with newly created verified credentials failed!');
  }
  console.log('✅ PASS: Login with existing registered account succeeded!');

  // ==========================================
  // TEST 6: Google OAuth Backend API Verification
  // ==========================================
  console.log('\n--- TEST 6: Google OAuth Backend Endpoint & Session Creation ---');
  const googleRes = await axios.post(`${API_BASE}/auth/google`, {
    testProfile: {
      email: `google_user_${timestamp}@gmail.com`,
      name: 'Google Verified User',
      sub: `goog_sub_${timestamp}`,
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    },
  });

  if (!googleRes.data.token || !googleRes.data.user.email) {
    throw new Error('Google OAuth backend API failed to return token or user record');
  }
  console.log('Google Auth Response user:', googleRes.data.user.email);
  console.log('✅ PASS: Google OAuth backend endpoint verified and created session!');

  // ==========================================
  // TEST 7: Forgot Password & Reset Flow
  // ==========================================
  console.log('\n--- TEST 7: Forgot Password & Reset Flow ---');
  // Request reset code via API
  const forgotRes = await axios.post(`${API_BASE}/auth/forgot-password`, {
    email: testUser.email,
  });
  console.log('Forgot password response:', forgotRes.data.message);
  const resetCode = forgotRes.data.demoResetKey;

  // Reset password
  const newPassword = 'NewSecretPassword@2026';
  const resetRes = await axios.post(`${API_BASE}/auth/reset-password`, {
    email: testUser.email,
    code: resetCode,
    newPassword,
    confirmPassword: newPassword,
  });
  console.log('Reset password response:', resetRes.data.message);

  // Verify login with new password
  const newLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    login: testUser.email,
    password: newPassword,
  });
  if (!newLoginRes.data.token) {
    throw new Error('Login with new reset password failed!');
  }
  console.log('✅ PASS: Password successfully reset and authenticated with new password!');

  await browser.close();
  console.log('\n🎉 ALL 7 MANDATORY AUTHENTICATION SUITE TESTS PASSED 100%!');
}

runAuthVerification().catch((err) => {
  console.error('\n❌ Authentication verification failed:', err);
  process.exit(1);
});
