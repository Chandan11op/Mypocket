import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Laptop, Globe, Palette, CheckCircle2, Calendar, Sparkles } from 'lucide-react';

export function SettingsPage() {
  const {
    theme,
    updateTheme,
    currency,
    updateCurrency,
    dateFormat,
    updateDateFormat,
    themeColor,
    updateThemeColor,
  } = useTheme();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Settings & Preferences
        </h1>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Customize your application theme, currency display, date formatting, and appearance
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-8">
        {/* Theme Preference */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Palette className="w-4 h-4 text-brand-600" />
            <span>Appearance Theme</span>
          </div>
          <p className="text-xs text-slate-400">
            Choose between light, dark, or automatic system appearance.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <button
              type="button"
              onClick={() => updateTheme('light')}
              className={`p-3.5 flex flex-col items-center gap-2 rounded-2xl border text-xs font-bold transition ${
                theme === 'light'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => updateTheme('dark')}
              className={`p-3.5 flex flex-col items-center gap-2 rounded-2xl border text-xs font-bold transition ${
                theme === 'dark'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => updateTheme('system')}
              className={`p-3.5 flex flex-col items-center gap-2 rounded-2xl border text-xs font-bold transition ${
                theme === 'system'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Laptop className="w-5 h-5" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* Currency Preference */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Globe className="w-4 h-4 text-brand-600" />
            <span>Display Currency</span>
          </div>
          <p className="text-xs text-slate-400">
            Set default currency symbol for balances, statements, and ledgers.
          </p>

          <div className="max-w-xs">
            <select
              value={currency}
              onChange={(e) => updateCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="INR">Indian Rupee (₹ INR)</option>
              <option value="USD">US Dollar ($ USD)</option>
              <option value="EUR">Euro (€ EUR)</option>
              <option value="GBP">British Pound (£ GBP)</option>
            </select>
          </div>
        </div>

        {/* Date Format Preference */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Date Format</span>
          </div>
          <p className="text-xs text-slate-400">
            Choose your preferred date display convention across statements.
          </p>

          <div className="max-w-xs">
            <select
              value={dateFormat}
              onChange={(e) => updateDateFormat(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 05/10/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-10-05)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/05/2026)</option>
            </select>
          </div>
        </div>

        {/* Theme Accent Color */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Brand Accent</span>
          </div>
          <p className="text-xs text-slate-400">
            Application accent styling theme.
          </p>

          <div className="flex items-center gap-3 pt-1">
            {[
              { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-600' },
              { id: 'blue', name: 'Blue', bg: 'bg-blue-600' },
              { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-600' },
              { id: 'violet', name: 'Violet', bg: 'bg-violet-600' },
            ].map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => updateThemeColor(col.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
                  themeColor === col.id
                    ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${col.bg}`}></span>
                <span>{col.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Backend Synchronization Confirmation */}
        <div className="p-4 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <p className="text-xs text-brand-800 dark:text-brand-300">
            Preferences are persistently synchronized with your My Pocket MongoDB account and will be available across both web and mobile clients.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
