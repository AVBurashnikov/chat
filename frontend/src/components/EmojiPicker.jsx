import React, { memo } from 'react';
import styles from './EmojiPicker.module.css';

const emojis = [
  '😀', '😃', '😂', '🤣', '😄', '😅', '😆',
  '😉', '😊', '😋', '😎', '😍', '😘', '🥰',
  '🤗', '🤔', '🤨', '😐', '😑', '😶', '🙄',
  '😏', '😣', '😥', '😮', '🤐', '😯', '😪',
  '😫', '🥱', '😴', '🤤', '🤩', '🥳', '🤪',
  '😜', '🤭', '🧐', '🤓', '👿', '👹', '👺',
  '🤡', '💩', '👻', '👽', '🤖', '💀', '☠️',
  '👾', '🤠',
];

const EmojiPicker = ({ open, onSelect }) => {
  if (!open) return null;

  return (
    <div className={styles.picker}>
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={styles.emojiButton}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default memo(EmojiPicker);
