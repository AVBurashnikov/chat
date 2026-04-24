import React, { memo } from 'react';
import styles from './DropdownMenu.module.css';

export const DropdownMenu = memo(function DropdownMenu({
  children,
  align = 'right',
  className = '',
}) {
  return (
    <div
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
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.item} ${danger ? styles.itemDanger : ''} ${className}`}
    >
      {children}
    </button>
  );
});
