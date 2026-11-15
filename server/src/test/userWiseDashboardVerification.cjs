const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== VIBE USER-WISE ACTIVITY TRACKING & DASHBOARD VERIFICATION ===\n');
  let testsPassed = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // TEST 1: Profile Page Password Form Removal
  console.log('1. Checking ProfilePage.tsx for Password form removal...');
  const profilePageContent = fs.readFileSync(
    path.join(__dirname, '../../../client/src/pages/ProfilePage.tsx'),
    'utf8'
  );
  assert(!profilePageContent.includes('handleChangePassword'), 'No handleChangePassword in ProfilePage');
  assert(!profilePageContent.includes('type="password"'), 'No password input fields in ProfilePage');
  assert(!profilePageContent.includes('Change Password'), 'No "Change Password" form in ProfilePage');
  assert(profilePageContent.includes('Google Verified'), 'Displays Google Verified account badge');
  assert(profilePageContent.includes('Music Dashboard'), 'Displays link to Music Dashboard');

  // TEST 2: Create Account A & Account B
  console.log('\n2. Creating two independent Google authenticated accounts (Account A & Account B)...');
  const userA_email = `usera_${Date.now()}@gmail.com`;
  const userB_email = `userb_${Date.now()}@gmail.com`;

  const authA = await axios.post(`${API_BASE}/auth/google`, {
    testProfile: {
      sub: 'goog_sub_A_' + Date.now(),
      email: userA_email,
      name: 'User A (Aarav)',
    },
  });
  const tokenA = authA.data.token;
  const userA_id = authA.data.user.id;

  const authB = await axios.post(`${API_BASE}/auth/google`, {
    testProfile: {
      sub: 'goog_sub_B_' + Date.now(),
      email: userB_email,
      name: 'User B (Bhavya)',
    },
  });
  const tokenB = authB.data.token;
  const userB_id = authB.data.user.id;

  assert(Boolean(tokenA) && Boolean(tokenB), 'Both accounts authenticated via Google');
  assert(userA_id !== userB_id, 'Accounts have distinct user IDs');

  // TEST 3: User A saves Liked Song, creates Playlist, and Follows Artist
  console.log('\n3. User A performs private music actions...');
  const testSong1 = {
    id: 'track-kesariya-101',
    title: 'Kesariya',
    artist: 'Arijit Singh',
    album: 'Brahmastra',
    duration: 268,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
  };

  const likeResA = await axios.post(
    `${API_BASE}/me/liked-songs/${testSong1.id}`,
    { song: testSong1 },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  assert(likeResA.status === 201 && likeResA.data.liked === true, 'User A liked Kesariya');

  const playlistResA = await axios.post(
    `${API_BASE}/me/playlists`,
    { title: 'Aarav Midnight Vibes', description: 'Personal playlist by User A' },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  const playlistA_id = playlistResA.data.playlist.id;
  assert(playlistResA.status === 201 && Boolean(playlistA_id), 'User A created private playlist');

  const followResA = await axios.post(
    `${API_BASE}/me/followed-artists/artist-arijit`,
    { artistName: 'Arijit Singh', genre: 'Bollywood Romantic' },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  assert(followResA.status === 201 && followResA.data.followed === true, 'User A followed Arijit Singh');

  // Log meaningful playback session for User A (65 seconds)
  const listenResA = await axios.post(
    `${API_BASE}/me/listening-events`,
    {
      song: testSong1,
      listenedDuration: 65,
      completionPercentage: 55,
      eventType: 'half_completed',
    },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  assert(listenResA.status === 201 && listenResA.data.recorded === true, 'Meaningful playback session recorded for User A');

  // TEST 4: Verification of Complete User Isolation (User B must see ZERO of User A data)
  console.log('\n4. Verifying User B cannot see User A private data...');
  const userB_liked = await axios.get(`${API_BASE}/me/liked-songs`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(userB_liked.data.likedSongs.length === 0, 'User B has 0 liked songs (isolated from User A)');

  const userB_playlists = await axios.get(`${API_BASE}/me/playlists`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(userB_playlists.data.playlists.length === 0, 'User B has 0 playlists (isolated from User A)');

  const userB_artists = await axios.get(`${API_BASE}/me/followed-artists`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(userB_artists.data.artists.length === 0, 'User B has 0 followed artists (isolated from User A)');

  // TEST 5: IDOR & Security Ownership Check
  console.log('\n5. Verifying User B cannot delete or modify User A playlist (403 Forbidden)...');
  let idorBlocked = false;
  try {
    await axios.delete(`${API_BASE}/me/playlists/${playlistA_id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
  } catch (err) {
    if (err.response && err.response.status === 403) {
      idorBlocked = true;
    }
  }
  assert(idorBlocked, 'IDOR blocked: User B cannot delete User A playlist');

  // TEST 6: User A Personal Dashboard Real DB Stats
  console.log('\n6. Verifying User A Dashboard with real DB statistics...');
  const dashResA = await axios.get(`${API_BASE}/me/dashboard`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });

  const d = dashResA.data;
  assert(d.stats.totalLikedSongs === 1, 'Dashboard totalLikedSongs === 1');
  assert(d.stats.totalPlaylists === 1, 'Dashboard totalPlaylists === 1');
  assert(d.stats.totalFollowedArtists === 1, 'Dashboard totalFollowedArtists === 1');
  assert(d.stats.totalSongsPlayed >= 1, 'Dashboard totalSongsPlayed >= 1');
  assert(d.stats.totalListeningMinutes >= 1, 'Dashboard totalListeningMinutes >= 1');
  assert(Array.isArray(d.weeklyActivity) && d.weeklyActivity.length === 7, 'Weekly activity has 7 days of breakdown');
  assert(d.recentlyPlayed.length >= 1 && d.recentlyPlayed[0].title === 'Kesariya', 'Recently played lists Kesariya');
  assert(d.mostPlayedSongs.length >= 1 && d.mostPlayedSongs[0].title === 'Kesariya', 'Most played song is Kesariya');

  // TEST 7: Threshold Enforcement (< 30s not counted as full play session)
  console.log('\n7. Testing listening event threshold (< 30s rejected)...');
  const shortListenRes = await axios.post(
    `${API_BASE}/me/listening-events`,
    {
      song: testSong1,
      listenedDuration: 10,
      completionPercentage: 15,
      eventType: 'skipped',
    },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  assert(shortListenRes.data.recorded === false, 'Sub-30s playback correctly not recorded as meaningful session');

  console.log('\n======================================================');
  console.log(`VERIFICATION COMPLETE: ${testsPassed} / ${totalTests} TESTS PASSED!`);
  console.log('======================================================\n');

  if (testsPassed === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});

