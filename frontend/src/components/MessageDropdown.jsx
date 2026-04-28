import { useEffect, useRef } from 'react';
import { DropdownMenu, DropdownMenuItem } from './ui/DropdownMenu';

const ICONS = {
  reply: '↩',
  delete: '✕',
};

export const MessageDropdown = ({
  message,
  onReply,
  onEdit,
  onDelete,
  isMine,
  isOpen,
  setOpen,
  anchorRef,
}) => {
  const handleReply = () => {
    onReply(message);
    setOpen(false);
  };

  const handleEdit = () => {
    onEdit?.(message);
    setOpen(false);
  };

  const handleDelete = () => {
    onDelete?.(message);
    setOpen(false);
  };

  return (
    <DropdownMenu 
      align={isMine ? 'right' : 'left'} 
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      anchorRef={anchorRef}
    >
      <DropdownMenuItem onClick={handleReply}>
        {ICONS.reply} Ответить
      </DropdownMenuItem>
      {isMine && <DropdownMenuItem onClick={handleEdit}>Редактировать</DropdownMenuItem>}
      <DropdownMenuItem onClick={handleDelete} danger>
        {ICONS.delete} Удалить
      </DropdownMenuItem>
    </DropdownMenu>
  );
};
