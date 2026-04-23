import React, { memo } from 'react';
import styles from './ReplyPreview.module.css';

const ICONS = {
  close: '✕',
};

const ReplyPreview = ({ replyTo, onCancel }) => {
  if (!replyTo) return null;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.title}>
          Replying to {replyTo.sender_username}
        </div>

        <div className={styles.text}>
          {replyTo.content.length < 90
            ? replyTo.content
            : `${replyTo.content.substring(0, 90)}...`}
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel reply"
        className={styles.cancelButton}
      >
        {ICONS.close}
      </button>
    </div>
  );
};

export default memo(ReplyPreview);