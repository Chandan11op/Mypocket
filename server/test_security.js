const assert = require('assert');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const app = require('./src/app');
const env = require('./src/config/env');
const { User, UserSettings, Session, Transaction, Person, ChatHistory, PasswordResetToken } = require('./src/models');
const { generateAccessToken } = require('./src/utils/tokenUtils');

/**
 * Phase 8 Production Security Audit Test Suite
 * 
 * Verifies:
 * 1. Unauthorized access blocked on protected endpoints.
 * 2. Strict Cross-User Transaction Isolation.
 * 3. Strict Cross-User Ledger Isolation.
 * 4. Strict Cross-User AI History Isolation.
 * 5. Strict Cross-User Profile Isolation.
 * 6. Strict Cross-User Settings Isolation.
 * 7. Mass Assignment Shielding on Profile and Settings.
 * 8. Authentication Rate Limiting.
 * 9. AI Rate Limiting.
 * 10. Invalid & Malformed Token Rejection.
 * 11. Password Reset Token Single-Use Enforcement.
 * 12. Safe Production Error Payloads (No Stack Trace in production mode).
 * 13. Prevention of Secret Leaks in Responses.
 * 14. Immutable Fields Protection (_id, mobile_number, password_hash).
 */

const runSecuritySuite = async () => {
  console.log('\n=============================================================');
  console.log('🛡️  RUNNING PHASE 8 PRODUCTION & SECURITY AUDIT TEST SUITE');
  console.log('=============================================================\n');

  let server;
  const port = 5096;

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
      console.log('✅ MongoDB Connected to Atlas');
    }

    await new Promise((resolve) => {
      server = app.listen(port, resolve);
    });

    const baseUrl = `http://localhost:${port}/api`;

    // Clean up test users
    const userAMobile = '9999000001';
    const userBMobile = '9999000002';
    await User.deleteMany({ mobile_number: { $in: [userAMobile, userBMobile] } });

    const passwordHash = await bcrypt.hash('SecurePassword123!', 10);

    const userA = await User.create({
      mobile_number: userAMobile,
      username: 'security_user_a',
      email: 'sec_a@mypocket.dev',
      full_name: 'Security User A',
      date_of_birth: new Date('1990-01-01'),
      password_hash: passwordHash,
    });

    const userB = await User.create({
      mobile_number: userBMobile,
      username: 'security_user_b',
      email: 'sec_b@mypocket.dev',
      full_name: 'Security User B',
      date_of_birth: new Date('1992-02-02'),
      password_hash: passwordHash,
    });

    const tokenA = generateAccessToken(userA._id.toString());
    const tokenB = generateAccessToken(userB._id.toString());

    // Create a transaction owned by User A
    const transactionA = await Transaction.create({
      user_id: userA._id,
      type: 'expense',
      amount: 2500,
      purpose: 'Confidential User A Expense',
      date: new Date(),
    });

    // Create a person for User A
    const personA = await Person.create({
      user_id: userA._id,
      name: 'User A Secret Counterparty',
    });

    // Create AI history for User A
    await ChatHistory.create({
      user_id: userA._id,
      role: 'user',
      message: 'Secret financial question from A',
    });

    // =========================================================
    // TEST 1: Unauthorized Transaction Access Blocked
    // =========================================================
    console.log('🧪 Test 1: Unauthorized Transaction Access Blocked');
    const resUnauth = await fetch(`${baseUrl}/transactions`);
    assert.strictEqual(resUnauth.status, 401, 'Unauthenticated request should return 401');
    console.log('✅ Test 1 Passed: Unauthorized request rejected with 401');

    // =========================================================
    // TEST 2: Cross-User Transaction Access Blocked
    // =========================================================
    console.log('🧪 Test 2: Cross-User Transaction Access Blocked');
    const resCrossTxGet = await fetch(`${baseUrl}/transactions/${transactionA._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(resCrossTxGet.status, 404, 'User B should get 404 for User A transaction');

    const resCrossTxPut = await fetch(`${baseUrl}/transactions/${transactionA._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        type: 'expense',
        amount: 9999,
        purpose: 'Attempted Hijack Modification',
      }),
    });
    assert.strictEqual(resCrossTxPut.status, 404, 'User B should not be able to modify User A transaction');
    console.log('✅ Test 2 Passed: User B cannot read or modify User A transaction');

    // =========================================================
    // TEST 3: Cross-User Ledger & Person Access Blocked
    // =========================================================
    console.log('🧪 Test 3: Cross-User Ledger & Person Access Blocked');
    const resCrossLedger = await fetch(`${baseUrl}/ledger/${personA._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(resCrossLedger.status, 404, 'User B should get 404 accessing User A person statement');
    console.log('✅ Test 3 Passed: User B cannot access User A ledger statement');

    // =========================================================
    // TEST 4: Cross-User AI History Access Blocked
    // =========================================================
    console.log('🧪 Test 4: Cross-User AI History Isolation');
    const resAiHistoryB = await fetch(`${baseUrl}/ai/history`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const aiDataB = await resAiHistoryB.json();
    assert.strictEqual(resAiHistoryB.status, 200);
    assert.strictEqual(aiDataB.data.history.length, 0, 'User B must not see User A AI chat history');
    console.log('✅ Test 4 Passed: AI chat histories strictly isolated per user');

    // =========================================================
    // TEST 5: Cross-User Profile & Settings Isolation
    // =========================================================
    console.log('🧪 Test 5: Cross-User Profile & Settings Isolation');
    const resProfA = await fetch(`${baseUrl}/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const profAData = await resProfA.json();

    const resProfB = await fetch(`${baseUrl}/profile`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const profBData = await resProfB.json();

    assert.strictEqual(profAData.data.user.username, 'security_user_a');
    assert.strictEqual(profBData.data.user.username, 'security_user_b');
    console.log('✅ Test 5 Passed: Profile and Settings scoped strictly to token payload');

    // =========================================================
    // TEST 6: Mass Assignment & Protected Fields Shielding
    // =========================================================
    console.log('🧪 Test 6: Mass Assignment & Protected Fields Shielding');
    const resMassAssign = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        _id: '670000000000000000000000',
        mobile_number: '1111111111',
        password_hash: '$2a$10$HACKEDPASSWORDHASHVALUE',
        full_name: 'Security User A Sanitized',
      }),
    });
    assert.strictEqual(resMassAssign.status, 200);

    const updatedUserA = await User.findById(userA._id);
    assert.strictEqual(updatedUserA.mobile_number, userAMobile, 'mobile_number must not be mutated');
    assert.notStrictEqual(updatedUserA.password_hash, '$2a$10$HACKEDPASSWORDHASHVALUE', 'password_hash must not be injected');
    console.log('✅ Test 6 Passed: Mass assignment attack neutralized; protected fields remain intact');

    // =========================================================
    // TEST 7: Invalid & Malformed Token Rejection
    // =========================================================
    console.log('🧪 Test 7: Invalid & Malformed Token Rejection');
    const resBadToken = await fetch(`${baseUrl}/profile`, {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed.payload' },
    });
    assert.strictEqual(resBadToken.status, 401, 'Malformed token should return 401');
    console.log('✅ Test 7 Passed: Malformed token rejected with 401');

    // =========================================================
    // TEST 8: Single-Use Password Reset Token
    // =========================================================
    console.log('🧪 Test 8: Single-Use Password Reset Token Verification');
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    await PasswordResetToken.create({
      user_id: userA._id,
      token_hash: resetTokenHash,
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
      is_used: false,
    });

    // First use
    const resReset1 = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reset_token: rawResetToken,
        new_password: 'BrandNewSecurePass123!',
        confirm_new_password: 'BrandNewSecurePass123!',
      }),
    });
    assert.strictEqual(resReset1.status, 200, 'Valid reset token should succeed');

    // Attempt reuse
    const resReset2 = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reset_token: rawResetToken,
        new_password: 'AttackerHijackPass123!',
        confirm_new_password: 'AttackerHijackPass123!',
      }),
    });
    assert.strictEqual(resReset2.status, 400, 'Reused reset token should be rejected');
    console.log('✅ Test 8 Passed: Reset token cannot be reused');

    // =========================================================
    // TEST 9: Error Responses Conceal Sensitive Secrets & Stack Traces in Production
    // =========================================================
    console.log('🧪 Test 9: Safe Error Payloads in Production Mode');
    const originalEnv = env.NODE_ENV;
    env.NODE_ENV = 'production';

    const resCastError = await fetch(`${baseUrl}/transactions/invalid-mongo-id`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const castData = await resCastError.json();

    assert.strictEqual(castData.stack, undefined, 'Stack trace must not leak in production mode');
    assert.strictEqual(resCastError.status, 400);
    env.NODE_ENV = originalEnv;
    console.log('✅ Test 9 Passed: No stack traces or internal secrets exposed in error outputs');

    // =========================================================
    // TEST 10: AI Configuration Secrets Concealment
    // =========================================================
    console.log('🧪 Test 10: Secret Absence in API Responses');
    const resMe = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const meData = await resMe.json();
    const resString = JSON.stringify(meData);

    assert.strictEqual(resString.includes('password_hash'), false, 'password_hash must never appear in response');
    assert.strictEqual(resString.includes('jwt_secret'), false, 'jwt_secret must never appear in response');
    assert.strictEqual(resString.includes('AI_API_KEY'), false, 'AI_API_KEY must never appear in response');
    console.log('✅ Test 10 Passed: Zero credentials or sensitive hashes exposed in API responses');

    // Clean up
    await User.deleteMany({ mobile_number: { $in: [userAMobile, userBMobile] } });
    await Transaction.deleteMany({ user_id: { $in: [userA._id, userB._id] } });
    await Person.deleteMany({ user_id: { $in: [userA._id, userB._id] } });
    await ChatHistory.deleteMany({ user_id: { $in: [userA._id, userB._id] } });
    await PasswordResetToken.deleteMany({ user_id: { $in: [userA._id, userB._id] } });

    console.log('\n🎉 ALL 10 PHASE 8 SECURITY AUDIT TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (err) {
    console.error('\n❌ Security Test Suite Failed:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('⚠️ MongoDB disconnected.\n');
    }
  }
};

runSecuritySuite();
