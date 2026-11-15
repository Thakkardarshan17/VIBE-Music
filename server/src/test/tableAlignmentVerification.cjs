const { chromium } = require('playwright');
const path = require('path');

async function verifyTableAlignment() {
  console.log('🧪 Starting Song Table Straight-Line Alignment Verification...\n');

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

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Skip splash screen
  await page.addInitScript(() => {
    sessionStorage.setItem('vibe_splash_shown', 'true');
  });

  // Log in as demo user
  console.log('Authenticating demo user...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.click('button:has-text("Demo User")');
  await page.waitForTimeout(1000);

  // Navigate to Top Charts page
  console.log('Navigating to Top Charts page (/charts)...');
  await page.goto('http://localhost:5173/charts', { waitUntil: 'networkidle' });

  // Wait for rows to finish loading
  const rowLocator = page.locator('.glass-panel .grid.grid-cols-12.cursor-pointer');
  await rowLocator.first().waitFor({ state: 'visible', timeout: 10000 });

  const rowCount = await rowLocator.count();
  console.log(`Found ${rowCount} song rows in the chart table.`);

  if (rowCount < 2) {
    throw new Error('Need at least 2 song rows to verify alignment!');
  }

  // Measure bounding rectangles across all rows
  const alignmentData = await page.evaluate(() => {
    const tableRows = Array.from(document.querySelectorAll('.glass-panel:first-of-type .grid.grid-cols-12.cursor-pointer'));
    return tableRows.map((row, idx) => {
      const albumCol = row.children[1];
      const providerCol = row.children[2];
      const statusCol = row.children[3];
      const actionsCol = row.children[4];

      return {
        row: idx + 1,
        albumLeft: albumCol ? Math.round(albumCol.getBoundingClientRect().left) : 0,
        providerLeft: providerCol ? Math.round(providerCol.getBoundingClientRect().left) : 0,
        statusLeft: statusCol ? Math.round(statusCol.getBoundingClientRect().left) : 0,
        actionsRight: actionsCol ? Math.round(actionsCol.getBoundingClientRect().right) : 0,
      };
    });
  });

  console.log('\n--- Alignment Measurements across Rows ---');
  alignmentData.slice(0, 8).forEach((d) => {
    console.log(`Row #${d.row}: Album.left = ${d.albumLeft}px | Provider.left = ${d.providerLeft}px | Status.left = ${d.statusLeft}px | Actions.right = ${d.actionsRight}px`);
  });

  // Verify that all albumLeft are identical
  const firstAlbumLeft = alignmentData[0].albumLeft;
  const albumMismatch = alignmentData.find((d) => Math.abs(d.albumLeft - firstAlbumLeft) > 1);
  if (albumMismatch) {
    throw new Error(`Album alignment mismatch on Row #${albumMismatch.row}: expected ${firstAlbumLeft}px, got ${albumMismatch.albumLeft}px`);
  }
  console.log('✅ PASS: All Album columns are 100% aligned in the exact same vertical line!');

  // Verify that all providerLeft are identical
  const firstProviderLeft = alignmentData[0].providerLeft;
  const providerMismatch = alignmentData.find((d) => Math.abs(d.providerLeft - firstProviderLeft) > 1);
  if (providerMismatch) {
    throw new Error(`Provider alignment mismatch on Row #${providerMismatch.row}: expected ${firstProviderLeft}px, got ${providerMismatch.providerLeft}px`);
  }
  console.log('✅ PASS: All Source/Provider badge columns are 100% aligned in the exact same vertical line!');

  // Verify that all statusLeft are identical
  const firstStatusLeft = alignmentData[0].statusLeft;
  const statusMismatch = alignmentData.find((d) => Math.abs(d.statusLeft - firstStatusLeft) > 1);
  if (statusMismatch) {
    throw new Error(`Status alignment mismatch on Row #${statusMismatch.row}: expected ${firstStatusLeft}px, got ${statusMismatch.statusLeft}px`);
  }
  console.log('✅ PASS: All "Full Song" badge columns are 100% aligned in the exact same vertical line!');

  // Capture screenshot of the aligned table
  const shotPath = path.join(__dirname, '..', '..', 'table_aligned_verified.png');
  await page.screenshot({ path: shotPath });
  console.log(`📸 Screenshot of perfectly aligned table saved to: ${shotPath}`);

  await browser.close();
  console.log('\n🎉 ALL ALIGNMENT VERIFICATIONS PASSED 100%!');
}

verifyTableAlignment().catch((err) => {
  console.error('\n❌ Alignment verification failed:', err);
  process.exit(1);
});
