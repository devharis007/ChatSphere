import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { ChatMessage } from '../types';
import type { ConnectionStatus } from '../hooks/useChatConnection';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';

interface ChatScreenProps {
  username: string;
  room: string;
  messages: ChatMessage[];
  users: string[];
  typingUsers: string[];
  status: ConnectionStatus;
  error: string | null;
  onSendMessage: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  onLeave: () => void;
}

export function ChatScreen({
  username,
  room,
  messages,
  users,
  typingUsers,
  status,
  error,
  onSendMessage,
  onTyping,
  onLeave,
}: ChatScreenProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const othersTyping = typingUsers.filter((u) => u !== username);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setDraft('');
    onTyping(false);
    inputRef.current?.focus();
  };

  const handleChange = (value: string) => {
    setDraft(value);
    onTyping(value.trim().length > 0);
  };

  return (
    <div className="chat-screen">
      <Sidebar room={room} username={username} users={users} status={status} onLeave={onLeave} />

      <div className="chat-main">
        {error && <div className="banner banner-error">{error}</div>}

        <MessageList messages={messages} currentUser={username} />

        <div className="typing-indicator">
          {othersTyping.length > 0 && (
            <span>
              {othersTyping.join(', ')} {othersTyping.length === 1 ? 'is' : 'are'} typing…
            </span>
          )}
        </div>

        <form className="message-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message…"
            value={draft}
            maxLength={1000}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => onTyping(false)}
            disabled={status !== 'connected'}
            autoFocus
          />
          <button type="submit" disabled={status !== 'connected' || !draft.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
