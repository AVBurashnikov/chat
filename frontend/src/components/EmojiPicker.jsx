import React, { memo } from 'react';

const emojis = [
  '😀','😁','😂','🤣','😃','😄','😅',
  '😆','😉','😊','😋','😎','😍','😘',
  '🥰','🤗','🤔','🤨','😐','😑','😶',
  '🙄','😏','😣','😥','😮','🤐','😯',
  '😪','😫','🥱','😴','🤤','🤩',
  '🥳','🤪','😜','🤭','🧐','🤓','😈',
  '👿','👹','👺','🤡','💩','👻','👽',
  '🤖','💀','☠️','👾','🤠'
];

const EmojiPicker = ({ open, onSelect }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '70px',
        left: '10px',
        zIndex: 1000,
        background: 'var(--bg-form)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: 'var(--surface-glow)',
        padding: 8,
        maxWidth: 400,
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 4,
      }}
    >
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          style={{
            fontSize: 20,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default memo(EmojiPicker);