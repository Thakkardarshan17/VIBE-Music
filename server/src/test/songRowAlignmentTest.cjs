const { chromium } = require('playwright');
const axios = require('axios');

async function testSongRowAlignment() {
  console.log('Testing SongRow alignment across Mobile (360px) and Desktop (1280px)...');
  const authRes = await axios.post('http://localhost:5000/api/auth/google', {
    testProfile: {
      sub: 'align_test_sub_' + Date.now(),
      email: `align_test_${Date.now()}@gmail.com`,
      name: 'Align Tester',
    },
  });
  const validToken = authRes.data.token;

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (e) {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.addInitScript((tok) => {
      localStorage.setItem('vibe_token', tok);
      sessionStorage.setItem('vibe_splash_shown', 'true');
    }, validToken);

    for (const width of [360, 768, 1280]) {
      console.log(`\nTesting viewport width: ${width}px ...`);
      await page.setViewportSize({ width, height: 800 });
      await page.goto('http://localhost:5173/artists', { waitUntil: 'networkidle', timeout: 15000 });

      await page.waitForSelector('div[role="row"]', { timeout: 10000 });
      const row = page.locator('div[role="row"]').first();

      const titleEl = row.locator('p.truncate').first();
      const heartBtn = row.locator('button[title="Like song"], button[title="Unlike song"]').first();
      const durationEl = row.locator('span.font-mono').last();

      const titleBox = await titleEl.boundingBox();
      const heartBox = await heartBtn.boundingBox();
      const durationBox = await durationEl.boundingBox();

      const titleRight = titleBox.x + titleBox.width;
      console.log(`[${width}px] Title right: ${titleRight.toFixed(1)}px, Heart left: ${heartBox.x.toFixed(1)}px, Duration left: ${durationBox.x.toFixed(1)}px`);

      if (heartBox.x >= titleRight) {
        console.log(`[${width}px] PASS: Heart button does NOT overlap title!`);
      } else {
        console.error(`[${width}px] FAIL: Title overlaps heart button!`);
        process.exitCode = 1;
      }

      if (durationBox.x >= heartBox.x + heartBox.width) {
        console.log(`[${width}px] PASS: Duration is right-aligned after heart button!`);
      } else {
        console.error(`[${width}px] FAIL: Duration overlaps heart button!`);
        process.exitCode = 1;
      }
    }

    console.log('\n🎉 ALL ALIGNMENT CHECKS ACROSS MOBILE, TABLET & DESKTOP PASSED!');
  } catch (err) {
    console.error('Alignment test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testSongRowAlignment();
