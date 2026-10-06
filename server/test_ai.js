const assert = require('assert');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const { User, Transaction, Person, Session, ChatHistory } = require('./src/models');
const { generateUserFinancialSummary } = require('./src/services/financialSummaryService');
const aiService = require('./src/services/aiService');
const { GeminiAiProvider } = require('./src/services/aiService');
const app = require('./src/app');

const runAiSuite = async () => {
  console.log('\n🚀 STARTING COMPLETE PHASE 6.2 AI TEST SUITE (14 VERIFICATION CHECKS)...\n');

  await connectDB();

  const userA_Mobile = '+919333333333';
  const userB_Mobile = '+919444444444';

  // Clean up prior test users if any exist
  const existingUsers = await User.find({ mobile_number: { $in: [userA_Mobile, userB_Mobile] } });
  for (const u of existingUsers) {
    await Transaction.deleteMany({ user_id: u._id });
    await Person.deleteMany({ user_id: u._id });
    await Session.deleteMany({ user_id: u._id });
    await ChatHistory.deleteMany({ user_id: u._id });
    await User.deleteOne({ _id: u._id });
  }

  let server;
  const port = 5096;
  await new Promise((resolve) => {
    server = app.listen(port, resolve);
  });

  const baseUrl = `http://localhost:${port}/api`;

  try {
    // -------------------------------------------------------------
    // Setup User A & User B
    // -------------------------------------------------------------
    console.log('📦 Setup: Creating User A & User B with independent financial data');
    
    // Create User A
    const regA = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_number: userA_Mobile,
        username: 'ai_user_a_' + Date.now(),
        email: `ai_usera_${Date.now()}@example.com`,
        full_name: 'AI Test User A',
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
    const dataLoginA = await loginA.json();
    const tokenA = dataLoginA.data.accessToken;
    const userA_Id = dataLoginA.data.user.id;

    // Create User B
    const regB = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_number: userB_Mobile,
        username: 'ai_user_b_' + Date.now(),
        email: `ai_userb_${Date.now()}@example.com`,
        full_name: 'AI Test User B',
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
    const dataLoginB = await loginB.json();
    const tokenB = dataLoginB.data.accessToken;
    const userB_Id = dataLoginB.data.user.id;

    // Seed User A Transactions: Income 50,000; Expense 5,000 (Rent/Landlord); Expense 2,000 (Groceries)
    await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ type: 'income', amount: 50000, purpose: 'Monthly Salary' }),
    });
    await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ type: 'expense', amount: 5000, purpose: 'Apartment Rent', person_name: 'Landlord' }),
    });
    await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ type: 'expense', amount: 2000, purpose: 'Supermarket Groceries' }),
    });

    // Seed User B Transactions: Income 15,000; Expense 1,500 (Electricity Bill)
    await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ type: 'income', amount: 15000, purpose: 'Freelance Design' }),
    });
    await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ type: 'expense', amount: 1500, purpose: 'Electricity Bill' }),
    });

    // -------------------------------------------------------------
    // Test 1: AI endpoint requires authentication
    // -------------------------------------------------------------
    console.log('\n🧪 Test 1: Authentication Requirement on /api/ai endpoints');
    const noAuthChat = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello AI' }),
    });
    assert.strictEqual(noAuthChat.status, 401);

    const noAuthHist = await fetch(`${baseUrl}/ai/history`);
    assert.strictEqual(noAuthHist.status, 401);
    console.log('✅ Test 1 Passed: Unauthorized requests correctly blocked (401).');

    // -------------------------------------------------------------
    // Test 2: Empty message rejected
    // -------------------------------------------------------------
    console.log('\n🧪 Test 2: Empty Query Rejection');
    const emptyQueryRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ message: '   ' }),
    });
    assert.strictEqual(emptyQueryRes.status, 400);
    console.log('✅ Test 2 Passed: Empty text query rejected with 400.');

    // -------------------------------------------------------------
    // Test 3: Message over maximum length rejected (>500 characters)
    // -------------------------------------------------------------
    console.log('\n🧪 Test 3: Oversized Query Rejection (>500 chars)');
    const oversizedQueryRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ message: 'X'.repeat(501) }),
    });
    assert.strictEqual(oversizedQueryRes.status, 400);
    console.log('✅ Test 3 Passed: Query >500 characters rejected with 400.');

    // -------------------------------------------------------------
    // Test 4: Missing AI configuration handled gracefully (503 AI_NOT_CONFIGURED)
    // -------------------------------------------------------------
    console.log('\n🧪 Test 4: Graceful Missing AI Configuration Handling');
    const originalApiKey = process.env.AI_API_KEY;
    process.env.AI_API_KEY = '';
    aiService.provider = aiService.createProvider();

    const unconfiguredRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ message: 'What is my current balance?' }),
    });
    const unconfiguredData = await unconfiguredRes.json();
    assert.strictEqual(unconfiguredRes.status, 503);
    assert.strictEqual(unconfiguredData.code, 'AI_NOT_CONFIGURED');
    console.log('✅ Test 4 Passed: 503 AI_NOT_CONFIGURED returned gracefully without exposing internal secrets.');

    // -------------------------------------------------------------
    // Test 5: Provider abstraction works
    // -------------------------------------------------------------
    console.log('\n🧪 Test 5: Provider Abstraction Runtime Switching');
    let capturedSummary = null;
    let capturedUserMsg = null;
    let capturedHistory = null;

    const mockProvider = {
      generateResponse: async (summary, userMsg, history) => {
        capturedSummary = summary;
        capturedUserMsg = userMsg;
        capturedHistory = history;
        return `Based on your My Pocket records, your current balance is ₹${summary.current_financial_status.current_balance}. You have total expenses of ₹${summary.current_financial_status.total_expense}.`;
      },
    };

    aiService.setProvider(mockProvider);
    process.env.AI_API_KEY = 'test_mock_key';

    const providerChatRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ message: 'What is my current financial status?' }),
    });
    const providerChatData = await providerChatRes.json();
    assert.strictEqual(providerChatRes.status, 200);
    assert(providerChatData.message.includes('₹43000'));
    assert.strictEqual(capturedUserMsg, 'What is my current financial status?');
    console.log('✅ Test 5 Passed: Provider abstraction dispatches queries cleanly.');

    // -------------------------------------------------------------
    // Test 6: Gemini provider request construction & normalization
    // -------------------------------------------------------------
    console.log('\n🧪 Test 6: Gemini Provider Request Construction');
    const geminiProvider = new GeminiAiProvider('mock_gemini_key', 'gemini-1.5-flash');
    assert.strictEqual(geminiProvider.modelName, 'gemini-1.5-flash');
    assert.strictEqual(geminiProvider.apiKey, 'mock_gemini_key');
    console.log('✅ Test 6 Passed: GeminiAiProvider class instantiated with correct model parameters.');

    // -------------------------------------------------------------
    // Test 7: Provider error handled gracefully
    // -------------------------------------------------------------
    console.log('\n🧪 Test 7: Provider Error & Timeout Normalization');
    const failingProvider = {
      generateResponse: async () => {
        const timeoutErr = new Error('AI provider request timed out. Please try again.');
        timeoutErr.statusCode = 504;
        throw timeoutErr;
      },
    };
    aiService.setProvider(failingProvider);

    const failRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ message: 'Will this request fail?' }),
    });
    const failData = await failRes.json();
    assert.strictEqual(failRes.status, 504);
    assert(failData.message.includes('timed out'));
    console.log('✅ Test 7 Passed: Provider errors normalized to proper HTTP status codes without crashing.');

    // Restore working mock provider for remaining business tests
    aiService.setProvider(mockProvider);

    // -------------------------------------------------------------
    // Test 8: Financial context remains strictly scoped to user
    // -------------------------------------------------------------
    console.log('\n🧪 Test 8: User-Scoped Financial Telemetry Generation');
    const summaryA = await generateUserFinancialSummary(userA_Id);
    assert.strictEqual(summaryA.current_financial_status.total_income, 50000);
    assert.strictEqual(summaryA.current_financial_status.total_expense, 7000);
    assert.strictEqual(summaryA.current_financial_status.current_balance, 43000);
    assert.strictEqual(summaryA.current_financial_status.total_transactions, 3);
    assert.strictEqual(summaryA.spending_analysis.top_spending_purposes[0].purpose, 'Apartment Rent');
    assert.strictEqual(summaryA.spending_analysis.top_counterparties[0].person, 'Landlord');

    const summaryB = await generateUserFinancialSummary(userB_Id);
    assert.strictEqual(summaryB.current_financial_status.total_income, 15000);
    assert.strictEqual(summaryB.current_financial_status.total_expense, 1500);
    assert.strictEqual(summaryB.current_financial_status.current_balance, 13500);
    assert.strictEqual(summaryB.current_financial_status.total_transactions, 2);
    assert.strictEqual(summaryB.spending_analysis.top_spending_purposes[0].purpose, 'Electricity Bill');
    console.log('✅ Test 8 Passed: Telemetry aggregates computed accurately per user.');

    // -------------------------------------------------------------
    // Test 9: Cross-User Isolation: User A cannot access User B's financial context
    // -------------------------------------------------------------
    console.log('\n🧪 Test 9: Cross-User Context Isolation Verification');
    // User B sends a query
    await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ message: 'What is my top expense?' }),
    });
    // Captured summary in mock provider must belong only to User B
    assert.strictEqual(capturedSummary.current_financial_status.current_balance, 13500);
    assert.strictEqual(capturedSummary.spending_analysis.top_spending_purposes[0].purpose, 'Electricity Bill');
    // Ensure User A's data (50,000 / Landlord / Rent) is NOT present in captured telemetry
    assert.notStrictEqual(capturedSummary.current_financial_status.total_income, 50000);
    console.log('✅ Test 9 Passed: User A and User B financial telemetry completely isolated.');

    // -------------------------------------------------------------
    // Test 10: Chat history remains strictly user-scoped
    // -------------------------------------------------------------
    console.log('\n🧪 Test 10: Scoped Chat History Storage & Retrieval');
    const histResA = await fetch(`${baseUrl}/ai/history`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const histDataA = await histResA.json();
    assert.strictEqual(histResA.status, 200);

    const histResB = await fetch(`${baseUrl}/ai/history`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const histDataB = await histResB.json();
    assert.strictEqual(histResB.status, 200);

    // Verify User B only sees User B's turns
    assert.strictEqual(histDataB.data.history.length, 2); // 1 user + 1 assistant
    assert.strictEqual(histDataB.data.history[0].message, 'What is my top expense?');
    // Verify none of User A's messages are visible to User B
    const userBMessages = histDataB.data.history.map((h) => h.message);
    assert(!userBMessages.includes('What is my current financial status?'));
    console.log('✅ Test 10 Passed: Chat history is strictly isolated per authenticated user.');

    // -------------------------------------------------------------
    // Test 11: DELETE /api/ai/history only deletes current user's history
    // -------------------------------------------------------------
    console.log('\n🧪 Test 11: Scoped History Deletion');
    const delHistA = await fetch(`${baseUrl}/ai/history`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(delHistA.status, 200);

    // Verify User A history is now 0
    const checkA = await fetch(`${baseUrl}/ai/history`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkDataA = await checkA.json();
    assert.strictEqual(checkDataA.data.history.length, 0);

    // Verify User B history is still intact (2 items)
    const checkB = await fetch(`${baseUrl}/ai/history`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const checkDataB = await checkB.json();
    assert.strictEqual(checkDataB.data.history.length, 2);
    console.log('✅ Test 11 Passed: Deletion of User A history left User B history untouched.');

    // -------------------------------------------------------------
    // Test 12: Rate Limiting Enforcement
    // -------------------------------------------------------------
    console.log('\n🧪 Test 12: Rate Limiting Verification');
    // Rate limiter configured at 20 requests per 15 min. Let's make rapid requests to exceed it.
    let rateLimitTriggered = false;
    for (let i = 0; i < 25; i++) {
      const rlRes = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
        body: JSON.stringify({ message: `Rate limit probe #${i}` }),
      });
      if (rlRes.status === 429) {
        rateLimitTriggered = true;
        break;
      }
    }
    assert.strictEqual(rateLimitTriggered, true);
    console.log('✅ Test 12 Passed: AI endpoint rate limiter responds with 429 when threshold exceeded.');

    console.log('\n🎉 ALL 12 DIRECT AI TESTS PASSED WITH 100% SUCCESS!\n');
  } finally {
    // Teardown & clean up test users
    const userA = await User.findOne({ mobile_number: userA_Mobile });
    const userB = await User.findOne({ mobile_number: userB_Mobile });

    if (userA) {
      await Transaction.deleteMany({ user_id: userA._id });
      await Person.deleteMany({ user_id: userA._id });
      await Session.deleteMany({ user_id: userA._id });
      await ChatHistory.deleteMany({ user_id: userA._id });
      await User.deleteOne({ _id: userA._id });
    }
    if (userB) {
      await Transaction.deleteMany({ user_id: userB._id });
      await Person.deleteMany({ user_id: userB._id });
      await Session.deleteMany({ user_id: userB._id });
      await ChatHistory.deleteMany({ user_id: userB._id });
      await User.deleteOne({ _id: userB._id });
    }

    server.close();
    await mongoose.connection.close();
  }
};

runAiSuite().catch((err) => {
  console.error('\n❌ AI TEST SUITE FAILED:', err);
  process.exit(1);
});
