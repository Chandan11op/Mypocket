import React, { useState } from 'react';
import { accountApi } from '../../services';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/formatters';
import {
  Wallet,
  ShieldCheck,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  CreditCard,
  Banknote,
  TrendingUp,
} from 'lucide-react';

export function OnboardingFlow({ onComplete }) {
  const { currency } = useTheme();
  const [step, setStep] = useState(1);
  const [addedAccounts, setAddedAccounts] = useState([]);

  // New account form state for Step 2
  const [accountForm, setAccountForm] = useState({
    name: '',
    account_type: 'BANK',
    institution_name: '',
    opening_balance: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 3 Financial Position State
  const [financialPos, setFinancialPos] = useState(null);
  const [isLoadingPos, setIsLoadingPos] = useState(false);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    const typeClassMap = {
      BANK: 'ASSET',
      CASH: 'ASSET',
      WALLET: 'ASSET',
      INVESTMENT: 'ASSET',
      RECEIVABLE: 'ASSET',
      CREDIT_CARD: 'LIABILITY',
      LOAN: 'LIABILITY',
      PAYABLE: 'LIABILITY',
    };

    try {
      const payload = {
        name: accountForm.name.trim(),
        account_class: typeClassMap[accountForm.account_type] || 'ASSET',
        account_type: accountForm.account_type,
        institution_name: accountForm.institution_name.trim(),
        opening_balance: accountForm.opening_balance ? parseFloat(accountForm.opening_balance) : 0,
      };

      const res = await accountApi.createAccount(payload);
      if (res.data.success) {
        setAddedAccounts((prev) => [...prev, res.data.data.account || res.data.data]);
        setAccountForm({
          name: '',
          account_type: 'BANK',
          institution_name: '',
          opening_balance: '',
        });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToStep3 = async () => {
    setIsLoadingPos(true);
    try {
      const res = await accountApi.getFinancialPosition();
      if (res.data.success) {
        setFinancialPos(res.data.data);
      }
      setStep(3);
    } catch (err) {
      setErrorMsg('Unable to retrieve financial position. Proceeding...');
      setStep(3);
    } finally {
      setIsLoadingPos(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      {/* Header & Step Tracker */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Wallet className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Let's set up your financial position
        </h1>
        <p className="text-xs font-medium text-slate-400 mt-1 max-w-md mx-auto">
          My Pocket works by tracking where your money is, what you own, what you owe, and what others owe you.
        </p>

        {/* Steps Pills */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-brand-600'
                  : s < step
                  ? 'w-4 bg-emerald-500'
                  : 'w-4 bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: WELCOME & PRINCIPLES */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Step 1: How My Pocket Tracks Your Wealth
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  1. Assets (What You Own)
                </span>
                Bank accounts, wallets, physical cash, investments, and money owed to you.
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  2. Liabilities (What You Owe)
                </span>
                Credit card balances, personal/bank loans, and external payables.
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Your opening account balances represent your existing wealth—not income. Internal transfers between your accounts won't distort your net worth.
            </p>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-sm transition"
          >
            <span>Continue to Add Accounts</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: ADD ACCOUNTS & OPENING BALANCES */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Step 2: Add your financial accounts & opening balances
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add your current bank accounts, wallets, cash, or credit cards.
            </p>
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAddAccount} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
            {errorMsg && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{errorMsg}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Account Name (e.g. BOB Savings)"
                value={accountForm.name}
                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={accountForm.account_type}
                onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value })}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="BANK">Bank Account (Asset)</option>
                <option value="CASH">Cash (Asset)</option>
                <option value="WALLET">Digital Wallet (Asset)</option>
                <option value="INVESTMENT">Investment (Asset)</option>
                <option value="CREDIT_CARD">Credit Card (Liability)</option>
                <option value="LOAN">Loan (Liability)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Institution (e.g. Bank of Baroda)"
                value={accountForm.institution_name}
                onChange={(e) => setAccountForm({ ...accountForm, institution_name: e.target.value })}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Opening Balance (₹)"
                value={accountForm.opening_balance}
                onChange={(e) => setAccountForm({ ...accountForm, opening_balance: e.target.value })}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !accountForm.name.trim()}
              className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
              <span>Add Account</span>
            </button>
          </form>

          {/* Added Accounts List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Added Accounts ({addedAccounts.length})
            </h3>
            {addedAccounts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No accounts added yet. Add at least one account above.</p>
            ) : (
              <div className="space-y-2">
                {addedAccounts.map((acc, idx) => (
                  <div key={acc._id || idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{acc.name}</p>
                      <p className="text-[10px] text-slate-400">{acc.institution_name || acc.account_type}</p>
                    </div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      {formatCurrency(acc.balance || acc.opening_balance || 0, currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={handleGoToStep3}
              disabled={addedAccounts.length === 0 || isLoadingPos}
              className="flex-1 py-2.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoadingPos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Review Financial Position</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW FINANCIAL POSITION */}
      {step === 3 && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Step 3: Review your initial financial position
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified double-entry snapshot based on your configured accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Total Assets</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(financialPos?.financial_position?.total_assets ?? 0, currency)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Total Liabilities</span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(financialPos?.financial_position?.total_liabilities ?? 0, currency)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Net Worth</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(financialPos?.financial_position?.net_worth ?? 0, currency)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setStep(2)}
              className="py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 py-2.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
            >
              <span>Looks Good, Complete Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: FINISH SETUP */}
      {step === 4 && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Setup Complete!
            </h2>
            <p className="text-xs font-medium text-slate-400 mt-1 max-w-sm mx-auto">
              Your financial books have been initialized with immutable double-entry accuracy.
            </p>
          </div>

          <button
            onClick={onComplete}
            className="w-full py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-600/20 transition"
          >
            Go to My Accounts Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
