/**
 * Message input component with validation
 */

import { useState } from 'react';

export const MessageInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmed = message.trim();

    // Validate
    if (!trimmed) {
      setError('Message cannot be empty');
      return;
    }

    if (trimmed.length > 5000) {
      setError('Message is too long');
      return;
    }

    // Send
    onSend(trimmed);
    setMessage('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: 8,
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-form)',
      }}
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        style={{
          flex: 1,
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          fontSize: 14,
          boxSizing: 'border-box',
        }}
        disabled={disabled}
        maxLength="5000"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        style={{
          padding: '10px 16px',
          borderRadius: 8,
          background: 'var(--success)',
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
      {error && (
        <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
          {error}
        </div>
      )}
    </form>
  );
};