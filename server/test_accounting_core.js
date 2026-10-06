const assert = require('assert');
const mongoose = require('mongoose');
const env = require('./src/config/env');
const User = require('./src/models/User');
const Account = require('./src/models/Account');
const JournalEntry = require('./src/models/JournalEntry');
const Person = require('./src/models/Person');
const Transaction = require('./src/models/Transaction');
const doubleEntryService = require('./src/services/doubleEntryService');

async function runAccountingCoreTests() {
  console.log('🚀 STARTING PHASE 7.5 CORE ACCOUNTING TEST SUITE...\n');

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Cleanup synthetic test user data
    const testEmailA = 'accounting_core_user_a@mypocket.test';
    const testEmailB = 'accounting_core_user_b@mypocket.test';

    await User.deleteMany({ email: { $in: [testEmailA, testEmailB] } });

    const userA = await User.create({
      full_name: 'Accounting User A',
      username: 'accuser_a',
      email: testEmailA,
      mobile_number: '9988776655',
      date_of_birth: new Date('1995-05-15'),
      password_hash: '$2b$12$eImiTXuWVxfM37uY4JANjOL.8bF.x2GqU3yT5W0p5fW1GZ3a.0b1W',
    });

    const userB = await User.create({
      full_name: 'Accounting User B',
      username: 'accuser_b',
      email: testEmailB,
      mobile_number: '9988776644',
      date_of_birth: new Date('1995-05-15'),
      password_hash: '$2b$12$eImiTXuWVxfM37uY4JANjOL.8bF.x2GqU3yT5W0p5fW1GZ3a.0b1W',
    });

    await Account.deleteMany({ user_id: { $in: [userA._id, userB._id] } });
    await JournalEntry.deleteMany({ user_id: { $in: [userA._id, userB._id] } });
    await Person.deleteMany({ user_id: { $in: [userA._id, userB._id] } });

    console.log('📦 Setup complete. Initializing System Chart of Accounts...');
    await doubleEntryService.initializeSystemAccounts(userA._id);
    await doubleEntryService.initializeSystemAccounts(userB._id);

    // =========================================================================
    // TEST 1: Setup Accounts & Opening Balances
    // =========================================================================
    console.log('\n🧪 Test 1: Setup Opening Accounts & Balances');
    const bob = await doubleEntryService.createAccountWithOpeningBalance(userA._id, {
      name: 'Bank of Baroda',
      account_class: 'ASSET',
      account_type: 'BANK',
      opening_balance: 40000,
    });

    const slice = await doubleEntryService.createAccountWithOpeningBalance(userA._id, {
      name: 'Slice Wallet',
      account_class: 'ASSET',
      account_type: 'DIGITAL_WALLET',
      opening_balance: 20000,
    });

    const cash = await doubleEntryService.createAccountWithOpeningBalance(userA._id, {
      name: 'Cash Wallet',
      account_class: 'ASSET',
      account_type: 'CASH',
      opening_balance: 5000,
    });

    const groww = await doubleEntryService.createAccountWithOpeningBalance(userA._id, {
      name: 'Groww Investments',
      account_class: 'ASSET',
      account_type: 'INVESTMENT',
      opening_balance: 10000,
    });

    let pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 75000);
    assert.strictEqual(pos.financial_position.total_liabilities, 0);
    assert.strictEqual(pos.financial_position.net_worth, 75000);
    assert.strictEqual(pos.financial_position.is_balanced, true);
    console.log('✅ Test 1 Passed: Opening balances created ₹75,000 Total Assets & Net Worth.');

    // =========================================================================
    // TEST 2: Own Account Transfer (BOB -> Slice ₹10,000)
    // =========================================================================
    console.log('\n🧪 Test 2: Transfer between Own Accounts (BOB -> Slice ₹10,000)');
    await doubleEntryService.postJournalEntry(userA._id, {
      transaction_type: 'TRANSFER',
      description: 'Transfer BOB to Slice',
      lines: [
        { account_id: slice._id, debit: 10000, credit: 0 },
        { account_id: bob._id, debit: 0, credit: 10000 },
      ],
    });

    const bobBal2 = await doubleEntryService.getAccountBalance(userA._id, bob._id);
    const sliceBal2 = await doubleEntryService.getAccountBalance(userA._id, slice._id);
    assert.strictEqual(bobBal2, 30000);
    assert.strictEqual(sliceBal2, 30000);

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 75000);
    assert.strictEqual(pos.financial_position.net_worth, 75000);
    assert.strictEqual(pos.profit_and_loss.total_income, 0);
    assert.strictEqual(pos.profit_and_loss.total_expenses, 0);
    console.log('✅ Test 2 Passed: Transfer changed account composition without affecting Income/Expense/Net Worth.');

    // =========================================================================
    // TEST 3: Salary Income (₹50,000 -> BOB)
    // =========================================================================
    console.log('\n🧪 Test 3: Salary Income Deposit (₹50,000 into BOB)');
    const salaryAcc = await Account.findOne({ user_id: userA._id, name: 'Salary Income' });
    await doubleEntryService.postJournalEntry(userA._id, {
      transaction_type: 'INCOME',
      description: 'Monthly Salary Credit',
      lines: [
        { account_id: bob._id, debit: 50000, credit: 0 },
        { account_id: salaryAcc._id, debit: 0, credit: 50000 },
      ],
    });

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 125000);
    assert.strictEqual(pos.profit_and_loss.total_income, 50000);
    assert.strictEqual(pos.financial_position.net_worth, 125000);
    console.log('✅ Test 3 Passed: Salary increased Assets and Net Worth to ₹125,000.');

    // =========================================================================
    // TEST 4: Restaurant Expense (₹1,000 from BOB)
    // =========================================================================
    console.log('\n🧪 Test 4: Restaurant Expense (₹1,000 from BOB)');
    const foodAcc = await Account.findOne({ user_id: userA._id, name: 'Food & Dining' });
    await doubleEntryService.postJournalEntry(userA._id, {
      transaction_type: 'EXPENSE',
      description: 'Dinner at Restaurant',
      lines: [
        { account_id: foodAcc._id, debit: 1000, credit: 0 },
        { account_id: bob._id, debit: 0, credit: 1000 },
      ],
    });

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 124000);
    assert.strictEqual(pos.profit_and_loss.total_expenses, 1000);
    assert.strictEqual(pos.financial_position.net_worth, 124000);
    console.log('✅ Test 4 Passed: Expense decreased Assets and Net Worth to ₹124,000.');

    // =========================================================================
    // TEST 5: Investment Purchase (BOB -> Groww ₹5,000)
    // =========================================================================
    console.log('\n🧪 Test 5: Investment Purchase (BOB -> Groww ₹5,000)');
    await doubleEntryService.postJournalEntry(userA._id, {
      transaction_type: 'INVESTMENT',
      description: 'Mutual Fund Investment in Groww',
      lines: [
        { account_id: groww._id, debit: 5000, credit: 0 },
        { account_id: bob._id, debit: 0, credit: 5000 },
      ],
    });

    const bobBal5 = await doubleEntryService.getAccountBalance(userA._id, bob._id);
    const growwBal5 = await doubleEntryService.getAccountBalance(userA._id, groww._id);
    assert.strictEqual(bobBal5, 74000);
    assert.strictEqual(growwBal5, 15000);

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 124000);
    assert.strictEqual(pos.profit_and_loss.total_expenses, 1000);
    assert.strictEqual(pos.financial_position.net_worth, 124000);
    console.log('✅ Test 5 Passed: Investment shifted asset form without creating an Expense.');

    // =========================================================================
    // TEST 6: Borrow Money from Rahul (₹10,000)
    // =========================================================================
    console.log('\n🧪 Test 6: Borrow Money from Rahul (₹10,000 into BOB)');
    const rahulPerson = await Person.create({ user_id: userA._id, name: 'Rahul' });
    const rahulPayableAcc = await Account.create({
      user_id: userA._id,
      name: 'Payable: Rahul',
      account_class: 'LIABILITY',
      account_type: 'PAYABLE',
    });

    await doubleEntryService.postJournalEntry(userA._id, {
      transaction_type: 'BORROW',
      description: 'Loan received from Rahul',
      person_id: rahulPerson._id,
      lines: [
        { account_id: bob._id, debit: 10000, credit: 0 },
        { account_id: rahulPayableAcc._id, debit: 0, credit: 10000 },
      ],
    });

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 134000);
    assert.strictEqual(pos.financial_position.total_liabilities, 10000);
    assert.strictEqual(pos.financial_position.net_worth, 124000);
    console.log('✅ Test 6 Passed: Borrowing increased Assets & Liabilities equally; Net Worth unchanged.');

    // =========================================================================
    // TEST 7: Repay Rahul (₹3,000 from BOB)
    // =========================================================================
    console.log('\n🧪 Test 7: Partial Repayment to Rahul (₹3,000 from BOB)');
    await doubleEntryService.postJournalEntry(userA._id, {
      transaction_type: 'REPAYMENT',
      description: 'Partial Loan Repayment to Rahul',
      person_id: rahulPerson._id,
      lines: [
        { account_id: rahulPayableAcc._id, debit: 3000, credit: 0 },
        { account_id: bob._id, debit: 0, credit: 3000 },
      ],
    });

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 131000);
    assert.strictEqual(pos.financial_position.total_liabilities, 7000);
    assert.strictEqual(pos.financial_position.net_worth, 124000);
    console.log('✅ Test 7 Passed: Repayment reduced Assets & Liabilities equally; Net Worth unchanged.');

    // =========================================================================
    // TEST 8: Lend Money to Rahul (₹5,000 from BOB)
    // =========================================================================
    console.log('\n🧪 Test 8: Lend Money to Rahul (₹5,000 from BOB)');
    const rahulReceivableAcc = await Account.create({
      user_id: userA._id,
      name: 'Receivable: Rahul',
      account_class: 'ASSET',
      account_type: 'RECEIVABLE',
    });

    await doubleEntryService.postJournalEntry(userA._id, {
      transaction_type: 'LEND',
      description: 'Lent money to Rahul',
      person_id: rahulPerson._id,
      lines: [
        { account_id: rahulReceivableAcc._id, debit: 5000, credit: 0 },
        { account_id: bob._id, debit: 0, credit: 5000 },
      ],
    });

    const bobBal8 = await doubleEntryService.getAccountBalance(userA._id, bob._id);
    const recBal8 = await doubleEntryService.getAccountBalance(userA._id, rahulReceivableAcc._id);
    assert.strictEqual(bobBal8, 76000);
    assert.strictEqual(recBal8, 5000);

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 131000);
    assert.strictEqual(pos.financial_position.net_worth, 124000);
    console.log('✅ Test 8 Passed: Lending decreased Cash asset and increased Receivable asset; Net Worth unchanged.');

    // =========================================================================
    // TEST 9: Strict Unbalanced Journal Rejection
    // =========================================================================
    console.log('\n🧪 Test 9: Reject Unbalanced Journal Entry');
    await assert.rejects(
      async () => {
        await doubleEntryService.postJournalEntry(userA._id, {
          transaction_type: 'EXPENSE',
          description: 'Unbalanced entry test',
          lines: [
            { account_id: foodAcc._id, debit: 1000, credit: 0 },
            { account_id: bob._id, debit: 0, credit: 900 },
          ],
        });
      },
      (err) => err.statusCode === 400 && err.message.includes('UNBALANCED_JOURNAL')
    );
    console.log('✅ Test 9 Passed: Unbalanced journal entry correctly rejected with status 400.');

    // =========================================================================
    // TEST 10: Strict Cross-User Ownership Authorization Check
    // =========================================================================
    console.log('\n🧪 Test 10: Cross-User Resource Access Prevention (403 FORBIDDEN)');
    const bobUserB = await doubleEntryService.createAccountWithOpeningBalance(userB._id, {
      name: 'BOB User B',
      account_class: 'ASSET',
      account_type: 'BANK',
      opening_balance: 10000,
    });

    await assert.rejects(
      async () => {
        // User A tries to transfer to User B's account ID
        await doubleEntryService.postJournalEntry(userA._id, {
          transaction_type: 'TRANSFER',
          description: 'Malicious Cross-User Transfer',
          lines: [
            { account_id: bobUserB._id, debit: 1000, credit: 0 },
            { account_id: bob._id, debit: 0, credit: 1000 },
          ],
        });
      },
      (err) => err.statusCode === 403 && err.message.includes('FORBIDDEN')
    );
    console.log('✅ Test 10 Passed: Cross-user resource access strictly blocked with 403 FORBIDDEN.');

    // =========================================================================
    // TEST 11: Immutable Entry Reversal Verification
    // =========================================================================
    console.log('\n🧪 Test 11: Journal Entry Reversal Verification');
    const entryToReverse = await doubleEntryService.postJournalEntry(userA._id, {
      transaction_type: 'EXPENSE',
      description: 'Accidental Expense',
      lines: [
        { account_id: foodAcc._id, debit: 500, credit: 0 },
        { account_id: bob._id, debit: 0, credit: 500 },
      ],
    });

    const { originalEntry, reversalEntry } = await doubleEntryService.reverseJournalEntry(userA._id, entryToReverse._id, 'Correction');
    assert.strictEqual(originalEntry.status, 'REVERSED');
    assert.strictEqual(reversalEntry.status, 'POSTED');

    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.total_assets, 131500);
    assert.strictEqual(pos.profit_and_loss.total_expenses, 500);
    console.log('✅ Test 11 Passed: Reversal negated erroneous entry and restored exact financial position.');

    // =========================================================================
    // TEST 12: Fundamental Accounting Invariant Verification (Assets = Liabilities + Equity)
    // =========================================================================
    console.log('\n🧪 Test 12: Fundamental Accounting Equation Invariant Check');
    pos = await doubleEntryService.getFinancialPosition(userA._id);
    assert.strictEqual(pos.financial_position.is_balanced, true);
    assert.strictEqual(pos.financial_position.total_assets, pos.financial_position.total_liabilities + pos.financial_position.owners_equity);
    console.log('✅ Test 12 Passed: Assets = Liabilities + Equity strictly satisfied for complete dataset.');

    console.log('\n🎉 ALL 12 STAGE B CORE ACCOUNTING TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (error) {
    console.error('❌ Stage B Test Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('⚠️ MongoDB Disconnected.');
  }
}

runAccountingCoreTests();
