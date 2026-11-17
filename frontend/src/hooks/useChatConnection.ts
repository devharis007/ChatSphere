import { useCallback, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { HUB_URL } from '../config';
import type { ChatMessage } from '../types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface UseChatConnectionResult {
  status: ConnectionStatus;
  messages: ChatMessage[];
  users: string[];
  typingUsers: string[];
  error: string | null;
  joinRoom: (username: string, room: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
}

/**
 * Owns the SignalR connection lifecycle for the chat hub and exposes reactive state
 * (messages, connected users, typing indicators) plus imperative actions the UI can call.
 */
export function useChatConnection(): UseChatConnectionResult {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      connectionRef.current?.stop();
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const joinRoom = useCallback(async (username: string, room: string) => {
    setError(null);
    setMessages([]);
    setUsers([]);
    setTypingUsers([]);
    setStatus('connecting');

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('ReceiveMessage', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    connection.on('UpdateUserList', (userList: string[]) => {
      setUsers(userList);
    });

    connection.on('UserTyping', (user: string, isTyping: boolean) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(user) ? prev : [...prev, user];
        }
        return prev.filter((u) => u !== user);
      });
    });

    connection.on('Error', (message: string) => {
      setError(message);
    });

    connection.onreconnecting(() => setStatus('reconnecting'));
    connection.onreconnected(() => setStatus('connected'));
    connection.onclose(() => setStatus('disconnected'));

    try {
      await connection.start();
      await connection.invoke('JoinRoom', username, room);
      connectionRef.current = connection;
      setStatus('connected');
    } catch (err) {
      setStatus('disconnected');
      setError(err instanceof Error ? err.message : 'Failed to connect to chat server.');
      throw err;
    }
  }, []);

  const leaveRoom = useCallback(async () => {
    const connection = connectionRef.current;
    if (!connection) return;
    try {
      await connection.invoke('LeaveRoom');
    } catch {
      // Connection may already be closed; ignore.
    }
    await connection.stop();
    connectionRef.current = null;
    setStatus('disconnected');
    setMessages([]);
    setUsers([]);
    setTypingUsers([]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const connection = connectionRef.current;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;
    try {
      await connection.invoke('SendMessage', trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    }
  }, []);

  const setTyping = useCallback((isTyping: boolean) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;

    if (isTyping) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        connection.invoke('Typing', true).catch(() => undefined);
      }
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = window.setTimeout(() => {
        isTypingRef.current = false;
        connection.invoke('Typing', false).catch(() => undefined);
      }, 2000);
    } else {
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      connection.invoke('Typing', false).catch(() => undefined);
    }
  }, []);

  return { status, messages, users, typingUsers, error, joinRoom, leaveRoom, sendMessage, setTyping };
}
