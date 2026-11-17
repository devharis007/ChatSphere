import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: string;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageList({ messages, currentUser }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <p className="no-messages">No messages yet — say hello!</p>
      )}
      {messages.map((message) => {
        if (message.isSystem) {
          return (
            <div key={message.id} className="system-message">
              {message.text}
            </div>
          );
        }

        const isOwn = message.user === currentUser;
        return (
          <div key={message.id} className={`message-row ${isOwn ? 'own' : ''}`}>
            <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
              {!isOwn && <div className="message-author">{message.user}</div>}
              <div className="message-text">{message.text}</div>
              <div className="message-time">{formatTime(message.timestamp)}</div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
