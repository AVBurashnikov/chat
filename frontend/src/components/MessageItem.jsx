/**
 * Component for a single message in the chat
 */

import { useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

const STATUS_ICONS = {
  sent: '✓',
  delivered: '✓✓',
};

export const MessageItem = ({ message, onReply }) => {
  const { user } = useAuth();

  const mine = user && message.sender_id === user.id;
  const utcDate = new Date(
    message.created_at + (message.created_at.includes('Z') ? '' : 'Z')
  );
  const time = utcDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusInfo = mine
    ? message.read_at
      ? {
          icon: STATUS_ICONS.delivered,
          color: '#7dd3fc',
          title: 'Прочитано',
        }
      : message.delivered_at
        ? {
            icon: STATUS_ICONS.delivered,
            color: 'rgba(243,247,255,0.72)',
            title: 'Доставлено',
          }
        : {
            icon: STATUS_ICONS.sent,
            color: 'rgba(243,247,255,0.72)',
            title: 'Отправлено',
          }
    : null;

  const initial = (message.sender_username || '?')[0]?.toUpperCase();
  const touchStartX = useRef(0);

  const handleContextMenu = (e) => {
    e.preventDefault();
    onReply(message);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
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
        marginBottom: 24,
        alignItems: 'flex-end',
        gap: 10,
      }}
    >
      {!mine && (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--avatar-bg)',
            color: 'var(--text-primary)',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: 'var(--surface-glow)',
          }}
        >
          {initial}
        </div>
      )}

      <div
        style={{
          maxWidth: 'min(70%, 680px)',
          wordBreak: 'break-word',
          display: 'flex',
          flexDirection: 'column',
          alignItems: mine ? 'flex-end' : 'flex-start',
        }}
      >
        {/* {!mine && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-muted)',
              marginBottom: 5,
              paddingLeft: 4,
            }}
          >
            {message.sender_username}
          </div>
        )} */}

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 22,
            borderBottomRightRadius: mine ? 8 : 22,
            borderBottomLeftRadius: mine ? 22 : 8,
            background: mine ? 'var(--msg-own)' : 'var(--msg-other)',
            color: mine ? 'var(--msg-text-own)' : 'var(--msg-text-other)',
            fontSize: 14,
            lineHeight: 1.5,
            boxShadow: 'var(--shadow-card)',
            border: `1px solid ${
              mine ? 'rgba(255,255,255,0.08)' : 'var(--border)'
            }`,
            overflow: 'hidden',
          }}
        >
          {message.reply_to_message && (
            <div
              style={{
                borderLeft: `3px solid ${
                  mine ? 'rgba(255,255,255,0.55)' : 'var(--accent-strong)'
                }`,
                paddingLeft: 10,
                marginBottom: 10,
                fontSize: 12,
                borderRadius: 2,
                color: mine
                  ? 'rgba(255,255,255,0.86)'
                  : 'var(--text-secondary)',
                background: mine
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(125,211,252,0.08)',
                paddingTop: 8,
                paddingBottom: 8,
                paddingRight: 8,
              }}
            >
              <strong style={{ display: 'block', marginBottom: 2 }}>
                {message.reply_to_message.sender_username}
              </strong>
              <div>
                {message.reply_to_message.content.length < 80
                  ? message.reply_to_message.content
                  : `${message.reply_to_message.content.substring(0, 80)}...`}
              </div>
            </div>
          )}

          {message.file_url && message.file_type?.startsWith('image/') && (
            <div style={{ marginBottom: message.content ? 10 : 0 }}>
              <img
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${message.file_url}`}
                alt={message.file_name}
                style={{
                  maxWidth: '100%',
                  maxHeight: 260,
                  display: 'block',
                  borderRadius: 16,
                  cursor: 'pointer',
                  boxShadow: '0 12px 24px rgba(2, 6, 23, 0.22)',
                }}
                onClick={() =>
                  window.open(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${message.file_url}`,
                    '_blank'
                  )
                }
              />
            </div>
          )}

          {message.file_url && !message.file_type?.startsWith('image/') && (
            <div style={{ marginBottom: message.content ? 10 : 0 }}>
              <a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${message.file_url}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: mine
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(125,211,252,0.08)',
                  borderRadius: 14,
                  textDecoration: 'none',
                  color: 'inherit',
                  fontSize: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ fontSize: 16 }}>📎</span>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700 }}>{message.file_name}</span>
                  {message.file_size && (
                    <span style={{ opacity: 0.75 }}>
                      {Math.round(message.file_size / 1024)} KB
                    </span>
                  )}
                </span>
              </a>
            </div>
          )}

          {message.content}
        </div>

        <div
          style={{
            marginTop: 6,
            paddingInline: 6,
            fontSize: 11,
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
                fontSize: 11,
                color: statusInfo.color,
                fontWeight: 700,
                letterSpacing: '0.03em',
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
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--avatar-own-bg)',
            color: '#f3f7ff',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: 'var(--surface-glow)',
          }}
        >
          {(user?.username || '?')[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
};
