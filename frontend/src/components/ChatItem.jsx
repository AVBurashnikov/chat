/**
 * Component for a single chat item in the chat list
 */

import { useQueryClient } from '@tanstack/react-query';
import { markChatRead } from '../api/chats';
import { ChatDropdown } from './ChatDropdown';

export const ChatItem = ({
  chat,
  selectedId,
  onSelect,
  openMenuChatId,
  setOpenMenuChatId,
}) => {
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

  const truncatedPreview =
    lastMessagePreview.length > 40
      ? `${lastMessagePreview.substring(0, 40)}...`
      : lastMessagePreview;

  const isSelected = chat.id === selectedId;
  const isMenuOpen = openMenuChatId === chat.id;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        borderRadius: 18,
        background: isSelected ? 'var(--gradient-selected)' : 'transparent',
        border: `1px solid ${
          isSelected ? 'rgba(125,211,252,0.18)' : 'var(--border)'
        }`,
        boxShadow: isSelected ? 'var(--shadow-card)' : 'var(--surface-glow)',
        overflow: 'visible',
        zIndex: isMenuOpen ? 30 : 1,
      }}
    >
      <button
        type="button"
        onClick={handleSelect}
        style={{
          flex: 1,
          textAlign: 'left',
          padding: '14px',
          borderRadius: 18,
          border: 'none',
          cursor: 'pointer',
          background: 'transparent',
          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: chat.other_online
                  ? 'var(--online-dot)'
                  : 'var(--offline-dot)',
                boxShadow: chat.other_online
                  ? '0 0 16px rgba(34,197,94,0.45)'
                  : 'none',
              }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {chat.title || `Chat #${chat.id}`}
            </span>
            {chat.muted && (
              <span
                style={{
                  marginLeft: 6,
                  padding: '3px 7px',
                  borderRadius: 999,
                  background: isSelected
                    ? 'rgba(255,255,255,0.14)'
                    : 'var(--accent-bg)',
                  color: isSelected
                    ? 'rgba(255,255,255,0.86)'
                    : 'var(--text-secondary)',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                Muted
              </span>
            )}
          </div>

          {chat.unread_count > 0 && (
            <span
              style={{
                minWidth: 22,
                padding: '2px 7px',
                borderRadius: 999,
                background: 'var(--unread-bg)',
                color: 'var(--unread-text)',
                fontSize: 10,
                fontWeight: 800,
                textAlign: 'center',
              }}
            >
              {chat.unread_count}
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              fontSize: 12,
              lineHeight: 1.4,
              color: isSelected
                ? 'rgba(243,247,255,0.9)'
                : 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: isSelected ? 600 : 500,
            }}
          >
            {truncatedPreview}
          </div>

          {lastMessageTime && (
            <span
              style={{
                fontSize: 11,
                color: isSelected
                  ? 'rgba(243,247,255,0.72)'
                  : 'var(--text-muted)',
                fontWeight: 700,
              }}
            >
              {lastMessageTime}
            </span>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={handleToggleMenu}
        title="Chat actions"
        aria-label="Chat actions"
        style={{
          marginRight: 12,
          width: 34,
          height: 34,
          borderRadius: 999,
          border: '1px solid var(--border)',
          cursor: 'pointer',
          background: isSelected ? 'rgba(255,255,255,0.12)' : 'var(--bg-form)',
          color: isSelected
            ? 'rgba(255,255,255,0.92)'
            : 'var(--text-secondary)',
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--surface-glow)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        ⋮
      </button>

      {isMenuOpen && (
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
