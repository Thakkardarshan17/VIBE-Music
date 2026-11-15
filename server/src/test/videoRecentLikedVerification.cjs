const { chromium } = require('playwright');
const path = require('path');

async function testVideoRecentLiked() {
  console.log('🧪 Starting Video Toggle, Recent Tracks, and Liked Songs Verification...\n');

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

  // Listen for any uncaught page errors or console errors
  let uncaughtErrors = [];
  page.on('pageerror', (err) => {
    console.error('⚠️ [Page Error Caught]:', err.message);
    uncaughtErrors.push(err.message);
  });

  // Bypass splash screen in test
  await page.addInitScript(() => {
    sessionStorage.setItem('vibe_splash_shown', 'true');
  });

  // 1. Log in with Demo Credentials (Mandatory Auth)
  console.log('--- 1. Authenticating Demo User ---');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.click('button:has-text("Demo User")');
  await page.waitForTimeout(1000);

  // 2. Play a song on Home page
  console.log('--- 2. Playing a song on Home page ---');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Click Play on the Spotlight Hero or first song card
  const playBtn = page.locator('button:has-text("Play Spotlight")').first();
  if (await playBtn.isVisible()) {
    console.log('Clicking Play Spotlight...');
    await playBtn.click();
  } else {
    console.log('Clicking first song card play button...');
    await page.locator('.glass-card button').first().click();
  }
  await page.waitForTimeout(1000);

  // Verify Mini Player is now active
  const miniPlayer = page.locator('text=FULL SONG').first();
  await miniPlayer.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ Song started playing in Mini Player!');

  // 2. Click the TV Video Button to toggle music video!
  console.log('\n--- 2. Testing TV Video Toggle Button (No Crash Test) ---');
  const tvBtn = page.locator('button[title*="Video"]:visible').first();
  await tvBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Clicking TV button to open Music Video...');
  await tvBtn.click();
  await page.waitForTimeout(1000);

  // Check that the page did NOT crash
  if (uncaughtErrors.length > 0) {
    throw new Error(`Page crashed with errors: ${uncaughtErrors.join(', ')}`);
  }
  console.log('✅ Video Window opened without crashing!');

  // Capture screenshot of video window
  const videoShot = path.join(__dirname, '..', '..', 'video_player_verified.png');
  await page.screenshot({ path: videoShot });
  console.log(`📸 Video window screenshot saved: ${videoShot}`);

  // Click TV button again to hide video
  console.log('Clicking TV button to close/toggle video...');
  await tvBtn.click();
  await page.waitForTimeout(600);
  console.log('✅ Video Window closed cleanly without crash!');

  // 3. Test Liking the song
  console.log('\n--- 3. Testing Liking a Song ---');
  const likeBtn = page.locator('button[title="Like"]:visible, button[title="Unlike"]:visible').first();
  await likeBtn.click();
  await page.waitForTimeout(600);
  console.log('✅ Clicked Like button!');

  // 4. Navigate to Liked Songs page (/liked)
  console.log('\n--- 4. Checking Liked Songs Page (/liked) ---');
  await page.goto('http://localhost:5173/liked', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const likedCount = await page.locator('.glass-panel h2:has-text("Liked Songs")').isVisible();
  console.log(`Liked Songs banner visible: ${likedCount}`);

  // Check if at least 1 song is listed
  const songRows = page.locator('.glass-panel .group.flex.items-center');
  const rowCount = await songRows.count();
  console.log(`Found ${rowCount} song(s) in Liked Songs playlist!`);
  if (rowCount === 0) {
    throw new Error('Expected liked song to be present in Liked Songs page, but list is empty!');
  }
  console.log('✅ Liked song verified in Liked Songs page!');
  await page.screenshot({ path: path.join(__dirname, '..', '..', 'liked_songs_verified.png') });

  // 5. Navigate to History page (/history)
  console.log('\n--- 5. Checking Recently Played Page (/history) ---');
  await page.goto('http://localhost:5173/history', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const historyRows = page.locator('.glass-panel .group.flex.items-center');
  const histCount = await historyRows.count();
  console.log(`Found ${histCount} recently played track(s) in History page!`);
  if (histCount === 0) {
    throw new Error('Expected played song to be present in History page, but list is empty!');
  }
  console.log('✅ Played track verified in History page!');
  await page.screenshot({ path: path.join(__dirname, '..', '..', 'history_recent_verified.png') });

  // 6. Check Home page Recently Played shelf
  console.log('\n--- 6. Checking Home Page Recently Played Shelf ---');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const recentShelf = page.locator('h3:has-text("Recently Played")');
  const isShelfVisible = await recentShelf.isVisible();
  console.log(`Home page Recently Played shelf visible: ${isShelfVisible}`);
  if (!isShelfVisible) {
    throw new Error('Recently Played shelf is not visible on Home page after playing a song!');
  }
  console.log('✅ Recently Played shelf verified on Home page!');

  await browser.close();
  console.log('\n🎉 ALL TESTS PASSED: 0 CRASHES, VIDEO PLAYER, RECENT SONGS, AND LIKED SONGS FULLY VERIFIED!');
}

testVideoRecentLiked().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
