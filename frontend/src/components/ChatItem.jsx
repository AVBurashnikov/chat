/**
 * Component for a single chat item in the chat list
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { markChatRead } from '../api/chats';
import { ChatDropdown } from './ChatDropdown';

export const ChatItem = ({ chat, selectedId, onSelect, openMenuChatId, setOpenMenuChatId }) => {
  const queryClient = useQueryClient();

  const handleSelect = () => {
    setOpenMenuChatId(null);
    onSelect(chat.id);
    markChatRead(chat.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    });
  };

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    setOpenMenuChatId(openMenuChatId === chat.id ? null : chat.id);
  };

  const lastMessageTime = chat.last_message_time
    ? new Date(chat.last_message_time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const lastMessagePreview = chat.last_message_text
    ? `${chat.last_message_sender ? `${chat.last_message_sender}: ` : ''}${chat.last_message_text}`
    : 'No messages yet';

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
      }}
    >
      <button
        onClick={handleSelect}
        style={{
          flex: 1,
          textAlign: 'left',
          padding: '10px 10px',
          borderRadius: 10,
          border: 'none',
          cursor: 'pointer',
          background:
            chat.id === selectedId
              ? 'var(--gradient-selected)'
              : 'transparent',
          color: chat.id === selectedId ? 'var(--text-primary)' : 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: chat.other_online ? 'var(--online-dot)' : 'var(--offline-dot)',
              }}
            />
            <span style={{ fontWeight: 600, color: chat.id === selectedId ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {chat.title || `Chat #${chat.id}`}
            </span>
            {chat.muted && (
              <div>
                <span style={{
                  marginLeft: 6,
                  padding: '2px 6px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  color: 'var(--text-tertiary)',
                  fontSize: 10,
                }}>
                  Muted
                </span>
              </div>
            )}
          </div>
          {chat.unread_count > 0 && (
            <div>
              <span
                style={{
                  flexShrink: 0,
                  padding: '0 6px',
                  borderRadius: 999,
                  background: 'var(--unread-bg)',
                  color: 'var(--unread-text)',
                  fontSize: 10,
                }}
              >
                {chat.unread_count}
              </span>
            </div>
          )}

          <button
            onClick={handleToggleMenu}
            title="Chat actions"
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: '1px solid var(--text-primary)',
              cursor: 'pointer',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ⋮
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              flex: 1,
              fontSize: 12,
              color: 'var(--text-tertiary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {lastMessagePreview.substring(0, 20) + '...'}
          </div>

          {lastMessageTime && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {lastMessageTime}
            </span>
          )}
        </div>
      </button>

      {openMenuChatId === chat.id && (
        <ChatDropdown
          chatId={chat.id}
          muted={chat.muted}
          onClose={() => setOpenMenuChatId(null)}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      )}
    </div>
  );
};