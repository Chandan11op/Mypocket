import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { transactionApi } from '../../services';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Receipt,
  Users,
  Loader2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

import { FinancialPositionSummary } from '../../components/accounts/FinancialPositionSummary';

export function DashboardPage() {
  const { refreshTrigger, openAddTransaction } = useOutletContext();
  const { currency } = useTheme();

  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [summaryRes, txRes] = await Promise.all([
        transactionApi.getSummary(),
        transactionApi.getStatement(),
      ]);

      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data);
      }
      if (txRes.data.success) {
        const statement = txRes.data.data.statement || [];
        // statement is chronological (oldest first), so reverse and take top 5
        const recent = statement.slice().reverse().slice(0, 5);
        setRecentTransactions(recent);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Unable to fetch dashboard statistics. Please refresh.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, refreshTrigger]);

  if (isLoading && !summary) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
        <p className="text-xs font-semibold text-slate-400">Loading your finances...</p>
      </div>
    );
  }

  const currentBalance = summary?.current_balance ?? 0;
  const totalIncome = summary?.total_income ?? 0;
  const totalExpense = summary?.total_expense ?? 0;
  const monthlyTrends = summary?.monthly_trends || [];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Financial Dashboard
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Real-time balance, income, expense flows and recent ledger activity
          </p>
        </div>

        <button
          onClick={openAddTransaction}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 flex items-center gap-3 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Verified Double-Entry Financial Position Widget */}
      <FinancialPositionSummary refreshTrigger={refreshTrigger} />

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Net Current Balance Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Current Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                currentBalance >= 0
                  ? 'text-slate-900 dark:text-white'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(currentBalance, currency)}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              Net accumulated funds from verified transactions
            </p>
          </div>
        </div>

        {/* Total Income Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Income
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(totalIncome, currency)}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              Received cash, salary, and repayments
            </p>
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              -{formatCurrency(totalExpense, currency)}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              Total expenditure across all counterparties
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section: Monthly Inflow vs Outflow */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Income & Expense Trend
            </h2>
            <p className="text-xs text-slate-400">Monthly aggregate breakdown</p>
          </div>
        </div>

        {monthlyTrends.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Receipt className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-500">No monthly trend data yet.</p>
            <p className="text-[11px] text-slate-400">Add transactions to visualize cash flow charts.</p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  stroke="#94a3b8"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  stroke="#94a3b8"
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val, currency), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h2>
            <p className="text-xs text-slate-400">Latest activity on your account</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
          >
            View All Statement →
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              You don't have any transactions yet.
            </p>
            <button
              onClick={openAddTransaction}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record your first transaction</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentTransactions.map((tx) => (
              <div
                key={tx._id}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {tx.purpose}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{formatDate(tx.date)}</span>
                      {tx.person_name && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-slate-500 dark:text-slate-300">
                            {tx.person_name}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-black ${
                      tx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </p>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {tx.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
