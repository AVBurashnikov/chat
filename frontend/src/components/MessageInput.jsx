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
        borderTop: '1px solid rgba(148,163,184,0.2)',
        background: 'rgba(15,23,42,0.5)',
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
          border: '1px solid rgba(148,163,184,0.3)',
          background: '#020617',
          color: '#e5e7eb',
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
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          color: '#020617',
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
        <div style={{ color: '#fecaca', fontSize: 12, marginTop: 4 }}>
          {error}
        </div>
      )}
    </form>
  );
};