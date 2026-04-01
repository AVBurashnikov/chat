/**
 * Authentication API endpoints
 */

import apiClient from './client';

export async function login(username, password) {
  try {
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);

    const { data } = await apiClient.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // Store in sessionStorage (secure - cleared on tab close)
    if (data.access_token) {
      sessionStorage.setItem('access_token', data.access_token);
      // Also store in localStorage for backward compatibility
      localStorage.setItem('token', data.access_token);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function register(username, password) {
  try {
    const { data } = await apiClient.post('/auth/register', {
      username,
      password,
    });
    return data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
}

export async function me() {
  try {
    const { data } = await apiClient.get('/auth/me');
    return data;
  } catch (error) {
    console.error('Me error:', error);
    throw error;
  }
}

export function logout() {
  sessionStorage.removeItem('access_token');
  localStorage.removeItem('token');
}