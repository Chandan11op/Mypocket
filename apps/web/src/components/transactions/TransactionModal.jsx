import React, { useState, useEffect } from 'react';
import { accountApi, personApi, transactionApi } from '../../services';
import {
  X,
  Loader2,
  IndianRupee,
  Calendar,
  User,
  Tag,
  ArrowRightLeft,
  TrendingUp,
  CreditCard,
  HandCoins,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Building2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const TRANSACTION_TYPES = [
  {
    id: 'EXPENSE',
    label: 'Expense',
    meaning: 'I spent my money',
    icon: ArrowUpRight,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50',
  },
  {
    id: 'INCOME',
    label: 'Income',
    meaning: 'I received money',
    icon: ArrowDownLeft,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
  },
  {
    id: 'TRANSFER',
    label: 'Transfer Money',
    meaning: 'I moved money between my accounts',
    icon: ArrowRightLeft,
    color: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50',
  },
  {
    id: 'INVESTMENT',
    label: 'Investment',
    meaning: 'I put money into an investment asset',
    icon: TrendingUp,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50',
  },
  {
    id: 'BORROW',
    label: 'Borrow Money',
    meaning: 'I received money and I owe them',
    icon: CreditCard,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50',
  },
  {
    id: 'REPAYMENT',
    label: 'Repay Borrowed Money',
    meaning: 'I returned money I borrowed',
    icon: HandCoins,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
  },
  {
    id: 'LEND',
    label: 'Lend Money',
    meaning: 'I gave someone money & they owe me',
    icon: HandCoins,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
  },
  {
    id: 'RECEIVABLE_PAYMENT',
    label: 'Receive Money Back',
    meaning: 'Someone returned money they owed me',
    icon: ArrowDownLeft,
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50',
  },
];

const INVESTMENT_TYPES = [
  'Mutual Fund',
  'Stocks',
  'IPO',
  'ETF',
  'Fixed Deposit',
  'Bonds',
  'Gold',
  'Other',
];

export function TransactionModal({ isOpen, onClose, onSuccess, defaultAccountId = null }) {
  const [step, setStep] = useState('SELECT_TYPE'); // 'SELECT_TYPE' or 'FILL_FORM'
  const [txType, setTxType] = useState('EXPENSE');

  // Accounts & Persons dropdown state
  const [accounts, setAccounts] = useState([]);
  const [persons, setPersons] = useState([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);

  // Common Form Fields
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState('');

  // Specific Form Fields
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [investmentAccountId, setInvestmentAccountId] = useState('');
  const [investmentType, setInvestmentType] = useState('Mutual Fund');
  const [liabilityAccountId, setLiabilityAccountId] = useState('');
  const [receivableAccountId, setReceivableAccountId] = useState('');
  const [personName, setPersonName] = useState('');
  const [counterpartyName, setCounterpartyName] = useState(''); // merchant/source name

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Helper to format balance display safely
  const formatAccBalance = (a) => {
    const bal = a.calculated_balance ?? a.balance ?? 0;
    return typeof bal === 'number' ? bal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : bal;
  };

  // Fetch accounts and persons when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadEntities = async () => {
      setIsLoadingEntities(true);
      try {
        const [accRes, personRes] = await Promise.all([
          accountApi.getAccounts(),
          personApi.getPersons(),
        ]);

        if (accRes.data.success) {
          const accList = accRes.data.data.accounts || accRes.data.data || [];
          setAccounts(accList);

          const assetAccs = accList.filter((a) => a.account_class === 'ASSET');
          const liabilityAccs = accList.filter((a) => a.account_class === 'LIABILITY');
          const invAccs = accList.filter((a) => a.account_type === 'INVESTMENT');
          const recAccs = accList.filter((a) => a.account_type === 'RECEIVABLE');
          const expAccs = accList.filter((a) => a.account_class === 'EXPENSE');

          const defaultAsset = assetAccs.find((a) => a._id === defaultAccountId) || assetAccs[0];

          if (defaultAsset) {
            setFromAccountId((prev) => prev || defaultAsset._id);
            setToAccountId((prev) => prev || defaultAsset._id);
          }
          if (liabilityAccs.length > 0) {
            setLiabilityAccountId((prev) => prev || liabilityAccs[0]._id);
          }
          if (invAccs.length > 0) {
            setInvestmentAccountId((prev) => prev || invAccs[0]._id);
          } else if (assetAccs.length > 1) {
            setInvestmentAccountId((prev) => prev || assetAccs[1]._id);
          }
          if (recAccs.length > 0) {
            setReceivableAccountId((prev) => prev || recAccs[0]._id);
          }
        }
        if (personRes.data.success) {
          setPersons(personRes.data.data.persons || personRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load accounts/persons:', err);
      } finally {
        setIsLoadingEntities(false);
      }
    };

    loadEntities();
  }, [isOpen, defaultAccountId]);

  if (!isOpen) return null;

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setPersonName('');
    setCounterpartyName('');
    setErrorMessage('');
    setExpenseAccountId('');
    setStep('SELECT_TYPE');
  };

  const handleSelectType = (typeId) => {
    setTxType(typeId);

    // Smart pre-selections based on accounts available
    const assetAccs = accounts.filter((a) => a.account_class === 'ASSET');
    const liabilityAccs = accounts.filter((a) => a.account_class === 'LIABILITY');
    const invAccs = accounts.filter((a) => a.account_type === 'INVESTMENT');
    const recAccs = accounts.filter((a) => a.account_type === 'RECEIVABLE');

    const defaultAsset = assetAccs.find((a) => a._id === defaultAccountId) || assetAccs[0];

    if (typeId === 'EXPENSE') {
      if (defaultAsset) setFromAccountId(defaultAsset._id);
    } else if (typeId === 'INCOME') {
      if (defaultAsset) setToAccountId(defaultAsset._id);
    } else if (typeId === 'TRANSFER') {
      if (defaultAsset) setFromAccountId(defaultAsset._id);
      const otherAsset = assetAccs.find((a) => a._id !== (defaultAsset?._id));
      if (otherAsset) setToAccountId(otherAsset._id);
    } else if (typeId === 'INVESTMENT') {
      if (defaultAsset) setFromAccountId(defaultAsset._id);
      if (invAccs.length > 0) setInvestmentAccountId(invAccs[0]._id);
      else if (assetAccs.length > 1) setInvestmentAccountId(assetAccs[1]._id);
    } else if (typeId === 'BORROW') {
      if (defaultAsset) setToAccountId(defaultAsset._id);
      if (liabilityAccs.length > 0) setLiabilityAccountId(liabilityAccs[0]._id);
    } else if (typeId === 'REPAYMENT') {
      if (defaultAsset) setFromAccountId(defaultAsset._id);
      if (liabilityAccs.length > 0) setLiabilityAccountId(liabilityAccs[0]._id);
    } else if (typeId === 'LEND') {
      if (defaultAsset) setFromAccountId(defaultAsset._id);
      if (recAccs.length > 0) setReceivableAccountId(recAccs[0]._id);
    } else if (typeId === 'RECEIVABLE_PAYMENT') {
      if (defaultAsset) setToAccountId(defaultAsset._id);
      if (recAccs.length > 0) setReceivableAccountId(recAccs[0]._id);
    }

    setStep('FILL_FORM');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid positive amount.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Please enter a description or reason.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        transaction_type: txType,
        amount: numAmount,
        description: description.trim(),
        date: new Date(date).toISOString(),
        person_name: personName.trim() || counterpartyName.trim() || undefined,
      };

      // Type-specific account assignments
      if (txType === 'EXPENSE') {
        if (!fromAccountId) throw new Error('Please select an account to pay from.');
        payload.from_account_id = fromAccountId;
        if (expenseAccountId) payload.expense_account_id = expenseAccountId;
      } else if (txType === 'INCOME') {
        if (!toAccountId) throw new Error('Please select an account to receive funds.');
        payload.to_account_id = toAccountId;
      } else if (txType === 'TRANSFER') {
        if (!fromAccountId || !toAccountId) throw new Error('Please select both source and destination accounts.');
        if (fromAccountId === toAccountId) throw new Error('Source and destination accounts cannot be the same.');
        payload.from_account_id = fromAccountId;
        payload.to_account_id = toAccountId;
      } else if (txType === 'INVESTMENT') {
        if (!fromAccountId || !investmentAccountId) throw new Error('Please select source and investment accounts.');
        payload.from_account_id = fromAccountId;
        payload.investment_account_id = investmentAccountId;
        payload.description = `[${investmentType}] ${description.trim()}`;
      } else if (txType === 'BORROW') {
        if (!toAccountId || !liabilityAccountId) throw new Error('Please select target account and liability loan account.');
        payload.to_account_id = toAccountId;
        payload.liability_account_id = liabilityAccountId;
      } else if (txType === 'REPAYMENT') {
        if (!fromAccountId || !liabilityAccountId) throw new Error('Please select payment account and liability loan account.');
        payload.from_account_id = fromAccountId;
        payload.liability_account_id = liabilityAccountId;
      } else if (txType === 'LEND') {
        if (!fromAccountId || !receivableAccountId) throw new Error('Please select payment account and receivable account.');
        payload.from_account_id = fromAccountId;
        payload.receivable_account_id = receivableAccountId;
      } else if (txType === 'RECEIVABLE_PAYMENT') {
        if (!toAccountId || !receivableAccountId) throw new Error('Please select receiving account and receivable account.');
        payload.to_account_id = toAccountId;
        payload.receivable_account_id = receivableAccountId;
      }

      await transactionApi.createTransaction(payload);
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      const apiMsg = err.response?.data?.message;
      const errorArray = err.response?.data?.errors;
      const errorDetails = Array.isArray(errorArray)
        ? errorArray.map((e) => (typeof e === 'object' ? e.message : e)).filter(Boolean).join(', ')
        : null;

      setErrorMessage(
        errorDetails
          ? `${apiMsg || 'Validation failed'}: ${errorDetails}`
          : apiMsg || err.message || 'Failed to post accounting transaction.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeObj = TRANSACTION_TYPES.find((t) => t.id === txType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {step === 'FILL_FORM' && (
                <button
                  onClick={() => setStep('SELECT_TYPE')}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline mr-1 font-semibold"
                >
                  ← Change
                </button>
              )}
              <span>{step === 'SELECT_TYPE' ? 'What happened?' : selectedTypeObj?.label}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {step === 'SELECT_TYPE'
                ? 'Select the financial event you want to record'
                : selectedTypeObj?.meaning}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: TRANSACTION TYPE CHOOSER */}
        {step === 'SELECT_TYPE' && (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
            {TRANSACTION_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectType(t.id)}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left transition group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${t.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-brand-600 transition">
                      {t.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">{t.meaning}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 2: DYNAMIC FORM BASED ON TRANSACTION TYPE */}
        {step === 'FILL_FORM' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* DYNAMIC FIELD 1: Account Selectors */}
            {txType === 'EXPENSE' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Paid Via (Account) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {accounts
                      .filter((a) => a.account_class === 'ASSET')
                      .map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} ({a.institution_name || a.account_type}) — Balance: ₹{formatAccBalance(a)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Expense Category (Optional)
                  </label>
                  <select
                    value={expenseAccountId}
                    onChange={(e) => setExpenseAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Auto-Detect Category (Smart Keyword Matching)</option>
                    {accounts
                      .filter((a) => a.account_class === 'EXPENSE')
                      .map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {txType === 'INCOME' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Received In (Account) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {accounts
                    .filter((a) => a.account_class === 'ASSET')
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({a.institution_name || a.account_type}) — Balance: ₹{formatAccBalance(a)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {txType === 'TRANSFER' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    From Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} (₹{formatAccBalance(a)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    To Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} (₹{formatAccBalance(a)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {txType === 'INVESTMENT' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Paid From Account <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={fromAccountId}
                      onChange={(e) => setFromAccountId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {accounts
                        .filter((a) => a.account_class === 'ASSET')
                        .map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name} (₹{formatAccBalance(a)})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Investment Account <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={investmentAccountId}
                      onChange={(e) => setInvestmentAccountId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {accounts
                        .filter((a) => a.account_class === 'ASSET')
                        .map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name} ({a.account_type})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Investment Type
                  </label>
                  <select
                    value={investmentType}
                    onChange={(e) => setInvestmentType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {INVESTMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(txType === 'BORROW' || txType === 'REPAYMENT') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {txType === 'BORROW' ? 'Received In Account' : 'Paid From Account'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={txType === 'BORROW' ? toAccountId : fromAccountId}
                    onChange={(e) => (txType === 'BORROW' ? setToAccountId(e.target.value) : setFromAccountId(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {accounts
                      .filter((a) => a.account_class === 'ASSET')
                      .map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} (₹{formatAccBalance(a)})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Liability / Loan Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={liabilityAccountId}
                    onChange={(e) => setLiabilityAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {accounts
                      .filter((a) => a.account_class === 'LIABILITY')
                      .map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} ({a.account_type})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {(txType === 'LEND' || txType === 'RECEIVABLE_PAYMENT') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {txType === 'LEND' ? 'Paid From Account' : 'Received In Account'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={txType === 'LEND' ? fromAccountId : toAccountId}
                    onChange={(e) => (txType === 'LEND' ? setFromAccountId(e.target.value) : setToAccountId(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {accounts
                      .filter((a) => a.account_class === 'ASSET')
                      .map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} (₹{formatAccBalance(a)})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Receivable Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={receivableAccountId}
                    onChange={(e) => setReceivableAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {accounts
                      .filter((a) => a.account_type === 'RECEIVABLE' || a.account_class === 'ASSET')
                      .map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} ({a.account_type})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* Counterparty / Person Field */}
            {['BORROW', 'REPAYMENT', 'LEND', 'RECEIVABLE_PAYMENT'].includes(txType) ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {txType === 'BORROW'
                    ? 'Borrowed From (Person/Lender)'
                    : txType === 'REPAYMENT'
                    ? 'Repaying To (Person/Lender)'
                    : txType === 'LEND'
                    ? 'Lent To (Person)'
                    : 'Received From (Person)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul, Priya, Bank Loan"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {txType === 'EXPENSE' ? 'Paid To (Merchant/Person)' : 'Source / Counterparty'} (Optional)
                </label>
                <input
                  type="text"
                  placeholder={txType === 'EXPENSE' ? "e.g. McDonald's, Grocery Store" : "e.g. Hex India, Client"}
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            {/* Purpose / Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Reason / Purpose <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dinner, Salary, Personal Loan, Transfer for expenses"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Transaction Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Transaction Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Actual event date. Historical backdated entries sort chronologically without double-counting.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep('SELECT_TYPE')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Posting Entry...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Post Transaction</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
