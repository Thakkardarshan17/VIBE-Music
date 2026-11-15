const { chromium } = require('playwright');
const path = require('path');

async function testLogoReplacement() {
  console.log('🚀 Starting Complete VIBE MUSIC Logo Replacement Verification Suite...\n');

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

  // Helper to verify logo image
  async function verifyLogoOnPage(pageName, selector = 'img[alt*="VIBE MUSIC"]') {
    const logos = page.locator(selector);
    const count = await logos.count();
    console.log(`Checking ${pageName}: found ${count} official logo instances`);
    if (count === 0) {
      throw new Error(`No logo found on ${pageName} using selector "${selector}"`);
    }

    for (let i = 0; i < count; i++) {
      const isVisible = await logos.nth(i).isVisible();
      if (!isVisible) continue; // might be in hidden-on-mobile/desktop container
      const naturalWidth = await logos.nth(i).evaluate((img) => img.naturalWidth);
      const naturalHeight = await logos.nth(i).evaluate((img) => img.naturalHeight);
      console.log(`  Logo #${i + 1} visible: ${isVisible}, natural dimensions: ${naturalWidth}x${naturalHeight}`);
      if (naturalWidth === 0 || naturalHeight === 0) {
        throw new Error(`Logo #${i + 1} on ${pageName} failed to load (0 dimensions)!`);
      }
    }
    console.log(`  ✅ ${pageName} logo successfully verified!`);
  }

  // 1. Splash Screen
  console.log('\n--- 1. Testing Splash Screen Logo ---');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/splash', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await verifyLogoOnPage('Splash Screen');
  await page.screenshot({ path: path.join(__dirname, '..', '..', 'logo_splash_verified.png') });

  // 2. Desktop Home & Sidebar & Footer
  console.log('\n--- 2. Testing Desktop Home, Sidebar & Footer ---');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // Sidebar logo
  await verifyLogoOnPage('Desktop Sidebar', 'aside img[alt*="VIBE MUSIC"]');
  // Footer logo
  await verifyLogoOnPage('Desktop Footer', 'footer img[alt*="VIBE MUSIC"]');
  await page.screenshot({ path: path.join(__dirname, '..', '..', 'logo_desktop_home_verified.png') });

  // 3. Mobile Header (375px)
  console.log('\n--- 3. Testing Mobile Header (375px) ---');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await verifyLogoOnPage('Mobile Header', 'header img[alt*="VIBE MUSIC"]');
  await page.screenshot({ path: path.join(__dirname, '..', '..', 'logo_mobile_header_verified.png') });

  // 4. Login Page
  console.log('\n--- 4. Testing Login Page ---');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await verifyLogoOnPage('Login Page', 'img[alt*="VIBE MUSIC"]');
  await page.screenshot({ path: path.join(__dirname, '..', '..', 'logo_login_verified.png') });

  // 5. SignUp Page
  console.log('\n--- 5. Testing SignUp Page ---');
  await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await verifyLogoOnPage('SignUp Page', 'img[alt*="VIBE MUSIC"]');
  await page.screenshot({ path: path.join(__dirname, '..', '..', 'logo_signup_verified.png') });

  await browser.close();
  console.log('\n🎉 ALL LOGO REPLACEMENT TESTS PASSED SUCCESSFULLY!');
}

testLogoReplacement().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

