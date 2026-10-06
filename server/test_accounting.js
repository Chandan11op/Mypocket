const assert = require('assert');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const connectDB = require('./src/config/db');
const { User, Transaction, Person, Session } = require('./src/models');
const app = require('./src/app');

const runAccountingSuite = async () => {
  console.log('\n🚀 STARTING COMPREHENSIVE ACCOUNTING & FINANCIAL TEST SUITE...\n');

  await connectDB();

  // Create two distinct test users to thoroughly verify user isolation
  const userA_Mobile = '+919111111111';
  const userB_Mobile = '+919222222222';

  await User.deleteMany({ mobile_number: { $in: [userA_Mobile, userB_Mobile] } });

  let server;
  const port = 5096;
  await new Promise((resolve) => {
    server = app.listen(port, resolve);
  });

  const baseUrl = `http://localhost:${port}/api`;

  try {
    // -------------------------------------------------------------
    // Setup Users & Sessions
    // -------------------------------------------------------------
    console.log('📦 Setup: Registering User A & User B');
    const regA = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_number: userA_Mobile,
        username: 'user_a_' + Date.now(),
        email: `usera_${Date.now()}@example.com`,
        full_name: 'User A Person',
        date_of_birth: '1990-01-01',
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

    const regB = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_number: userB_Mobile,
        username: 'user_b_' + Date.now(),
        email: `userb_${Date.now()}@example.com`,
        full_name: 'User B Person',
        date_of_birth: '1992-02-02',
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

    // -------------------------------------------------------------
    // Test 1: User A Creates Transactions (Income & Expense with Person)
    // -------------------------------------------------------------
    console.log('🧪 Test 1: User A Creates Transactions');
    
    // TX 1: Income ₹10,000 from Rahul
    const tx1Res = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        type: 'income',
        amount: 10000,
        purpose: 'Salary Advance',
        person_name: 'Rahul',
        date: '2026-10-01T10:00:00.000Z',
      }),
    });
    const tx1Data = await tx1Res.json();
    assert.strictEqual(tx1Res.status, 201);
    assert.strictEqual(tx1Data.data.transaction.person_name, 'Rahul');
    const tx1Id = tx1Data.data.transaction._id;
    const personRahulIdA = tx1Data.data.transaction.person_id;
    console.log('✅ Test 1 Passed: Transaction 1 created with auto-created person.');

    // TX 2: Expense ₹2,500 to Rahul (reusing person name)
    const tx2Res = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        type: 'expense',
        amount: 2500,
        purpose: 'Dinner & Groceries',
        person_name: 'rahul', // Test case-insensitive person resolution
        date: '2026-10-02T12:00:00.000Z',
      }),
    });
    const tx2Data = await tx2Res.json();
    assert.strictEqual(tx2Res.status, 201);
    assert.strictEqual(tx2Data.data.transaction.person_id, personRahulIdA, 'Person ID should be reused without creating duplicate');
    const tx2Id = tx2Data.data.transaction._id;

    // TX 3: Expense ₹1,500 to Priya
    const tx3Res = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        type: 'expense',
        amount: 1500,
        purpose: 'Shopping',
        person_name: 'Priya',
        date: '2026-10-03T15:00:00.000Z',
      }),
    });
    assert.strictEqual(tx3Res.status, 201);

    // -------------------------------------------------------------
    // Test 2: Reject Negative / Zero / Invalid Amounts
    // -------------------------------------------------------------
    console.log('\n🧪 Test 2: Reject Invalid Amounts & Types');
    const badAmtRes = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        type: 'expense',
        amount: -500,
        purpose: 'Invalid negative test',
      }),
    });
    assert.strictEqual(badAmtRes.status, 400);

    const zeroAmtRes = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        type: 'expense',
        amount: 0,
        purpose: 'Invalid zero test',
      }),
    });
    assert.strictEqual(zeroAmtRes.status, 400);

    const badTypeRes = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        type: 'transfer',
        amount: 100,
        purpose: 'Invalid type test',
      }),
    });
    assert.strictEqual(badTypeRes.status, 400);
    console.log('✅ Test 2 Passed: Validation middleware rejected negative, zero, and bad types.');

    // -------------------------------------------------------------
    // Test 3: User A Reads, Updates, Deletes Own Transaction
    // -------------------------------------------------------------
    console.log('\n🧪 Test 3: User A Transaction CRUD');
    const getSingleRes = await fetch(`${baseUrl}/transactions/${tx1Id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(getSingleRes.status, 200);

    const updateRes = await fetch(`${baseUrl}/transactions/${tx1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        type: 'income',
        amount: 12000,
        purpose: 'Salary Advance (Updated)',
        person_name: 'Rahul',
      }),
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateData.data.transaction.amount, 12000);
    console.log('✅ Test 3 Passed: User A successfully read and updated own transaction.');

    // -------------------------------------------------------------
    // Test 4: SECURITY CHECK - User B CANNOT Access User A's Transaction
    // -------------------------------------------------------------
    console.log('\n🧪 Test 4: SECURITY - User B Cannot Read, Update, or Delete User A Transaction');
    const bGetRes = await fetch(`${baseUrl}/transactions/${tx1Id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bGetRes.status, 404, 'User B must not find User A transaction');

    const bUpdateRes = await fetch(`${baseUrl}/transactions/${tx1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        type: 'expense',
        amount: 99999,
        purpose: 'Malicious update attempt',
      }),
    });
    assert.strictEqual(bUpdateRes.status, 404, 'User B must not update User A transaction');

    const bDeleteRes = await fetch(`${baseUrl}/transactions/${tx1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bDeleteRes.status, 404, 'User B must not delete User A transaction');
    console.log('✅ Test 4 Passed: Strict user isolation verified on single resource endpoints.');

    // -------------------------------------------------------------
    // Test 5: Person Autocomplete & Search (Scoped to Current User)
    // -------------------------------------------------------------
    console.log('\n🧪 Test 5: Person Autocomplete & Search');
    // User B creates a person named "Rohan"
    await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        type: 'income',
        amount: 500,
        purpose: 'Test',
        person_name: 'Rohan UserB',
      }),
    });

    const searchResA = await fetch(`${baseUrl}/persons/search?q=rah`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const searchDataA = await searchResA.json();
    assert.strictEqual(searchResA.status, 200);
    assert.strictEqual(searchDataA.data.persons.length, 1);
    assert.strictEqual(searchDataA.data.persons[0].name, 'Rahul');

    // User B searching "rah" should NOT find User A's "Rahul"
    const searchResB = await fetch(`${baseUrl}/persons/search?q=rah`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const searchDataB = await searchResB.json();
    assert.strictEqual(searchDataB.data.persons.length, 0, 'User B must not see User A persons');
    console.log('✅ Test 5 Passed: Autocomplete search scoped strictly to authenticated user.');

    // -------------------------------------------------------------
    // Test 6: Summary API & Balance Calculations
    // -------------------------------------------------------------
    console.log('\n🧪 Test 6: Financial Summary (Income, Expense, Balance)');
    // User A currently has:
    // Income: ₹12,000 (TX 1 updated)
    // Expense: ₹2,500 (TX 2) + ₹1,500 (TX 3) = ₹4,000
    // Current Balance = ₹12,000 - ₹4,000 = ₹8,000
    const summaryRes = await fetch(`${baseUrl}/transactions/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const summaryData = await summaryRes.json();
    assert.strictEqual(summaryRes.status, 200);
    assert.strictEqual(summaryData.data.total_income, 12000);
    assert.strictEqual(summaryData.data.total_expense, 4000);
    assert.strictEqual(summaryData.data.current_balance, 8000);
    assert.strictEqual(summaryData.data.transaction_count, 3);
    console.log('✅ Test 6 Passed: Financial summary calculated accurately (Income ₹12,000, Expense ₹4,000, Net Balance ₹8,000).');

    // -------------------------------------------------------------
    // Test 7: Bank Statement & Chronological Running Balance
    // -------------------------------------------------------------
    console.log('\n🧪 Test 7: Statement & Running Balance Calculation');
    // Timeline:
    // 1. 01 Oct: Income ₹12,000  -> Running Balance: ₹12,000
    // 2. 02 Oct: Expense ₹2,500 -> Running Balance: ₹9,500
    // 3. 03 Oct: Expense ₹1,500 -> Running Balance: ₹8,000
    const stmtRes = await fetch(`${baseUrl}/transactions/statement`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const stmtData = await stmtRes.json();
    assert.strictEqual(stmtRes.status, 200);
    assert.strictEqual(stmtData.data.statement.length, 3);
    assert.strictEqual(stmtData.data.statement[0].running_balance, 12000);
    assert.strictEqual(stmtData.data.statement[1].running_balance, 9500);
    assert.strictEqual(stmtData.data.statement[2].running_balance, 8000);
    console.log('✅ Test 7 Passed: Running balance is deterministically calculated chronologically.');

    // -------------------------------------------------------------
    // Test 8: Person Ledger Overview & Individual Detail
    // -------------------------------------------------------------
    console.log('\n🧪 Test 8: Ledger Overview & Person Account');
    const ledgerRes = await fetch(`${baseUrl}/ledger`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const ledgerData = await ledgerRes.json();
    assert.strictEqual(ledgerRes.status, 200);
    
    // Rahul: Received ₹12,000, Paid ₹2,500, Net: ₹9,500
    const rahulLedger = ledgerData.data.ledger.find((l) => l.name === 'Rahul');
    assert(rahulLedger);
    assert.strictEqual(rahulLedger.total_received, 12000);
    assert.strictEqual(rahulLedger.total_paid, 2500);
    assert.strictEqual(rahulLedger.net_balance, 9500);

    // Individual Person Detail
    const pDetailRes = await fetch(`${baseUrl}/ledger/${rahulLedger.person_id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const pDetailData = await pDetailRes.json();
    assert.strictEqual(pDetailRes.status, 200);
    assert.strictEqual(pDetailData.data.net_balance, 9500);
    assert.strictEqual(pDetailData.data.transactions.length, 2);

    // User B cannot access User A's person ledger
    const bLedgerRes = await fetch(`${baseUrl}/ledger/${rahulLedger.person_id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bLedgerRes.status, 404, 'User B must not access User A person ledger');
    console.log('✅ Test 8 Passed: Person ledger and individual account details verified.');

    // -------------------------------------------------------------
    // Test 9: Excel Export Generation (.xlsx validation)
    // -------------------------------------------------------------
    console.log('\n🧪 Test 9: Excel Export (.xlsx buffer check)');
    const exportRes = await fetch(`${baseUrl}/transactions/export`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(exportRes.status, 200);
    assert.strictEqual(
      exportRes.headers.get('content-type'),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    const arrayBuffer = await exportRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    assert(workbook.SheetNames.includes('My Pocket Statement'));
    const worksheet = workbook.Sheets['My Pocket Statement'];
    const jsonSheet = XLSX.utils.sheet_to_json(worksheet);
    assert.strictEqual(jsonSheet.length, 3);
    assert.strictEqual(jsonSheet[0]['Type'], 'INCOME');
    assert.strictEqual(jsonSheet[0]['Running Balance (INR)'], 12000);
    console.log('✅ Test 9 Passed: Excel workbook validly generated on backend with accurate statements.');

    // -------------------------------------------------------------
    // Test 10: Pagination & Query Filters
    // -------------------------------------------------------------
    console.log('\n🧪 Test 10: Transactions Pagination & Query Filters');
    const filterRes = await fetch(`${baseUrl}/transactions?type=expense&limit=1&page=1`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const filterData = await filterRes.json();
    assert.strictEqual(filterRes.status, 200);
    assert.strictEqual(filterData.data.transactions.length, 1);
    assert.strictEqual(filterData.data.pagination.total, 2);
    assert.strictEqual(filterData.data.pagination.pages, 2);
    console.log('✅ Test 10 Passed: Pagination and type filters verified.');

    console.log('\n🎉 ALL 10 ACCOUNTING & FINANCIAL INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n');
  } finally {
    // Cleanup
    const userA = await User.findOne({ mobile_number: userA_Mobile });
    const userB = await User.findOne({ mobile_number: userB_Mobile });

    if (userA) {
      await Transaction.deleteMany({ user_id: userA._id });
      await Person.deleteMany({ user_id: userA._id });
      await Session.deleteMany({ user_id: userA._id });
      await User.deleteOne({ _id: userA._id });
    }
    if (userB) {
      await Transaction.deleteMany({ user_id: userB._id });
      await Person.deleteMany({ user_id: userB._id });
      await Session.deleteMany({ user_id: userB._id });
      await User.deleteOne({ _id: userB._id });
    }

    server.close();
    await mongoose.connection.close();
  }
};

runAccountingSuite().catch((err) => {
  console.error('\n❌ ACCOUNTING TEST SUITE FAILED:', err);
  process.exit(1);
});
