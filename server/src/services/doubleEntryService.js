const Account = require('../models/Account');
const JournalEntry = require('../models/JournalEntry');
const Person = require('../models/Person');
const Transaction = require('../models/Transaction');

/**
 * System default accounts template to initialize for new users
 */
const DEFAULT_SYSTEM_ACCOUNTS = [
  // EQUITY
  { name: "Owner's Equity", account_class: 'EQUITY', account_type: 'OWNER_EQUITY', is_system_account: true, description: "Initial capital & retained wealth" },
  // ASSET (Legacy holding)
  { name: 'Legacy Unassigned Wallet', account_class: 'ASSET', account_type: 'CASH', is_system_account: true, description: 'Default holding account for historical transactions' },
  // INCOME
  { name: 'Salary Income', account_class: 'INCOME', account_type: 'SALARY', is_system_account: true, description: 'Employment income' },
  { name: 'Other Income', account_class: 'INCOME', account_type: 'OTHER_INCOME', is_system_account: true, description: 'Miscellaneous income' },
  // EXPENSE
  { name: 'Food & Dining', account_class: 'EXPENSE', account_type: 'FOOD', is_system_account: true, description: 'Food and restaurant expenses' },
  { name: 'Travel & Transport', account_class: 'EXPENSE', account_type: 'TRAVEL', is_system_account: true, description: 'Travel, fuel, and transport expenses' },
  { name: 'Bills & Utilities', account_class: 'EXPENSE', account_type: 'BILLS', is_system_account: true, description: 'Bills, electricity, mobile recharge' },
  { name: 'Shopping', account_class: 'EXPENSE', account_type: 'SHOPPING', is_system_account: true, description: 'General shopping' },
  { name: 'General Expense', account_class: 'EXPENSE', account_type: 'OTHER_EXPENSE', is_system_account: true, description: 'Other general expenses' },
];

class DoubleEntryService {
  /**
   * Initializes default system chart of accounts for a given user
   */
  async initializeSystemAccounts(userId) {
    if (!userId) throw new Error('userId is required to initialize system accounts');

    const createdAccounts = [];
    for (const tpl of DEFAULT_SYSTEM_ACCOUNTS) {
      const existing = await Account.findOne({ user_id: userId, name: tpl.name });
      if (!existing) {
        const acc = await Account.create({
          ...tpl,
          user_id: userId,
        });
        createdAccounts.push(acc);
      } else {
        createdAccounts.push(existing);
      }
    }
    return createdAccounts;
  }

  /**
   * Validates ownership of all accounts, person, and transaction referenced in a journal payload
   */
  async validateOwnership(userId, accountIds = [], personId = null, refTransactionId = null) {
    if (!userId) {
      const err = new Error('UNAUTHORIZED: userId missing');
      err.statusCode = 401;
      throw err;
    }

    // 1. Verify all Accounts belong to user
    const uniqueAccountIds = [...new Set(accountIds.map((id) => id.toString()))];
    if (uniqueAccountIds.length > 0) {
      const accounts = await Account.find({
        _id: { $in: uniqueAccountIds },
        user_id: userId,
      });

      if (accounts.length !== uniqueAccountIds.length) {
        const err = new Error('FORBIDDEN: One or more referenced accounts do not belong to the authenticated user or do not exist');
        err.statusCode = 403;
        throw err;
      }

      // Check all accounts are active
      const inactive = accounts.find((a) => !a.is_active);
      if (inactive) {
        const err = new Error(`BAD_REQUEST: Account "${inactive.name}" is inactive.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // 2. Verify Person ownership if provided
    if (personId) {
      const person = await Person.findOne({ _id: personId, user_id: userId });
      if (!person) {
        const err = new Error('FORBIDDEN: Referenced counterparty person does not belong to the authenticated user');
        err.statusCode = 403;
        throw err;
      }
    }

    // 3. Verify Reference Transaction ownership if provided
    if (refTransactionId) {
      const refTx = await Transaction.findOne({ _id: refTransactionId, user_id: userId });
      if (!refTx) {
        const err = new Error('FORBIDDEN: Referenced transaction does not belong to the authenticated user');
        err.statusCode = 403;
        throw err;
      }
    }
  }

  /**
   * Validates journal entry lines for strict double-entry balancing
   */
  validateJournalLines(lines) {
    if (!Array.isArray(lines) || lines.length < 2) {
      const err = new Error('BAD_REQUEST: Journal entry must contain at least 2 lines.');
      err.statusCode = 400;
      throw err;
    }

    let totalDebitPaise = 0;
    let totalCreditPaise = 0;
    let hasDebit = false;
    let hasCredit = false;

    for (const line of lines) {
      if (!line.account_id) {
        const err = new Error('BAD_REQUEST: Every journal line must have an account_id.');
        err.statusCode = 400;
        throw err;
      }

      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;

      if (debit < 0 || credit < 0) {
        const err = new Error('BAD_REQUEST: Line debits and credits cannot be negative.');
        err.statusCode = 400;
        throw err;
      }

      if (debit > 0 && credit > 0) {
        const err = new Error('BAD_REQUEST: Line cannot have both debit and credit greater than zero.');
        err.statusCode = 400;
        throw err;
      }

      if (debit > 0) hasDebit = true;
      if (credit > 0) hasCredit = true;

      totalDebitPaise += Math.round(debit * 100);
      totalCreditPaise += Math.round(credit * 100);
    }

    if (!hasDebit || !hasCredit) {
      const err = new Error('BAD_REQUEST: Journal entry must have at least one debit line and one credit line.');
      err.statusCode = 400;
      throw err;
    }

    if (totalDebitPaise !== totalCreditPaise) {
      const err = new Error(`UNBALANCED_JOURNAL: Total debits (₹${(totalDebitPaise / 100).toFixed(2)}) must equal total credits (₹${(totalCreditPaise / 100).toFixed(2)}).`);
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Posts an immutable JournalEntry after full validation
   */
  async postJournalEntry(userId, entryPayload) {
    const {
      date = new Date(),
      transaction_type,
      description,
      lines,
      person_id = null,
      reference_transaction_id = null,
      is_legacy = false,
      status = 'POSTED',
    } = entryPayload;

    if (!transaction_type || !description) {
      const err = new Error('BAD_REQUEST: transaction_type and description are required.');
      err.statusCode = 400;
      throw err;
    }

    // 1. Validate lines balancing
    this.validateJournalLines(lines);

    // 2. Validate ownership of all referenced entities
    const accountIds = lines.map((l) => l.account_id);
    await this.validateOwnership(userId, accountIds, person_id, reference_transaction_id);

    // 3. Create entry
    const journalEntry = await JournalEntry.create({
      user_id: userId,
      date,
      transaction_type,
      status,
      description,
      lines,
      person_id,
      reference_transaction_id,
      is_legacy,
    });

    return journalEntry;
  }

  /**
   * Reverses a POSTED JournalEntry by creating a balanced inverted REVERSAL entry
   */
  async reverseJournalEntry(userId, entryId, reason = 'User correction') {
    const originalEntry = await JournalEntry.findOne({ _id: entryId, user_id: userId });

    if (!originalEntry) {
      const err = new Error('NOT_FOUND: Journal entry not found');
      err.statusCode = 404;
      throw err;
    }

    if (originalEntry.status === 'REVERSED') {
      return { originalEntry, reversalEntry: null, alreadyReversed: true, message: 'Transaction entry is already reversed.' };
    }

    if (originalEntry.status !== 'POSTED') {
      const err = new Error(`BAD_REQUEST: Cannot reverse entry with status "${originalEntry.status}". Only POSTED entries can be reversed.`);
      err.statusCode = 400;
      throw err;
    }

    // Invert lines: swap debits and credits
    const invertedLines = originalEntry.lines.map((line) => ({
      account_id: line.account_id,
      debit: line.credit,
      credit: line.debit,
      description: `Reversal: ${line.description || originalEntry.description}`,
    }));

    // Post reversal entry
    const reversalEntry = await JournalEntry.create({
      user_id: userId,
      date: new Date(),
      transaction_type: 'REVERSAL',
      status: 'POSTED',
      description: `Reversal of Entry #${originalEntry._id}: ${reason}`,
      lines: invertedLines,
      person_id: originalEntry.person_id,
      reverses_entry_id: originalEntry._id,
      is_legacy: originalEntry.is_legacy,
    });

    // Mark original entry as REVERSED
    originalEntry.status = 'REVERSED';
    originalEntry.reversed_by_entry_id = reversalEntry._id;
    await originalEntry.save();

    return { originalEntry, reversalEntry };
  }

  /**
   * Returns exact calculated balance for an account derived strictly from POSTED JournalEntries
   */
  async getAccountBalance(userId, accountId, includeLegacy = false) {
    const account = await Account.findOne({ _id: accountId, user_id: userId });
    if (!account) {
      const err = new Error('NOT_FOUND: Account not found');
      err.statusCode = 404;
      throw err;
    }

    const matchQuery = {
      user_id: account.user_id,
      status: 'POSTED',
      'lines.account_id': account._id,
    };

    if (!includeLegacy) {
      matchQuery.is_legacy = false;
    }

    const entries = await JournalEntry.find(matchQuery);

    let totalDebitPaise = 0;
    let totalCreditPaise = 0;

    for (const entry of entries) {
      for (const line of entry.lines) {
        if (line.account_id.toString() === account._id.toString()) {
          totalDebitPaise += Math.round((line.debit || 0) * 100);
          totalCreditPaise += Math.round((line.credit || 0) * 100);
        }
      }
    }

    let balancePaise = 0;
    if (account.account_class === 'ASSET' || account.account_class === 'EXPENSE') {
      balancePaise = totalDebitPaise - totalCreditPaise;
    } else {
      // LIABILITY, EQUITY, INCOME
      balancePaise = totalCreditPaise - totalDebitPaise;
    }

    return balancePaise / 100;
  }

  /**
   * Generates Financial Position & Statements strictly from POSTED JournalEntries
   */
  async getFinancialPosition(userId, includeLegacy = false) {
    await this.initializeSystemAccounts(userId);

    const accounts = await Account.find({ user_id: userId, is_active: true });

    const matchQuery = { user_id: userId, status: 'POSTED' };
    if (!includeLegacy) matchQuery.is_legacy = false;

    const entries = await JournalEntry.find(matchQuery);

    // Compute balance for each account
    const accountBalancesMap = new Map();
    for (const acc of accounts) {
      accountBalancesMap.set(acc._id.toString(), {
        account: acc,
        debitPaise: 0,
        creditPaise: 0,
      });
    }

    for (const entry of entries) {
      for (const line of entry.lines) {
        const accId = line.account_id.toString();
        if (accountBalancesMap.has(accId)) {
          const item = accountBalancesMap.get(accId);
          item.debitPaise += Math.round((line.debit || 0) * 100);
          item.creditPaise += Math.round((line.credit || 0) * 100);
        }
      }
    }

    let totalAssetsPaise = 0;
    let totalLiabilitiesPaise = 0;
    let totalEquityPaise = 0;
    let totalIncomePaise = 0;
    let totalExpensePaise = 0;

    const accountSummaries = [];

    for (const [, item] of accountBalancesMap) {
      const acc = item.account;
      let balancePaise = 0;

      if (acc.account_class === 'ASSET' || acc.account_class === 'EXPENSE') {
        balancePaise = item.debitPaise - item.creditPaise;
      } else {
        balancePaise = item.creditPaise - item.debitPaise;
      }

      const balance = balancePaise / 100;

      accountSummaries.push({
        _id: acc._id,
        name: acc.name,
        account_class: acc.account_class,
        account_type: acc.account_type,
        institution_name: acc.institution_name,
        balance,
      });

      if (acc.account_class === 'ASSET') totalAssetsPaise += balancePaise;
      if (acc.account_class === 'LIABILITY') totalLiabilitiesPaise += balancePaise;
      if (acc.account_class === 'EQUITY') totalEquityPaise += balancePaise;
      if (acc.account_class === 'INCOME') totalIncomePaise += balancePaise;
      if (acc.account_class === 'EXPENSE') totalExpensePaise += balancePaise;
    }

    const totalIncome = totalIncomePaise / 100;
    const totalExpenses = totalExpensePaise / 100;
    const netProfit = (totalIncomePaise - totalExpensePaise) / 100;

    const totalAssets = totalAssetsPaise / 100;
    const totalLiabilities = totalLiabilitiesPaise / 100;
    const netWorth = (totalAssetsPaise - totalLiabilitiesPaise) / 100;
    const ownersEquityTotal = (totalEquityPaise + totalIncomePaise - totalExpensePaise) / 100;

    return {
      financial_position: {
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: netWorth,
        owners_equity: ownersEquityTotal,
        is_balanced: Math.abs(totalAssetsPaise - (totalLiabilitiesPaise + totalEquityPaise + totalIncomePaise - totalExpensePaise)) === 0,
      },
      profit_and_loss: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_profit: netProfit,
      },
      accounts: accountSummaries,
    };
  }

  /**
   * Helper: Record business-level accounting transaction with idempotency protection
   */
  async processBusinessTransaction(userId, payload, idempotencyKey = null) {
    const {
      transaction_type,
      date = new Date(),
      description,
      amount,
      from_account_id,
      to_account_id,
      income_account_id,
      expense_account_id,
      investment_account_id,
      liability_account_id,
      receivable_account_id,
      person_id = null,
    } = payload;

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      const err = new Error('BAD_REQUEST: Amount must be a positive number greater than 0.');
      err.statusCode = 400;
      throw err;
    }

    // Optional Idempotency check
    if (idempotencyKey) {
      const existing = await JournalEntry.findOne({
        user_id: userId,
        description: `[IDEM:${idempotencyKey}] ${description}`,
      });
      if (existing) {
        return existing;
      }
    }

    const entryDescription = idempotencyKey ? `[IDEM:${idempotencyKey}] ${description}` : description;

    let resolvedPersonId = person_id;
    if (!resolvedPersonId && payload.person_name && typeof payload.person_name === 'string' && payload.person_name.trim()) {
      const pName = payload.person_name.trim();
      let person = await Person.findOne({ user_id: userId, name: pName });
      if (!person) {
        person = await Person.create({ user_id: userId, name: pName });
      }
      resolvedPersonId = person._id;
    }

    let resolvedIncomeAccountId = income_account_id;
    if (transaction_type === 'INCOME' && !resolvedIncomeAccountId) {
      await this.initializeSystemAccounts(userId);
      const incAcc = await Account.findOne({ user_id: userId, account_class: 'INCOME' });
      if (incAcc) resolvedIncomeAccountId = incAcc._id;
    }

    let resolvedExpenseAccountId = expense_account_id;
    if (transaction_type === 'EXPENSE' && !resolvedExpenseAccountId) {
      await this.initializeSystemAccounts(userId);

      const searchText = `${description || ''} ${payload.person_name || ''}`.toLowerCase();
      let matchedType = 'OTHER_EXPENSE';

      if (/(train|ticket|travel|flight|bus|cab|uber|ola|auto|transport|fuel|petrol|railway|irctc)/i.test(searchText)) {
        matchedType = 'TRAVEL';
      } else if (/(food|dining|restaurant|swiggy|zomato|lunch|dinner|breakfast|tea|coffee|grocery|mcdonald)/i.test(searchText)) {
        matchedType = 'FOOD';
      } else if (/(bill|utility|recharge|electricity|water|wifi|internet|mobile)/i.test(searchText)) {
        matchedType = 'BILLS';
      } else if (/(shopping|amazon|flipkart|clothes|mall|store)/i.test(searchText)) {
        matchedType = 'SHOPPING';
      }

      let expAcc = await Account.findOne({ user_id: userId, account_class: 'EXPENSE', account_type: matchedType });
      if (!expAcc) {
        expAcc = await Account.findOne({ user_id: userId, account_class: 'EXPENSE' });
      }
      if (expAcc) resolvedExpenseAccountId = expAcc._id;
    }

    // Collect all referenced account IDs to validate account classes
    const accountIdsToValidate = [
      from_account_id,
      to_account_id,
      resolvedIncomeAccountId,
      resolvedExpenseAccountId,
      investment_account_id,
      liability_account_id,
      receivable_account_id,
    ].filter(Boolean);

    const accountsMap = new Map();
    if (accountIdsToValidate.length > 0) {
      const accounts = await Account.find({
        _id: { $in: accountIdsToValidate },
        user_id: userId,
      });
      for (const acc of accounts) {
        accountsMap.set(acc._id.toString(), acc);
      }
    }

    const getAcc = (id, paramName) => {
      if (!id) return null;
      const acc = accountsMap.get(id.toString());
      if (!acc) {
        const err = new Error(`FORBIDDEN: Account for ${paramName} does not belong to user or does not exist.`);
        err.statusCode = 403;
        throw err;
      }
      return acc;
    };

    let lines = [];

    switch (transaction_type) {
      case 'INCOME': {
        if (!to_account_id || !resolvedIncomeAccountId) {
          const err = new Error('BAD_REQUEST: INCOME requires to_account_id (Asset) and income_account_id (Income).');
          err.statusCode = 400;
          throw err;
        }
        const toAcc = getAcc(to_account_id, 'to_account_id');
        const incAcc = getAcc(resolvedIncomeAccountId, 'income_account_id');

        if (toAcc.account_class !== 'ASSET') {
          const err = new Error('BAD_REQUEST: INCOME target account (to_account_id) must be an ASSET account.');
          err.statusCode = 400;
          throw err;
        }
        if (incAcc.account_class !== 'INCOME') {
          const err = new Error('BAD_REQUEST: INCOME source account (income_account_id) must be an INCOME account.');
          err.statusCode = 400;
          throw err;
        }

        lines = [
          { account_id: to_account_id, debit: numAmount, credit: 0, description },
          { account_id: resolvedIncomeAccountId, debit: 0, credit: numAmount, description },
        ];
        break;
      }
      case 'EXPENSE': {
        if (!from_account_id || !resolvedExpenseAccountId) {
          const err = new Error('BAD_REQUEST: EXPENSE requires from_account_id (Asset) and expense_account_id (Expense).');
          err.statusCode = 400;
          throw err;
        }
        const fromAcc = getAcc(from_account_id, 'from_account_id');
        const expAcc = getAcc(resolvedExpenseAccountId, 'expense_account_id');

        if (fromAcc.account_class !== 'ASSET') {
          const err = new Error('BAD_REQUEST: EXPENSE source account (from_account_id) must be an ASSET account.');
          err.statusCode = 400;
          throw err;
        }
        if (expAcc.account_class !== 'EXPENSE') {
          const err = new Error('BAD_REQUEST: EXPENSE category account (expense_account_id) must be an EXPENSE account.');
          err.statusCode = 400;
          throw err;
        }

        lines = [
          { account_id: resolvedExpenseAccountId, debit: numAmount, credit: 0, description },
          { account_id: from_account_id, debit: 0, credit: numAmount, description },
        ];
        break;
      }
      case 'TRANSFER': {
        if (!from_account_id || !to_account_id) {
          const err = new Error('BAD_REQUEST: TRANSFER requires from_account_id and to_account_id.');
          err.statusCode = 400;
          throw err;
        }
        const fromAcc = getAcc(from_account_id, 'from_account_id');
        const toAcc = getAcc(to_account_id, 'to_account_id');

        if (fromAcc.account_class === 'INCOME' || fromAcc.account_class === 'EXPENSE' ||
            toAcc.account_class === 'INCOME' || toAcc.account_class === 'EXPENSE') {
          const err = new Error('BAD_REQUEST: TRANSFER source and destination cannot be INCOME or EXPENSE accounts.');
          err.statusCode = 400;
          throw err;
        }

        lines = [
          { account_id: to_account_id, debit: numAmount, credit: 0, description },
          { account_id: from_account_id, debit: 0, credit: numAmount, description },
        ];
        break;
      }
      case 'INVESTMENT': {
        if (!from_account_id || !investment_account_id) {
          const err = new Error('BAD_REQUEST: INVESTMENT requires from_account_id (Bank/Cash) and investment_account_id (Investment Asset).');
          err.statusCode = 400;
          throw err;
        }
        const fromAcc = getAcc(from_account_id, 'from_account_id');
        const invAcc = getAcc(investment_account_id, 'investment_account_id');

        if (fromAcc.account_class !== 'ASSET' || invAcc.account_class !== 'ASSET') {
          const err = new Error('BAD_REQUEST: INVESTMENT accounts must be ASSET accounts.');
          err.statusCode = 400;
          throw err;
        }

        lines = [
          { account_id: investment_account_id, debit: numAmount, credit: 0, description },
          { account_id: from_account_id, debit: 0, credit: numAmount, description },
        ];
        break;
      }
      case 'BORROW': {
        if (!to_account_id || !liability_account_id) {
          const err = new Error('BAD_REQUEST: BORROW requires to_account_id (Asset) and liability_account_id (Liability).');
          err.statusCode = 400;
          throw err;
        }
        const toAcc = getAcc(to_account_id, 'to_account_id');
        const liabAcc = getAcc(liability_account_id, 'liability_account_id');

        if (toAcc.account_class !== 'ASSET' || liabAcc.account_class !== 'LIABILITY') {
          const err = new Error('BAD_REQUEST: BORROW requires an ASSET target account and a LIABILITY source account.');
          err.statusCode = 400;
          throw err;
        }

        lines = [
          { account_id: to_account_id, debit: numAmount, credit: 0, description },
          { account_id: liability_account_id, debit: 0, credit: numAmount, description },
        ];
        break;
      }
      case 'REPAYMENT': {
        if (!from_account_id || !liability_account_id) {
          const err = new Error('BAD_REQUEST: REPAYMENT requires from_account_id (Asset) and liability_account_id (Liability).');
          err.statusCode = 400;
          throw err;
        }
        const fromAcc = getAcc(from_account_id, 'from_account_id');
        const liabAcc = getAcc(liability_account_id, 'liability_account_id');

        if (fromAcc.account_class !== 'ASSET' || liabAcc.account_class !== 'LIABILITY') {
          const err = new Error('BAD_REQUEST: REPAYMENT requires an ASSET payment account and a LIABILITY loan account.');
          err.statusCode = 400;
          throw err;
        }

        lines = [
          { account_id: liability_account_id, debit: numAmount, credit: 0, description },
          { account_id: from_account_id, debit: 0, credit: numAmount, description },
        ];
        break;
      }
      case 'LEND': {
        if (!from_account_id || !receivable_account_id) {
          const err = new Error('BAD_REQUEST: LEND requires from_account_id (Asset) and receivable_account_id (Receivable Asset).');
          err.statusCode = 400;
          throw err;
        }
        const fromAcc = getAcc(from_account_id, 'from_account_id');
        const recAcc = getAcc(receivable_account_id, 'receivable_account_id');

        if (fromAcc.account_class !== 'ASSET' || recAcc.account_class !== 'ASSET') {
          const err = new Error('BAD_REQUEST: LEND requires ASSET accounts.');
          err.statusCode = 400;
          throw err;
        }

        lines = [
          { account_id: receivable_account_id, debit: numAmount, credit: 0, description },
          { account_id: from_account_id, debit: 0, credit: numAmount, description },
        ];
        break;
      }
      case 'RECEIVABLE_PAYMENT': {
        if (!to_account_id || !receivable_account_id) {
          const err = new Error('BAD_REQUEST: RECEIVABLE_PAYMENT requires to_account_id (Asset) and receivable_account_id (Receivable Asset).');
          err.statusCode = 400;
          throw err;
        }
        const toAcc = getAcc(to_account_id, 'to_account_id');
        const recAcc = getAcc(receivable_account_id, 'receivable_account_id');

        if (toAcc.account_class !== 'ASSET' || recAcc.account_class !== 'ASSET') {
          const err = new Error('BAD_REQUEST: RECEIVABLE_PAYMENT requires ASSET accounts.');
          err.statusCode = 400;
          throw err;
        }

        lines = [
          { account_id: to_account_id, debit: numAmount, credit: 0, description },
          { account_id: receivable_account_id, debit: 0, credit: numAmount, description },
        ];
        break;
      }
      case 'ADJUSTMENT': {
        if (!payload.lines || payload.lines.length < 2) {
          const err = new Error('BAD_REQUEST: ADJUSTMENT requires balanced lines array.');
          err.statusCode = 400;
          throw err;
        }
        lines = payload.lines;
        break;
      }
      default: {
        const err = new Error(`BAD_REQUEST: Unsupported transaction_type "${transaction_type}".`);
        err.statusCode = 400;
        throw err;
      }
    }

    return await this.postJournalEntry(userId, {
      date,
      transaction_type,
      description: entryDescription,
      lines,
      person_id: resolvedPersonId,
    });
  }

  /**
   * Generates Balance Sheet statement
   */
  async getBalanceSheet(userId, includeLegacy = false) {
    const pos = await this.getFinancialPosition(userId, includeLegacy);
    
    const assetAccounts = pos.accounts.filter(a => a.account_class === 'ASSET');
    const liabilityAccounts = pos.accounts.filter(a => a.account_class === 'LIABILITY');
    const equityAccounts = pos.accounts.filter(a => a.account_class === 'EQUITY');

    return {
      as_of: new Date(),
      assets: {
        total: pos.financial_position.total_assets,
        accounts: assetAccounts,
      },
      liabilities: {
        total: pos.financial_position.total_liabilities,
        accounts: liabilityAccounts,
      },
      equity: {
        total: pos.financial_position.owners_equity,
        owner_equity_accounts: equityAccounts,
        net_profit: pos.profit_and_loss.net_profit,
      },
      net_worth: pos.financial_position.net_worth,
      is_balanced: pos.financial_position.is_balanced,
    };
  }

  /**
   * Generates Profit & Loss statement for a date range
   */
  async getProfitAndLoss(userId, fromDate = null, toDate = null, includeLegacy = false) {
    await this.initializeSystemAccounts(userId);
    const accounts = await Account.find({ user_id: userId, is_active: true });

    const matchQuery = { user_id: userId, status: 'POSTED' };
    if (!includeLegacy) matchQuery.is_legacy = false;

    if (fromDate || toDate) {
      matchQuery.date = {};
      if (fromDate) matchQuery.date.$gte = new Date(fromDate);
      if (toDate) matchQuery.date.$lte = new Date(toDate);
    }

    const entries = await JournalEntry.find(matchQuery);

    const accountMap = new Map();
    for (const acc of accounts) {
      if (acc.account_class === 'INCOME' || acc.account_class === 'EXPENSE') {
        accountMap.set(acc._id.toString(), {
          account: acc,
          debitPaise: 0,
          creditPaise: 0,
        });
      }
    }

    for (const entry of entries) {
      for (const line of entry.lines) {
        const accId = line.account_id.toString();
        if (accountMap.has(accId)) {
          const item = accountMap.get(accId);
          item.debitPaise += Math.round((line.debit || 0) * 100);
          item.creditPaise += Math.round((line.credit || 0) * 100);
        }
      }
    }

    let totalIncomePaise = 0;
    let totalExpensePaise = 0;
    const incomeAccounts = [];
    const expenseAccounts = [];

    for (const [, item] of accountMap) {
      const acc = item.account;
      if (acc.account_class === 'INCOME') {
        const balPaise = item.creditPaise - item.debitPaise;
        const bal = balPaise / 100;
        totalIncomePaise += balPaise;
        incomeAccounts.push({ _id: acc._id, name: acc.name, account_type: acc.account_type, amount: bal });
      } else if (acc.account_class === 'EXPENSE') {
        const balPaise = item.debitPaise - item.creditPaise;
        const bal = balPaise / 100;
        totalExpensePaise += balPaise;
        expenseAccounts.push({ _id: acc._id, name: acc.name, account_type: acc.account_type, amount: bal });
      }
    }

    const totalIncome = totalIncomePaise / 100;
    const totalExpenses = totalExpensePaise / 100;
    const netProfit = (totalIncomePaise - totalExpensePaise) / 100;

    return {
      period: { from: fromDate || 'ALL_TIME', to: toDate || 'NOW' },
      income: {
        total: totalIncome,
        accounts: incomeAccounts,
      },
      expenses: {
        total: totalExpenses,
        accounts: expenseAccounts,
      },
      net_profit: netProfit,
    };
  }

  /**
   * Generates Cash Flow statement for a date range
   */
  async getCashFlow(userId, fromDate = null, toDate = null, includeLegacy = false) {
    const matchQuery = { user_id: userId, status: 'POSTED' };
    if (!includeLegacy) matchQuery.is_legacy = false;

    if (fromDate || toDate) {
      matchQuery.date = {};
      if (fromDate) matchQuery.date.$gte = new Date(fromDate);
      if (toDate) matchQuery.date.$lte = new Date(toDate);
    }

    const entries = await JournalEntry.find(matchQuery);

    let operatingInflowPaise = 0;
    let operatingOutflowPaise = 0;
    let transfersPaise = 0;
    let investmentFlowPaise = 0;
    let financingInflowPaise = 0;
    let financingOutflowPaise = 0;

    for (const entry of entries) {
      const amountPaise = Math.round((entry.lines[0]?.debit || entry.lines[0]?.credit || 0) * 100);
      switch (entry.transaction_type) {
        case 'INCOME':
          operatingInflowPaise += amountPaise;
          break;
        case 'EXPENSE':
          operatingOutflowPaise += amountPaise;
          break;
        case 'TRANSFER':
          transfersPaise += amountPaise;
          break;
        case 'INVESTMENT':
          investmentFlowPaise += amountPaise;
          break;
        case 'BORROW':
          financingInflowPaise += amountPaise;
          break;
        case 'REPAYMENT':
          financingOutflowPaise += amountPaise;
          break;
        case 'LEND':
          financingOutflowPaise += amountPaise;
          break;
        case 'RECEIVABLE_PAYMENT':
          financingInflowPaise += amountPaise;
          break;
      }
    }

    const netOperating = (operatingInflowPaise - operatingOutflowPaise) / 100;
    const netFinancing = (financingInflowPaise - financingOutflowPaise) / 100;
    const netCashMovement = netOperating + netFinancing - (investmentFlowPaise / 100);

    return {
      period: { from: fromDate || 'ALL_TIME', to: toDate || 'NOW' },
      operating_cash_flow: {
        inflow: operatingInflowPaise / 100,
        outflow: operatingOutflowPaise / 100,
        net: netOperating,
      },
      transfers_total: transfersPaise / 100,
      investment_flow: investmentFlowPaise / 100,
      financing_cash_flow: {
        inflow: financingInflowPaise / 100,
        outflow: financingOutflowPaise / 100,
        net: netFinancing,
      },
      net_cash_movement: netCashMovement,
    };
  }

  /**
   * Reconciles an account balance against actual statement balance
   */
  async reconcileAccount(userId, accountId, actualBalance, asOf = new Date(), notes = '') {
    const account = await Account.findOne({ _id: accountId, user_id: userId });
    if (!account) {
      const err = new Error('NOT_FOUND: Account not found');
      err.statusCode = 404;
      throw err;
    }

    const calculatedBalance = await this.getAccountBalance(userId, accountId);
    const numActual = Number(actualBalance);
    if (isNaN(numActual)) {
      const err = new Error('BAD_REQUEST: actual_balance must be a valid number');
      err.statusCode = 400;
      throw err;
    }

    const variancePaise = Math.round(numActual * 100) - Math.round(calculatedBalance * 100);
    const variance = variancePaise / 100;
    const isReconciled = variancePaise === 0;

    const ReconciliationLog = require('../models/ReconciliationLog');
    const log = await ReconciliationLog.create({
      user_id: userId,
      account_id: accountId,
      as_of: new Date(asOf),
      calculated_balance: calculatedBalance,
      actual_balance: numActual,
      variance,
      is_reconciled: isReconciled,
      notes,
    });

    if (isReconciled) {
      account.last_reconciled_at = new Date(asOf);
      account.last_reconciled_balance = numActual;
      await account.save();
    }

    return {
      account_id: accountId,
      account_name: account.name,
      calculated_balance: calculatedBalance,
      actual_balance: numActual,
      variance,
      is_reconciled: isReconciled,
      reconciliation_log: log,
    };
  }
  /**
   * High-level Helper: Creates an Account & posts its Opening Balance
   */
  async createAccountWithOpeningBalance(userId, accountData) {
    const { name, account_class, account_type, institution_name, description, currency, opening_balance = 0, opening_balance_date = new Date() } = accountData;

    // 1. Ensure system accounts exist
    await this.initializeSystemAccounts(userId);

    // 2. Create account document
    const account = await Account.create({
      user_id: userId,
      name,
      account_class,
      account_type,
      institution_name,
      description,
      currency,
      opening_balance_meta: {
        amount: opening_balance,
        date: opening_balance_date,
      },
    });

    // 3. If opening balance > 0, post double-entry journal
    if (opening_balance > 0) {
      const ownerEquityAccount = await Account.findOne({ user_id: userId, name: "Owner's Equity" });
      if (!ownerEquityAccount) throw new Error("CRITICAL: Owner's Equity system account missing");

      let lines = [];
      if (account_class === 'ASSET') {
        lines = [
          { account_id: account._id, debit: opening_balance, credit: 0, description: `Opening balance for ${account.name}` },
          { account_id: ownerEquityAccount._id, debit: 0, credit: opening_balance, description: `Initial capital credit for ${account.name}` },
        ];
      } else if (account_class === 'LIABILITY') {
        lines = [
          { account_id: ownerEquityAccount._id, debit: opening_balance, credit: 0, description: `Initial liability debit against equity for ${account.name}` },
          { account_id: account._id, debit: 0, credit: opening_balance, description: `Opening liability balance for ${account.name}` },
        ];
      }

      if (lines.length > 0) {
        await this.postJournalEntry(userId, {
          date: opening_balance_date,
          transaction_type: 'OPENING_BALANCE',
          description: `Opening balance setup for ${account.name}`,
          lines,
        });
      }
    }

    return account;
  }
}

module.exports = new DoubleEntryService();


