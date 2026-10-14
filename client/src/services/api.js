import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('skilltrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to normalize errors and handle 401s
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const data = error.response?.data;

    // Handle 401 Unauthorized
    if (status === 401 && !originalRequest?._retry) {
      const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
                             originalRequest?.url?.includes('/auth/register');
      
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('skilltrack_token');
        localStorage.removeItem('skilltrack_user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }
    }

    // Extract standardized, user-friendly message without leaking internals
    let message = data?.message || data?.error;

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      message = data.errors.join('. ');
    }

    if (status === 429) {
      message = 'Too many attempts. Please wait a moment and try again.';
    } else if (status === 401) {
      if (message === 'Invalid email or password') {
        message = 'Email or password is incorrect.';
      } else if (message === 'User account is inactive') {
        message = 'Your account is currently inactive. Please contact an administrator.';
      } else if (!message) {
        message = 'Your session has expired. Please sign in again.';
      }
    } else if (status === 400 && message === 'Email is already registered') {
      message = 'An account with this email already exists.';
    } else if (status === 403) {
      message = 'You do not have permission to access this resource.';
    } else if (status >= 500) {
      message = 'An unexpected server error occurred. Please try again later.';
    } else if (!message) {
      message = error.message || 'An unexpected error occurred.';
    }

    error.normalizedMessage = message;
    return Promise.reject(error);
  }
);

export default api;
