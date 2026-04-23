/**
 * Component for displaying a list of messages grouped by date
 */

import { useEffect, useMemo, useRef } from 'react';
import { MessageItem } from './MessageItem';

export const MessageList = ({ messages, onReply }) => {
  const bottomRef = useRef(null);

  const formatDateLabel = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (msgDate.getTime() === today.getTime()) {
      return 'Сегодня';
    }

    if (msgDate.getTime() === yesterday.getTime()) {
      return 'Вчера';
    }

    const options = { day: 'numeric', month: 'short' };
    if (date.getFullYear() !== now.getFullYear()) {
      options.year = 'numeric';
    }

    return date.toLocaleDateString('ru-RU', options);
  };

  const groupedMessages = useMemo(
    () =>
      messages.reduce((groups, msg) => {
        const date = new Date(
          msg.created_at + (msg.created_at.includes('Z') ? '' : 'Z')
        );
        const dateKey = formatDateLabel(date);
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(msg);
        return groups;
      }, {}),
    [messages]
  );

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      style={{
        flex: 1,
        padding: '24px 24px 12px',
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1,
        background:
          'radial-gradient(circle at top, rgba(125,211,252,0.06), transparent 30%)',
      }}
    >
      {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
        <div key={dateLabel}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              margin: '8px 0 18px',
            }}
          >
            <div
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                color: 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--surface-glow)',
              }}
            >
              {dateLabel}
            </div>
          </div>
          {msgs.map((message) => (
            <MessageItem key={message.id} message={message} onReply={onReply} />
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
