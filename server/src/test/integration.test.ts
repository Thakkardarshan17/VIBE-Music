process.env.NODE_ENV = 'test';
import axios from 'axios';
import http from 'http';
import app from '../index.js';
import { seedDatabase } from '../db/seed.js';

const TEST_PORT = 5099;
let server: http.Server;
const API = `http://localhost:${TEST_PORT}/api`;

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 STARTING VIBE MUSIC FULL-STACK INTEGRATION TEST SUITE');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // Ensure seed is complete
  await seedDatabase();

  // 1. Start test server
  server = app.listen(TEST_PORT);
  await new Promise((r) => setTimeout(r, 1000));

  try {
    // 2. Health & Database Test
    const healthRes = await axios.get(`${API}/health`);
    assert(healthRes.status === 200 && healthRes.data.database.connected === true, 'Server & Database Connectivity (Health check)');

    // 3. User Registration Test
    const testEmail = `test_${Date.now()}@vibemusic.com`;
    const regRes = await axios.post(`${API}/auth/register`, {
      email: testEmail,
      username: `tester_${Date.now()}`,
      password: 'TestPassword@123',
    });
    assert(regRes.status === 201 && !!regRes.data.token, 'User Registration & JWT issuance');
    const userToken = regRes.data.token;
    const userHeaders = { Authorization: `Bearer ${userToken}` };

    // 4. User Login Test
    const loginRes = await axios.post(`${API}/auth/login`, {
      login: testEmail,
      password: 'TestPassword@123',
    });
    assert(loginRes.status === 200 && loginRes.data.user.email === testEmail, 'User Login with credentials');

    // 5. Auth /me & Profile Test
    const meRes = await axios.get(`${API}/auth/me`, { headers: userHeaders });
    assert(meRes.status === 200 && meRes.data.user.email === testEmail, 'Authenticated User Profile & Settings Retrieval');

    // 6. Admin Authentication Test
    const adminLoginRes = await axios.post(`${API}/auth/login`, {
      login: 'admin@vibemusic.com',
      password: 'Admin@123456',
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.user.role === 'ADMIN', 'Admin Authentication & Role Verification');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 7. Admin Dashboard Analytics Test
    const adminDashRes = await axios.get(`${API}/admin/dashboard`, { headers: adminHeaders });
    assert(
      adminDashRes.status === 200 &&
      adminDashRes.data.stats.totalUsers > 0 &&
      Array.isArray(adminDashRes.data.providers),
      'Admin Dashboard Analytics & Provider Registry'
    );

    // 8. Real Music API Search Test (Hindi & Global music)
    const searchRes = await axios.get(`${API}/music/search?q=Arijit Singh`);
    assert(
      searchRes.status === 200 &&
      searchRes.data.tracks.length > 0 &&
      searchRes.data.tracks.some((t: any) => t.isAuthorized === true),
      `Universal Music Search API (Arijit Singh - found ${searchRes.data.tracks.length} tracks with artwork and playback)`
    );

    // 9. Real Jamendo Music API Search Test
    const jamendoRes = await axios.get(`${API}/music/search?q=rock&provider=jamendo`);
    assert(
      jamendoRes.status === 200 &&
      jamendoRes.data.tracks.length > 0 &&
      !!jamendoRes.data.tracks[0].audioUrl,
      `Jamendo API Direct MP3 Stream Search (found ${jamendoRes.data.tracks.length} streaming tracks)`
    );

    // 10. Trending Music Endpoint Test
    const trendRes = await axios.get(`${API}/music/trending`);
    assert(trendRes.status === 200 && trendRes.data.tracks.length > 0, 'Trending Music API Endpoint');

    // 11. Top Charts Endpoint Test
    const chartRes = await axios.get(`${API}/music/charts`);
    assert(chartRes.status === 200 && chartRes.data.charts.length > 0, 'Top Charts Categorization Endpoint');

    // 12. Playlist Creation Test
    const createPlRes = await axios.post(
      `${API}/playlists`,
      { title: 'My Awesome Test Playlist', description: 'Testing playlist CRUD' },
      { headers: userHeaders }
    );
    assert(createPlRes.status === 201 && createPlRes.data.playlist.title === 'My Awesome Test Playlist', 'User Playlist Creation');
    const playlistId = createPlRes.data.playlist.id;

    // 13. Add Song to Playlist Test
    const sampleTrack = searchRes.data.tracks[0];
    const addTrackRes = await axios.post(
      `${API}/playlists/${playlistId}/tracks`,
      { song: sampleTrack },
      { headers: userHeaders }
    );
    assert(addTrackRes.status === 201, 'Add Track to User Playlist');

    // 14. Favorite Song Toggle Test
    const favToggleRes = await axios.post(
      `${API}/favorites/${sampleTrack.id}`,
      { song: sampleTrack },
      { headers: userHeaders }
    );
    assert(favToggleRes.status === 200 && favToggleRes.data.isFavorite === true, 'Favorite Song Toggle (Liked)');

    // 15. Listening History Logging Test
    const histLogRes = await axios.post(
      `${API}/history`,
      { song: sampleTrack, durationPlayed: 45 },
      { headers: userHeaders }
    );
    assert(histLogRes.status === 201 && histLogRes.data.logged === true, 'Listening History Playback Logging');

    // 16. Verify History Retrieval
    const histGetRes = await axios.get(`${API}/history`, { headers: userHeaders });
    assert(histGetRes.status === 200 && histGetRes.data.history.length > 0, 'Listening History Retrieval');
  } catch (err: any) {
    console.error('Test error during execution:', err.response?.data || err.message);
    failed++;
  } finally {
    server.close();
    console.log('\n========================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
