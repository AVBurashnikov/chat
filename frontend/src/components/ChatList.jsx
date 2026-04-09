/**
 * Chat list with React Query and security improvements
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createChat, deleteChat, getChats, markChatRead, toggleChatMute, archiveChat } from '../api/chats';

export const ChatList = ({ selectedId, onSelect, isMobile, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [participantUsername, setParticipantUsername] = useState('');
  const [formError, setFormError] = useState('');
  const [openMenuChatId, setOpenMenuChatId] = useState(null);

  const { data: chats = [] } = useQuery({
    queryKey: ['chats'],
    queryFn: getChats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const createChatMutation = useMutation({
    mutationFn: ({ usernameValue }) => createChat(usernameValue),
    onSuccess: (createdChat) => {
      setParticipantUsername('');
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      onSelect(createdChat.id);
    },
    onError: (error) => {
      const backendMessage = error?.response?.data?.detail;
      setFormError(backendMessage || 'Failed to create chat');
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: (chatId) => deleteChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  const handleCreateChat = (e) => {
    e.preventDefault();
    setFormError('');

    // Validate input
    if (!participantUsername.trim()) {
      setFormError('Enter a username');
      return;
    }

    if (participantUsername.length < 3 || participantUsername.length > 50) {
      setFormError('Username must be 3-50 characters');
      return;
    }

    createChatMutation.mutate({
      usernameValue: participantUsername.trim(),
    });
  };

  const handleSelect = (chatId) => {
    setOpenMenuChatId(null);
    onSelect(chatId);
    markChatRead(chatId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    });
  };

  const handleToggleMenu = (e, chatId) => {
    e.stopPropagation();
    setOpenMenuChatId(openMenuChatId === chatId ? null : chatId);
  };

  const handleMute = (e, chatId) => {
    e.stopPropagation();
    setOpenMenuChatId(null);

    toggleChatMute(chatId)
      .then(() => queryClient.invalidateQueries({ queryKey: ['chats'] }))
      .catch((error) => console.error('Toggle mute error:', error));
  };

  const handleArchive = (e, chatId) => {
    e.stopPropagation();
    setOpenMenuChatId(null);

    archiveChat(chatId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        if (chatId === selectedId) {
          onSelect(null);
        }
      })
      .catch((error) => console.error('Archive chat error:', error));
  };

  const handleDelete = (e, chatId) => {
    e.stopPropagation();
    setOpenMenuChatId(null);

    if (!confirm('Delete this chat?')) {
      return;
    }

    deleteChatMutation.mutate(chatId);
    if (chatId === selectedId) {
      onSelect(null);
    }
  };

  return (
    <div
      style={{
        width: 280,
        boxSizing: 'border-box',
        borderRight: isMobile ? 'none' : '1px solid var(--border-strong)',
        background: 'var(--gradient-header)',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        position: isMobile ? 'fixed' : 'static',
        top: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        height: isMobile ? '100vh' : 'auto',
        zIndex: isMobile ? 1000 : 'auto',
        transform: isMobile ? `translateX(${isOpen ? 0 : -100}%)` : 'none',
        transition: isMobile ? 'transform 0.3s ease' : 'none',
        pointerEvents: isMobile && !isOpen ? 'none' : 'auto',
      }}
    >
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Chats</div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}
      {!isMobile && (
        <div style={{ padding: '4px 8px', fontSize: 13, color: 'var(--text-secondary)' }}>
          Chats
        </div>
      )}

      {/* Create chat form */}
      <form
        onSubmit={handleCreateChat}
        style={{
          padding: 8,
          borderBottom: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <input
            type="text"
            value={participantUsername}
            onChange={(e) => setParticipantUsername(e.target.value)}
            placeholder="username"
            style={{
              flex: 1,
              boxSizing: 'border-box',
              padding: '6px 9px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: 12,
            }}
            disabled={createChatMutation.isPending}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={createChatMutation.isPending || !participantUsername.trim()}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--accent-bg)',
              color: 'var(--accent)',
              fontWeight: 700,
              fontSize: 16,
              lineHeight: '16px',
              cursor: createChatMutation.isPending ? 'wait' : 'pointer',
              opacity: createChatMutation.isPending ? 0.7 : 1,
            }}
          >
            {createChatMutation.isPending ? '…' : '+'}
          </button>
        </div>
        {formError && (
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--danger)' }}>
            {formError}
          </div>
        )}
      </form>

      {/* Chat list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {chats.map((chat) => {
          const lastMessageTime = chat.last_message_time
            ? new Date(chat.last_message_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : null;

          const lastMessagePreview = chat.last_message_text
            ? `${chat.last_message_sender ? `${chat.last_message_sender}: ` : ''}${chat.last_message_text}`
            : 'No messages yet';

          const muteButtonLabel = chat.muted ? 'Unmute chat' : 'Mute chat';

          return (
            <div
              key={chat.id}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: 4,
              }}
            >
              <button
                onClick={() => handleSelect(chat.id)}
                style={{
                  flex: 1,
                  textAlign: 'left',
                  padding: '10px 10px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    chat.id === selectedId
                      ? 'var(--gradient-selected)'
                      : 'transparent',
                  color: chat.id === selectedId ? 'var(--text-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: chat.other_online ? 'var(--online-dot)' : 'var(--offline-dot)',
                      }}
                    />
                    <span style={{ fontWeight: 600, color: chat.id === selectedId ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {chat.title || `Chat #${chat.id}`}
                    </span>
                    {chat.muted && (
                      <div>
                        <span style={{
                          marginLeft: 6,
                          padding: '2px 6px',
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.08)',
                          color: 'var(--text-tertiary)',
                          fontSize: 10,
                        }}>
                          Muted
                        </span>
                      </div>
                    )}                 
                  </div>
                  {chat.unread_count > 0 && (
                      <div>
                        <span
                          style={{
                            flexShrink: 0,
                            padding: '0 6px',
                            borderRadius: 999,
                            background: 'var(--unread-bg)',
                            color: 'var(--unread-text)',
                            fontSize: 10,
                          }}
                        >
                          {chat.unread_count}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={(e) => handleToggleMenu(e, chat.id)}
                      title="Chat actions"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        border: '1px solid var(--text-primary)',
                        cursor: 'pointer',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ⋮
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  
                  <div
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: 'var(--text-tertiary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {lastMessagePreview}
                  </div>

                  
                  {lastMessageTime && (
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {lastMessageTime}
                    </span>
                  )}

                </div>
              </button>

            {openMenuChatId === chat.id && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  minWidth: 160,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: '0 10px 28px rgba(0,0,0,0.08)',
                  zIndex: 100,
                }}
              >
                <button
                  onClick={(e) => handleMute(e, chat.id)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    borderRadius: 12,
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {muteButtonLabel}
                </button>
                <button
                  onClick={(e) => handleArchive(e, chat.id)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    borderRadius: 12,
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Archive chat
                </button>
                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    borderRadius: 12,
                    background: 'transparent',
                    color: 'var(--text-danger)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Delete chat
                </button>
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
};