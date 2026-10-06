const mongoose = require('mongoose');
const { Transaction, Person } = require('../models');

/**
 * Generates an enriched, compact, privacy-preserving financial telemetry summary for AI context.
 * 
 * SECURITY BOUNDARIES:
 * - Every single database query strictly filters by the authenticated user's ObjectId.
 * - No passwords, hashes, tokens, session IDs, internal MongoDB IDs, or PII are exposed.
 * - Raw database documents are transformed into aggregated statistical metrics.
 * 
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<object>} Compact financial summary object
 */
const generateUserFinancialSummary = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  // Current Month boundaries
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Previous Month boundaries
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // 3-Months Lookback boundary
  const startOf3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  // 1. Overall Totals & Balance
  const overallStats = await Transaction.aggregate([
    { $match: { user_id: userObjectId } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalIncome = 0;
  let totalExpense = 0;
  let totalTransactions = 0;

  overallStats.forEach((st) => {
    totalTransactions += st.count;
    if (st._id === 'income') totalIncome = st.total;
    if (st._id === 'expense') totalExpense = st.total;
  });

  const currentBalance = Math.round((totalIncome - totalExpense) * 100) / 100;

  // 2. Current Month vs Previous Month Metrics
  const monthComparison = await Transaction.aggregate([
    {
      $match: {
        user_id: userObjectId,
        date: { $gte: startOfPrevMonth, $lte: endOfCurrentMonth },
      },
    },
    {
      $group: {
        _id: {
          period: {
            $cond: [{ $gte: ['$date', startOfCurrentMonth] }, 'current', 'previous'],
          },
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
  ]);

  let currentMonthIncome = 0;
  let currentMonthExpense = 0;
  let prevMonthIncome = 0;
  let prevMonthExpense = 0;

  monthComparison.forEach((item) => {
    if (item._id.period === 'current') {
      if (item._id.type === 'income') currentMonthIncome = item.total;
      if (item._id.type === 'expense') currentMonthExpense = item.total;
    } else {
      if (item._id.type === 'income') prevMonthIncome = item.total;
      if (item._id.type === 'expense') prevMonthExpense = item.total;
    }
  });

  // Calculate percentage changes
  const calcChange = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const pct = ((current - previous) / previous) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  const expenseChangePercentage = calcChange(currentMonthExpense, prevMonthExpense);
  const incomeChangePercentage = calcChange(currentMonthIncome, prevMonthIncome);
  const currentMonthNet = Math.round((currentMonthIncome - currentMonthExpense) * 100) / 100;
  const prevMonthNet = Math.round((prevMonthIncome - prevMonthExpense) * 100) / 100;

  // 3. Top Spending Purposes over the last 3 months
  const topPurposes = await Transaction.aggregate([
    {
      $match: {
        user_id: userObjectId,
        type: 'expense',
        date: { $gte: startOf3MonthsAgo },
      },
    },
    {
      $group: {
        _id: '$purpose',
        total_amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total_amount: -1 } },
    { $limit: 5 },
  ]);

  // 4. Highest Individual Expense (Last 3 months)
  const highestExpenseTx = await Transaction.findOne({
    user_id: userObjectId,
    type: 'expense',
    date: { $gte: startOf3MonthsAgo },
  })
    .sort({ amount: -1 })
    .select('amount purpose date person_name -_id')
    .lean();

  // 5. Top Counterparty Persons by Volume (Last 3 months)
  const topPersons = await Transaction.aggregate([
    {
      $match: {
        user_id: userObjectId,
        person_id: { $ne: null },
        date: { $gte: startOf3MonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          person_name: '$person_name',
          type: '$type',
        },
        total_amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const personLedgerMap = {};
  topPersons.forEach((item) => {
    const pName = item._id.person_name;
    if (!personLedgerMap[pName]) {
      personLedgerMap[pName] = { person: pName, total_received: 0, total_paid: 0, net_balance: 0, count: 0 };
    }
    personLedgerMap[pName].count += item.count;
    if (item._id.type === 'income') {
      personLedgerMap[pName].total_received += item.total_amount;
    } else if (item._id.type === 'expense') {
      personLedgerMap[pName].total_paid += item.total_amount;
    }
  });

  const personSummaryList = Object.values(personLedgerMap).map((p) => ({
    person: p.person,
    total_received: Math.round(p.total_received * 100) / 100,
    total_paid: Math.round(p.total_paid * 100) / 100,
    net_balance: Math.round((p.total_received - p.total_paid) * 100) / 100,
    transaction_count: p.count,
  })).sort((a, b) => (b.total_received + b.total_paid) - (a.total_received + a.total_paid)).slice(0, 5);

  // 6. Average Daily Expense (Current Month)
  const daysInCurrentMonthElapsed = Math.max(1, now.getDate());
  const averageDailyExpense = Math.round((currentMonthExpense / daysInCurrentMonthElapsed) * 100) / 100;

  // 7. Last 3 Months Trend
  const monthlyTrends = await Transaction.aggregate([
    {
      $match: {
        user_id: userObjectId,
        date: { $gte: startOf3MonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          month: { $dateToString: { format: '%Y-%m', date: '$date' } },
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  const trendsMap = {};
  monthlyTrends.forEach((item) => {
    const month = item._id.month;
    if (!trendsMap[month]) trendsMap[month] = { month, income: 0, expense: 0, net: 0 };
    if (item._id.type === 'income') trendsMap[month].income = Math.round(item.total * 100) / 100;
    if (item._id.type === 'expense') trendsMap[month].expense = Math.round(item.total * 100) / 100;
    trendsMap[month].net = Math.round((trendsMap[month].income - trendsMap[month].expense) * 100) / 100;
  });

  // 8. Recent Activity Sample (5 most recent transactions)
  const recentTransactions = await Transaction.find({ user_id: userObjectId })
    .sort({ date: -1, createdAt: -1 })
    .limit(5)
    .lean();

  // 9. Double-Entry Accounting Position & Reconciliation Telemetry
  let doubleEntryTelemetry = null;
  try {
    const doubleEntryService = require('./doubleEntryService');
    const pos = await doubleEntryService.getFinancialPosition(userId);
    const pnl = await doubleEntryService.getProfitAndLoss(userId);
    const cashFlow = await doubleEntryService.getCashFlow(userId);

    const ReconciliationLog = require('../models/ReconciliationLog');
    const unreconciledCount = await ReconciliationLog.countDocuments({
      user_id: userObjectId,
      is_reconciled: false,
    });

    const cashAccounts = pos.accounts.filter(a => ['BANK', 'CASH', 'WALLET', 'DIGITAL_WALLET'].includes(a.account_type));
    const investmentAccounts = pos.accounts.filter(a => a.account_type === 'INVESTMENT');
    const receivables = pos.accounts.filter(a => a.account_class === 'ASSET' && a.account_type === 'RECEIVABLE');
    const payables = pos.accounts.filter(a => a.account_class === 'LIABILITY');

    doubleEntryTelemetry = {
      financial_position: pos.financial_position,
      profit_and_loss: pnl,
      cash_flow: cashFlow,
      breakdown: {
        cash_and_bank_accounts: cashAccounts,
        investment_accounts: investmentAccounts,
        receivables: receivables,
        liabilities_and_payables: payables,
      },
      reconciliation_summary: {
        unreconciled_warnings_count: unreconciledCount,
        has_unreconciled_variances: unreconciledCount > 0,
      },
    };
  } catch (deErr) {
    // Graceful fallback if double entry tables are untouched
    doubleEntryTelemetry = null;
  }

  return {
    currency: 'INR',
    current_financial_status: {
      current_balance: currentBalance,
      total_income: Math.round(totalIncome * 100) / 100,
      total_expense: Math.round(totalExpense * 100) / 100,
      total_transactions: totalTransactions,
    },
    double_entry_accounting: doubleEntryTelemetry,
    current_month: {
      income: Math.round(currentMonthIncome * 100) / 100,
      expense: Math.round(currentMonthExpense * 100) / 100,
      net_change: currentMonthNet,
      avg_daily_expense: averageDailyExpense,
      days_elapsed: daysInCurrentMonthElapsed,
    },
    previous_month: {
      income: Math.round(prevMonthIncome * 100) / 100,
      expense: Math.round(prevMonthExpense * 100) / 100,
      net_change: prevMonthNet,
    },
    comparison: {
      income_percentage_change: incomeChangePercentage,
      expense_percentage_change: expenseChangePercentage,
    },
    spending_analysis: {
      top_spending_purposes: topPurposes.map((p) => ({
        purpose: p._id,
        amount: Math.round(p.total_amount * 100) / 100,
        count: p.count,
      })),
      highest_expense: highestExpenseTx ? {
        amount: highestExpenseTx.amount,
        purpose: highestExpenseTx.purpose,
        date: highestExpenseTx.date ? highestExpenseTx.date.toISOString().substring(0, 10) : '',
        person: highestExpenseTx.person_name || 'N/A',
      } : null,
      top_counterparties: personSummaryList,
    },
    three_month_trend: Object.values(trendsMap),
    recent_activity_sample: recentTransactions.map((tx) => ({
      date: tx.date ? tx.date.toISOString().substring(0, 10) : '',
      type: tx.type,
      amount: tx.amount,
      purpose: tx.purpose,
      person: tx.person_name || 'N/A',
    })),
  };
};

module.exports = {
  generateUserFinancialSummary,
};

