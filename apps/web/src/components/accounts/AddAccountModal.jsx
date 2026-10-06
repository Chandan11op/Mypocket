import React, { useState } from 'react';
import { accountApi } from '../../services';
import { X, Loader2, PlusCircle, AlertCircle } from 'lucide-react';

const ACCOUNT_TYPE_OPTIONS = [
  { label: 'Bank Account', value: 'BANK', class: 'ASSET' },
  { label: 'Physical Cash', value: 'CASH', class: 'ASSET' },
  { label: 'Digital Wallet', value: 'WALLET', class: 'ASSET' },
  { label: 'Investment Portfolio', value: 'INVESTMENT', class: 'ASSET' },
  { label: 'Receivable (Owed to Me)', value: 'RECEIVABLE', class: 'ASSET' },
  { label: 'Other Asset', value: 'OTHER_ASSET', class: 'ASSET' },
  { label: 'Credit Card', value: 'CREDIT_CARD', class: 'LIABILITY' },
  { label: 'Bank / Person Loan', value: 'LOAN', class: 'LIABILITY' },
  { label: 'Payable (I Owe)', value: 'PAYABLE', class: 'LIABILITY' },
  { label: 'Other Liability', value: 'OTHER_LIABILITY', class: 'LIABILITY' },
];

export function AddAccountModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'BANK',
    institution_name: '',
    description: '',
    currency: 'INR',
    opening_balance: '',
    opening_balance_date: new Date().toISOString().substring(0, 10),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const selectedOption = ACCOUNT_TYPE_OPTIONS.find((opt) => opt.value === formData.account_type);
  const accountClass = selectedOption ? selectedOption.class : 'ASSET';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Account name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        name: formData.name.trim(),
        account_class: accountClass,
        account_type: formData.account_type,
        institution_name: formData.institution_name.trim(),
        description: formData.description.trim(),
        currency: formData.currency,
        opening_balance: formData.opening_balance ? parseFloat(formData.opening_balance) : 0,
        opening_balance_date: formData.opening_balance_date ? new Date(formData.opening_balance_date).toISOString() : new Date().toISOString(),
      };

      const res = await accountApi.createAccount(payload);
      if (res.data.success) {
        setFormData({
          name: '',
          account_type: 'BANK',
          institution_name: '',
          description: '',
          currency: 'INR',
          opening_balance: '',
          opening_balance_date: new Date().toISOString().substring(0, 10),
        });
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to create financial account. Please check your entries.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Add Financial Account</h2>
            <p className="text-xs text-slate-400">Add a bank, wallet, cash, or credit account</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Account Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BOB Savings, Slice, Groww, Cash"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Account Type
              </label>
              <select
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.class})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Institution
              </label>
              <input
                type="text"
                placeholder="e.g. Bank of Baroda, SBI"
                value={formData.institution_name}
                onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Opening Balance (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                As-Of Date
              </label>
              <input
                type="date"
                required
                value={formData.opening_balance_date}
                onChange={(e) => setFormData({ ...formData, opening_balance_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 -mt-2">
            Opening balance establishes your starting financial position as of the chosen date.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Primary salary account"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Save Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
