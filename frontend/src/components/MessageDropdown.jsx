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
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setOpen]);

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
    <div ref={menuRef}>
      <DropdownMenu align={isMine ? 'right' : 'left'}>
        <DropdownMenuItem onClick={handleReply}>
          {ICONS.reply} Ответить
        </DropdownMenuItem>
        {isMine && <DropdownMenuItem onClick={handleEdit}>Редактировать</DropdownMenuItem>}
        <DropdownMenuItem onClick={handleDelete} danger>
          {ICONS.delete} Удалить
        </DropdownMenuItem>
      </DropdownMenu>
    </div>
  );
};
