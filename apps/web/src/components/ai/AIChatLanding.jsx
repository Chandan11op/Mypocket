import React from 'react';
import { Sparkles, Bot, ShieldCheck, TrendingUp, Wallet, ArrowRight } from 'lucide-react';
import { AIQuickActions } from './AIQuickActions';

export function AIChatLanding({ onSelectPrompt }) {
  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 flex flex-col items-center text-center space-y-8 animate-fade-in">
      {/* Brand Hero Visual */}
      <div className="relative">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 shadow-xl shadow-brand-500/10 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="My Pocket AI Assistant"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-brand-500 text-white shadow-md">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {/* Main Pitch */}
      <div className="space-y-2 max-w-lg">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-xs font-bold border border-brand-200/50 dark:border-brand-900/50">
          <Bot className="w-3.5 h-3.5" />
          <span>Intelligent Financial Companion</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          My Pocket AI
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
          Your personal financial assistant. Ask questions about your spending, monthly cash flows, counterparty ledgers, and budgeting strategies.
        </p>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Strict User Data Privacy</span>
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60">
          <Wallet className="w-3.5 h-3.5 text-brand-500" />
          <span>Real Ledger Grounded</span>
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60">
          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          <span>3-Month Trend Analytics</span>
        </span>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="w-full pt-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 text-left sm:text-center">
          Suggested Financial Inquiries
        </p>
        <AIQuickActions onSelectAction={onSelectPrompt} />
      </div>
    </div>
  );
}

export default AIChatLanding;
