/**
 * Chat list with React Query and security improvements
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createChat, deleteChat, getChats, markChatRead } from '../api/chats';

export const ChatList = ({ selectedId, onSelect }) => {
  const queryClient = useQueryClient();
  const [participantUsername, setParticipantUsername] = useState('');
  const [formError, setFormError] = useState('');

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
    onSelect(chatId);
    markChatRead(chatId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    });
  };

  const handleDelete = (e, chatId) => {
    e.stopPropagation();

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
        borderRight: '1px solid rgba(30,64,175,0.6)',
        background: 'radial-gradient(circle at 0 0, #0f172a, #020617)',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ padding: '4px 8px', fontSize: 13, color: '#9ca3af' }}>
        Chats
      </div>

      {/* Create chat form */}
      <form
        onSubmit={handleCreateChat}
        style={{
          padding: 8,
          borderBottom: '1px solid rgba(30,64,175,0.4)',
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
              border: '1px solid rgba(148,163,184,0.35)',
              background: '#020617',
              color: '#e5e7eb',
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
              border: '1px solid rgba(148,163,184,0.35)',
              background: 'rgba(59,130,246,0.15)',
              color: '#93c5fd',
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
          <div style={{ marginTop: 4, fontSize: 11, color: '#f87171' }}>
            {formError}
          </div>
        )}
      </form>

      {/* Chat list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {chats.map((chat) => (
          <div
            key={chat.id}
            style={{
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
                    ? 'linear-gradient(135deg, #2563eb, #60a5fa)'
                    : 'transparent',
                color: chat.id === selectedId ? '#e5e7eb' : '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    marginRight: 6,
                    background: chat.other_online ? '#22c55e' : '#4b5563',
                  }}
                />
                {chat.title || `Chat #${chat.id}`}
              </div>

              {chat.unread_count > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    padding: '0 6px',
                    borderRadius: 999,
                    background: '#ef4444',
                    color: '#f9fafb',
                    fontSize: 10,
                  }}
                >
                  {chat.unread_count}
                </span>
              )}
            </button>

            <button
              onClick={(e) => handleDelete(e, chat.id)}
              title="Delete chat"
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                background: 'rgba(248,113,113,0.12)',
                color: '#fca5a5',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};