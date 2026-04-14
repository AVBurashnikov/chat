/**
 * Chat window with WebSocket support
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendFileMessage } from '../api/chats';
import { useAuth } from '../hooks/useAuth';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';

export const ChatWindow = ({ chatId, isMobile, onMenuOpen }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => getMessages(chatId),
    enabled: !!chatId,
  });
  const [socket, setSocket] = useState(null);

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
      ws.send(JSON.stringify({ type: 'read' }));
      queryClient.invalidateQueries({ queryKey: ['chats'] });
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
          if (msg.sender_id !== user?.id) {
            ws.send(JSON.stringify({ type: 'read' }));
          }
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        } else if (msg.type === 'message_status') {
          queryClient.setQueryData(['messages', chatId], (old = []) =>
            old.map((item) =>
              item.id === msg.id
                ? {
                    ...item,
                    delivered_at: msg.delivered_at,
                    read_at: msg.read_at,
                  }
                : item
            )
          );
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
  }, [chatId, queryClient, user]);

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

  const handleSendFile = async (file, content) => {
    try {
      await sendFileMessage(chatId, file, content);
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } catch (error) {
      console.error('Failed to send file:', error);
      alert('Failed to send file. Please try again.');
    }
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
        <MessageList messages={messages} />
        <MessageInput onSend={handleSend} onSendFile={handleSendFile} disabled={!socket} isMobile={isMobile} onMenuOpen={onMenuOpen}/>
      </div>
  );
};