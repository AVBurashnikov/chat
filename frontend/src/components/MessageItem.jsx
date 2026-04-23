/**
 * Component for a single message in the chat
 */

import { useRef, useState } from 'react';

import styles from './MessageItem.module.css';

import { useAuth } from '../hooks/useAuth';
import { MessageDropdown } from './MessageDropdown';

const STATUS_ICONS = {
  sent: '✓',
  delivered: '✓✓',
};

export const MessageItem = ({ message, onReply }) => {
  const { user } = useAuth();
  const timerRef = useRef(null);

  const [isMessageDropdownOpen, setMessageDropdownOpen] = useState(false);

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
    // onReply(message);
    setMessageDropdownOpen(true);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    timerRef.current = setTimeout(() => {
      setMessageDropdownOpen(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    console.log(diff);

    if (diff > 50) {
      onReply(message);
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const replyClass = `${styles.reply} ${
    mine ? styles.replyMine : styles.replyOther
  }`;

  return (
    <div
      className={`
        ${styles.wrapper}
        ${mine ? styles.mine : styles.other}
        ${isMessageDropdownOpen ? styles.wrapperOpen : styles.wrapperClosed}
      `}
    >
      {!mine && (
        <div className={`${styles.avatar} ${styles.avatarOther}`}>
          {initial}
        </div>
      )}
      <div
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`
          ${styles.content}
          ${mine ? styles.alignEnd : styles.alignStart}
        `}
      >
        <div
          className={`
            ${styles.bubble}
            ${mine ? styles.bubbleMine : styles.bubbleOther}
          `}
        >
          {message.reply_to_message && (
            <div className={replyClass}>
              <strong className={styles.replyAuthor}>
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
            <div className={styles.imageWrapper}>
              <img
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${message.file_url}`}
                alt={message.file_name}
                className={styles.image}
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
                className={`
                  ${styles.file}
                  ${mine ? styles.fileMine : styles.fileOther}
                `}
              >
                <span style={{ fontSize: 16 }}>📎</span>
                <span className={styles.fileMeta}>
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

        <div className={styles.footer}>
          <span>{time}</span>
          {mine && statusInfo && (
            <span
              className={styles.status}
              style={{ color: statusInfo.color }}
            >
              {statusInfo.icon}
            </span>
          )}
        </div>
        {isMessageDropdownOpen && (
          <MessageDropdown 
            message={message}
            onReply={onReply}
            isMine={mine} 
            isOpen={isMessageDropdownOpen}
            setOpen={setMessageDropdownOpen}
          />
        )}
      </div>

      {mine && (
        <div className={`${styles.avatar} ${styles.avatarMine}`}>
          {(user?.username || '?')[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
};
