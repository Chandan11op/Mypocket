import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { accountApi, transactionApi } from '../../services';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { TransactionModal } from '../../components/transactions/TransactionModal';
import {
  ArrowLeft,
  Building2,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2,
  CheckCircle2,
  PlusCircle,
  History,
  FileText,
  Filter,
  ArrowUpDown,
  Calendar,
  X,
} from 'lucide-react';

export function AccountDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency } = useTheme();

  const [account, setAccount] = useState(null);
  const [statement, setStatement] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Sorting & Filtering state
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (Newest First) or 'asc' (Oldest First)
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Reconciliation form state
  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);

  // Edit metadata modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', institution_name: '', description: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit Transaction state
  const [editingTx, setEditingTx] = useState(null);
  const [editTxForm, setEditTxForm] = useState({ description: '', amount: '', date: '' });
  const [isSavingTxEdit, setIsSavingTxEdit] = useState(false);

  // Transaction Modal state with defaultAccountId
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  const loadAccountDetails = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = {
        sort_order: sortOrder,
      };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (filterType !== 'ALL') params.transaction_type = filterType;

      const [accRes, stmtRes, recRes] = await Promise.all([
        accountApi.getAccountById(id),
        accountApi.getAccountTransactions(id, params),
        accountApi.getReconciliationLogs(id),
      ]);

      if (accRes.data.success) {
        const acc = accRes.data.data.account || accRes.data.data;
        setAccount(acc);
        setEditForm({
          name: acc.name || '',
          institution_name: acc.institution_name || '',
          description: acc.description || '',
        });
      }
      if (stmtRes.data.success) {
        setStatement(stmtRes.data.data.transactions || stmtRes.data.data.statement || []);
      }
      if (recRes.data.success) {
        setReconciliations(recRes.data.data.history || recRes.data.data || []);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Unable to load account details. Account may not exist or access denied.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [id, sortOrder, fromDate, toDate, filterType]);

  useEffect(() => {
    loadAccountDetails();
  }, [loadAccountDetails]);

  const handleReconcileSubmit = async (e) => {
    e.preventDefault();
    if (actualBalanceInput === '') return;

    setIsReconciling(true);
    setReconcileResult(null);
    try {
      const payload = {
        actual_balance: parseFloat(actualBalanceInput),
        notes: reconcileNotes.trim(),
      };
      const res = await accountApi.reconcileAccount(id, payload);
      if (res.data.success) {
        setReconcileResult(res.data.data);
        setActualBalanceInput('');
        setReconcileNotes('');
        loadAccountDetails();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Reconciliation attempt failed.');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleUpdateMetadata = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await accountApi.updateAccount(id, editForm);
      if (res.data.success) {
        setIsEditModalOpen(false);
        loadAccountDetails();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update account metadata.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(`Are you sure you want to delete account "${account?.name}"? All associated transactions will be removed and this account will no longer be visible.`)) {
      return;
    }
    try {
      await accountApi.deleteAccount(id);
      navigate('/accounts');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  const handleDeleteTransaction = async (txId, txDesc) => {
    if (!window.confirm(`Are you sure you want to void/reverse entry "${txDesc || 'Transaction'}"? This will post a balancing double-entry reversal to keep your books balanced.`)) {
      return;
    }
    try {
      await transactionApi.deleteTransaction(txId);
      loadAccountDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to void transaction.');
    }
  };

  const handleStartEditTx = (tx) => {
    const txAmt = tx.debit > 0 ? tx.debit : tx.credit;
    const formattedDate = tx.date ? new Date(tx.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10);
    setEditingTx(tx);
    setEditTxForm({
      description: tx.description || '',
      amount: txAmt || '',
      date: formattedDate,
    });
  };

  const handleSaveTxEdit = async (e) => {
    e.preventDefault();
    if (!editingTx) return;

    const numAmount = parseFloat(editTxForm.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    setIsSavingTxEdit(true);
    try {
      if (editingTx.status === 'REVERSED') {
        alert('This entry has already been reversed.');
        setEditingTx(null);
        return;
      }

      // 1. Reverse original entry
      await transactionApi.reverseTransaction(editingTx._id, 'Correction / Edit transaction');

      // 2. Post updated entry
      let txType = editingTx.transaction_type;
      if (txType === 'OPENING_BALANCE' || txType === 'REVERSAL') {
        txType = account?.account_class === 'ASSET' ? 'INCOME' : 'EXPENSE';
      }

      const payload = {
        transaction_type: txType,
        amount: numAmount,
        description: editTxForm.description.trim(),
        date: new Date(editTxForm.date).toISOString(),
      };

      if (txType === 'EXPENSE') {
        payload.from_account_id = id;
      } else if (txType === 'INCOME') {
        payload.to_account_id = id;
      } else {
        payload.from_account_id = id;
      }

      await transactionApi.createTransaction(payload);
      setEditingTx(null);
      loadAccountDetails();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to save transaction edits.');
    } finally {
      setIsSavingTxEdit(false);
    }
  };

  if (isLoading && !account) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
        <p className="text-xs font-semibold text-slate-400">Loading account ledger & statement...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">{errorMessage || 'The account you requested could not be located.'}</p>
        <Link to="/accounts" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Back to Accounts
        </Link>
      </div>
    );
  }

  const calculatedBalance = account.calculated_balance ?? account.balance ?? 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/accounts')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {account.name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  account.is_active
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {account.is_active ? 'Active' : 'Archived'}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              {account.institution_name || 'General Institution'} • {account.account_type} ({account.account_class})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTxModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 flex items-center gap-3 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Calculated Book Balance
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(calculatedBalance, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Derived strictly from posted journal entries</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Reconciliation Audit Status
          </span>
          <div className="mt-2 flex items-center gap-2">
            {account.last_reconciled_at ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5" /> Reconciled
              </span>
            ) : (
              <span className="text-amber-500 font-bold text-lg flex items-center gap-1.5">
                <AlertCircle className="w-5 h-5" /> Unreconciled
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {account.last_reconciled_at
              ? `Last statement verified on ${formatDate(account.last_reconciled_at)}`
              : 'Statement has not been audited yet'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Ledger Entries
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {statement.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Verified double-entry lines posted</p>
        </div>
      </div>

      {/* Reconciliation Workflow Form */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span>Statement Reconciliation Audit</span>
            </h2>
            <p className="text-xs text-slate-400">
              Compare calculated book balance against actual statement balance
            </p>
          </div>
        </div>

        {reconcileResult && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold ${
              reconcileResult.is_reconciled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-900 dark:text-amber-300'
            }`}
          >
            {reconcileResult.is_reconciled ? (
              <p className="flex items-center gap-2 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>✓ Reconciled — My Pocket balance matches actual statement balance!</span>
              </p>
            ) : (
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>⚠️ Statement Unreconciled</span>
                </p>
                <div className="mt-2 space-y-1 text-xs font-medium">
                  <p>Book Balance: {formatCurrency(reconcileResult.calculated_balance, currency)}</p>
                  <p>Actual Statement Balance: {formatCurrency(reconcileResult.actual_balance, currency)}</p>
                  <p className="font-bold">Variance: {formatCurrency(reconcileResult.variance, currency)}</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 italic mt-1">
                    Notice: Reconciliation never alters account balances automatically. Record missing transaction explicitly to resolve the variance.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleReconcileSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Actual Statement Balance (₹)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder={calculatedBalance.toString()}
              value={actualBalanceInput}
              onChange={(e) => setActualBalanceInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Notes / Audit Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly bank statement verified"
              value={reconcileNotes}
              onChange={(e) => setReconcileNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isReconciling || actualBalanceInput === ''}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isReconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Audit & Reconcile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Account Statement & Running Balance Table with Sorting & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Account Ledger & Statement</span>
            </h2>
            <p className="text-xs text-slate-400">Deterministic running balance history sorted by event date</p>
          </div>

          {/* Sort & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setSortOrder('desc')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  sortOrder === 'desc'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Newest First
              </button>
              <button
                onClick={() => setSortOrder('asc')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  sortOrder === 'asc'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Oldest First
              </button>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
              <option value="TRANSFER">Transfer</option>
              <option value="INVESTMENT">Investment</option>
              <option value="BORROW">Borrow</option>
              <option value="REPAYMENT">Repayment</option>
              <option value="LEND">Lend</option>
              <option value="RECEIVABLE_PAYMENT">Receive Repay</option>
            </select>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500">Filter Dates:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
            placeholder="From"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
            placeholder="To"
          />
          {(fromDate || toDate || filterType !== 'ALL') && (
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
                setFilterType('ALL');
              }}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Statement Table */}
        {statement.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            No transactions match the selected filters for this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Event Date</th>
                  <th className="px-4 py-3">Description & Counterparty</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Counter-Account</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">Running Balance</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {statement.map((tx) => {
                  const isVoided = tx.status === 'REVERSED' || tx.transaction_type === 'REVERSAL';
                  return (
                    <tr key={tx._id} className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${isVoided ? 'opacity-50 line-through bg-slate-50/40' : ''}`}>
                      <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                        <div>{formatDate(tx.date)}</div>
                        {tx.recorded_at && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Rec: {formatDate(tx.recorded_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900 dark:text-white">{tx.description}</p>
                        {tx.person && (
                          <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                            Person: {tx.person}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 uppercase text-[10px] font-bold text-slate-400">{tx.transaction_type}</td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{tx.counter_account_name || '-'}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {tx.debit > 0 ? formatCurrency(tx.debit, currency) : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-rose-600 dark:text-rose-400">
                        {tx.credit > 0 ? formatCurrency(tx.credit, currency) : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(tx.running_balance ?? tx.balance, currency)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isVoided ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-400">
                            Reversed
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleStartEditTx(tx)}
                              title="Edit Transaction Entry"
                              className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(tx._id, tx.description)}
                              title="Void / Delete Transaction Entry"
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Edit Transaction Entry</h3>
                <p className="text-[11px] text-slate-400">Reverses original entry & posts corrected double-entry record</p>
              </div>
              <button onClick={() => setEditingTx(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTxEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Reason / Purpose <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTxForm.description}
                  onChange={(e) => setEditTxForm({ ...editTxForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editTxForm.amount}
                    onChange={(e) => setEditTxForm({ ...editTxForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Event Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editTxForm.date}
                    onChange={(e) => setEditTxForm({ ...editTxForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTxEdit}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isSavingTxEdit ? 'Saving & Re-posting...' : 'Save & Re-post Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reconciliation History Audit Trail */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <span>Reconciliation Audit Logs</span>
        </h2>

        {reconciliations.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No reconciliation history recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {reconciliations.map((rec) => (
              <div
                key={rec._id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-between text-xs border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  {rec.is_reconciled ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {formatDate(rec.as_of || rec.createdAt)} — {rec.is_reconciled ? 'Reconciled' : 'Unreconciled Variance'}
                    </p>
                    <p className="text-[11px] text-slate-400">{rec.notes || 'No notes provided'}</p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">
                    Book {formatCurrency(rec.calculated_balance, currency)} vs Actual {formatCurrency(rec.actual_balance, currency)}
                  </p>
                  <p className={rec.variance === 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                    Diff: {formatCurrency(rec.variance, currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Safe Metadata Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Account Details</h3>
            <p className="text-xs text-slate-400">Safe metadata modifications only. Account balance cannot be edited manually.</p>

            <form onSubmit={handleUpdateMetadata} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Institution Name</label>
                <input
                  type="text"
                  value={editForm.institution_name}
                  onChange={(e) => setEditForm({ ...editForm, institution_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account-Preselected Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={loadAccountDetails}
        defaultAccountId={id}
      />
    </div>
  );
}
