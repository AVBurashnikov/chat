import React, { memo } from 'react';
import styles from './IconButton.module.css';

const IconButton = ({
  children,
  onClick,
  type = 'button',
  variant = 'default',
  size = 'md',
  disabled,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${styles.button}
        ${styles[variant]}
        ${styles[size]}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default memo(IconButton);