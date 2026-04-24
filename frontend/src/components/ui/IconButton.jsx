import React, { memo } from 'react';
import styles from './IconButton.module.css';

const IconButton = ({
  children,
  onClick,
  type = 'button',
  variant = 'default',
  size = 'md',
  disabled,
  className = '',
  ...props
}) => {
  const buttonClassName = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClassName}
      {...props}
    >
      {children}
    </button>
  );
};

export default memo(IconButton);
