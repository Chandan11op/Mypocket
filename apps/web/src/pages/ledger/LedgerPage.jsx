import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ledgerApi } from '../../services';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/formatters';
import {
  Users,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Loader2,
  Wallet,
} from 'lucide-react';

export function LedgerPage() {
  const { refreshTrigger } = useOutletContext();
  const { currency } = useTheme();

  const [ledger, setLedger] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchLedger = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await ledgerApi.getLedger();
      if (res.data.success) {
        setLedger(res.data.data.ledger || []);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to load counterparty ledger. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger, refreshTrigger]);

  const filteredLedger = ledger.filter((entry) =>
    entry.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Counterparty Ledger
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Total received, paid, and net balance breakdown per person
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search person name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Ledger Grid / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-400">Calculating person accounts...</p>
          </div>
        ) : filteredLedger.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">
              People you transact with will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLedger.map((person) => (
              <Link
                key={person.person_id}
                to={`/ledger/${person.person_id}`}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-950/60 dark:group-hover:text-brand-400 transition">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                      {person.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {person.transaction_count} transaction
                      {person.transaction_count === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div className="hidden sm:block">
                    <p className="text-xs text-slate-400">Received / Paid</p>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      +{formatCurrency(person.total_received, currency)} / -
                      {formatCurrency(person.total_paid, currency)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Net Balance</p>
                    <p
                      className={`text-sm font-black ${
                        person.net_balance >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {person.net_balance >= 0 ? '+' : ''}
                      {formatCurrency(person.net_balance, currency)}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
