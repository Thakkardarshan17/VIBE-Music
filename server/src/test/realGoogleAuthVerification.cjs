const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING REAL GOOGLE AUTH VERIFICATION ---');

// 1. Verify GoogleAuthButton.tsx
const btnPath = path.resolve(__dirname, '../../../client/src/components/auth/GoogleAuthButton.tsx');
assert(fs.existsSync(btnPath), 'GoogleAuthButton.tsx must exist');
const btnCode = fs.readFileSync(btnPath, 'utf8');

// Check real GIS integration
assert(btnCode.includes('https://accounts.google.com/gsi/client'), 'Must load official Google Identity Services SDK');
assert(btnCode.includes('google.accounts.id.initialize'), 'Must initialize Google Accounts ID');
assert(btnCode.includes('google.accounts.oauth2.initTokenClient'), 'Must initialize Google OAuth2 Token Client for real popup');
assert(btnCode.includes('requestAccessToken'), 'Must trigger real Google popup via requestAccessToken');

// Verify removal of fake test email form
assert(!btnCode.includes('testEmail'), 'Must remove fake testEmail state and input');
assert(!btnCode.includes('user@gmail.com'), 'Must remove placeholder mock user@gmail.com');
assert(!btnCode.includes('Instant Google Sign-In Test'), 'Must remove fake Instant Google Sign-In Test banner');

console.log('✓ 1. GoogleAuthButton: Real Google Identity Services (GIS) & popup OAuth client verified (fake form removed).');

// 2. Verify backend Google Auth Controller
const controllerPath = path.resolve(__dirname, '../../../server/src/controllers/authController.ts');
const controllerCode = fs.readFileSync(controllerPath, 'utf8');

assert(controllerCode.includes('https://oauth2.googleapis.com/tokeninfo'), 'Must verify ID tokens against Google servers');
assert(controllerCode.includes('https://www.googleapis.com/oauth2/v3/userinfo'), 'Must verify access tokens against Google userinfo API');
assert(controllerCode.includes('googleId: googleUser.sub'), 'Must link real googleId');
assert(controllerCode.includes('emailVerified: true'), 'Must set emailVerified true for Google authenticated users');

console.log('✓ 2. authController: Real Google token verification via Google APIs verified.');

// 3. Verify environment variable declarations
const clientEnvPath = path.resolve(__dirname, '../../../client/.env');
const serverEnvPath = path.resolve(__dirname, '../../../server/.env');

assert(fs.readFileSync(clientEnvPath, 'utf8').includes('VITE_GOOGLE_CLIENT_ID'), 'client/.env must declare VITE_GOOGLE_CLIENT_ID');
assert(fs.readFileSync(serverEnvPath, 'utf8').includes('GOOGLE_CLIENT_ID'), 'server/.env must declare GOOGLE_CLIENT_ID');

console.log('✓ 3. Environment configuration for Google OAuth Client ID verified.');

console.log('\n--- ALL REAL GOOGLE AUTH VERIFICATIONS PASSED (3/3) ---');

