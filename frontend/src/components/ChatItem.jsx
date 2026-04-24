/**
 * Component for a single chat item in the chat list
 */

import { useQueryClient } from '@tanstack/react-query';
import { markChatRead } from '../api/chats';
import { ChatDropdown } from './ChatDropdown';
import styles from './ChatItem.module.css';

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
    lastMessagePreview.length > 20
      ? `${lastMessagePreview.substring(0, 20)}...`
      : lastMessagePreview;

  const isSelected = chat.id === selectedId;
  const isMenuOpen = openMenuChatId === chat.id;

  return (
    <div
      className={`
        ${styles.container}
        ${isSelected ? styles.selected : ''}
        ${isMenuOpen ? styles.open : ''}
      `}
    >
      <button
        type="button"
        onClick={handleSelect}
        className={`${styles.selectButton} ${isSelected ? styles.selectButtonSelected : ''}`}
      >
        <div className={styles.rowTop}>
          <div className={styles.titleBlock}>
            <span
              className={`${styles.onlineDot} ${chat.other_online ? styles.onlineDotActive : ''}`}
            />
            <span className={`${styles.title} ${isSelected ? styles.titleSelected : ''}`}>
              {chat.title || `Chat #${chat.id}`}
            </span>
            {chat.muted && (
              <span className={`${styles.muted} ${isSelected ? styles.mutedSelected : ''}`}>
                Muted
              </span>
            )}
          </div>

          {chat.unread_count > 0 && <span className={styles.unread}>{chat.unread_count}</span>}
        </div>

        <div className={styles.rowBottom}>
          <div className={`${styles.preview} ${isSelected ? styles.previewSelected : ''}`}>
            {truncatedPreview}
          </div>

          {lastMessageTime && <span className={styles.time}>{lastMessageTime}</span>}
        </div>
      </button>

      <button
        type="button"
        onClick={handleToggleMenu}
        title="Chat actions"
        aria-label="Chat actions"
        className={`${styles.menuButton} ${isSelected ? styles.menuButtonSelected : ''}`}
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
