import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services';
import { Wallet, Phone, Mail, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [devToken, setDevToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await authApi.forgotPassword(identifier);
      if (res.data.success) {
        setIsSent(true);
        if (res.data.dev_reset_token) {
          setDevToken(res.data.dev_reset_token);
        }
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to request password reset. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10">
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/logo.png"
            alt="My Pocket Logo"
            className="w-16 h-16 rounded-2xl object-contain shadow-lg shadow-brand-500/20 mb-3"
          />
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Reset Password
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Enter your mobile number or email to receive a password reset token
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 text-xs font-medium text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900">
            {errorMessage}
          </div>
        )}

        {isSent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              If an account exists for <span className="font-bold">{identifier}</span>, a secure
              reset token has been issued.
            </p>

            {devToken && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl text-left">
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                  🛠️ Dev Mode Reset Token:
                </p>
                <p className="text-[10px] font-mono text-slate-700 dark:text-slate-300 break-all mt-1">
                  {devToken}
                </p>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  className="inline-block mt-2 text-xs font-bold text-brand-600 hover:underline"
                >
                  Proceed to Reset Form →
                </Link>
              </div>
            )}

            <div className="pt-4">
              <Link
                to="/login"
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Mobile Number or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="+919876543210 or you@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-md shadow-brand-600/25 disabled:opacity-50 transition duration-150"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Request Reset Token</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-4">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Remembered your password? Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
