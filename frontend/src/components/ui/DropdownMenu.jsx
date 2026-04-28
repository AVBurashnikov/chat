import React, { memo, useEffect, useRef } from 'react';
import styles from './DropdownMenu.module.css';

export const DropdownMenu = memo(function DropdownMenu({
  children,
  align = 'right',
  className = '',
  isOpen,
  onClose,
  anchorRef,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        if (anchorRef && anchorRef.current && !anchorRef.current.contains(e.target)) {
          onClose?.();
        } else if (!anchorRef) {
          onClose?.();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className={`${styles.menu} ${align === 'left' ? styles.left : styles.right} ${className}`}
    >
      {children}
    </div>
  );
});

export const DropdownMenuItem = memo(function DropdownMenuItem({
  children,
  onClick,
  danger = false,
  disabled = false,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${styles.item} ${danger ? styles.itemDanger : ''} ${disabled ? styles.itemDisabled : ''} ${className}`}
    >
      {children}
    </button>
  );
});
