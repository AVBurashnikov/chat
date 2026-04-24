/**
 * Component for creating a new chat
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createChat } from '../api/chats';
import styles from './ChatForm.module.css';

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

  const isPending = createChatMutation.isPending;

  return (
    <form onSubmit={handleCreateChat} className={styles.form}>
      <div className={styles.row}>
        <input
          type="text"
          value={participantUsername}
          onChange={(e) => setParticipantUsername(e.target.value)}
          placeholder="username"
          className={styles.input}
          disabled={isPending}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isPending || !participantUsername.trim()}
          className={`${styles.submit} ${isPending ? styles.pending : ''}`}
        >
          {isPending ? '...' : '+'}
        </button>
      </div>
      {formError && <div className={styles.error}>{formError}</div>}
    </form>
  );
};
