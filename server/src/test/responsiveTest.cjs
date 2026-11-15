const { chromium } = require('playwright');

const BREAKPOINTS = [
  320, 360, 375, 390, 414, 430, 600, 768, 820, 1024, 1280, 1366, 1440, 1600, 1920
];

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Login', path: '/login' },
  { name: 'SignUp', path: '/signup' },
  { name: 'ForgotPassword', path: '/forgot-password' },
  { name: 'Search', path: '/search' },
  { name: 'PlayerStudio', path: '/player' },
  { name: 'Library', path: '/library' },
  { name: 'Settings', path: '/settings' }
];

async function runResponsiveTests() {
  console.log('🚀 Starting VIBE Music Multi-Viewport Responsive Validation Suite...\n');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log('Chromium not installed locally in Playwright, trying msedge or system chrome...');
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch (e2) {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  let totalTests = 0;
  let passedTests = 0;
  let failures = [];

  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp, height: 800 });
    console.log(`📐 Checking Breakpoint ${bp}px...`);

    for (const p of PAGES) {
      totalTests++;
      try {
        await page.goto(`http://localhost:5173${p.path}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
        await page.waitForTimeout(300);

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          return {
            scrollWidth: docWidth,
            innerWidth: winWidth,
            hasOverflow: docWidth > winWidth + 1 // 1px tolerance for subpixel rounding
          };
        });

        if (overflow.hasOverflow) {
          failures.push(`[${bp}px] Page "${p.name}" has horizontal overflow: scrollWidth=${overflow.scrollWidth} > winWidth=${overflow.innerWidth}`);
          console.log(`  ❌ ${p.name} @ ${bp}px: OVERFLOW detected (${overflow.scrollWidth}px > ${overflow.innerWidth}px)`);
        } else {
          passedTests++;
        }
      } catch (err) {
        failures.push(`[${bp}px] Page "${p.name}" error: ${err.message}`);
        console.log(`  ❌ ${p.name} @ ${bp}px: Error ${err.message}`);
      }
    }
  }

  await browser.close();

  console.log('\n========================================================');
  console.log(`RESPONSIVE TEST SUMMARY: ${passedTests} / ${totalTests} PASSED`);
  if (failures.length > 0) {
    console.log(`FAILURES (${failures.length}):`);
    failures.forEach(f => console.log('  - ' + f));
    process.exit(1);
  } else {
    console.log('🎉 100% RESPONSIVE: ZERO horizontal overflow across all 15 breakpoints!');
    console.log('========================================================\n');
    process.exit(0);
  }
}

runResponsiveTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});

