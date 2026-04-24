/**
 * Chat window with WebSocket support
 */

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendFileMessage } from '../api/chats';
import { useAuth } from '../hooks/useAuth';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import styles from './ChatWindow.module.css';

export const ChatWindow = ({ chatId, isMobile, onMenuOpen }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => getMessages(chatId),
    enabled: !!chatId,
  });
  const [socket, setSocket] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    if (!chatId) return;

    const token = sessionStorage.getItem('access_token') || localStorage.getItem('token');

    if (!token) {
      console.warn('No token available');
      return;
    }

    const defaultHost = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    const websocketBaseUrl = import.meta.env.VITE_WS_URL || defaultHost;

    const ws = new WebSocket(
      `${websocketBaseUrl.replace(/\/\/$/, '')}/ws/chats/${chatId}?token=${token}`
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
          queryClient.setQueryData(['messages', chatId], (old = []) => [...old, msg]);

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
      alert('Соединение еще не установлено. Подождите или перезагрузите страницу.');
      return;
    }

    if (text.length > 5000) {
      alert('Message is too long');
      return;
    }

    socket.send(
      JSON.stringify({
        content: text,
        reply_to: replyTo?.id || null,
      })
    );
    setReplyTo(null);
  };

  const handleSendFile = async (file, content, replyToId) => {
    try {
      await sendFileMessage(chatId, file, content, replyToId);
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } catch (error) {
      console.error('Failed to send file:', error);
      alert('Failed to send file. Please try again.');
      throw error;
    }
  };

  if (!chatId) {
    return (
      <div className={styles.empty}>
        {isMobile && (
          <button onClick={onMenuOpen} className={styles.menuButton}>
            ☰
          </button>
        )}
        <div className={styles.emptyTitle}>Select a chat</div>
        <div className={styles.emptyDescription}>
          Choose a conversation from the sidebar to start messaging.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.window}>
      <div className={styles.backdrop} />
      <MessageList messages={messages} onReply={setReplyTo} />
      <MessageInput
        onSend={handleSend}
        onSendFile={handleSendFile}
        disabled={!socket}
        isMobile={isMobile}
        onMenuOpen={onMenuOpen}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};
