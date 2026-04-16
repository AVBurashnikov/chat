/**
 * Component for a single message in the chat
 */

import { useAuth } from '../hooks/useAuth';
import { useRef } from 'react';

export const MessageItem = ({ message, onReply }) => {
  const { user } = useAuth();

  const mine = user && message.sender_id === user.id;
  // Ensure created_at is treated as UTC
  const utcDate = new Date(message.created_at + (message.created_at.includes('Z') ? '' : 'Z'));
  const time = utcDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const statusInfo = mine
    ? message.read_at
      ? { icon: '✓✓', color: '#0b93f6', title: 'Прочитано' }
      : message.delivered_at
        ? { icon: '✓✓', color: 'var(--text-muted)', title: 'Доставлено' }
        : { icon: '✓', color: 'var(--text-muted)', title: 'Отправлено' }
    : null;
  const initial = (message.sender_username || '?')[0]?.toUpperCase();

  const handleContextMenu = (e) => {
    e.preventDefault();
    onReply(message);
  };

  const touchStartX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      onReply(message);
    }
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
          wordBreak: 'break-word',
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
            color: mine ? 'var(--msg-text-own)' : 'var(--msg-text-other)',
            fontSize: 14,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {message.file_url && message.file_type?.startsWith('image/') && (
            <div style={{ marginBottom: 8 }}>
              <img
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${message.file_url}`}
                alt={message.file_name}
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${message.file_url}`, '_blank')}
              />
            </div>
          )}
          {message.file_url && !message.file_type?.startsWith('image/') && (
            <div style={{ marginBottom: 8 }}>
              <a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${message.file_url}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: 'inherit',
                  fontSize: 12,
                }}
              >
                📎 {message.file_name}
                {message.file_size && (
                  <span>({Math.round(message.file_size / 1024)}KB)</span>
                )}
              </a>
            </div>
          )}
          {message.reply_to_message && (
            <div
              style={{
                borderLeft: '3px solid rgba(0,0,0,0.2)',
                paddingLeft: 8,
                marginBottom: 6,
                fontSize: 12,
                opacity: 0.8
              }}
            >
              <strong>
                {message.reply_to_message.sender_username}
              </strong>
              <div>
                {message.reply_to_message.content}
              </div>
            </div>
          )}
          {message.content}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 10,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{time}</span>
          {mine && statusInfo && (
            <span
              title={statusInfo.title}
              style={{
                fontSize: 10,
                color: statusInfo.color,
                fontWeight: 600,
              }}
            >
              {statusInfo.icon}
            </span>
          )}
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
};