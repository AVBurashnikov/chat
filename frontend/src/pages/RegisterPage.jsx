/**
 * Registration page
 */

import { useState } from 'react';
import { register } from '../api/auth';
import { AuthCard } from '../components/ui/AuthCard';

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
      setOk('Account created successfully!');
      setTimeout(onSwitch, 1500);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || 'Registration error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Register"
      username={username}
      password={password}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      onSwitch={onSwitch}
      submitLabel="Create Account"
      loadingLabel="Loading..."
      switchLabel="Already have an account? Sign in"
      loading={loading}
      error={error}
      success={ok}
      passwordAutoComplete="new-password"
    />
  );
};
