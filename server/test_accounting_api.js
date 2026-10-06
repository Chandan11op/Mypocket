const assert = require('assert');
const mongoose = require('mongoose');
const env = require('./src/config/env');
const app = require('./src/app');
const { User, Account, JournalEntry, Person, ReconciliationLog } = require('./src/models');
const jwt = require('jsonwebtoken');

async function runAccountingApiTests() {
  console.log('🚀 STARTING PHASE 7.5 STAGE C REST API TEST SUITE...\n');

  let server;
  const port = 5098;

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    await new Promise((resolve) => {
      server = app.listen(port, resolve);
    });

    const baseUrl = `http://localhost:${port}/api`;

    const testEmailA = 'api_accounting_user_a@mypocket.test';
    const testEmailB = 'api_accounting_user_b@mypocket.test';

    await User.deleteMany({ email: { $in: [testEmailA, testEmailB] } });

    const userA = await User.create({
      full_name: 'API User A',
      username: 'apiuser_a',
      email: testEmailA,
      mobile_number: '9111111111',
      date_of_birth: new Date('1995-05-15'),
      password_hash: '$2b$12$eImiTXuWVxfM37uY4JANjOL.8bF.x2GqU3yT5W0p5fW1GZ3a.0b1W',
    });

    const userB = await User.create({
      full_name: 'API User B',
      username: 'apiuser_b',
      email: testEmailB,
      mobile_number: '9222222222',
      date_of_birth: new Date('1995-05-15'),
      password_hash: '$2b$12$eImiTXuWVxfM37uY4JANjOL.8bF.x2GqU3yT5W0p5fW1GZ3a.0b1W',
    });

    await Account.deleteMany({ user_id: { $in: [userA._id, userB._id] } });
    await JournalEntry.deleteMany({ user_id: { $in: [userA._id, userB._id] } });
    await Person.deleteMany({ user_id: { $in: [userA._id, userB._id] } });
    await ReconciliationLog.deleteMany({ user_id: { $in: [userA._id, userB._id] } });

    const { generateAccessToken } = require('./src/utils/tokenUtils');
    const tokenA = generateAccessToken(userA._id.toString());
    const tokenB = generateAccessToken(userB._id.toString());


    console.log('📦 Setup complete. Testing REST API Endpoints...');

    // Helper request function
    async function request(path, options = {}) {
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
      }
      const res = await fetch(`${baseUrl}${path}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      const data = await res.json();
      return { status: res.status, body: data };
    }

    // =========================================================================
    // TEST 1: POST /api/accounts (Create Bank of Baroda with ₹40,000 Opening)
    // =========================================================================
    console.log('\n🧪 Test 1: POST /api/accounts (Create BOB with ₹40,000 opening)');
    const res1 = await request('/accounts', {
      method: 'POST',
      token: tokenA,
      body: {
        name: 'Bank of Baroda',
        account_class: 'ASSET',
        account_type: 'BANK',
        institution_name: 'Bank of Baroda',
        opening_balance: 40000,
      },
    });

    assert.strictEqual(res1.status, 201);
    assert.strictEqual(res1.body.success, true);
    assert.strictEqual(res1.body.data.calculated_balance, 40000);
    const bobId = res1.body.data.account._id;
    console.log('✅ Test 1 Passed: Account created & opening balance posted via double-entry.');

    // Create Slice, Cash, Groww accounts
    const resSlice = await request('/accounts', {
      method: 'POST',
      token: tokenA,
      body: { name: 'Slice Wallet', account_class: 'ASSET', account_type: 'DIGITAL_WALLET', opening_balance: 20000 },
    });
    const sliceId = resSlice.body.data.account._id;

    const resCash = await request('/accounts', {
      method: 'POST',
      token: tokenA,
      body: { name: 'Cash Wallet', account_class: 'ASSET', account_type: 'CASH', opening_balance: 5000 },
    });
    const cashId = resCash.body.data.account._id;

    const resGroww = await request('/accounts', {
      method: 'POST',
      token: tokenA,
      body: { name: 'Groww Investments', account_class: 'ASSET', account_type: 'INVESTMENT', opening_balance: 10000 },
    });
    const growwId = resGroww.body.data.account._id;

    // Fetch System Income & Expense Accounts
    const salaryAcc = await Account.findOne({ user_id: userA._id, name: 'Salary Income' });
    const foodAcc = await Account.findOne({ user_id: userA._id, name: 'Food & Dining' });

    // =========================================================================
    // TEST 2: GET /api/accounts (User Scoped List)
    // =========================================================================
    console.log('\n🧪 Test 2: GET /api/accounts (Scoped Account List)');
    const res2 = await request('/accounts', { token: tokenA });

    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.data.accounts.length >= 4, true);
    console.log('✅ Test 2 Passed: Scoped accounts retrieved with calculated balances.');

    // =========================================================================
    // TEST 3: POST /api/accounting/transactions (TRANSFER BOB -> Slice ₹10,000)
    // =========================================================================
    console.log('\n🧪 Test 3: POST /api/accounting/transactions (TRANSFER ₹10,000)');
    const res3 = await request('/accounting/transactions', {
      method: 'POST',
      token: tokenA,
      body: {
        transaction_type: 'TRANSFER',
        description: 'Move money to Slice',
        from_account_id: bobId,
        to_account_id: sliceId,
        amount: 10000,
      },
    });

    assert.strictEqual(res3.status, 201);
    assert.strictEqual(res3.body.data.journal_entry.transaction_type, 'TRANSFER');
    console.log('✅ Test 3 Passed: Transfer API posted balanced journal entry.');

    // =========================================================================
    // TEST 4: POST /api/accounting/transactions (INCOME Salary ₹50,000)
    // =========================================================================
    console.log('\n🧪 Test 4: POST /api/accounting/transactions (INCOME ₹50,000)');
    const res4 = await request('/accounting/transactions', {
      method: 'POST',
      token: tokenA,
      body: {
        transaction_type: 'INCOME',
        description: 'October Salary',
        to_account_id: bobId,
        income_account_id: salaryAcc._id,
        amount: 50000,
      },
    });

    assert.strictEqual(res4.status, 201);
    console.log('✅ Test 4 Passed: Salary Income posted.');

    // =========================================================================
    // TEST 5: POST /api/accounting/transactions (EXPENSE Food ₹1,000)
    // =========================================================================
    console.log('\n🧪 Test 5: POST /api/accounting/transactions (EXPENSE ₹1,000)');
    const res5 = await request('/accounting/transactions', {
      method: 'POST',
      token: tokenA,
      body: {
        transaction_type: 'EXPENSE',
        description: 'Dinner',
        from_account_id: bobId,
        expense_account_id: foodAcc._id,
        amount: 1000,
      },
    });

    assert.strictEqual(res5.status, 201);
    console.log('✅ Test 5 Passed: Food Expense posted.');

    // =========================================================================
    // TEST 6: POST /api/accounting/transactions (INVESTMENT Groww ₹5,000)
    // =========================================================================
    console.log('\n🧪 Test 6: POST /api/accounting/transactions (INVESTMENT ₹5,000)');
    const res6 = await request('/accounting/transactions', {
      method: 'POST',
      token: tokenA,
      body: {
        transaction_type: 'INVESTMENT',
        description: 'Groww Mutual Fund',
        from_account_id: bobId,
        investment_account_id: growwId,
        amount: 5000,
      },
    });

    assert.strictEqual(res6.status, 201);
    console.log('✅ Test 6 Passed: Investment transaction posted.');

    // Create Rahul Payable & Borrow ₹10,000
    const resRahulPayable = await request('/accounts', {
      method: 'POST',
      token: tokenA,
      body: { name: 'Payable: Rahul', account_class: 'LIABILITY', account_type: 'PAYABLE' },
    });
    const rahulPayableId = resRahulPayable.body.data.account._id;

    const rahulPerson = await Person.create({ user_id: userA._id, name: 'Rahul' });

    // BORROW ₹10,000
    await request('/accounting/transactions', {
      method: 'POST',
      token: tokenA,
      body: {
        transaction_type: 'BORROW',
        description: 'Borrowed from Rahul',
        to_account_id: bobId,
        liability_account_id: rahulPayableId,
        amount: 10000,
        person_id: rahulPerson._id,
      },
    });

    // REPAYMENT ₹3,000
    await request('/accounting/transactions', {
      method: 'POST',
      token: tokenA,
      body: {
        transaction_type: 'REPAYMENT',
        description: 'Repayment to Rahul',
        from_account_id: bobId,
        liability_account_id: rahulPayableId,
        amount: 3000,
        person_id: rahulPerson._id,
      },
    });

    // =========================================================================
    // TEST 7: GET /api/financial-position Verification
    // =========================================================================
    console.log('\n🧪 Test 7: GET /api/financial-position Verification');
    const resPos = await request('/financial-position', { token: tokenA });

    assert.strictEqual(resPos.status, 200);
    assert.strictEqual(resPos.body.data.financial_position.total_assets, 131000);
    assert.strictEqual(resPos.body.data.financial_position.total_liabilities, 7000);
    assert.strictEqual(resPos.body.data.financial_position.net_worth, 124000);
    assert.strictEqual(resPos.body.data.financial_position.is_balanced, true);
    console.log('✅ Test 7 Passed: Financial position matched expected Assets ₹131,000, Liabilities ₹7,000, Net Worth ₹124,000.');

    // =========================================================================
    // TEST 8: GET /api/statements/balance-sheet Verification
    // =========================================================================
    console.log('\n🧪 Test 8: GET /api/statements/balance-sheet Verification');
    const resBS = await request('/statements/balance-sheet', { token: tokenA });

    assert.strictEqual(resBS.status, 200);
    assert.strictEqual(resBS.body.data.is_balanced, true);
    assert.strictEqual(resBS.body.data.assets.total, 131000);
    assert.strictEqual(resBS.body.data.liabilities.total, 7000);
    console.log('✅ Test 8 Passed: Balance sheet verified and balanced.');

    // =========================================================================
    // TEST 9: GET /api/statements/profit-loss Verification
    // =========================================================================
    console.log('\n🧪 Test 9: GET /api/statements/profit-loss Verification');
    const resPNL = await request('/statements/profit-loss', { token: tokenA });

    assert.strictEqual(resPNL.status, 200);
    assert.strictEqual(resPNL.body.data.income.total, 50000);
    assert.strictEqual(resPNL.body.data.expenses.total, 1000);
    assert.strictEqual(resPNL.body.data.net_profit, 49000);
    console.log('✅ Test 9 Passed: P&L excludes Transfers, Investments, & Loan Principal movements.');

    // =========================================================================
    // TEST 10: GET /api/statements/cash-flow Verification
    // =========================================================================
    console.log('\n🧪 Test 10: GET /api/statements/cash-flow Verification');
    const resCF = await request('/statements/cash-flow', { token: tokenA });

    assert.strictEqual(resCF.status, 200);
    assert.strictEqual(resCF.body.data.operating_cash_flow.inflow, 50000);
    assert.strictEqual(resCF.body.data.operating_cash_flow.outflow, 1000);
    assert.strictEqual(resCF.body.data.transfers_total, 10000);
    console.log('✅ Test 10 Passed: Cash Flow categorizes Operating, Transfers, and Financing flows.');

    // =========================================================================
    // TEST 11: Reconciliation API Verification (POST & GET)
    // =========================================================================
    console.log('\n🧪 Test 11: POST & GET /api/reconciliation/:accountId');
    const resRec = await request(`/reconciliation/${bobId}`, {
      method: 'POST',
      token: tokenA,
      body: { actual_balance: 81000, notes: 'Monthly statement check' },
    });

    assert.strictEqual(resRec.status, 200);
    assert.strictEqual(resRec.body.data.is_reconciled, true);
    assert.strictEqual(resRec.body.data.variance, 0);

    const resRecHist = await request(`/reconciliation/${bobId}`, { token: tokenA });

    assert.strictEqual(resRecHist.status, 200);
    assert.strictEqual(resRecHist.body.data.history.length >= 1, true);
    console.log('✅ Test 11 Passed: Account reconciliation & history verified.');

    // =========================================================================
    // TEST 12: Idempotency Protection Verification
    // =========================================================================
    console.log('\n🧪 Test 12: Idempotency Protection Verification');
    const idempotencyKey = 'unique_txn_key_12345';
    const payload = {
      transaction_type: 'EXPENSE',
      description: 'Idempotency Test Expense',
      from_account_id: bobId,
      expense_account_id: foodAcc._id,
      amount: 250,
    };

    const resIdem1 = await request('/accounting/transactions', {
      method: 'POST',
      token: tokenA,
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: payload,
    });

    assert.strictEqual(resIdem1.status, 201);

    const resIdem2 = await request('/accounting/transactions', {
      method: 'POST',
      token: tokenA,
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: payload,
    });

    assert.strictEqual(resIdem2.status, 201);
    assert.strictEqual(resIdem1.body.data.journal_entry._id, resIdem2.body.data.journal_entry._id);
    console.log('✅ Test 12 Passed: Idempotency key prevented duplicate entry creation.');

    // =========================================================================
    // TEST 13: Strict Cross-User Security Rejection (403 FORBIDDEN)
    // =========================================================================
    console.log('\n🧪 Test 13: Cross-User Security Authorization Check (403 FORBIDDEN)');
    const resForbidden = await request(`/accounts/${bobId}`, { token: tokenB });
    assert.strictEqual(resForbidden.status, 404);

    const resForbiddenTx = await request('/accounting/transactions', {
      method: 'POST',
      token: tokenB,
      body: {
        transaction_type: 'TRANSFER',
        description: 'Malicious Cross-User Transfer',
        from_account_id: bobId,
        to_account_id: sliceId,
        amount: 500,
      },
    });

    assert.strictEqual(resForbiddenTx.status, 403);
    console.log('✅ Test 13 Passed: Cross-user access rejected with 403 FORBIDDEN.');

    console.log('\n🎉 ALL 13 STAGE C REST API TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (error) {
    console.error('❌ Stage C Test Failed:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    console.log('⚠️ Server closed & MongoDB Disconnected.');
  }
}

runAccountingApiTests();
