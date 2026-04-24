import { useEffect, useRef } from 'react';
import { DropdownMenu, DropdownMenuItem } from './ui/DropdownMenu';

const ICONS = {
  reply: '↩',
  delete: '✕',
};

export const MessageDropdown = ({
  message,
  onReply,
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
    setOpen(false);
  };

  const handleDelete = () => {
    setOpen(false);
  };

  return (
    <div ref={menuRef}>
      <DropdownMenu align={isMine ? 'right' : 'left'}>
        <DropdownMenuItem onClick={handleReply}>
          {ICONS.reply} Reply
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} danger>
          {ICONS.delete} Delete
        </DropdownMenuItem>
      </DropdownMenu>
    </div>
  );
};
