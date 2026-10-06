import React, { useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

export function AIInput({
  inputMessage,
  setInputMessage,
  onSendMessage,
  isLoading,
  maxLength = 500,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && inputMessage.trim()) {
        onSendMessage();
      }
    }
  };

  const remainingChars = maxLength - inputMessage.length;
  const isNearLimit = remainingChars <= 50;

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isLoading && inputMessage.trim()) {
            onSendMessage();
          }
        }}
        className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-900/5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition p-2 sm:p-2.5"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputMessage}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              setInputMessage(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask My Pocket AI about your spending, budget, or balances... (Enter to send)"
          disabled={isLoading}
          className="w-full resize-none bg-transparent px-2 sm:px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none disabled:opacity-50 min-h-[42px] max-h-[140px]"
          aria-label="Ask financial assistant question"
        />

        <div className="flex items-center justify-between pt-1 px-2 border-t border-slate-100 dark:border-slate-800/80 mt-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-semibold ${
                isNearLimit
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {inputMessage.length}/{maxLength}
            </span>
            <span className="hidden sm:inline-block text-[10px] text-slate-400 dark:text-slate-600">
              • Shift + Enter for new line
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-xs font-bold rounded-xl shadow-xs active:scale-95 transition disabled:active:scale-100 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default AIInput;
