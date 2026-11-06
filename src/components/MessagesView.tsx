import React, { useState, useEffect, useRef } from 'react';

interface MessagesViewProps {
  isNightShiftMode: boolean;
  currentUser: any;
  onOpenSupport?: () => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  isNightShiftMode,
  currentUser,
  onOpenSupport,
}) => {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [statusNotice, setStatusNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch threads
  const fetchThreads = async () => {
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch('/api/messages/threads', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
        if (data.threads?.length > 0 && !activeThreadId) {
          setActiveThreadId(data.threads[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch active thread messages
  const fetchMessages = async (threadId: string) => {
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch(`/api/messages/threads/${threadId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setActiveThread(data.thread);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load thread messages:', err);
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeThreadId) {
      fetchMessages(activeThreadId);
    }
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeThreadId || isSending) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch(`/api/messages/threads/${activeThreadId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ body: newMessageText.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessageText('');
        fetchThreads();
      } else {
        const err = await res.json();
        setStatusNotice({ type: 'error', text: err.error || 'Failed to send message' });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setStatusNotice({ type: 'error', text: 'Network connection issue. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  // Block user
  const handleBlockUser = async () => {
    if (!activeThread?.otherUserId) return;
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch('/api/safety/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          blockedUserId: activeThread.otherUserId,
          reason: blockReason || 'User requested block',
        }),
      });

      if (res.ok) {
        setIsBlockModalOpen(false);
        setActiveThreadId(null);
        setActiveThread(null);
        fetchThreads();
        setStatusNotice({
          type: 'success',
          text: 'User has been blocked. You will no longer receive communications from them.',
        });
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      setStatusNotice({ type: 'error', text: 'Unable to block user. Please try again.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2559] dark:text-white">
          Messages
        </h1>
        <p className="text-xs text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] mt-1">
          Coordinate reservation details, check-in instructions, and hospital proximity with verified hosts and clinicians.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-[#0B1626] rounded-3xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm overflow-hidden flex flex-col md:flex-row h-[640px]">
        {/* Left Pane: Thread List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-gray-100 dark:border-[#233550] flex flex-col h-full bg-[#EFF6FB]/30 dark:bg-[#0E1A2E]/50">
          <div className="p-4 border-b border-gray-100 dark:border-[#233550] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0B2559] dark:text-white uppercase tracking-wider">
              Conversations ({threads.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-[#233550]">
            {threads.map((t) => {
              const isActive = t.id === activeThreadId;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={`w-full text-left p-4 transition-colors flex items-start gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-[#0B1626] border-l-4 border-l-[#0A6FA8]'
                      : 'hover:bg-white/60 dark:hover:bg-[#15253e]/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#EFF6FB] dark:bg-[#1E293B] text-[#0A6FA8] dark:text-[#3E9AD1] font-bold flex items-center justify-center shrink-0 text-sm">
                    {t.participantName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0B2559] dark:text-white truncate">
                        {t.participantName}
                      </span>
                      {t.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0A6FA8] text-white tabular-nums">
                          {t.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] truncate mt-0.5">
                      {t.listingTitle}
                    </p>
                    <p className="text-xs text-[rgba(11,37,89,0.85)] dark:text-gray-300 truncate mt-1">
                      {t.lastMessagePreview}
                    </p>
                  </div>
                </button>
              );
            })}

            {threads.length === 0 && !isLoading && (
              <div className="p-8 text-center text-xs text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0]">
                <span className="material-symbols-outlined text-3xl text-[rgba(11,37,89,0.3)] block mb-2">
                  chat_bubble_outline
                </span>
                No active conversations yet. Messages appear here once you request or confirm a stay.
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat */}
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0B1626]">
          {activeThread ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-100 dark:border-[#233550] flex items-center justify-between bg-white dark:bg-[#0B1626]">
                <div>
                  <h2 className="text-sm font-bold text-[#0B2559] dark:text-white">
                    {activeThread.otherUserName}
                  </h2>
                  <p className="text-[11px] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0]">
                    {activeThread.listingTitle}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBlockModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">block</span>
                    <span>Block User</span>
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#EFF6FB]/20 dark:bg-[#0E1A2E]/20">
                {messages.map((m) => {
                  const isMe = m.sender_id === currentUser.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs ${
                          isMe
                            ? 'bg-[#0A6FA8] text-white rounded-br-xs'
                            : 'bg-white dark:bg-[#1E293B] text-[#0B2559] dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-xs shadow-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                      </div>
                      <span className="text-[10px] text-[rgba(11,37,89,0.5)] dark:text-gray-400 mt-1 px-1 tabular-nums">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && m.is_read && ' · Read'}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Status Notice */}
              {statusNotice && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`mx-3 mb-2 px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                    statusNotice.type === 'error'
                      ? 'bg-[#F4E2DC] text-[#A8452E] border-[#A8452E]/30'
                      : 'bg-[#E1EFE9] text-[#2F6E5E] border-[#2F6E5E]/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">
                      {statusNotice.type === 'error' ? 'error' : 'check_circle'}
                    </span>
                    <span>{statusNotice.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatusNotice(null)}
                    aria-label="Dismiss notice"
                    className="p-1 hover:opacity-75 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              )}

              {/* Input Composer */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 dark:border-[#233550] flex items-center gap-2 bg-white dark:bg-[#0B1626]">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => {
                    setNewMessageText(e.target.value);
                    if (statusNotice?.type === 'error') setStatusNotice(null);
                  }}
                  placeholder="Type a message..."
                  aria-label="Write a message"
                  className="flex-1 h-10 px-4 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-[#EFF6FB]/60 dark:bg-[#0E1A2E] text-[#0B2559] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0A6FA8] focus:ring-offset-2"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim() || isSending}
                  className="h-10 px-4 rounded-full text-xs font-semibold bg-[#0A6FA8] text-white hover:bg-[#0C7EBF] disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0A6FA8] focus-visible:ring-offset-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isSending ? 'progress_activity' : 'send'}
                  </span>
                  <span>{isSending ? 'Sending...' : 'Send message'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0]">
              <span className="material-symbols-outlined text-4xl text-[rgba(11,37,89,0.2)] mb-2">
                forum
              </span>
              <p className="font-medium text-[#0B2559] dark:text-white">Select a conversation</p>
              <p className="mt-1">Choose a thread from the left to view messages</p>
            </div>
          )}
        </div>
      </div>

      {/* BLOCK USER MODAL */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0B1626] rounded-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-[#233550] shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[#0B2559] dark:text-white">
              Block {activeThread?.otherUserName}?
            </h3>
            <p className="text-xs text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] leading-relaxed">
              They will no longer be able to message you or request stays at your properties. This cannot be undone automatically.
            </p>
            <div>
              <label className="block text-xs font-medium text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0] mb-1">
                Reason (optional)
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. Unresponsive, harassment"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-[#0E1A2E] text-[#0B2559] dark:text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Keep conversation
              </button>
              <button
                type="button"
                onClick={handleBlockUser}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#A8452E] text-white hover:bg-[#913b27] transition-colors"
              >
                Block user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
