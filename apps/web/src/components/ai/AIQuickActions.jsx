import React from 'react';
import {
  PieChart,
  Calendar,
  Scale,
  TrendingUp,
  HelpCircle,
  PiggyBank,
  ArrowRight,
} from 'lucide-react';

const DEFAULT_ACTIONS = [
  {
    icon: PieChart,
    label: 'Where am I spending the most?',
    query: 'Where am I spending the most money?',
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50',
  },
  {
    icon: Calendar,
    label: 'How much did I spend this month?',
    query: 'How much did I spend this month and what is my average daily expense?',
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
  },
  {
    icon: Scale,
    label: 'Compare this month with last month',
    query: 'Compare my spending and income for this month with the previous month.',
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
  },
  {
    icon: PiggyBank,
    label: 'How can I reduce my expenses?',
    query: 'Based on my spending habits, give me practical tips to reduce expenses.',
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
  },
  {
    icon: TrendingUp,
    label: 'Show my spending trends',
    query: 'Summarize my 3-month financial trend and cash flow direction.',
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50',
  },
];

export function AIQuickActions({ onSelectAction, isCompact = false }) {
  if (isCompact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DEFAULT_ACTIONS.slice(0, 4).map((action, idx) => (
          <button
            key={idx}
            onClick={() => onSelectAction(action.query)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-brand-500/50 transition shrink-0 shadow-2xs"
          >
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
      {DEFAULT_ACTIONS.map((action, idx) => {
        const Icon = action.icon;
        return (
          <button
            key={idx}
            onClick={() => onSelectAction(action.query)}
            className="flex items-start gap-3 p-3.5 sm:p-4 text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50 hover:shadow-md hover:shadow-brand-500/5 transition group"
          >
            <div className={`p-2 rounded-xl shrink-0 ${action.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {action.label}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                {action.query}
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
          </button>
        );
      })}
    </div>
  );
}

export default AIQuickActions;
