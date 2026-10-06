import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountApi } from '../../services';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FinancialPositionSummary } from '../../components/accounts/FinancialPositionSummary';
import { AddAccountModal } from '../../components/accounts/AddAccountModal';
import { OnboardingFlow } from '../../components/accounts/OnboardingFlow';
import {
  Wallet,
  PlusCircle,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ChevronRight,
  Clock,
} from 'lucide-react';

export function AccountsPage() {
  const { currency } = useTheme();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await accountApi.getAccounts();
      if (res.data.success) {
        setAccounts(res.data.data.accounts || res.data.data || []);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Unable to fetch accounts. Please check your network connection.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts, refreshTrigger]);

  const handleAccountCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (isLoading && accounts.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
        <p className="text-xs font-semibold text-slate-400">Loading financial accounts...</p>
      </div>
    );
  }

  // If user has zero accounts, render first-time onboarding flow
  if (!isLoading && accounts.length === 0) {
    return <OnboardingFlow onComplete={fetchAccounts} />;
  }

  // Group accounts by Assets, Liabilities, and Receivables
  const assetAccounts = accounts.filter(
    (a) => a.account_class === 'ASSET' && a.account_type !== 'RECEIVABLE'
  );
  const receivableAccounts = accounts.filter(
    (a) => a.account_class === 'ASSET' && a.account_type === 'RECEIVABLE'
  );
  const liabilityAccounts = accounts.filter((a) => a.account_class === 'LIABILITY');

  const renderAccountGroup = (title, items, typeClass) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {title} ({items.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((acc) => {
            const isAsset = acc.account_class === 'ASSET';
            const isReceivable = acc.account_type === 'RECEIVABLE';

            return (
              <div
                key={acc._id}
                onClick={() => navigate(`/accounts/${acc._id}`)}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                          isReceivable
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            : isAsset
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isAsset ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 transition">
                          {acc.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          {acc.institution_name || acc.account_type}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        acc.is_active
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {acc.is_active ? 'Active' : 'Archived'}
                    </span>
                  </div>

                  {/* Calculated Balance */}
                  <div className="mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Calculated Balance
                    </span>
                    <p
                      className={`text-xl font-black tracking-tight ${
                        isAsset
                          ? 'text-slate-900 dark:text-white'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(acc.calculated_balance ?? acc.balance ?? 0, currency)}
                    </p>
                  </div>
                </div>

                {/* Footer Status & Date */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 mt-4">
                  <div className="flex items-center gap-1.5">
                    {acc.last_reconciled_at ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Reconciled {formatDate(acc.last_reconciled_at)}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Not Reconciled</span>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Financial Accounts
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Manage bank accounts, wallets, cash, investments, liabilities & receivables
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 flex items-center gap-3 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Financial Position Summary Widget */}
      <FinancialPositionSummary refreshTrigger={refreshTrigger} />

      {/* Account Groups */}
      <div className="space-y-8">
        {renderAccountGroup('Asset Accounts', assetAccounts, 'ASSET')}
        {renderAccountGroup('Receivable Accounts', receivableAccounts, 'RECEIVABLE')}
        {renderAccountGroup('Liability & Loan Accounts', liabilityAccounts, 'LIABILITY')}
      </div>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAccountCreated}
      />
    </div>
  );
}
