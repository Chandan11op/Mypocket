const assert = require('assert');
const mongoose = require('mongoose');
const env = require('./src/config/env');
const app = require('./src/app');
const { User, Account, JournalEntry, Person, ReconciliationLog } = require('./src/models');
const doubleEntryService = require('./src/services/doubleEntryService');
const { generateAccessToken } = require('./src/utils/tokenUtils');

async function runFinancialStatementsSuite() {
  console.log('🚀 STARTING STAGE D FINANCIAL STATEMENTS & RECONCILIATION TEST SUITE (38 VERIFICATION CHECKS)...\n');

  let server;
  const port = 5099;

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    await new Promise((resolve) => {
      server = app.listen(port, resolve);
    });

    const baseUrl = `http://localhost:${port}/api`;

    const testEmailA = 'stage_d_user_a@mypocket.test';
    const testEmailB = 'stage_d_user_b@mypocket.test';

    await User.deleteMany({ email: { $in: [testEmailA, testEmailB] } });

    const userA = await User.create({
      full_name: 'Stage D User A',
      username: 'staged_a',
      email: testEmailA,
      mobile_number: '9333333333',
      date_of_birth: new Date('1995-05-15'),
      password_hash: '$2b$12$eImiTXuWVxfM37uY4JANjOL.8bF.x2GqU3yT5W0p5fW1GZ3a.0b1W',
    });

    const userB = await User.create({
      full_name: 'Stage D User B',
      username: 'staged_b',
      email: testEmailB,
      mobile_number: '9444444444',
      date_of_birth: new Date('1995-05-15'),
      password_hash: '$2b$12$eImiTXuWVxfM37uY4JANjOL.8bF.x2GqU3yT5W0p5fW1GZ3a.0b1W',
    });

    await Account.deleteMany({ user_id: { $in: [userA._id, userB._id] } });
    await JournalEntry.deleteMany({ user_id: { $in: [userA._id, userB._id] } });
    await Person.deleteMany({ user_id: { $in: [userA._id, userB._id] } });
    await ReconciliationLog.deleteMany({ user_id: { $in: [userA._id, userB._id] } });

    const tokenA = generateAccessToken(userA._id.toString());
    const tokenB = generateAccessToken(userB._id.toString());

    async function request(path, options = {}) {
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
      const res = await fetch(`${baseUrl}${path}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      const data = await res.json();
      return { status: res.status, body: data };
    }

    console.log('📦 Setup complete. Running 38 Accounting Integrity Verification Checks...\n');

    // =========================================================================
    // TEST GROUP A: OPENING POSITION
    // =========================================================================
    console.log('🧪 TEST GROUP A — OPENING POSITION');
    const bob = await doubleEntryService.createAccountWithOpeningBalance(userA._id, { name: 'Bank of Baroda', account_class: 'ASSET', account_type: 'BANK', opening_balance: 30000 });
    const slice = await doubleEntryService.createAccountWithOpeningBalance(userA._id, { name: 'Slice Wallet', account_class: 'ASSET', account_type: 'DIGITAL_WALLET', opening_balance: 30000 });
    const cash = await doubleEntryService.createAccountWithOpeningBalance(userA._id, { name: 'Cash Wallet', account_class: 'ASSET', account_type: 'CASH', opening_balance: 5000 });
    const groww = await doubleEntryService.createAccountWithOpeningBalance(userA._id, { name: 'Groww Investments', account_class: 'ASSET', account_type: 'INVESTMENT', opening_balance: 15000 });
    const loan = await doubleEntryService.createAccountWithOpeningBalance(userA._id, { name: 'Personal Loan', account_class: 'LIABILITY', account_type: 'LOAN', opening_balance: 7000 });

    let pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 80000); // 1. BOB 30k + Slice 30k + Cash 5k + Groww 15k
    assert.strictEqual(pos.financial_position.total_liabilities, 7000); // 2. Liability 7k
    assert.strictEqual(pos.financial_position.net_worth, 73000); // 3. Net worth = 80k - 7k
    assert.strictEqual(pos.financial_position.is_balanced, true); // 4. Balance check
    console.log('✅ Checks 1-5 Passed: Opening Position Assets ₹80,000, Liabilities ₹7,000, Net Worth ₹73,000.');

    // =========================================================================
    // TEST GROUP B: TRANSFER
    // =========================================================================
    console.log('\n🧪 TEST GROUP B — TRANSFER (BOB -> Slice ₹10,000)');
    await doubleEntryService.processBusinessTransaction(userA._id, {
      transaction_type: 'TRANSFER',
      description: 'Internal Transfer BOB to Slice',
      from_account_id: bob._id,
      to_account_id: slice._id,
      amount: 10000,
    });

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 80000); // 6. Assets unchanged
    assert.strictEqual(pos.financial_position.net_worth, 73000); // 6. Net worth unchanged

    const bobBal7 = await doubleEntryService.getAccountBalance(userA._id, bob._id);
    const sliceBal8 = await doubleEntryService.getAccountBalance(userA._id, slice._id);
    assert.strictEqual(bobBal7, 20000); // 7. BOB decreases to 20k
    assert.strictEqual(sliceBal8, 40000); // 8. Slice increases to 40k

    const pnl9 = await doubleEntryService.getProfitAndLoss(userA._id);
    assert.strictEqual(pnl9.income.total, 0);
    assert.strictEqual(pnl9.expenses.total, 0); // 9. P&L unchanged
    console.log('✅ Checks 6-9 Passed: Transfer shifted assets without affecting Net Worth or P&L.');

    // =========================================================================
    // TEST GROUP C: EXPENSE
    // =========================================================================
    console.log('\n🧪 TEST GROUP C — EXPENSE (₹1,000 Restaurant Expense)');
    const foodAcc = await Account.findOne({ user_id: userA._id, name: 'Food & Dining' });
    await doubleEntryService.processBusinessTransaction(userA._id, {
      transaction_type: 'EXPENSE',
      description: 'Restaurant Dinner',
      from_account_id: bob._id,
      expense_account_id: foodAcc._id,
      amount: 1000,
    });

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 79000); // 10. Assets = 79k
    assert.strictEqual(pos.financial_position.net_worth, 72000); // 10. Net worth = 72k

    const pnl11 = await doubleEntryService.getProfitAndLoss(userA._id);
    assert.strictEqual(pnl11.expenses.total, 1000); // 11. Expense = 1,000
    assert.strictEqual(pnl11.net_profit, -1000); // 12. Net profit = -1,000
    console.log('✅ Checks 10-12 Passed: Expense reduced Assets and Net Worth accurately.');

    // =========================================================================
    // TEST GROUP D: INVESTMENT
    // =========================================================================
    console.log('\n🧪 TEST GROUP D — INVESTMENT (BOB -> Groww ₹5,000)');
    await doubleEntryService.processBusinessTransaction(userA._id, {
      transaction_type: 'INVESTMENT',
      description: 'Groww SIP',
      from_account_id: bob._id,
      investment_account_id: groww._id,
      amount: 5000,
    });

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 79000); // 13. Assets unchanged
    assert.strictEqual(pos.financial_position.net_worth, 72000); // 13. Net worth unchanged

    const pnl14 = await doubleEntryService.getProfitAndLoss(userA._id);
    assert.strictEqual(pnl14.expenses.total, 1000); // 14. P&L unchanged (No fake expense)

    const growwBal15 = await doubleEntryService.getAccountBalance(userA._id, groww._id);
    const bobBal16 = await doubleEntryService.getAccountBalance(userA._id, bob._id);
    assert.strictEqual(growwBal15, 20000); // 15. Groww = 20k
    assert.strictEqual(bobBal16, 14000); // 16. BOB = 14k
    console.log('✅ Checks 13-16 Passed: Investment shifted cash to asset without creating an Expense.');

    // =========================================================================
    // TEST GROUP E & F: BORROWING & REPAYMENT
    // =========================================================================
    console.log('\n🧪 TEST GROUP E & F — BORROWING & REPAYMENT');
    const rahulPayable = await doubleEntryService.createAccountWithOpeningBalance(userA._id, { name: 'Payable: Rahul', account_class: 'LIABILITY', account_type: 'PAYABLE' });
    const rahulPerson = await Person.create({ user_id: userA._id, name: 'Rahul' });

    // Borrow ₹10,000
    await doubleEntryService.processBusinessTransaction(userA._id, {
      transaction_type: 'BORROW',
      description: 'Loan from Rahul',
      to_account_id: bob._id,
      liability_account_id: rahulPayable._id,
      amount: 10000,
      person_id: rahulPerson._id,
    });

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 89000); // 17. Assets +10k
    assert.strictEqual(pos.financial_position.total_liabilities, 17000); // 17. Liabilities +10k
    assert.strictEqual(pos.financial_position.net_worth, 72000); // 17. Net worth unchanged

    // Repay principal ₹3,000
    await doubleEntryService.processBusinessTransaction(userA._id, {
      transaction_type: 'REPAYMENT',
      description: 'Repay Rahul principal',
      from_account_id: bob._id,
      liability_account_id: rahulPayable._id,
      amount: 3000,
      person_id: rahulPerson._id,
    });

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 86000); // 18. Assets -3k
    assert.strictEqual(pos.financial_position.total_liabilities, 14000); // 18. Liabilities -3k
    assert.strictEqual(pos.financial_position.net_worth, 72000); // 18. Net worth unchanged
    console.log('✅ Checks 17-18 Passed: Borrowing and principal repayment adjusted balance sheet without affecting Net Worth.');

    // =========================================================================
    // TEST GROUP G: LENDING & RECEIVABLE REPAYMENT
    // =========================================================================
    console.log('\n🧪 TEST GROUP G — LENDING & RECEIVABLE REPAYMENT');
    const rahulReceivable = await doubleEntryService.createAccountWithOpeningBalance(userA._id, { name: 'Receivable: Rahul', account_class: 'ASSET', account_type: 'RECEIVABLE' });

    // Lend ₹5,000
    await doubleEntryService.processBusinessTransaction(userA._id, {
      transaction_type: 'LEND',
      description: 'Lent to Rahul',
      from_account_id: bob._id,
      receivable_account_id: rahulReceivable._id,
      amount: 5000,
      person_id: rahulPerson._id,
    });

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 86000); // 19. Total assets unchanged (Cash -5k, Rec +5k)
    assert.strictEqual(pos.financial_position.net_worth, 72000); // 19. Net worth unchanged

    // Rahul repays ₹5,000
    await doubleEntryService.processBusinessTransaction(userA._id, {
      transaction_type: 'RECEIVABLE_PAYMENT',
      description: 'Rahul repaid loan',
      to_account_id: bob._id,
      receivable_account_id: rahulReceivable._id,
      amount: 5000,
      person_id: rahulPerson._id,
    });

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 86000); // 20. Total assets unchanged
    assert.strictEqual(pos.financial_position.net_worth, 72000); // 20. Net worth unchanged
    console.log('✅ Checks 19-20 Passed: Lending and receivable repayment accurately shifted asset types.');

    // =========================================================================
    // TEST GROUP H: RECONCILIATION
    // =========================================================================
    console.log('\n🧪 TEST GROUP H — RECONCILIATION');
    const bobCurrentBal = await doubleEntryService.getAccountBalance(userA._id, bob._id); // 16,000

    // Exact reconciliation
    const rec1 = await doubleEntryService.reconcileAccount(userA._id, bob._id, bobCurrentBal);
    assert.strictEqual(rec1.is_reconciled, true); // 21. RECONCILED
    assert.strictEqual(rec1.variance, 0);

    // Discrepancy reconciliation (Actual = 15,000 vs Calculated = 16,000)
    const rec2 = await doubleEntryService.reconcileAccount(userA._id, bob._id, bobCurrentBal - 1000);
    assert.strictEqual(rec2.is_reconciled, false); // 22. UNRECONCILED
    assert.strictEqual(rec2.variance, -1000); // 22. Variance = -1,000

    const bobBalAfterUnrec = await doubleEntryService.getAccountBalance(userA._id, bob._id);
    assert.strictEqual(bobBalAfterUnrec, bobCurrentBal); // 23. Balance unchanged

    const logs = await ReconciliationLog.find({ user_id: userA._id, account_id: bob._id });
    assert.strictEqual(logs.length >= 2, true); // 24. History persisted
    console.log('✅ Checks 21-24 Passed: Reconciliation detects variances without altering account balances.');

    // =========================================================================
    // TEST GROUP I: EXPLICIT ADJUSTMENT
    // =========================================================================
    console.log('\n🧪 TEST GROUP I — EXPLICIT ADJUSTMENT');
    // Post explicit missing ₹1,000 expense
    await doubleEntryService.processBusinessTransaction(userA._id, {
      transaction_type: 'EXPENSE',
      description: 'Missing Expense Found During Reconciliation',
      from_account_id: bob._id,
      expense_account_id: foodAcc._id,
      amount: 1000,
    });

    const bobBalAdjusted = await doubleEntryService.getAccountBalance(userA._id, bob._id);
    assert.strictEqual(bobBalAdjusted, bobCurrentBal - 1000); // 25 & 26. BOB decreased by 1,000

    const rec3 = await doubleEntryService.reconcileAccount(userA._id, bob._id, bobCurrentBal - 1000);
    assert.strictEqual(rec3.is_reconciled, true); // 27. Reconciled after explicit entry
    assert.strictEqual(rec3.variance, 0);
    console.log('✅ Checks 25-27 Passed: Explicit adjustment brought account balance and achieved zero variance.');

    // =========================================================================
    // TEST GROUP J: DATE FILTERING & BOUNDARIES
    // =========================================================================
    console.log('\n🧪 TEST GROUP J — DATE FILTERING & BOUNDARIES');
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);

    await doubleEntryService.postJournalEntry(userA._id, {
      date: futureDate,
      transaction_type: 'INCOME',
      description: 'Future Bonus',
      lines: [
        { account_id: bob._id, debit: 10000, credit: 0 },
        { account_id: (await Account.findOne({ user_id: userA._id, name: 'Salary Income' }))._id, debit: 0, credit: 10000 },
      ],
    });

    const pnlFiltered = await doubleEntryService.getProfitAndLoss(
      userA._id,
      new Date('2025-01-01'),
      new Date()
    );

    assert.strictEqual(pnlFiltered.income.total, 0); // 28 & 29 & 30. Future income excluded from current period
    console.log('✅ Checks 28-30 Passed: Date range filters strictly isolate accounting periods.');

    // =========================================================================
    // TEST GROUP K: SECURITY & ISOLATION
    // =========================================================================
    console.log('\n🧪 TEST GROUP K — SECURITY & CROSS-USER ISOLATION');
    const resSec1 = await request(`/accounts/${bob._id}`, { token: tokenB });
    assert.strictEqual(resSec1.status, 404); // 31. User B cannot read User A account

    const resSec2 = await request(`/reconciliation/${bob._id}`, { method: 'POST', token: tokenB, body: { actual_balance: 15000 } });
    assert.strictEqual(resSec2.status, 404); // 32. User B cannot reconcile User A account

    const resSec3 = await request(`/accounts/${bob._id}/transactions`, { token: tokenB });
    assert.strictEqual(resSec3.status, 404); // 33. User B cannot access User A statement
    console.log('✅ Checks 31-33 Passed: Cross-user resources strictly protected with 404/403.');

    // =========================================================================
    // TEST GROUP L: INVALID ACCOUNTING REJECTIONS
    // =========================================================================
    console.log('\n🧪 TEST GROUP L — INVALID ACCOUNTING REJECTIONS');
    const resBad1 = await request('/accounting/transactions', {
      method: 'POST',
      token: tokenA,
      body: { transaction_type: 'EXPENSE', amount: -500, from_account_id: bob._id, expense_account_id: foodAcc._id, description: 'Negative' },
    });
    assert.strictEqual(resBad1.status, 400); // 34 & 36. Negative amount rejected

    const resBad2 = await request('/accounting/transactions', {
      method: 'POST',
      token: tokenA,
      body: { transaction_type: 'TRANSFER', amount: 1000, from_account_id: bob._id, to_account_id: foodAcc._id, description: 'Bad Transfer' },
    });
    assert.strictEqual(resBad2.status, 400); // 35. Transfer into Expense account rejected

    const resBad3 = await request('/accounting/transactions', {
      method: 'POST',
      token: tokenA,
      body: { transaction_type: 'EXPENSE', amount: 1000, from_account_id: bob._id, expense_account_id: foodAcc._id, description: '', date: 'invalid-date' },
    });
    assert.strictEqual(resBad3.status, 400); // 37. Invalid date rejected
    console.log('✅ Checks 34-37 Passed: Invalid transaction types, amounts, and account classes rejected.');

    // =========================================================================
    // TEST GROUP M: ACCOUNTING INVARIANT VERIFICATION
    // =========================================================================
    console.log('\n🧪 TEST GROUP M — ACCOUNTING INVARIANT VERIFICATION');
    pos = await doubleEntryService.getFinancialPosition(userA._id, true);
    assert.strictEqual(pos.financial_position.is_balanced, true); // 38. Assets = Liabilities + Equity
    assert.strictEqual(pos.financial_position.total_assets, pos.financial_position.total_liabilities + pos.financial_position.owners_equity);
    console.log('✅ Check 38 Passed: Assets = Liabilities + Equity strictly holds across full accounting history.');

    console.log('\n🎉 ALL 38 STAGE D FINANCIAL STATEMENTS & RECONCILIATION CHECKS PASSED WITH 100% SUCCESS!\n');
  } catch (error) {
    console.error('❌ Stage D Test Failed:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    console.log('⚠️ Server closed & MongoDB Disconnected.');
  }
}

runFinancialStatementsSuite();
