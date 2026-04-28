/**
 * Chat window with WebSocket support
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteMessage,
  getMessages,
  sendFileMessage,
  updateMessage,
} from '../api/chats';
import { useAuth } from '../hooks/useAuth';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import styles from './ChatWindow.module.css';

const DELETED_MESSAGE_TEXT = 'Сообщение удалено';

export const ChatWindow = ({ chatId, isMobile, onMenuOpen }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => getMessages(chatId),
    enabled: !!chatId,
    select: (items) =>
      items.map((item) => ({
        ...item,
        rawContent: item.is_deleted ? '' : item.content,
      })),
  });
  const [socket, setSocket] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const replyToRef = useRef(null);
  const editingMessageRef = useRef(null);

  useEffect(() => {
    replyToRef.current = replyTo;
  }, [replyTo]);

  useEffect(() => {
    editingMessageRef.current = editingMessage;
  }, [editingMessage]);

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
          queryClient.setQueryData(['messages', chatId], (old = []) => [
            ...old,
            { ...msg, rawContent: msg.content },
          ]);

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
        } else if (msg.type === 'message_updated') {
          if (editingMessageRef.current?.id === msg.id) {
            setEditingMessage(null);
          }
          queryClient.setQueryData(['messages', chatId], (old = []) =>
            old.map((item) =>
              item.id === msg.id
                ? { ...item, ...msg, rawContent: msg.is_deleted ? '' : msg.content }
                : item
            )
          );
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        } else if (msg.type === 'message_deleted') {
          if (editingMessageRef.current?.id === msg.message_id) {
            setEditingMessage(null);
          }
          if (
            replyToRef.current?.id === msg.message_id &&
            (msg.delete_for_everyone || msg.user_id === user?.id)
          ) {
            setReplyTo(null);
          }
          queryClient.setQueryData(['messages', chatId], (old = []) => {
            if (!msg.delete_for_everyone) {
              if (msg.user_id !== user?.id) {
                return old;
              }

              return old.filter((item) => item.id !== msg.message_id);
            }

            return old.map((item) =>
              item.id === msg.message_id
                ? {
                    ...item,
                    content: DELETED_MESSAGE_TEXT,
                    rawContent: '',
                    file_url: null,
                    file_name: null,
                    file_type: null,
                    file_size: null,
                    edited_at: null,
                    deleted_at: new Date().toISOString(),
                    is_deleted: true,
                    is_edited: false,
                    reply_to_message: null,
                  }
                : item
            );
          });
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

  useEffect(() => {
    setReplyTo(null);
    setEditingMessage(null);
  }, [chatId]);

  const handleSend = (text) => {
    if (editingMessage) {
      updateMessage(chatId, editingMessage.id, text)
        .then((updated) => {
          queryClient.setQueryData(['messages', chatId], (old = []) =>
            old.map((item) => (item.id === updated.id ? { ...item, ...updated, rawContent: text } : item))
          );
          queryClient.invalidateQueries({ queryKey: ['chats'] });
          setEditingMessage(null);
        })
        .catch((error) => {
          console.error('Failed to update message:', error);
          alert(error?.response?.data?.detail || 'Failed to update message.');
        });
      return;
    }

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

  const handleStartEdit = (message) => {
    setReplyTo(null);
    setEditingMessage({
      ...message,
      rawContent: message.rawContent ?? message.content,
    });
  };

  const handleDeleteMessage = async (message, deleteForEveryone) => {
    try {
      await deleteMessage(chatId, message.id, deleteForEveryone);
      if (!deleteForEveryone) {
        queryClient.setQueryData(['messages', chatId], (old = []) =>
          old.filter((item) => item.id !== message.id)
        );
      }
      if (editingMessage?.id === message.id) {
        setEditingMessage(null);
      }
      if (replyTo?.id === message.id) {
        setReplyTo(null);
      }
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert(error?.response?.data?.detail || 'Failed to delete message.');
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
      <MessageList
        messages={messages}
        onReply={setReplyTo}
        onEdit={handleStartEdit}
        onDelete={handleDeleteMessage}
      />
      <MessageInput
        onSend={handleSend}
        onSendFile={handleSendFile}
        disabled={!socket}
        isMobile={isMobile}
        onMenuOpen={onMenuOpen}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
};
