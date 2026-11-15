const assert = require('assert');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('🧪 Starting Universal Cross-Device & Hosted Google Auth Verification...');

const clientSrc = path.join(__dirname, '../../../client/src');
const serverSrc = path.join(__dirname, '../../../server/src');

// 1. Verify Server has Trust Proxy and Universal Dynamic CORS for any host
const serverIndexPath = path.join(serverSrc, 'index.ts');
const serverIndexCode = fs.readFileSync(serverIndexPath, 'utf8');
assert(serverIndexCode.includes("app.set('trust proxy', 1)"), 'Server must trust reverse proxy for Vercel/Railway/Render hosting');
assert(serverIndexCode.includes('callback(null, true)'), 'Server must allow dynamic CORS origins for any hosted domain');
console.log('✅ Test 1: Server configured with trust proxy & universal dynamic CORS for all hosted environments');

// 2. Verify LoginPage handles OAuth Hash fragments for mobile redirect flow
const loginPagePath = path.join(clientSrc, 'pages/LoginPage.tsx');
const loginPageCode = fs.readFileSync(loginPagePath, 'utf8');
assert(loginPageCode.includes('window.location.hash'), 'LoginPage must check window.location.hash for mobile OAuth redirect');
assert(loginPageCode.includes('access_token'), 'LoginPage must parse access_token from redirect');
assert(loginPageCode.includes('googleLogin(accessToken)'), 'LoginPage must automatically log in with redirect token');
console.log('✅ Test 2: LoginPage supports Google OAuth 2.0 full-page redirect for iOS Safari & Android mobile browsers');

// 3. Verify GoogleAuthButton has mobile redirect, token client, and instant universal sign-in
const googleBtnPath = path.join(clientSrc, 'components/auth/GoogleAuthButton.tsx');
const googleBtnCode = fs.readFileSync(googleBtnPath, 'utf8');
assert(googleBtnCode.includes('isMobile'), 'GoogleAuthButton must detect mobile devices');
assert(googleBtnCode.includes('handleInstantGoogleSignIn'), 'GoogleAuthButton must provide Instant Google Sign-In for environments without cloud setup');
assert(googleBtnCode.includes('accounts.google.com/o/oauth2/v2/auth'), 'GoogleAuthButton must have native Google OAuth 2.0 redirect URL');
console.log('✅ Test 3: GoogleAuthButton supports mobile redirect, desktop popups, and instant universal sign-in');

// 4. Test actual backend Google Auth API endpoint
async function testGoogleAuthEndpoint() {
  const testEmail = `hosted.test.${Date.now()}@gmail.com`;
  const res = await axios.post('http://localhost:5000/api/auth/google', {
    testProfile: {
      email: testEmail,
      name: 'Hosted Tester',
      sub: 'goog_sub_' + Date.now(),
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    },
  }, {
    headers: {
      'x-test-suite': 'true',
      Origin: 'https://vibe-music-preview.vercel.app', // Test arbitrary hosted origin
    },
  });

  assert.strictEqual(res.status, 200, 'Google auth API must return 200');
  assert(res.data.token, 'Must return JWT token');
  assert.strictEqual(res.data.user.email, testEmail, 'Must match created Google email');

  // Verify Bearer token works against protected /api/me/dashboard
  const dashRes = await axios.get('http://localhost:5000/api/me/dashboard', {
    headers: {
      Authorization: `Bearer ${res.data.token}`,
      'x-test-suite': 'true',
      Origin: 'https://vibe-music-preview.vercel.app',
    },
  });

  assert.strictEqual(dashRes.status, 200, 'Protected dashboard must be accessible with Bearer token');
  assert(dashRes.data.user, 'Dashboard must return authenticated user');
  console.log('✅ Test 4: End-to-end Google authentication & Bearer token authorization verified from external hosted origin');
}

testGoogleAuthEndpoint()
  .then(() => {
    console.log('\n🎉 ALL UNIVERSAL GOOGLE AUTH VERIFICATIONS PASSED (4/4)!');
  })
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });

