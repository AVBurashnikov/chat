/**
 * Component for displaying a list of messages grouped by date
 */

import { useMemo, useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';

export const MessageList = ({ messages, onReply }) => {
  const bottomRef = useRef(null);

  // Function to format date labels
  const formatDateLabel = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (msgDate.getTime() === today.getTime()) {
      return 'Сегодня';
    } else if (msgDate.getTime() === yesterday.getTime()) {
      return 'Вчера';
    } else {
      const options = { day: 'numeric', month: 'short' };
      if (date.getFullYear() !== now.getFullYear()) {
        options.year = 'numeric';
      }
      return date.toLocaleDateString('ru-RU', options);
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => messages.reduce((groups, msg) => {
    const date = new Date(msg.created_at + (msg.created_at.includes('Z') ? '' : 'Z'));
    const dateKey = formatDateLabel(date);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {}), [messages]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      style={{
        flex: 1,
        padding: 16,
        overflowY: 'auto',
      }}
    >
      {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
        <div key={dateLabel}>
          <div
            style={{
              textAlign: 'center',
              margin: '16px 0',
              color: 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {dateLabel}
          </div>
          {msgs.map((message) => (
            <MessageItem key={message.id} message={message} onReply={onReply}/>
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};