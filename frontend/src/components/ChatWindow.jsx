/**
 * Chat window with WebSocket support
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMessages } from '../api/chats';
import { useAuth } from '../hooks/useAuth';
import { MessageInput } from './MessageInput';

export const ChatWindow = ({ chatId, isMobile, onMenuOpen }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => getMessages(chatId),
    enabled: !!chatId,
  });
  const [socket, setSocket] = useState(null);
  const bottomRef = useRef(null);

  // Function to format date labels
  const formatDateLabel = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (msgDate.getTime() === today.getTime()) {
      return 'Сегодня';
    } else if (msgDate.getTime() === yesterday.getTime()) {
      return 'Вчера';
    } else {
      const options = { day: 'numeric', month: 'short' };
      if (date.getFullYear() !== now.getFullYear()) {
        options.year = 'numeric';
      }
      return date.toLocaleDateString('ru-RU', options);
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => messages.reduce((groups, msg) => {
    const date = new Date(msg.created_at);
    const dateKey = formatDateLabel(date);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {}), [messages]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;

    // Get token from sessionStorage or localStorage
    const token =
      sessionStorage.getItem('access_token') ||
      localStorage.getItem('token');

    if (!token) {
      console.warn('No token available');
      return;
    }

    const defaultHost = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    const WEBSOCKET_BASE_URL =
      import.meta.env.VITE_WS_URL ||
      defaultHost;

    const ws = new WebSocket(
      `${WEBSOCKET_BASE_URL.replace(/\/\/$/, '')}/ws/chats/${chatId}?token=${token}`
    );

    ws.onopen = () => {
      console.log('WebSocket connected');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        } else if (msg.type === 'message') {
          queryClient.setQueryData(
            ['messages', chatId],
            (old = []) => [...old, msg]
          );
          // Invalidate chats to update unread counts
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setSocket(null);
    };

    return () => {
      ws.close();
      setSocket(null);
    };
  }, [chatId, queryClient]);

  const handleSend = (text) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert('Соединение не установлено. Пожалуйста, подождите или перезагрузите страницу.');
      return;
    }

    // Validate message length
    if (text.length > 5000) {
      alert('Message is too long');
      return;
    }

    socket.send(JSON.stringify({ content: text }));
  };

  if (!chatId) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-primary)',
          position: 'relative',
        }}
      >
        {isMobile && (
          <button
            onClick={onMenuOpen}
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              background: 'var(--bg-form)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: 48,
              height: 48,
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            ☰
          </button>
        )}
        Выберите чат слева
      </div>
    );
  }

  return (
      <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-primary)',
          }}
      >
        {/*  */}
        <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
            }}
        >
          {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
            <div key={dateLabel}>
              <div
                style={{
                  textAlign: 'center',
                  margin: '16px 0',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {dateLabel}
              </div>
              {msgs.map((m) => {
                const mine = user && m.sender_id === user.id;
                const time = new Date(m.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const initial = (m.sender_username || '?')[0]?.toUpperCase();

                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: mine ? 'flex-end' : 'flex-start',
                      marginBottom: 6,
                    }}
                  >
                    {!mine && (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--avatar-bg)',
                          color: 'var(--text-primary)',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 8,
                        }}
                      >
                        {initial}
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: '70%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: mine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: 16,
                          borderBottomRightRadius: mine ? 4 : 16,
                          borderBottomLeftRadius: mine ? 16 : 4,
                          background: mine ? 'var(--msg-own)' : 'var(--msg-other)',
                          color: 'var(--text-primary)',
                          fontSize: 14,
                          boxShadow: 'var(--shadow-card)',
                        }}
                      >
                        {m.content}
                      </div>
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 10,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {time}
                      </div>
                    </div>
                    {mine && (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--avatar-own-bg)',
                          color: '#e5e7eb',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: 8,
                        }}
                      >
                        {(user?.username || '?')[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>
        <MessageInput onSend={handleSend} disabled={!socket} isMobile={isMobile} onMenuOpen={onMenuOpen}/>
      </div>
  );
};