import React from 'react';

export function AITypingIndicator() {
  return (
    <div className="flex items-start gap-3.5 max-w-2xl">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-sm">
        <img
          src="/logo.png"
          alt="My Pocket AI"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5 py-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1.5">
            My Pocket AI is thinking
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce"></span>
        </div>
      </div>
    </div>
  );
}

export default AITypingIndicator;
