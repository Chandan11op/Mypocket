import React, { useState, useEffect } from 'react';
import { accountApi } from '../../services';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/formatters';
import {
  Wallet,
  Building2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export function FinancialPositionSummary({ refreshTrigger, positionData = null }) {
  const { currency } = useTheme();
  const [data, setData] = useState(positionData);
  const [isLoading, setIsLoading] = useState(!positionData);
  const [error, setError] = useState('');

  useEffect(() => {
    if (positionData) {
      setData(positionData);
      setIsLoading(false);
      return;
    }

    const fetchPosition = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await accountApi.getFinancialPosition();
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load financial position data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosition();
  }, [refreshTrigger, positionData]);

  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-center min-h-[140px]">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600 mr-2" />
        <span className="text-xs font-semibold text-slate-400">Loading financial position...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900 flex items-center gap-3 text-xs font-semibold">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const pos = data?.financial_position || {};
  const totalAssets = pos.total_assets ?? 0;
  const totalLiabilities = pos.total_liabilities ?? 0;
  const netWorth = pos.net_worth ?? 0;

  // Derive subcategory totals from accounts summary
  const accounts = data?.accounts || [];
  const cashTotal = accounts
    .filter((a) => ['BANK', 'CASH', 'WALLET', 'DIGITAL_WALLET'].includes(a.account_type))
    .reduce((sum, a) => sum + (a.calculated_balance ?? a.balance ?? 0), 0);
  const investmentTotal = accounts
    .filter((a) => a.account_type === 'INVESTMENT')
    .reduce((sum, a) => sum + (a.calculated_balance ?? a.balance ?? 0), 0);
  const receivableTotal = accounts
    .filter((a) => a.account_class === 'ASSET' && a.account_type === 'RECEIVABLE')
    .reduce((sum, a) => sum + (a.calculated_balance ?? a.balance ?? 0), 0);
  const payableTotal = accounts
    .filter((a) => a.account_class === 'LIABILITY')
    .reduce((sum, a) => sum + (a.calculated_balance ?? a.balance ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Top 3 Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Assets */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Assets
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalAssets, currency)}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              Bank, cash, investments & receivables
            </p>
          </div>
        </div>

        {/* Total Liabilities */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Liabilities
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              {formatCurrency(totalLiabilities, currency)}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              Credit cards, loans & external payables
            </p>
          </div>
        </div>

        {/* Net Worth */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Net Worth
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                netWorth >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(netWorth, currency)}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              Assets minus Liabilities (Verified)
            </p>
          </div>
        </div>
      </div>

      {/* Asset & Liability Breakdown Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
          <p className="text-[11px] font-medium text-slate-400">Cash & Bank</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            {formatCurrency(cashTotal, currency)}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
          <p className="text-[11px] font-medium text-slate-400">Investments</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            {formatCurrency(investmentTotal, currency)}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
          <p className="text-[11px] font-medium text-slate-400">Receivables</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {formatCurrency(receivableTotal, currency)}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
          <p className="text-[11px] font-medium text-slate-400">Payables</p>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            {formatCurrency(payableTotal, currency)}
          </p>
        </div>
      </div>
    </div>
  );
}
