import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChatList } from '../components/ChatList';
import { ChatWindow } from '../components/ChatWindow';
import {
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from '../utils/browserNotifications';

export const ChatPage = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    requestBrowserNotificationPermission();
  }, []);

  useEffect(() => {
    const token =
      sessionStorage.getItem('access_token') ||
      localStorage.getItem('token');

    if (!token) {
      return undefined;
    }

    const defaultHost = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    const websocketBaseUrl = import.meta.env.VITE_WS_URL || defaultHost;
    const ws = new WebSocket(
      `${websocketBaseUrl.replace(/\/\/$/, '')}/ws/notifications?token=${token}`
    );

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (payload.type !== 'new_message') {
          return;
        }

        queryClient.invalidateQueries({ queryKey: ['chats'] });

        const shouldNotify =
          payload.chat_id !== selectedId || document.hidden;

        if (!shouldNotify) {
          return;
        }

        showBrowserNotification({
          title: payload.sender_username || `Chat #${payload.chat_id}`,
          body: payload.preview || 'You have a new message',
          tag: `chat-${payload.chat_id}-message-${payload.message_id}`,
          data: {
            chatId: payload.chat_id,
            messageId: payload.message_id,
          },
        });
      } catch (error) {
        console.error('Notifications socket parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Notifications WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [queryClient, selectedId]);

  const handleSelectChat = (chatId) => {
    setSelectedId(chatId);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {isMobile && isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
        />
      )}

      <ChatList
        selectedId={selectedId}
        onSelect={handleSelectChat}
        isMobile={isMobile}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <ChatWindow
        chatId={selectedId}
        isMobile={isMobile}
        onMenuOpen={() => setIsMobileMenuOpen(true)}
      />
    </>
  );
};
