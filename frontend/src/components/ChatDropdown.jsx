/**
 * Dropdown menu for chat actions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteChat, toggleChatMute, archiveChat } from '../api/chats';

export const ChatDropdown = ({ chatId, muted, onClose, onSelect, selectedId }) => {
  const queryClient = useQueryClient();

  const deleteChatMutation = useMutation({
    mutationFn: (chatId) => deleteChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  const handleMute = (e) => {
    e.stopPropagation();
    onClose();

    toggleChatMute(chatId)
      .then(() => queryClient.invalidateQueries({ queryKey: ['chats'] }))
      .catch((error) => console.error('Toggle mute error:', error));
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    onClose();

    archiveChat(chatId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        if (chatId === selectedId) {
          onSelect(null);
        }
      })
      .catch((error) => console.error('Archive chat error:', error));
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onClose();

    if (!confirm('Delete this chat?')) {
      return;
    }

    deleteChatMutation.mutate(chatId);
    if (chatId === selectedId) {
      onSelect(null);
    }
  };

  const muteButtonLabel = muted ? 'Unmute chat' : 'Mute chat';

  return (
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
        onClick={handleMute}
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
        onClick={handleArchive}
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
        onClick={handleDelete}
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
  );
};