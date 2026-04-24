/**
 * Chat list with React Query and security improvements
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChats } from '../api/chats';
import { ChatForm } from './ChatForm';
import { ChatItem } from './ChatItem';
import styles from './ChatList.module.css';

export const ChatList = ({
  selectedId,
  onSelect,
  isMobile,
  isOpen,
  onClose,
}) => {
  const [openMenuChatId, setOpenMenuChatId] = useState(null);

  const { data: chats = [] } = useQuery({
    queryKey: ['chats'],
    queryFn: getChats,
    refetchInterval: 30000,
  });

  return (
    <div
      className={`
        ${styles.container}
        ${isMobile ? styles.mobile : ''}
        ${isMobile && isOpen ? styles.mobileOpen : ''}
      `}
    >
      {isMobile && (
        <div className={styles.mobileHeader}>
          <div className={styles.mobileTitle}>Chats</div>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>
      )}

      {!isMobile && (
        <div className={styles.desktopHeader}>
          <div className={styles.inboxLabel}>Inbox</div>
          <div className={styles.title}>Chats</div>
        </div>
      )}

      <ChatForm onChatCreated={onSelect} />

      <div className={styles.chats}>
        {chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            selectedId={selectedId}
            onSelect={onSelect}
            openMenuChatId={openMenuChatId}
            setOpenMenuChatId={setOpenMenuChatId}
          />
        ))}
      </div>
    </div>
  );
};
