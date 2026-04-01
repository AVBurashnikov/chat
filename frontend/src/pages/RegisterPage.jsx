/**
 * Registration page
 */

import { useState } from 'react';
import { register } from '../api/auth';

export const RegisterPage = ({ onSwitch }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');

    // Validation
    if (!username || username.length < 3 || username.length > 50) {
      setError('Username must be 3-50 characters');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(username, password);
      setOk('Аккаунт создан успешно!');
      setTimeout(onSwitch, 1500);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || 'Ошибка регистрации'
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
        color: '#e5e7eb',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 360,
          padding: 32,
          borderRadius: 16,
          background: 'rgba(15,23,42,0.95)',
          border: '1px solid rgba(148,163,184,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>Регистрация</h2>

        <div>
          <label style={{ fontSize: 13, color: '#9ca3af' }}>Логин</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.4)',
              background: '#020617',
              color: '#e5e7eb',
              boxSizing: 'border-box',
            }}
            disabled={loading}
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#9ca3af' }}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.4)',
              background: '#020617',
              color: '#e5e7eb',
              boxSizing: 'border-box',
            }}
            disabled={loading}
            autoComplete="new-password"
            required
          />
        </div>

        {error && <div style={{ fontSize: 12, color: '#f97373' }}>{error}</div>}
        {ok && <div style={{ fontSize: 12, color: '#4ade80' }}>{ok}</div>}

        <button
          type="submit"
          style={{
            marginTop: 8,
            padding: '10px 0',
            borderRadius: 999,
            border: 'none',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#020617',
            fontWeight: 600,
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
          disabled={loading}
        >
          {loading ? 'Загрузка...' : 'Создать аккаунт'}
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
            color: '#93c5fd',
            fontSize: 13,
            cursor: 'pointer',
          }}
          disabled={loading}
        >
          Уже есть аккаунт? Войти
        </button>
      </form>
    </div>
  );
};