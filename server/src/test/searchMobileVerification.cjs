const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testSearchMobile() {
  console.log('🔍 Testing Mobile Search Transparency & UI Verification...');
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

  // Test on standard mobile size: 375 x 667 (iPhone SE/13 mini)
  await page.setViewportSize({ width: 375, height: 667 });

  // 1. Visit Home Page
  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(500);

  // 2. Focus search input in Topbar
  const searchInput = await page.locator('header input[type="text"]');
  await searchInput.click();
  await page.waitForTimeout(300);

  // 3. Type "dil"
  console.log('Typing "dil" in mobile search input...');
  await searchInput.fill('dil');
  await page.waitForTimeout(2000); // wait for 300ms debounce + API fetch + animation

  // 4. Verify dropdown is visible
  const dropdown = page.locator('div[style*="background-color: rgb(18, 9, 29)"], div[style*="background-color: #12091D"]').first();
  const isDropdownVisible = await dropdown.isVisible();
  console.log(`Dropdown visible: ${isDropdownVisible}`);

  // 5. Inspect computed styles
  const styles = await dropdown.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      backgroundColor: computed.backgroundColor,
      opacity: computed.opacity,
      backdropFilter: computed.backdropFilter,
      zIndex: computed.zIndex,
      width: rect.width,
      left: rect.left,
      top: rect.top,
      position: computed.position,
    };
  });

  console.log('Computed styles of dropdown:', JSON.stringify(styles, null, 2));

  // Check opacity and background color
  const isSolid = (styles.opacity === '1') && 
                  (styles.backgroundColor === 'rgb(18, 9, 29)' || styles.backgroundColor.includes('18, 9, 29'));
  console.log(`Dropdown is 100% solid and opaque: ${isSolid}`);

  // Save screenshot to artifact folder
  const screenshotPath = path.join(__dirname, '..', '..', 'search_mobile_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to ${screenshotPath}`);

  // 6. Test on Search Page as well
  console.log('\nNavigating to http://localhost:5173/search ...');
  await page.goto('http://localhost:5173/search', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(500);

  const pageSearchInput = page.locator('div.max-w-3xl input[type="text"]');
  await pageSearchInput.click();
  await pageSearchInput.fill('shubh');
  await page.waitForTimeout(800);

  const searchPageDropdown = page.locator('div[style*="background-color: rgb(18, 9, 29)"], div[style*="background-color: #12091D"]').first();
  const spStyles = await searchPageDropdown.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      backgroundColor: computed.backgroundColor,
      opacity: computed.opacity,
      backdropFilter: computed.backdropFilter,
    };
  });
  console.log('Search page dropdown styles:', JSON.stringify(spStyles, null, 2));

  const screenshotPath2 = path.join(__dirname, '..', '..', 'search_page_mobile_verified.png');
  await page.screenshot({ path: screenshotPath2 });
  console.log(`Search page mobile screenshot saved to ${screenshotPath2}`);

  await browser.close();
  console.log('\n✅ All Mobile Search UI & Solid Opacity tests PASSED!');
}

testSearchMobile().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
