/**
 * Component for a single message in the chat
 */

import { useAuth } from '../hooks/useAuth';

export const MessageItem = ({ message }) => {
  const { user } = useAuth();

  const mine = user && message.sender_id === user.id;
  const time = new Date(message.created_at).toLocaleTimeString([], {
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

  return (
    <div
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
            color: 'var(--text-primary)',
            fontSize: 14,
            boxShadow: 'var(--shadow-card)',
          }}
        >
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