import React, { memo } from 'react';
import styles from './FilePreview.module.css';

const ICONS = {
  attach: '📎',
  close: '✕',
};

const getIcon = (file) => {
  if (file.type.startsWith('image/')) return '🖼️';
  if (file.type.includes('pdf')) return '📄';
  return '📎';
};

const FilePreview = ({ file, onRemove }) => {
  if (!file) return null;

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.icon}>
          {getIcon(file)}
        </div>

        <div className={styles.meta}>
          <div className={styles.fileName}>
            {file.name}
          </div>

          <div className={styles.fileSize}>
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove selected file"
        className={styles.removeButton}
      >
        {ICONS.close}
      </button>
    </div>
  );
};

export default memo(FilePreview);