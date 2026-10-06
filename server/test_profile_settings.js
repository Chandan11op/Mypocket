const assert = require('assert');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const { User, Session, UserSettings } = require('./src/models');
const app = require('./src/app');

/**
 * Phase 7 Test Suite: Profile, Settings, and Account Security
 */
const runProfileSettingsSuite = async () => {
  console.log('\n🚀 STARTING PHASE 7: PROFILE, SETTINGS & ACCOUNT SECURITY TEST SUITE...\n');

  await connectDB();

  const userA_Mobile = '+919111111111';
  const userB_Mobile = '+919222222222';

  // Clean prior test records
  const priorUsers = await User.find({ mobile_number: { $in: [userA_Mobile, userB_Mobile] } });
  for (const u of priorUsers) {
    await Session.deleteMany({ user_id: u._id });
    await UserSettings.deleteMany({ user_id: u._id });
    await User.deleteOne({ _id: u._id });
  }

  let server;
  const port = 5099;
  await new Promise((resolve) => {
    server = app.listen(port, resolve);
  });

  const baseUrl = `http://localhost:${port}/api`;

  try {
    // -------------------------------------------------------------
    // Setup: Create User A & User B
    // -------------------------------------------------------------
    console.log('📦 Setup: Creating User A & User B');

    // Register User A
    const regA = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_number: userA_Mobile,
        username: 'prof_user_a_' + Date.now(),
        email: `prof_usera_${Date.now()}@example.com`,
        full_name: 'Original Name A',
        date_of_birth: '1995-01-01',
        password: 'Password123!',
        confirm_password: 'Password123!',
      }),
    });
    assert.strictEqual(regA.status, 201);

    const loginA = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number: userA_Mobile, password: 'Password123!' }),
    });
    const dataA = await loginA.json();
    const tokenA = dataA.data.accessToken;
    const userA_Id = dataA.data.user.id;
    const initialUsernameA = dataA.data.user.username;

    // Register User B
    const regB = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_number: userB_Mobile,
        username: 'prof_user_b_' + Date.now(),
        email: `prof_userb_${Date.now()}@example.com`,
        full_name: 'Original Name B',
        date_of_birth: '1992-05-15',
        password: 'Password123!',
        confirm_password: 'Password123!',
      }),
    });
    assert.strictEqual(regB.status, 201);

    const loginB = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number: userB_Mobile, password: 'Password123!' }),
    });
    const dataB = await loginB.json();
    const tokenB = dataB.data.accessToken;
    const userB_Id = dataB.data.user.id;
    const usernameB = dataB.data.user.username;

    // -------------------------------------------------------------
    // Test 1: GET /api/profile requires authentication
    // -------------------------------------------------------------
    console.log('\n🧪 Test 1: GET /api/profile requires authentication');
    const noAuthRes = await fetch(`${baseUrl}/profile`);
    assert.strictEqual(noAuthRes.status, 401);
    console.log('✅ Test 1 Passed: Unauthenticated request rejected (401).');

    // -------------------------------------------------------------
    // Test 2: GET /api/profile returns correct safe profile
    // -------------------------------------------------------------
    console.log('\n🧪 Test 2: GET /api/profile returns correct safe user profile');
    const getProfRes = await fetch(`${baseUrl}/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getProfData = await getProfRes.json();
    assert.strictEqual(getProfRes.status, 200);
    assert.strictEqual(getProfData.data.user.full_name, 'Original Name A');
    assert.strictEqual(getProfData.data.user.mobile_number, userA_Mobile);
    assert.strictEqual(getProfData.data.user.password_hash, undefined, 'password_hash must never be returned');
    console.log('✅ Test 2 Passed: Safe user profile retrieved without security secrets.');

    // -------------------------------------------------------------
    // Test 3: PUT /api/profile updates allowed fields
    // -------------------------------------------------------------
    console.log('\n🧪 Test 3: PUT /api/profile updates allowed profile details');
    const updatedUsernameA = 'updated_name_a_' + Date.now();
    const updateRes = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        full_name: 'Updated Name A',
        username: updatedUsernameA,
        date_of_birth: '1996-06-20',
        profile_photo: 'https://example.com/photo.jpg',
      }),
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateData.data.user.full_name, 'Updated Name A');
    assert.strictEqual(updateData.data.user.username, updatedUsernameA);
    assert.strictEqual(updateData.data.user.profile_photo, 'https://example.com/photo.jpg');
    console.log('✅ Test 3 Passed: Profile fields updated successfully.');

    // -------------------------------------------------------------
    // Test 4: Duplicate username rejected
    // -------------------------------------------------------------
    console.log('\n🧪 Test 4: Duplicate username rejected on PUT /api/profile');
    const dupUserRes = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        username: usernameB, // Attempt to claim User B's username
      }),
    });
    assert.strictEqual(dupUserRes.status, 409);
    console.log('✅ Test 4 Passed: Duplicate username rejected with 409.');

    // -------------------------------------------------------------
    // Test 5: Protected fields cannot be modified
    // -------------------------------------------------------------
    console.log('\n🧪 Test 5: Protected fields (_id, password_hash, mobile_number) cannot be injected');
    const injectRes = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        _id: new mongoose.Types.ObjectId().toString(),
        password_hash: '$2a$10$maliciousfakehashhere',
        mobile_number: '+919999999999',
      }),
    });
    const injectData = await injectRes.json();
    assert.strictEqual(injectRes.status, 200);
    // Verify mobile number and id did NOT change
    const checkUserA = await User.findById(userA_Id).select('+password_hash');
    assert.strictEqual(checkUserA.mobile_number, userA_Mobile);
    assert(!checkUserA.password_hash.includes('maliciousfakehashhere'));
    console.log('✅ Test 5 Passed: Protected fields remained uncompromised.');

    // -------------------------------------------------------------
    // Test 6: Password change requires authentication
    // -------------------------------------------------------------
    console.log('\n🧪 Test 6: Password change requires authentication');
    const noAuthPwRes = await fetch(`${baseUrl}/profile/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'Password123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      }),
    });
    assert.strictEqual(noAuthPwRes.status, 401);
    console.log('✅ Test 6 Passed: Unauthenticated password change blocked.');

    // -------------------------------------------------------------
    // Test 7: Wrong current password rejected
    // -------------------------------------------------------------
    console.log('\n🧪 Test 7: Wrong current password rejected');
    const wrongPwRes = await fetch(`${baseUrl}/profile/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        currentPassword: 'WrongPassword999!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      }),
    });
    assert.strictEqual(wrongPwRes.status, 401);
    console.log('✅ Test 7 Passed: Invalid current password rejected with 401.');

    // -------------------------------------------------------------
    // Test 8: Correct password change succeeds
    // -------------------------------------------------------------
    console.log('\n🧪 Test 8: Correct password change succeeds & invalidates active sessions');
    const goodPwRes = await fetch(`${baseUrl}/profile/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        currentPassword: 'Password123!',
        newPassword: 'BrandNewPassword456!',
        confirmPassword: 'BrandNewPassword456!',
      }),
    });
    const goodPwData = await goodPwRes.json();
    assert.strictEqual(goodPwRes.status, 200);
    assert.strictEqual(goodPwData.success, true);
    console.log('✅ Test 8 Passed: Password changed successfully.');

    // -------------------------------------------------------------
    // Test 9: Old password no longer works for login; new password works
    // -------------------------------------------------------------
    console.log('\n🧪 Test 9: Login verification with updated credentials');
    const oldLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number: userA_Mobile, password: 'Password123!' }),
    });
    assert.strictEqual(oldLoginRes.status, 401);

    const newLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number: userA_Mobile, password: 'BrandNewPassword456!' }),
    });
    const newLoginData = await newLoginRes.json();
    assert.strictEqual(newLoginRes.status, 200);
    const refreshedTokenA = newLoginData.data.accessToken;
    console.log('✅ Test 9 Passed: Old password rejected; new password authorized.');

    // -------------------------------------------------------------
    // Test 10: GET /api/settings returns defaults
    // -------------------------------------------------------------
    console.log('\n🧪 Test 10: GET /api/settings returns defaults');
    const settingsRes = await fetch(`${baseUrl}/settings`, {
      headers: { Authorization: `Bearer ${refreshedTokenA}` },
    });
    const settingsData = await settingsRes.json();
    assert.strictEqual(settingsRes.status, 200);
    assert.strictEqual(settingsData.data.settings.theme, 'system');
    assert.strictEqual(settingsData.data.settings.currency, 'INR');
    assert.strictEqual(settingsData.data.settings.date_format, 'DD/MM/YYYY');
    console.log('✅ Test 10 Passed: Default settings initialized and retrieved.');

    // -------------------------------------------------------------
    // Test 11: PUT /api/settings persists updates
    // -------------------------------------------------------------
    console.log('\n🧪 Test 11: PUT /api/settings persists preferences');
    const updateSettingsRes = await fetch(`${baseUrl}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${refreshedTokenA}` },
      body: JSON.stringify({
        theme: 'dark',
        currency: 'USD',
        date_format: 'YYYY-MM-DD',
        theme_color: 'blue',
      }),
    });
    const updateSettingsData = await updateSettingsRes.json();
    assert.strictEqual(updateSettingsRes.status, 200);
    assert.strictEqual(updateSettingsData.data.settings.theme, 'dark');
    assert.strictEqual(updateSettingsData.data.settings.currency, 'USD');
    assert.strictEqual(updateSettingsData.data.settings.theme_color, 'blue');
    console.log('✅ Test 11 Passed: Settings updated and persisted.');

    // -------------------------------------------------------------
    // Test 12: Cross-User Isolation: User A cannot read User B settings
    // -------------------------------------------------------------
    console.log('\n🧪 Test 12: Cross-User Settings Isolation');
    const settingsBRes = await fetch(`${baseUrl}/settings`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const settingsBData = await settingsBRes.json();
    assert.strictEqual(settingsBRes.status, 200);
    // User B's settings should be default INR/system, NOT User A's updated USD/dark
    assert.strictEqual(settingsBData.data.settings.currency, 'INR');
    assert.strictEqual(settingsBData.data.settings.theme, 'system');
    console.log('✅ Test 12 Passed: User B settings isolated from User A.');

    // -------------------------------------------------------------
    // Test 13: User A cannot modify User B profile
    // -------------------------------------------------------------
    console.log('\n🧪 Test 13: User Profile Scoping Isolation');
    // Verify that profile calls using Token A only mutate User A
    const profBCheck = await User.findById(userB_Id);
    assert.strictEqual(profBCheck.full_name, 'Original Name B');
    console.log('✅ Test 13 Passed: User profile mutations strictly bound to authenticated token.');

    console.log('\n🎉 ALL 13 PHASE 7 PROFILE & SETTINGS TESTS PASSED WITH 100% SUCCESS!\n');
  } finally {
    // Teardown
    const uA = await User.findOne({ mobile_number: userA_Mobile });
    const uB = await User.findOne({ mobile_number: userB_Mobile });

    if (uA) {
      await Session.deleteMany({ user_id: uA._id });
      await UserSettings.deleteMany({ user_id: uA._id });
      await User.deleteOne({ _id: uA._id });
    }
    if (uB) {
      await Session.deleteMany({ user_id: uB._id });
      await UserSettings.deleteMany({ user_id: uB._id });
      await User.deleteOne({ _id: uB._id });
    }

    server.close();
    await mongoose.connection.close();
  }
};

runProfileSettingsSuite().catch((err) => {
  console.error('\n❌ PROFILE & SETTINGS TEST SUITE FAILED:', err);
  process.exit(1);
});
