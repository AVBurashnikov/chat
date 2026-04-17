/**
 * Main layout wrapper with header
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const Layout = ({ children, theme = 'dark', onToggleTheme }) => {
  const { user, logout } = useAuth();
  const [isCompact, setIsCompact] = useState(() => window.innerWidth <= 640);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth <= 640);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--gradient-bg)',
        padding: isCompact ? 0 : 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 20%, rgba(125,211,252,0.16), transparent 22%), radial-gradient(circle at 80% 80%, rgba(14,165,233,0.12), transparent 18%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 1100,
          height: isCompact ? '100dvh' : '90vh',
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderRadius: isCompact ? 0 : 28,
          boxShadow: isCompact ? 'none' : 'var(--shadow)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: isCompact ? 'none' : '1px solid var(--border)',
          position: 'relative',
          boxSizing: 'border-box',
          backgroundImage:
            'linear-gradient(180deg, var(--panel-overlay), transparent)',
        }}
      >
        <header
          style={{
            minHeight: isCompact ? 64 : 72,
            padding: isCompact ? '12px 14px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--gradient-header)',
            borderBottom: '1px solid var(--border)',
            boxShadow: 'var(--surface-glow)',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div
              style={{
                color: 'var(--text-primary)',
                fontWeight: 800,
                letterSpacing: '0.08em',
                fontSize: isCompact ? 14 : 15,
                textTransform: 'uppercase',
              }}
            >
              Phantom
            </div>
            {!isCompact && (
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  letterSpacing: '0.04em',
                }}
              >
                Quiet conversations, sharp interface
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isCompact ? 8 : 12,
              flexShrink: 0,
            }}
          >
            <button
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              style={{
                width: isCompact ? 38 : 42,
                height: isCompact ? 38 : 42,
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'var(--bg-form)',
                cursor: 'pointer',
                fontSize: isCompact ? 16 : 18,
                color: 'var(--text-primary)',
                boxShadow: 'var(--surface-glow)',
                flexShrink: 0,
              }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {user && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCompact ? 8 : 12,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: isCompact ? 34 : 38,
                    height: isCompact ? 34 : 38,
                    borderRadius: '50%',
                    background: 'var(--avatar-own-bg)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    boxShadow: 'var(--surface-glow)',
                    flexShrink: 0,
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>

                {!isCompact && (
                  <span
                    style={{
                      fontSize: 14,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.username.charAt(0).toUpperCase() +
                      user.username.slice(1)}
                  </span>
                )}

                <button
                  onClick={logout}
                  style={{
                    fontSize: 12,
                    padding: isCompact ? '7px 10px' : '8px 14px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-form)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    boxShadow: 'var(--surface-glow)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isCompact ? 'Exit' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </header>

        <main
          style={{
            flex: 1,
            display: 'flex',
            background: 'var(--bg-primary)',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
