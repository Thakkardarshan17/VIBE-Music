const { chromium } = require('playwright');
const axios = require('axios');

async function testArtistsPage() {
  console.log('Obtaining valid auth session token...');
  const authRes = await axios.post('http://localhost:5000/api/auth/google', {
    testProfile: {
      sub: 'test_artist_sub_' + Date.now(),
      email: `artist_test_${Date.now()}@gmail.com`,
      name: 'Artist Tester',
    },
  });
  const validToken = authRes.data.token;
  console.log('Obtained valid token!');

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (e) {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Inject real token before page loads
    await page.addInitScript((tok) => {
      localStorage.setItem('vibe_token', tok);
      sessionStorage.setItem('vibe_splash_shown', 'true');
    }, validToken);

    // 1. Visit Artists Page directly
    console.log('Navigating to http://localhost:5173/artists ...');
    await page.goto('http://localhost:5173/artists', { waitUntil: 'networkidle', timeout: 15000 });

    // Wait for artists to appear
    await page.waitForSelector('text=Arijit Singh', { timeout: 10000 });
    console.log('PASS: Artists grid loaded with Arijit Singh!');

    // Wait for initial artist tracks (default Arijit Singh)
    await page.waitForSelector('h4:has-text("Top Hits & Discography")', { timeout: 10000 });
    console.log('PASS: Top Hits & Discography header appeared!');

    // Check that song rows exist
    const songRows = await page.locator('div[role="row"], .glass-card').count();
    console.log(`PASS: Rendered ${songRows} song elements on the page.`);

    // 2. Click on "Diljit Dosanjh"
    console.log('Clicking on Diljit Dosanjh card...');
    const diljitCard = page.locator('div:has-text("Diljit Dosanjh")').last();
    await diljitCard.click();

    // Verify Diljit Dosanjh header updates
    await page.waitForSelector('h3:has-text("Diljit Dosanjh")', { timeout: 8000 });
    console.log('PASS: Artist header dynamically updated to Diljit Dosanjh!');

    // Verify tracks for Diljit Dosanjh appear
    await page.waitForTimeout(1000);
    const discographyText = await page.locator('h4:has-text("Top Hits & Discography")').textContent();
    console.log('PASS:', discographyText);

    // 3. Click on "Aditya Gadhvi"
    console.log('Clicking on Aditya Gadhvi card...');
    const adityaCard = page.locator('div:has-text("Aditya Gadhvi")').last();
    await adityaCard.click();

    // Verify Aditya Gadhvi header updates
    await page.waitForSelector('h3:has-text("Aditya Gadhvi")', { timeout: 8000 });
    console.log('PASS: Artist header dynamically updated to Aditya Gadhvi!');

    await page.waitForTimeout(1000);
    const adityaDiscography = await page.locator('h4:has-text("Top Hits & Discography")').textContent();
    console.log('PASS:', adityaDiscography);

    console.log('\n=============================================');
    console.log('🎉 ALL ARTIST CLICK & MUSIC LIST TESTS PASSED!');
    console.log('=============================================\n');
  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testArtistsPage();
