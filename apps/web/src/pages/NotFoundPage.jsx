import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 mb-4">
        <Wallet className="w-7 h-7" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 dark:text-white">404</h1>
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
        Page not found
      </p>
      <p className="text-xs text-slate-400 max-w-xs mt-1 mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
