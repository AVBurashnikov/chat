/**
 * Login page
 */

import { useState } from 'react';
import { login } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { AuthCard } from '../components/ui/AuthCard';

export const LoginPage = ({ onSwitch, onSuccess }) => {
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
    <AuthCard
      title="Login"
      username={username}
      password={password}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      onSwitch={onSwitch}
      submitLabel="Sign In"
      loadingLabel="Loading..."
      switchLabel="Don't have an account? Register"
      loading={loading}
      error={error}
      passwordAutoComplete="current-password"
    />
  );
};
