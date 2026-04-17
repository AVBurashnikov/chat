/**
 * Message input component with validation
 */

import { useState } from 'react';

const ICONS = {
  attach: '📎',
  close: '✕',
  menu: '☰',
  send: '➜',
};

export const MessageInput = ({
  onSend,
  onSendFile,
  disabled,
  isMobile,
  onMenuOpen,
  replyTo,
  onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmed = message.trim();

    if (selectedFile) {
      if (trimmed.length > 5000) {
        setError('Message is too long');
        return;
      }

      onSendFile(selectedFile, trimmed, replyTo?.id ?? null);
      setMessage('');
      setSelectedFile(null);
      onCancelReply?.();
      return;
    }

    if (!trimmed) {
      setError('Message cannot be empty');
      return;
    }

    if (trimmed.length > 5000) {
      setError('Message is too long');
      return;
    }

    onSend(trimmed, replyTo?.id);
    onCancelReply?.();
    setMessage('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 18px 18px',
        borderTop: '1px solid var(--border)',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.02), transparent), var(--bg-form)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      {selectedFile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: 16,
            border: '1px solid var(--border)',
            boxShadow: 'var(--surface-glow)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background: 'var(--accent-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                flexShrink: 0,
              }}
            >
              {ICONS.attach}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selectedFile.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            aria-label="Remove selected file"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--danger)',
              fontSize: 15,
            }}
          >
            {ICONS.close}
          </button>
        </div>
      )}

      {replyTo && (
        <div
          style={{
            padding: '12px 14px',
            borderLeft: '3px solid var(--accent-strong)',
            background: 'var(--bg-secondary)',
            borderRadius: 16,
            display: 'flex',
            gap: 12,
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
            boxShadow: 'var(--surface-glow)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--accent)',
                marginBottom: 4,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Replying to {replyTo.sender_username}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                wordBreak: 'break-word',
              }}
            >
              {replyTo.content.length < 90
                ? replyTo.content
                : `${replyTo.content.substring(0, 90)}...`}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--danger)',
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            {ICONS.close}
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            color: 'var(--danger)',
            fontSize: 12,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'var(--danger-bg)',
            border: '1px solid rgba(248, 113, 113, 0.18)',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          padding: 8,
          borderRadius: 20,
          border: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--surface-glow)',
        }}
      >
        {isMobile && (
          <button
            type="button"
            onClick={onMenuOpen}
            aria-label="Open chats"
            style={{
              background: 'var(--bg-form)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: 42,
              height: 42,
              color: 'var(--text-primary)',
              fontSize: 17,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {ICONS.menu}
          </button>
        )}

        <label
          aria-label="Attach file"
          style={{
            cursor: 'pointer',
            fontSize: 18,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 42,
            height: 42,
            borderRadius: '50%',
            border: '1px solid var(--border)',
            background: 'var(--bg-form)',
            flexShrink: 0,
          }}
        >
          {ICONS.attach}
          <input
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </label>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={selectedFile ? 'Add a caption...' : 'Write a message...'}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '13px 14px',
            borderRadius: 14,
            border: '1px solid transparent',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontSize: 15,
            boxSizing: 'border-box',
          }}
          disabled={disabled}
          maxLength="5000"
          autoComplete="off"
        />

        <button
          type="submit"
          disabled={disabled || (!message.trim() && !selectedFile)}
          aria-label="Send message"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--gradient-selected)',
            color: '#ffffff',
            border: 'none',
            fontSize: 18,
            fontWeight: 700,
            opacity: disabled ? 0.5 : 1,
            boxShadow: 'var(--shadow-card)',
            flexShrink: 0,
          }}
        >
          {ICONS.send}
        </button>
      </div>
    </form>
  );
};
