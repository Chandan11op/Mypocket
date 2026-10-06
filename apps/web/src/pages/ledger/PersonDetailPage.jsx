import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ledgerApi } from '../../services';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  ArrowLeft,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  Tag,
} from 'lucide-react';

export function PersonDetailPage() {
  const { personId } = useParams();
  const { currency } = useTheme();

  const [ledgerDetail, setLedgerDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchPersonLedger = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await ledgerApi.getPersonLedger(personId);
      if (res.data.success) {
        setLedgerDetail(res.data.data);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to load individual person ledger.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    fetchPersonLedger();
  }, [fetchPersonLedger]);

  if (isLoading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
        <p className="text-xs font-semibold text-slate-400">Loading person account statement...</p>
      </div>
    );
  }

  if (errorMessage || !ledgerDetail) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <p className="text-sm font-bold text-rose-600">{errorMessage || 'Person account not found.'}</p>
        <Link
          to="/ledger"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ledger</span>
        </Link>
      </div>
    );
  }

  const { person, total_received, total_paid, net_balance, transactions } = ledgerDetail;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/ledger"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Persons</span>
        </Link>
      </div>

      {/* Person Header & KPI Cards */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xl">
            {person.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {person.name}
            </h1>
            <p className="text-xs text-slate-400">
              Account created on {formatDate(person.created_at)}
            </p>
          </div>
        </div>

        {/* 3 Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Received
            </span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatCurrency(total_received, currency)}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Paid
            </span>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
              -{formatCurrency(total_paid, currency)}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Net Balance
            </span>
            <p
              className={`text-xl font-black mt-1 ${
                net_balance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {net_balance >= 0 ? '+' : ''}
              {formatCurrency(net_balance, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Chronological Entries */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Chronological Transaction Entries
          </h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No transactions found for this person.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((entry) => (
              <div
                key={entry._id}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      entry.type === 'income'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    {entry.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {entry.purpose}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatDate(entry.date)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-xs font-black ${
                      entry.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {entry.type === 'income' ? '+' : '-'}
                    {formatCurrency(entry.amount, currency)}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400">
                    Net: {formatCurrency(entry.running_net, currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
