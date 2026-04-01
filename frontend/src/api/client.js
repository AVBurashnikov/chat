/**
 * Axios client with security features
 */

import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
});

/**
 * Request interceptor - add token from sessionStorage
 */
apiClient.interceptors.request.use(
  (config) => {
    // Try sessionStorage first, then localStorage for backward compatibility
    const token = sessionStorage.getItem('access_token') ||
                  localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear both storage types for compatibility
      sessionStorage.removeItem('access_token');
      localStorage.removeItem('token');
      window.location.href = '/';
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default apiClient;