/**
 * Main App component
 * Displays login/register or chat based on auth state
 */

import { useState } from 'react';
import { Layout } from './components/Layout';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChatPage } from './pages/ChatPage';

export const App = () => {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  if (loading) {
    return (
      <Layout>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: 14,
          }}
        >
          Loading...
        </div>
      </Layout>
    );
  }

  let content;
  if (!user) {
    content =
      mode === 'login' ? (
        <LoginPage
          onSwitch={() => setMode('register')}
          onSuccess={() => setMode('login')}
        />
      ) : (
        <RegisterPage onSwitch={() => setMode('login')} />
      );
  } else {
    content = <ChatPage />;
  }

  return (
    <Layout theme={theme} onToggleTheme={toggleTheme}>
      {content}
    </Layout>
  );
};
