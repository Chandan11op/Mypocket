const mongoose = require('mongoose');
const JournalEntry = require('../models/JournalEntry');
const Person = require('../models/Person');
const Transaction = require('../models/Transaction');

/**
 * Calculates user overall financial summary: Total Income, Total Expense, Current Balance
 * 
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{total_income: number, total_expense: number, current_balance: number, transaction_count: number}>}
 */
const getFinancialSummary = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const entries = await JournalEntry.find({ user_id: userObjectId, status: 'POSTED', is_legacy: false });

  let totalIncomePaise = 0;
  let totalExpensePaise = 0;
  let count = 0;

  for (const entry of entries) {
    count++;
    const firstDebitLine = entry.lines?.find((l) => Number(l.debit) > 0);
    const amount = firstDebitLine ? Number(firstDebitLine.debit) : Number(entry.lines?.[0]?.credit || 0);
    const amtPaise = Math.round(amount * 100);

    if (entry.transaction_type === 'INCOME') {
      totalIncomePaise += amtPaise;
    } else if (entry.transaction_type === 'EXPENSE') {
      totalExpensePaise += amtPaise;
    }
  }

  const totalIncome = Math.round(totalIncomePaise) / 100;
  const totalExpense = Math.round(totalExpensePaise) / 100;
  const currentBalance = Math.round(totalIncomePaise - totalExpensePaise) / 100;

  return {
    total_income: totalIncome,
    total_expense: totalExpense,
    current_balance: currentBalance,
    transaction_count: count,
  };
};

/**
 * Aggregates monthly income and expense trends for charts
 */
const getMonthlyTrends = async (userId, months = 6) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  const entries = await JournalEntry.find({
    user_id: userObjectId,
    status: 'POSTED',
    is_legacy: false,
    date: { $gte: cutoffDate },
    transaction_type: { $in: ['INCOME', 'EXPENSE'] },
  });

  const map = {};
  for (const entry of entries) {
    const month = entry.date ? new Date(entry.date).toISOString().substring(0, 7) : new Date().toISOString().substring(0, 7);
    if (!map[month]) {
      map[month] = { month, income: 0, expense: 0 };
    }

    const firstDebitLine = entry.lines?.find((l) => Number(l.debit) > 0);
    const amount = firstDebitLine ? Number(firstDebitLine.debit) : Number(entry.lines?.[0]?.credit || 0);

    if (entry.transaction_type === 'INCOME') {
      map[month].income += amount;
    } else if (entry.transaction_type === 'EXPENSE') {
      map[month].expense += amount;
    }
  }

  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Generates bank-statement transaction sequence with deterministically calculated running balances.
 */
const getStatementWithRunningBalance = async (userId, filters = {}) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const query = { user_id: userObjectId, status: 'POSTED', is_legacy: false };

  const allEntries = await JournalEntry.find(query)
    .sort({ date: 1, created_at: 1, _id: 1 })
    .populate('person_id', 'name')
    .lean();

  let cumulativeBalancePaise = 0;
  const chronologicalStatement = allEntries.map((entry) => {
    const firstDebitLine = entry.lines?.find((l) => Number(l.debit) > 0);
    const amount = firstDebitLine ? Number(firstDebitLine.debit) : Number(entry.lines?.[0]?.credit || 0);

    const type = entry.transaction_type?.toLowerCase() === 'income' ? 'income' : 'expense';
    if (entry.transaction_type === 'INCOME') {
      cumulativeBalancePaise += Math.round(amount * 100);
    } else if (entry.transaction_type === 'EXPENSE') {
      cumulativeBalancePaise -= Math.round(amount * 100);
    }

    const personName = entry.person_id ? (typeof entry.person_id === 'object' ? entry.person_id.name : '') : (entry.person_name || '');

    return {
      _id: entry._id,
      date: entry.date,
      type: type,
      transaction_type: entry.transaction_type,
      amount: amount,
      purpose: entry.description,
      person_id: entry.person_id ? (entry.person_id._id || entry.person_id) : null,
      person_name: personName,
      running_balance: cumulativeBalancePaise / 100,
      created_at: entry.created_at || entry.createdAt,
    };
  });

  let filtered = chronologicalStatement;

  if (filters.type && ['income', 'expense'].includes(filters.type.toLowerCase())) {
    filtered = filtered.filter((tx) => tx.type === filters.type.toLowerCase());
  }

  if (filters.person_id) {
    filtered = filtered.filter((tx) => tx.person_id && tx.person_id.toString() === filters.person_id.toString());
  }

  if (filters.person_name) {
    const pName = filters.person_name.toLowerCase();
    filtered = filtered.filter((tx) => tx.person_name && tx.person_name.toLowerCase().includes(pName));
  }

  if (filters.date_from) {
    const fromDate = new Date(filters.date_from);
    filtered = filtered.filter((tx) => new Date(tx.date) >= fromDate);
  }

  if (filters.date_to) {
    const toDate = new Date(filters.date_to);
    filtered = filtered.filter((tx) => new Date(tx.date) <= toDate);
  }

  if (filters.search) {
    const searchTerms = filters.search.toLowerCase();
    filtered = filtered.filter(
      (tx) =>
        (tx.purpose && tx.purpose.toLowerCase().includes(searchTerms)) ||
        (tx.person_name && tx.person_name.toLowerCase().includes(searchTerms))
    );
  }

  return filtered;
};

/**
 * Aggregates ledger statistics for all counterparties belonging to the user
 */
const getLedgerSummary = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const userPersons = await Person.find({ user_id: userObjectId }).sort({ name: 1 }).lean();

  const ledgerMap = {};
  userPersons.forEach((p) => {
    ledgerMap[p._id.toString()] = {
      person_id: p._id,
      name: p.name,
      total_received: 0,
      total_paid: 0,
      net_balance: 0,
      transaction_count: 0,
    };
  });

  const journalEntries = await JournalEntry.find({
    user_id: userObjectId,
    person_id: { $ne: null },
    status: 'POSTED',
  }).populate('person_id', 'name');

  for (const entry of journalEntries) {
    if (!entry.person_id) continue;
    const pId = (entry.person_id._id || entry.person_id).toString();
    const pName = entry.person_id.name || 'Unknown';

    if (!ledgerMap[pId]) {
      ledgerMap[pId] = {
        person_id: entry.person_id._id || entry.person_id,
        name: pName,
        total_received: 0,
        total_paid: 0,
        net_balance: 0,
        transaction_count: 0,
      };
    }

    const firstDebitLine = entry.lines?.find((l) => Number(l.debit) > 0);
    const amt = firstDebitLine ? Number(firstDebitLine.debit) : Number(entry.lines?.[0]?.credit || 0);

    ledgerMap[pId].transaction_count += 1;

    if (['INCOME', 'RECEIVABLE_PAYMENT', 'BORROW'].includes(entry.transaction_type)) {
      ledgerMap[pId].total_received += amt;
    } else if (['EXPENSE', 'REPAYMENT', 'LEND'].includes(entry.transaction_type)) {
      ledgerMap[pId].total_paid += amt;
    }
  }

  const result = Object.values(ledgerMap).map((entry) => {
    const received = Math.round(entry.total_received * 100) / 100;
    const paid = Math.round(entry.total_paid * 100) / 100;
    const net = Math.round((received - paid) * 100) / 100;
    return {
      ...entry,
      total_received: received,
      total_paid: paid,
      net_balance: net,
    };
  });

  return result.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Retrieves detailed ledger for an individual person
 */
const getPersonLedgerDetail = async (userId, personId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const personObjectId = new mongoose.Types.ObjectId(personId);

  const person = await Person.findOne({ _id: personObjectId, user_id: userObjectId });
  if (!person) {
    return null;
  }

  const entries = await JournalEntry.find({
    user_id: userObjectId,
    person_id: personObjectId,
    status: 'POSTED',
  })
    .sort({ date: 1, created_at: 1, _id: 1 })
    .lean();

  let totalReceivedPaise = 0;
  let totalPaidPaise = 0;
  let runningNetPaise = 0;

  const transactionEntries = entries.map((entry) => {
    const firstDebitLine = entry.lines?.find((l) => Number(l.debit) > 0);
    const amount = firstDebitLine ? Number(firstDebitLine.debit) : Number(entry.lines?.[0]?.credit || 0);
    const amtPaise = Math.round(amount * 100);

    const isReceived = ['INCOME', 'RECEIVABLE_PAYMENT', 'BORROW'].includes(entry.transaction_type);
    if (isReceived) {
      totalReceivedPaise += amtPaise;
      runningNetPaise += amtPaise;
    } else {
      totalPaidPaise += amtPaise;
      runningNetPaise -= amtPaise;
    }

    return {
      _id: entry._id,
      date: entry.date,
      type: entry.transaction_type?.toLowerCase() === 'income' ? 'income' : 'expense',
      transaction_type: entry.transaction_type,
      amount: amount,
      purpose: entry.description,
      running_net: runningNetPaise / 100,
      created_at: entry.created_at || entry.createdAt,
    };
  });

  return {
    person: {
      id: person._id,
      name: person.name,
      created_at: person.created_at || person.createdAt,
    },
    total_received: totalReceivedPaise / 100,
    total_paid: totalPaidPaise / 100,
    net_balance: runningNetPaise / 100,
    transaction_count: entries.length,
    transactions: transactionEntries,
  };
};

module.exports = {
  getFinancialSummary,
  getMonthlyTrends,
  getStatementWithRunningBalance,
  getLedgerSummary,
  getPersonLedgerDetail,
};
