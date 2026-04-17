/**
 * Chat list with React Query and security improvements
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChats } from '../api/chats';
import { ChatForm } from './ChatForm';
import { ChatItem } from './ChatItem';

export const ChatList = ({
  selectedId,
  onSelect,
  isMobile,
  isOpen,
  onClose,
}) => {
  const [openMenuChatId, setOpenMenuChatId] = useState(null);

  const { data: chats = [] } = useQuery({
    queryKey: ['chats'],
    queryFn: getChats,
    refetchInterval: 30000,
  });

  return (
    <div
      style={{
        width: isMobile ? 'min(320px, 100vw)' : 320,
        boxSizing: 'border-box',
        borderRight: isMobile ? 'none' : '1px solid var(--border-strong)',
        background: 'linear-gradient(180deg, var(--gradient-header), transparent)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: isMobile ? 'fixed' : 'static',
        top: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        height: isMobile ? '100dvh' : 'auto',
        zIndex: isMobile ? 1000 : 'auto',
        transform: isMobile ? `translateX(${isOpen ? 0 : -100}%)` : 'none',
        transition: isMobile ? 'transform 0.3s ease' : 'none',
        pointerEvents: isMobile && !isOpen ? 'none' : 'auto',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        maxWidth: '100vw',
      }}
    >
      {isMobile && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div
            style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}
          >
            Chats
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-form)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              color: 'var(--text-primary)',
              fontSize: 18,
              cursor: 'pointer',
              width: 36,
              height: 36,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {!isMobile && (
        <div style={{ padding: '8px 10px 4px' }}>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Inbox
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginTop: 2,
            }}
          >
            Chats
          </div>
        </div>
      )}

      <ChatForm onChatCreated={onSelect} />

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
        {chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            selectedId={selectedId}
            onSelect={onSelect}
            openMenuChatId={openMenuChatId}
            setOpenMenuChatId={setOpenMenuChatId}
          />
        ))}
      </div>
    </div>
  );
};
