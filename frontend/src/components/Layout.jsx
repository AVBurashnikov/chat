/**
 * Main layout wrapper with header
 */

import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import styles from './Layout.module.css';

export const Layout = ({ children, theme = 'dark', onToggleTheme }) => {
  const { user, logout } = useAuth();

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} />

      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.branding}>
            <div className={styles.logo}>Phantom</div>
            <div className={styles.tagline}>Quiet conversations, sharp interface</div>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className={styles.themeButton}
            >
              {theme === 'dark' ? '☀' : '🌙'}
            </button>

            {user && (
              <div className={styles.userBox}>
                <div className={styles.userAvatar}>
                  {user.username.charAt(0).toUpperCase()}
                </div>

                <span className={styles.userName}>
                  {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
                </span>

                <button onClick={logout} className={styles.logoutButton}>
                  <span className={styles.desktopOnly}>Logout</span>
                  <span className={styles.mobileOnly}>Exit</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
};
