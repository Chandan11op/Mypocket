const assert = require('assert');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const { User, Session, PasswordResetToken, UserSettings } = require('./src/models');
const app = require('./src/app');

const runSuite = async () => {
  console.log('\n🚀 STARTING STREAMLINED AUTHENTICATION TEST SUITE (NO OTP)...\n');
  
  await connectDB();
  
  const testMobile = '+919888877777';
  const testUsername = 'testuser_' + Date.now();
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  // Clean up any prior test records
  await User.deleteMany({ mobile_number: testMobile });
  await Session.deleteMany({});
  await PasswordResetToken.deleteMany({});

  let server;
  const port = 5097;

  await new Promise((resolve) => {
    server = app.listen(port, resolve);
  });

  const baseUrl = `http://localhost:${port}/api/auth`;

  try {
    // -------------------------------------------------------------
    // Test 1: Successful Registration
    // -------------------------------------------------------------
    console.log('🧪 Test 1: Successful Registration');
    const regRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_number: testMobile,
        username: testUsername,
        email: testEmail,
        full_name: 'Rahul Sharma',
        date_of_birth: '1995-05-15',
        password: testPassword,
        confirm_password: testPassword,
      }),
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, 'Registration should return 201 Created');
    assert.strictEqual(regData.success, true);
    assert.strictEqual(regData.data.user.username, testUsername);
    console.log('✅ Test 1 Passed: User registered successfully.');

    // -------------------------------------------------------------
    // Test 2: Duplicate Mobile Number
    // -------------------------------------------------------------
    console.log('\n🧪 Test 2: Duplicate Mobile Number');
    const dupMobileRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_number: testMobile,
        username: testUsername + '_alt',
        email: 'alt_' + testEmail,
        full_name: 'Alt User',
        date_of_birth: '1995-05-15',
        password: testPassword,
        confirm_password: testPassword,
      }),
    });
    assert.strictEqual(dupMobileRes.status, 409, 'Duplicate mobile should return 409 Conflict');
    console.log('✅ Test 2 Passed: Duplicate mobile correctly rejected.');

    // -------------------------------------------------------------
    // Test 3: Duplicate Username
    // -------------------------------------------------------------
    console.log('\n🧪 Test 3: Duplicate Username');
    const dupUserRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_number: '+919888866666',
        username: testUsername,
        email: 'alt2_' + testEmail,
        full_name: 'Alt User',
        date_of_birth: '1995-05-15',
        password: testPassword,
        confirm_password: testPassword,
      }),
    });
    assert.strictEqual(dupUserRes.status, 409, 'Duplicate username should return 409 Conflict');
    console.log('✅ Test 3 Passed: Duplicate username correctly rejected.');

    // -------------------------------------------------------------
    // Test 4: Duplicate Email
    // -------------------------------------------------------------
    console.log('\n🧪 Test 4: Duplicate Email');
    const dupEmailRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_number: '+919888855555',
        username: testUsername + '_alt2',
        email: testEmail,
        full_name: 'Alt User',
        date_of_birth: '1995-05-15',
        password: testPassword,
        confirm_password: testPassword,
      }),
    });
    assert.strictEqual(dupEmailRes.status, 409, 'Duplicate email should return 409 Conflict');
    console.log('✅ Test 4 Passed: Duplicate email correctly rejected.');

    // -------------------------------------------------------------
    // Test 5: Verify Password Hashing in Database
    // -------------------------------------------------------------
    console.log('\n🧪 Test 5: Password Hashing Verification');
    const savedUser = await User.findOne({ mobile_number: testMobile }).select('+password_hash');
    assert(savedUser.password_hash !== testPassword, 'Password must not be stored in plaintext');
    assert(savedUser.password_hash.startsWith('$2'), 'Password must be hashed with bcrypt');
    console.log('✅ Test 5 Passed: Password securely hashed in MongoDB.');

    // -------------------------------------------------------------
    // Test 6: Direct Login with Valid Credentials (NO OTP)
    // -------------------------------------------------------------
    console.log('\n🧪 Test 6: Direct Login with Valid Credentials');
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-type': 'web',
        'x-device-name': 'Chrome Windows',
      },
      body: JSON.stringify({
        mobile_number: testMobile,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginData.success, true);
    assert(loginData.data.accessToken, 'Access token must be returned');
    assert(loginData.data.refreshToken, 'Refresh token must be returned');
    assert.strictEqual(loginData.data.user.username, testUsername);
    assert.strictEqual(loginData.data.user.password_hash, undefined, 'password_hash must never be in payload');

    const accessToken = loginData.data.accessToken;
    const refreshToken = loginData.data.refreshToken;
    console.log('✅ Test 6 Passed: Direct login succeeded, session created, tokens issued.');

    // -------------------------------------------------------------
    // Test 7: Login with Incorrect Password
    // -------------------------------------------------------------
    console.log('\n🧪 Test 7: Login with Incorrect Password');
    const badLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_number: testMobile,
        password: 'WrongPassword999',
      }),
    });
    assert.strictEqual(badLoginRes.status, 401);
    console.log('✅ Test 7 Passed: Invalid credentials rejected.');

    // -------------------------------------------------------------
    // Test 8: Access Token Works on Protected Route (/me)
    // -------------------------------------------------------------
    console.log('\n🧪 Test 8: Protected Route Access (/me)');
    const meRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meData = await meRes.json();
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meData.data.user.username, testUsername);
    assert.strictEqual(meData.data.user.password_hash, undefined);
    console.log('✅ Test 8 Passed: Authenticated profile retrieved.');

    // -------------------------------------------------------------
    // Test 9: Refresh Token Rotation
    // -------------------------------------------------------------
    console.log('\n🧪 Test 9: Refresh Token Rotation');
    const refreshRes = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const refreshData = await refreshRes.json();
    assert.strictEqual(refreshRes.status, 200);
    assert(refreshData.data.accessToken);
    assert(refreshData.data.refreshToken);
    assert.notStrictEqual(refreshData.data.refreshToken, refreshToken, 'Refresh token must rotate');
    const newAccessToken = refreshData.data.accessToken;
    const newRefreshToken = refreshData.data.refreshToken;
    console.log('✅ Test 9 Passed: Refresh token rotated successfully.');

    // -------------------------------------------------------------
    // Test 10: Old Refresh Token Revocation
    // -------------------------------------------------------------
    console.log('\n🧪 Test 10: Old Refresh Token Revocation');
    const oldRefreshRes = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    assert.strictEqual(oldRefreshRes.status, 401, 'Old rotated refresh token must be rejected');
    console.log('✅ Test 10 Passed: Revoked token rejected.');

    // -------------------------------------------------------------
    // Test 11: Forgot Password - Token Generation (NO OTP)
    // -------------------------------------------------------------
    console.log('\n🧪 Test 11: Forgot Password - Token Generation');
    const forgotRes = await fetch(`${baseUrl}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testMobile }),
    });
    const forgotData = await forgotRes.json();
    assert.strictEqual(forgotRes.status, 200);
    assert(forgotData.dev_reset_token, 'dev_reset_token must be returned in dev mode');
    const resetToken = forgotData.dev_reset_token;
    console.log(`✅ Test 11 Passed: Password reset token generated: ${resetToken.substring(0, 10)}...`);

    // -------------------------------------------------------------
    // Test 12: Reset Password with Token
    // -------------------------------------------------------------
    console.log('\n🧪 Test 12: Reset Password with Valid Token');
    const resetRes = await fetch(`${baseUrl}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reset_token: resetToken,
        new_password: 'UpdatedPassword789!',
        confirm_new_password: 'UpdatedPassword789!',
      }),
    });
    assert.strictEqual(resetRes.status, 200);
    console.log('✅ Test 12 Passed: Password reset successful.');

    // -------------------------------------------------------------
    // Test 13: Reset Token Cannot Be Reused
    // -------------------------------------------------------------
    console.log('\n🧪 Test 13: Reset Token Reuse Prevention');
    const reuseResetRes = await fetch(`${baseUrl}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reset_token: resetToken,
        new_password: 'AnotherPassword999!',
        confirm_new_password: 'AnotherPassword999!',
      }),
    });
    assert.strictEqual(reuseResetRes.status, 400, 'Used token must be rejected');
    console.log('✅ Test 13 Passed: Token reuse prevented.');

    // -------------------------------------------------------------
    // Test 14: Login with New Password
    // -------------------------------------------------------------
    console.log('\n🧪 Test 14: Login with Updated Password');
    const updatedLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_number: testMobile,
        password: 'UpdatedPassword789!',
      }),
    });
    const updatedLoginData = await updatedLoginRes.json();
    assert.strictEqual(updatedLoginRes.status, 200);
    console.log('✅ Test 14 Passed: Login verified with updated password.');

    // -------------------------------------------------------------
    // Test 15: Logout Current Device
    // -------------------------------------------------------------
    console.log('\n🧪 Test 15: Logout Current Device');
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: updatedLoginData.data.refreshToken }),
    });
    assert.strictEqual(logoutRes.status, 200);
    console.log('✅ Test 15 Passed: Logout completed.');

    // -------------------------------------------------------------
    // Test 16: Logout All Devices
    // -------------------------------------------------------------
    console.log('\n🧪 Test 16: Logout All Devices');
    // Login again to get new session
    const reLogin = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number: testMobile, password: 'UpdatedPassword789!' }),
    });
    const reLoginData = await reLogin.json();
    const logoutAllRes = await fetch(`${baseUrl}/logout-all`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${reLoginData.data.accessToken}`,
      },
    });
    assert.strictEqual(logoutAllRes.status, 200);
    console.log('✅ Test 16 Passed: Logout-all revoked all active sessions.');

    // -------------------------------------------------------------
    // Test 17: Unauthorized Access Blocked
    // -------------------------------------------------------------
    console.log('\n🧪 Test 17: Unauthorized Access Blocked');
    const unauthRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: 'Bearer fake_invalid_token' },
    });
    assert.strictEqual(unauthRes.status, 401);
    console.log('✅ Test 17 Passed: Invalid token rejected with 401.');

    // -------------------------------------------------------------
    // Test 18: Password Hash is NEVER returned in responses
    // -------------------------------------------------------------
    console.log('\n🧪 Test 18: Password Hash Concealment');
    assert.strictEqual(regData.data.user.password_hash, undefined);
    assert.strictEqual(loginData.data.user.password_hash, undefined);
    assert.strictEqual(meData.data.user.password_hash, undefined);
    console.log('✅ Test 18 Passed: password_hash never exposed.');

    console.log('\n🎉 ALL 18 STREAMLINED AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!\n');
  } finally {
    // Cleanup test user
    await User.deleteMany({ mobile_number: testMobile });
    await Session.deleteMany({});
    await PasswordResetToken.deleteMany({});
    server.close();
    await mongoose.connection.close();
  }
};

runSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
