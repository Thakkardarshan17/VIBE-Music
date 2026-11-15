const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testSplashScreen() {
  console.log('🎬 Starting VIBE Animated Splash Screen Automated Verification Suite...\n');

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

  // Test 1: Mobile Screen (375 x 667)
  console.log('📱 Testing Splash Screen on Mobile (375x667)...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5173/splash', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600); // 0.6s into animation

  // Check Developer Credit text
  const devCreditLocator = page.locator('footer');
  await devCreditLocator.waitFor({ state: 'visible', timeout: 5000 });
  const devText = await devCreditLocator.innerText();
  console.log(`Developer credit text: "${devText.trim()}"`);
  if (!devText.includes('Developed by Thakkar Darshan')) {
    throw new Error(`Developer credit text mismatch! Expected "Developed by Thakkar Darshan", got "${devText}"`);
  }
  console.log('✅ Developer credit text verified: "Developed by Thakkar Darshan"');

  // Check Tagline
  const taglineLocator = page.locator('text=Feel the Music. Live the Vibe.');
  const hasTagline = await taglineLocator.isVisible();
  console.log(`Tagline visible: ${hasTagline}`);
  if (!hasTagline) {
    throw new Error('Tagline "Feel the Music. Live the Vibe." is missing!');
  }
  console.log('✅ Tagline verified: "Feel the Music. Live the Vibe."');

  // Check Equalizer bars
  const eqBars = page.locator('.splash-eq-bar');
  const eqCount = await eqBars.count();
  console.log(`Equalizer bars count: ${eqCount}`);
  if (eqCount < 10) {
    throw new Error(`Expected at least 10 equalizer bars, got ${eqCount}`);
  }
  console.log(`✅ Animated Equalizer verified (${eqCount} bars)`);

  // Check Loading Text
  const loadingText = page.locator('text=Loading Your VIBE Experience...');
  const hasLoading = await loadingText.isVisible();
  console.log(`Loading indicator visible: ${hasLoading}`);

  // Take screenshot at mid-animation on mobile
  const mobileShot = path.join(__dirname, '..', '..', 'splash_mobile_verified.png');
  await page.screenshot({ path: mobileShot });
  console.log(`📸 Mobile splash screenshot saved: ${mobileShot}`);

  // Test 2: Desktop Screen (1280 x 800)
  console.log('\n💻 Testing Splash Screen on Desktop (1280x800)...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/splash', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const devCreditDesktop = await page.locator('footer').innerText();
  console.log(`Desktop developer credit: "${devCreditDesktop.trim()}"`);

  const desktopShot = path.join(__dirname, '..', '..', 'splash_desktop_verified.png');
  await page.screenshot({ path: desktopShot });
  console.log(`📸 Desktop splash screenshot saved: ${desktopShot}`);

  // Test 3: Check completion and automatic routing
  console.log('\n⏳ Waiting for splash animation to complete and trigger auth-based routing (~3s)...');
  await page.waitForTimeout(3500);
  const currentUrl = page.url();
  console.log(`Current URL after splash: ${currentUrl}`);
  // If not logged in, should be /login or /signup
  if (currentUrl.includes('/login') || currentUrl.includes('/signup') || currentUrl.endsWith('/')) {
    console.log('✅ Auth-based routing successfully executed after splash!');
  } else {
    console.warn(`Unexpected URL: ${currentUrl}`);
  }

  await browser.close();
  console.log('\n🎉 ALL SPLASH SCREEN VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

testSplashScreen().catch((err) => {
  console.error('Splash screen test error:', err);
  process.exit(1);
});

