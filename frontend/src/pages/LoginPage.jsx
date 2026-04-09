/**
 * Login page
 */

import { useState } from 'react';
import { login } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = ({ onSwitch, onSuccess }) => {
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await login(username, password);

      // Fetch user data
      const { me } = await import('../api/auth');
      const userData = await me();
      setUser(userData);

      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Invalid username or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 360,
          padding: 32,
          borderRadius: 16,
          background: 'var(--bg-form)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>Вход</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
          Введите логин и пароль
        </p>

        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Логин</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
            }}
            disabled={loading}
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
            }}
            disabled={loading}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

        <button
          type="submit"
          style={{
            marginTop: 8,
            padding: '10px 0',
            borderRadius: 999,
            border: 'none',
            background: 'var(--gradient-selected)',
            color: 'var(--bg-primary)',
            fontWeight: 600,
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
          disabled={loading}
        >
          {loading ? 'Загрузка...' : 'Войти'}
        </button>

        <button
          type="button"
          onClick={onSwitch}
          style={{
            marginTop: 4,
            padding: '8px 0',
            borderRadius: 999,
            border: 'none',
            background: 'transparent',
            color: 'var(--accent)',
            fontSize: 13,
            cursor: 'pointer',
          }}
          disabled={loading}
        >
          Нет аккаунта? Зарегистрироваться
        </button>
      </form>
    </div>
  );
};