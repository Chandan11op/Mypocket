import React, { useState, useEffect, useRef, useCallback } from 'react';
import { aiApi } from '../../services';
import {
  AIMessage,
  AIInput,
  AIChatLanding,
  AITypingIndicator,
  AIQuickActions,
  AIClearConfirmModal,
} from '../../components/ai';
import {
  Sparkles,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Shield,
  Bot,
} from 'lucide-react';

export function AIPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const chatContainerRef = useRef(null);
  const bottomMarkerRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = (behavior = 'smooth') => {
    bottomMarkerRef.current?.scrollIntoView({ behavior });
  };

  // Load chat history from backend on page load
  const loadChatHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    setErrorMessage('');
    try {
      const res = await aiApi.getHistory();
      if (res.data.success) {
        const historyList = res.data.data.history || [];
        setMessages(
          historyList.map((item) => ({
            id: item.id,
            role: item.role,
            message: item.message,
            created_at: item.created_at,
          }))
        );
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        setErrorMessage('Unable to load previous conversation history.');
      }
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    if (!isHistoryLoading) {
      scrollToBottom('auto');
    }
  }, [messages.length, isHistoryLoading]);

  // Send message handler
  const handleSendMessage = async (textToSend = null) => {
    const query = typeof textToSend === 'string' ? textToSend.trim() : inputMessage.trim();
    if (!query || isLoading) return;

    setErrorMessage('');
    setInputMessage('');

    // 1. Optimistically append user message to local state
    const userMsgObj = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      message: query,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setIsLoading(true);

    try {
      // 2. Query backend AI endpoint
      const res = await aiApi.sendMessage(query);

      if (res.data.success) {
        const aiReply = res.data.message || res.data.data?.reply;
        const aiMsgObj = {
          id: `local-ai-${Date.now()}`,
          role: 'assistant',
          message: aiReply,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsgObj]);
      }
    } catch (err) {
      let friendlyError = 'Something went wrong while consulting My Pocket AI. Please try again.';

      if (err.response) {
        const status = err.response.status;
        const code = err.response.data?.code;

        if (status === 429) {
          friendlyError = "You're sending questions a little too quickly. Please wait a moment before trying again.";
        } else if (status === 503 || code === 'AI_NOT_CONFIGURED') {
          friendlyError = 'My Pocket AI is currently not configured or undergoing maintenance. Please try again later.';
        } else if (status === 504) {
          friendlyError = 'The AI service timed out while processing your financial summary. Please try asking again.';
        } else if (err.response.data?.message) {
          friendlyError = err.response.data.message;
        }
      } else if (err.request) {
        friendlyError = 'Network connection failed. Please check your internet connection.';
      }

      setErrorMessage(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat history handler
  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      await aiApi.clearHistory();
      setMessages([]);
      setIsClearModalOpen(false);
      setErrorMessage('');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to clear conversation history. Please try again.'
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-61px)] md:h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Header Bar */}
      <header className="px-4 sm:px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shadow-xs">
            <img src="/logo.png" alt="My Pocket" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                My Pocket AI
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200/50 dark:border-emerald-900/50">
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Personal Financial & Accounting Advisor
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
              title="Clear conversation"
              aria-label="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Chat Scroll Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6"
      >
        {isHistoryLoading ? (
          <div className="h-full flex flex-col items-center justify-center min-h-[50vh] text-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
            <p className="text-xs font-semibold text-slate-400">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <AIChatLanding onSelectPrompt={(query) => handleSendMessage(query)} />
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, index) => (
              <AIMessage
                key={msg.id || `msg-${index}`}
                role={msg.role}
                message={msg.message}
                createdAt={msg.created_at}
              />
            ))}

            {/* Typing Indicator */}
            {isLoading && <AITypingIndicator />}

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 flex items-start gap-3 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-900 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            <div ref={bottomMarkerRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Sticky Bottom Input Area */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 shrink-0">
        <div className="max-w-4xl mx-auto space-y-2.5">
          {/* Quick suggestions if chat has messages */}
          {messages.length > 0 && !isLoading && (
            <AIQuickActions
              isCompact
              onSelectAction={(query) => handleSendMessage(query)}
            />
          )}

          <AIInput
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            onSendMessage={() => handleSendMessage()}
            isLoading={isLoading}
            maxLength={500}
          />
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <AIClearConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearHistory}
        isDeleting={isClearing}
      />
    </div>
  );
}

export default AIPage;
