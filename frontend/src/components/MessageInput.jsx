/**
 * Message input component with validation
 */

import { useState } from 'react';

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

    // If file is selected, send file message
    if (selectedFile) {
      if (trimmed.length > 5000) {
        setError('Message is too long');
        return;
      }
      onSendFile(selectedFile, trimmed);
      setMessage('');
      setSelectedFile(null);
      return;
    }

    // Regular text message
    if (!trimmed) {
      setError('Message cannot be empty');
      return;
    }

    if (trimmed.length > 5000) {
      setError('Message is too long');
      return;
    }

    // Send
    onSend(trimmed, replyTo?.id);
    onCancelReply?.();
    setMessage('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB.');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
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
        gap: 8,
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-form)',
      }}
    >
      {selectedFile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
            📎 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
          </span>
          <button
            type="button"
            onClick={removeFile}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--danger)',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {replyTo && (
        <div
          style={{
            padding: '8px',
            borderLeft: '3px solid #0b93f6',
            background: 'var(--bg-secondary)',
            borderRadius: 6,
            display: 'flex',
            gap: '8px',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <strong>{replyTo.sender_username}</strong>
            <div style={{ 
              fontSize: 12,
              wordBreak: 'break-word'
              }}
            >
              {replyTo.content.length < 50 
                  ? replyTo.content 
                  : `${replyTo.content.substring(0, 50)}...`}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--danger)',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 4 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {isMobile && (
          <button
            type="button"
            onClick={onMenuOpen}
            style={{
              background: 'var(--bg-form)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ☰
          </button>
        )}

        <label
          style={{
            cursor: 'pointer',
            fontSize: 18,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid var(--border)',
            background: 'var(--bg-form)',
          }}
        >
          📎
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
          placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontSize: 16,
            boxSizing: 'border-box',
          }}
          disabled={disabled}
          maxLength="5000"
          autoComplete="off"
        />
        <button
            type="submit"
            disabled={disabled || (!message.trim() && !selectedFile)}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: 'var(--gradient-selected)',
              color: 'var(--bg-primary)',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 13,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            Send
        </button>
      </div>
    </form>
  );
      {error && (
        <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
          {error}
        </div>
      )}
};