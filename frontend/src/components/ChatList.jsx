/**
 * Chat list with React Query and security improvements
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChats } from '../api/chats';
import { ChatForm } from './ChatForm';
import { ChatItem } from './ChatItem';

export const ChatList = ({ selectedId, onSelect, isMobile, isOpen, onClose }) => {
  const [openMenuChatId, setOpenMenuChatId] = useState(null);

  const { data: chats = [] } = useQuery({
    queryKey: ['chats'],
    queryFn: getChats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <div
      style={{
        width: 280,
        boxSizing: 'border-box',
        borderRight: isMobile ? 'none' : '1px solid var(--border-strong)',
        background: 'var(--gradient-header)',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        position: isMobile ? 'fixed' : 'static',
        top: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        height: isMobile ? '100vh' : 'auto',
        zIndex: isMobile ? 1000 : 'auto',
        transform: isMobile ? `translateX(${isOpen ? 0 : -100}%)` : 'none',
        transition: isMobile ? 'transform 0.3s ease' : 'none',
        pointerEvents: isMobile && !isOpen ? 'none' : 'auto',
      }}
    >
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Chats</div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}
      {!isMobile && (
        <div style={{ padding: '4px 8px', fontSize: 13, color: 'var(--text-secondary)' }}>
          Chats
        </div>
      )}

      {/* Create chat form */}
      <ChatForm onChatCreated={onSelect} />

      {/* Chat list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
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