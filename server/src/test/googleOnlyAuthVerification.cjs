const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== VIBE GOOGLE-ONLY AUTHENTICATION VERIFICATION ===\n');
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

  // TEST 1: Frontend Google-only UI Compliance
  console.log('1. Checking LoginPage.tsx for Google-Only constraints...');
  const loginPageContent = fs.readFileSync(path.join(__dirname, '../../../client/src/pages/LoginPage.tsx'), 'utf8');

  assert(!loginPageContent.includes('type="password"'), 'No password input exists on LoginPage');
  assert(!loginPageContent.includes('Create Account'), 'No manual "Create Account" link or form exists on LoginPage');
  assert(!loginPageContent.includes('Forgot Password'), 'No "Forgot Password" link exists on LoginPage');
  assert(!loginPageContent.includes('handleDemoLogin'), 'No demo accounts or dummy password buttons on LoginPage');
  assert(loginPageContent.includes('Welcome to'), 'LoginPage displays "Welcome to VIBE"');
  assert(loginPageContent.includes('Your Music. Your World.'), 'LoginPage displays "Your Music. Your World."');
  assert(loginPageContent.includes('Continue with Google'), 'LoginPage displays "Continue with Google"');
  assert(loginPageContent.includes('Terms & Conditions'), 'LoginPage displays Terms & Conditions');
  assert(loginPageContent.includes('Privacy Policy'), 'LoginPage displays Privacy Policy');

  // TEST 2: Check App.tsx Route Redirection
  console.log('\n2. Checking App.tsx and SplashScreen.tsx routing...');
  const appContent = fs.readFileSync(path.join(__dirname, '../../../client/src/App.tsx'), 'utf8');
  assert(appContent.includes('path="/signup" element={<Navigate to="/login" replace />}'), 'App.tsx redirects /signup to /login');
  assert(appContent.includes('path="/forgot-password" element={<Navigate to="/login" replace />}'), 'App.tsx redirects /forgot-password to /login');

  const splashContent = fs.readFileSync(path.join(__dirname, '../../../client/src/components/splash/SplashScreen.tsx'), 'utf8');
  assert(splashContent.includes("navigate('/login');"), 'SplashScreen navigates unauthenticated users directly to /login');
  assert(!splashContent.includes("navigate('/signup');"), 'SplashScreen does not navigate to /signup');

  // TEST 3: Google Auth API Flow - First Time User (Auto Registration)
  console.log('\n3. Testing Google Auth API for First Time User (Account Creation)...');
  const testSub = 'goog_' + Date.now();
  const testEmail = `vibetest_${Date.now()}@gmail.com`;
  const testName = 'Aarav Sharma';
  const testAvatar = 'https://lh3.googleusercontent.com/a/ACg8ocL_test123';

  try {
    const authRes = await axios.post(`${API_BASE}/auth/google`, {
      testProfile: {
        sub: testSub,
        email: testEmail,
        name: testName,
        picture: testAvatar,
      },
    });

    assert(authRes.status === 200, 'Google Auth API returns HTTP 200 OK');
    assert(Boolean(authRes.data.token), 'Google Auth returns JWT session token');
    assert(authRes.data.user.email === testEmail, 'User record created with verified Google email');
    assert(authRes.data.user.emailVerified === true, 'Google account is verified by default');
    assert(authRes.data.user.avatarUrl === testAvatar, 'Google profile avatar saved in database');

    const sessionToken = authRes.data.token;

    // TEST 4: Protected Session Validation via /api/auth/me
    console.log('\n4. Validating authenticated session via /api/auth/me...');
    const meRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });

    assert(meRes.status === 200, 'Accessing /api/auth/me with session token succeeds');
    assert(meRes.data.user.email === testEmail, 'Session belongs to authenticated Google user');

    // TEST 5: Subsequent Login with Same Google Account
    console.log('\n5. Testing Returning User Login with same Google Account...');
    const returnRes = await axios.post(`${API_BASE}/auth/google`, {
      testProfile: {
        sub: testSub,
        email: testEmail,
        name: testName,
        picture: testAvatar,
      },
    });

    assert(returnRes.status === 200, 'Returning Google user logs in successfully');
    assert(returnRes.data.user.id === authRes.data.user.id, 'User ID matches existing database record');

    // TEST 6: Complete Logout & Session Invalidation
    console.log('\n6. Testing Logout & Server-Side Session Invalidation...');
    const logoutRes = await axios.post(
      `${API_BASE}/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${sessionToken}` } }
    );
    assert(logoutRes.status === 200, 'Logout API returns HTTP 200 OK');

    // TEST 7: Attempting to use invalidated session token
    let sessionRevoked = false;
    try {
      await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        sessionRevoked = true;
      }
    }
    assert(sessionRevoked, 'Revoked session token is rejected with 401/403 (unauthorized)');

    // TEST 8: Unauthenticated access blocked on protected routes
    let unauthBlocked = false;
    try {
      await axios.get(`${API_BASE}/auth/me`);
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        unauthBlocked = true;
      }
    }
    assert(unauthBlocked, 'Unauthenticated access to protected user endpoint blocked');
  } catch (err) {
    console.error('API Error during test:', err.response?.data || err.message);
    assert(false, 'Google Auth API flow failed');
  }

  console.log(`\n========================================`);
  console.log(`VERIFICATION COMPLETE: ${testsPassed}/${totalTests} tests passed.`);
  console.log(`========================================\n`);

  if (testsPassed === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();

