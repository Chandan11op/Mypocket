import React from 'react';
import { SafeMarkdown } from './SafeMarkdown';
import { formatDate } from '../../utils/formatters';
import { User, Copy, Check } from 'lucide-react';

export function AIMessage({ message, role, createdAt, onCopy }) {
  const [copied, setCopied] = React.useState(false);

  const isUser = role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end group">
        <div className="max-w-[85%] sm:max-w-xl">
          <div className="bg-brand-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm shadow-brand-600/20">
            <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
              {message}
            </p>
          </div>
          {createdAt && (
            <p className="text-[10px] text-right font-medium text-slate-400 mt-1 px-1">
              {formatDate(createdAt, true)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Assistant / AI Message
  return (
    <div className="flex items-start gap-3 sm:gap-3.5 max-w-[95%] sm:max-w-3xl group">
      {/* AI Logo Avatar */}
      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
        <img
          src="/logo.png"
          alt="My Pocket AI"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl rounded-tl-sm px-4 sm:px-5 py-4 shadow-sm relative">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                My Pocket AI
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-[10px] font-bold">
                Assistant
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Copy answer"
              aria-label="Copy AI response"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <SafeMarkdown content={message} />
        </div>

        {createdAt && (
          <p className="text-[10px] font-medium text-slate-400 mt-1 px-1">
            {formatDate(createdAt, true)}
          </p>
        )}
      </div>
    </div>
  );
}

export default AIMessage;
