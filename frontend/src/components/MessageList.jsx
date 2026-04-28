/**
 * Component for displaying a list of messages grouped by date
 */

import { useEffect, useMemo, useRef } from 'react';
import { MessageItem } from './MessageItem';
import styles from './MessageList.module.css';

export const MessageList = ({ messages, onReply, onEdit, onDelete }) => {
  const bottomRef = useRef(null);

  const formatDateLabel = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

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
        const date = new Date(msg.created_at + (msg.created_at.includes('Z') ? '' : 'Z'));
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
    <div className={styles.container}>
      {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
        <div key={dateLabel}>
          <div className={styles.dateGroup}>
            <div className={styles.dateLabel}>{dateLabel}</div>
          </div>
          {msgs.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
