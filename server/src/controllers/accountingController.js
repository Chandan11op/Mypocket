const Account = require('../models/Account');
const JournalEntry = require('../models/JournalEntry');
const ReconciliationLog = require('../models/ReconciliationLog');
const doubleEntryService = require('../services/doubleEntryService');

// ==========================================
// 1. ACCOUNT CRUD & MANAGE
// ==========================================

const createAccount = async (req, res, next) => {
  try {
    const userId = req.userId;
    const {
      name,
      account_class,
      account_type,
      institution_name,
      description,
      currency,
      opening_balance,
      opening_balance_date,
    } = req.body;

    if (!name || !account_class || !account_type) {
      return res.status(400).json({
        success: false,
        message: 'Name, account_class, and account_type are required.',
      });
    }

    const account = await doubleEntryService.createAccountWithOpeningBalance(userId, {
      name,
      account_class: account_class.toUpperCase(),
      account_type: account_type.toUpperCase(),
      institution_name,
      description,
      currency,
      opening_balance: Number(opening_balance) || 0,
      opening_balance_date,
    });

    const calculated_balance = await doubleEntryService.getAccountBalance(userId, account._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        account,
        calculated_balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAccounts = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { account_class, account_type, is_active } = req.query;

    const filter = { user_id: userId };
    if (account_class) filter.account_class = account_class.toUpperCase();
    if (account_type) filter.account_type = account_type.toUpperCase();
    if (is_active !== undefined) filter.is_active = is_active === 'true';

    const accounts = await Account.find(filter).sort({ name: 1 });

    const accountsWithBalance = await Promise.all(
      accounts.map(async (acc) => {
        const balance = await doubleEntryService.getAccountBalance(userId, acc._id);
        return {
          ...acc.toJSON(),
          calculated_balance: balance,
          balance: balance,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        accounts: accountsWithBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAccountById = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const account = await Account.findOne({ _id: id, user_id: userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    const calculated_balance = await doubleEntryService.getAccountBalance(userId, account._id);

    res.status(200).json({
      success: true,
      data: {
        account: {
          ...account.toJSON(),
          calculated_balance,
          balance: calculated_balance,
        },
        calculated_balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateAccount = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, institution_name, description, currency } = req.body;

    const account = await Account.findOne({ _id: id, user_id: userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (name !== undefined) account.name = name.trim();
    if (institution_name !== undefined) account.institution_name = institution_name.trim();
    if (description !== undefined) account.description = description.trim();
    if (currency !== undefined) account.currency = currency.toUpperCase();

    await account.save();

    const calculated_balance = await doubleEntryService.getAccountBalance(userId, account._id);

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: {
        account,
        calculated_balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const account = await Account.findOne({ _id: id, user_id: userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Delete associated journal entries
    await JournalEntry.deleteMany({
      user_id: userId,
      'lines.account_id': id,
    });

    // Delete associated reconciliation logs
    await ReconciliationLog.deleteMany({
      user_id: userId,
      account_id: id,
    });

    // Delete account document
    await Account.deleteOne({ _id: id, user_id: userId });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getAccountTransactions = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const sort_order = (req.query.sort_order || 'desc').toLowerCase();
    const { from, to, transaction_type } = req.query;

    const account = await Account.findOne({ _id: id, user_id: userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // 1. Fetch ALL posted journal entries for this account sorted chronologically (oldest to newest) to compute deterministic running balances
    const allEntriesQuery = {
      user_id: userId,
      status: 'POSTED',
      'lines.account_id': id,
    };

    const allEntries = await JournalEntry.find(allEntriesQuery)
      .sort({ date: 1, created_at: 1, _id: 1 })
      .populate('person_id', 'name')
      .populate('lines.account_id', 'name account_class account_type');

    let runningPaise = 0;
    const entriesWithRunningBalance = [];

    for (const entry of allEntries) {
      const line = entry.lines.find((l) => l.account_id._id.toString() === id || l.account_id.toString() === id);
      const counterLine = entry.lines.find((l) => l.account_id._id.toString() !== id && l.account_id.toString() !== id);

      const debit = line ? Number(line.debit || 0) : 0;
      const credit = line ? Number(line.credit || 0) : 0;

      const debitPaise = Math.round(debit * 100);
      const creditPaise = Math.round(credit * 100);

      if (account.account_class === 'ASSET' || account.account_class === 'EXPENSE') {
        runningPaise += (debitPaise - creditPaise);
      } else {
        runningPaise += (creditPaise - debitPaise);
      }

      entriesWithRunningBalance.push({
        _id: entry._id,
        date: entry.date,
        recorded_at: entry.created_at || entry.createdAt,
        transaction_type: entry.transaction_type,
        description: entry.description,
        debit,
        credit,
        running_balance: runningPaise / 100,
        counter_account_name: counterLine?.account_id?.name || null,
        person: entry.person_id ? entry.person_id.name : null,
        status: entry.status,
      });
    }

    // 2. Apply filters (from, to, transaction_type)
    let filteredEntries = entriesWithRunningBalance;

    if (from || to) {
      filteredEntries = filteredEntries.filter((e) => {
        const d = new Date(e.date);
        if (from && d < new Date(from)) return false;
        if (to && d > new Date(to)) return false;
        return true;
      });
    }

    if (transaction_type) {
      filteredEntries = filteredEntries.filter(
        (e) => e.transaction_type.toUpperCase() === transaction_type.toUpperCase()
      );
    }

    const total = filteredEntries.length;

    // 3. Apply sorting (sort_order === 'asc' vs 'desc')
    if (sort_order === 'desc') {
      filteredEntries.reverse();
    }

    // 4. Apply pagination
    const skip = (page - 1) * limit;
    const paginatedEntries = filteredEntries.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: {
        account_id: id,
        account_name: account.name,
        transactions: paginatedEntries,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. BUSINESS TRANSACTIONS
// ==========================================

const createAccountingTransaction = async (req, res, next) => {
  try {
    const userId = req.userId;
    const idempotencyKey = req.headers['x-idempotency-key'] || req.headers['idempotency-key'] || null;

    const journalEntry = await doubleEntryService.processBusinessTransaction(
      userId,
      req.body,
      idempotencyKey
    );

    res.status(201).json({
      success: true,
      message: 'Accounting transaction posted successfully',
      data: {
        journal_entry: journalEntry,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. FINANCIAL STATEMENTS & POSITION
// ==========================================

const getFinancialPosition = async (req, res, next) => {
  try {
    const userId = req.userId;
    const includeLegacy = req.query.include_legacy === 'true';

    const position = await doubleEntryService.getFinancialPosition(userId, includeLegacy);

    res.status(200).json({
      success: true,
      data: position,
    });
  } catch (error) {
    next(error);
  }
};

const getBalanceSheet = async (req, res, next) => {
  try {
    const userId = req.userId;
    const includeLegacy = req.query.include_legacy === 'true';

    const balanceSheet = await doubleEntryService.getBalanceSheet(userId, includeLegacy);

    res.status(200).json({
      success: true,
      data: balanceSheet,
    });
  } catch (error) {
    next(error);
  }
};

const getProfitAndLoss = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { from, to } = req.query;
    const includeLegacy = req.query.include_legacy === 'true';

    const pnl = await doubleEntryService.getProfitAndLoss(userId, from, to, includeLegacy);

    res.status(200).json({
      success: true,
      data: pnl,
    });
  } catch (error) {
    next(error);
  }
};

const getCashFlow = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { from, to } = req.query;
    const includeLegacy = req.query.include_legacy === 'true';

    const cashFlow = await doubleEntryService.getCashFlow(userId, from, to, includeLegacy);

    res.status(200).json({
      success: true,
      data: cashFlow,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. RECONCILIATION
// ==========================================

const reconcileAccount = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { accountId } = req.params;
    const { actual_balance, as_of, notes } = req.body;

    if (actual_balance === undefined || actual_balance === null) {
      return res.status(400).json({
        success: false,
        message: 'actual_balance is required',
      });
    }

    const result = await doubleEntryService.reconcileAccount(
      userId,
      accountId,
      actual_balance,
      as_of,
      notes
    );

    res.status(200).json({
      success: true,
      message: result.is_reconciled ? 'Account successfully reconciled' : 'Reconciliation variance detected',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getReconciliationHistory = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { accountId } = req.params;

    const account = await Account.findOne({ _id: accountId, user_id: userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    const history = await ReconciliationLog.find({ user_id: userId, account_id: accountId })
      .sort({ created_at: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        account_id: accountId,
        account_name: account.name,
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};

const reverseAccountingTransaction = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const result = await doubleEntryService.reverseJournalEntry(userId, id, reason || 'User reversal');

    res.status(200).json({
      success: true,
      message: 'Transaction successfully reversed / voided',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccountingTransaction = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await doubleEntryService.reverseJournalEntry(userId, id, 'User deleted transaction');

    res.status(200).json({
      success: true,
      message: 'Transaction successfully voided and reversed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  getAccountTransactions,
  createAccountingTransaction,
  reverseAccountingTransaction,
  deleteAccountingTransaction,
  getFinancialPosition,
  getBalanceSheet,
  getProfitAndLoss,
  getCashFlow,
  reconcileAccount,
  getReconciliationHistory,
};
