/**
 * Dropdown menu for chat actions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveChat, deleteChat, toggleChatMute } from '../api/chats';
import { DropdownMenu, DropdownMenuItem } from './ui/DropdownMenu';

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

  return (
    <DropdownMenu>
      <DropdownMenuItem onClick={handleMute}>{muteButtonLabel}</DropdownMenuItem>
      <DropdownMenuItem onClick={handleArchive}>Archive chat</DropdownMenuItem>
      <DropdownMenuItem onClick={handleDelete} danger>
        Delete chat
      </DropdownMenuItem>
    </DropdownMenu>
  );
};
