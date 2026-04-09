/**
 * Component for creating a new chat
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createChat } from '../api/chats';

export const ChatForm = ({ onChatCreated }) => {
  const queryClient = useQueryClient();
  const [participantUsername, setParticipantUsername] = useState('');
  const [formError, setFormError] = useState('');

  const createChatMutation = useMutation({
    mutationFn: ({ usernameValue }) => createChat(usernameValue),
    onSuccess: (createdChat) => {
      setParticipantUsername('');
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      onChatCreated(createdChat.id);
    },
    onError: (error) => {
      const backendMessage = error?.response?.data?.detail;
      setFormError(backendMessage || 'Failed to create chat');
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

  return (
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
  );
};