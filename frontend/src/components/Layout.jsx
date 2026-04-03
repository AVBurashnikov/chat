/**
 * Main layout wrapper with header
 */

import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export const Layout = ({ children, theme = 'dark', onToggleTheme }) => {
  const { user, logout } = useAuth();

  // Apply theme class to body for global styles
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--gradient-bg)',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1100,
          height: '90vh',
          background: 'var(--bg-surface)',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border)',
        }}
      >
        <header
          style={{
            height: 56,
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--gradient-header)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            Chat Clone
          </div>
          <button
            onClick={onToggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: 'var(--text-primary)',
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {user.username.charAt(0).toUpperCase() +
                  user.username.slice(1)}
              </span>
              <button
                onClick={logout}
                style={{
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-form)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          )}
        </header>
        <main style={{ flex: 1, display: 'flex', background: 'var(--bg-primary)', overflow: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
