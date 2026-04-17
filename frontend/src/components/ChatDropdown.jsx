/**
 * Dropdown menu for chat actions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveChat, deleteChat, toggleChatMute } from '../api/chats';

export const ChatDropdown = ({
  chatId,
  muted,
  onClose,
  onSelect,
  selectedId,
}) => {
  const queryClient = useQueryClient();

  const deleteChatMutation = useMutation({
    mutationFn: (currentChatId) => deleteChat(currentChatId),
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

  const buttonStyle = {
    width: '100%',
    padding: '12px 14px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    textAlign: 'left',
    fontSize: 13,
    fontWeight: 600,
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: 8,
        top: 'calc(100% - 2px)',
        minWidth: 180,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        zIndex: 100,
        overflow: 'hidden',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <button type="button" onClick={handleMute} style={buttonStyle}>
        {muteButtonLabel}
      </button>
      <button type="button" onClick={handleArchive} style={buttonStyle}>
        Archive chat
      </button>
      <button
        type="button"
        onClick={handleDelete}
        style={{
          ...buttonStyle,
          color: 'var(--danger)',
        }}
      >
        Delete chat
      </button>
    </div>
  );
};
