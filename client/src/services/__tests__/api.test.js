import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from '../api';

describe('API Client & Interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('has a default baseURL configured', () => {
    expect(api.defaults.baseURL).toBeDefined();
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('attaches Bearer token to request headers when token is stored', async () => {
    localStorage.setItem('skilltrack_token', 'test-token-xyz');

    const requestInterceptor = api.interceptors.request.handlers[0];
    const initialConfig = { headers: {} };
    const modifiedConfig = await requestInterceptor.fulfilled(initialConfig);

    expect(modifiedConfig.headers.Authorization).toBe('Bearer test-token-xyz');
  });

  it('does not attach Bearer token when no token exists in storage', async () => {
    const requestInterceptor = api.interceptors.request.handlers[0];
    const initialConfig = { headers: {} };
    const modifiedConfig = await requestInterceptor.fulfilled(initialConfig);

    expect(modifiedConfig.headers.Authorization).toBeUndefined();
  });

  it('normalizes validation error arrays from 400 response', async () => {
    const responseInterceptor = api.interceptors.response.handlers[0];
    const errorObj = {
      config: { url: '/api/auth/register' },
      response: {
        status: 400,
        data: {
          message: 'Validation failed',
          errors: ['Name is required', 'Password must be at least 8 characters long'],
        },
      },
    };

    try {
      await responseInterceptor.rejected(errorObj);
    } catch (err) {
      expect(err.normalizedMessage).toBe('Name is required. Password must be at least 8 characters long');
    }
  });

  it('normalizes 429 rate limit errors to friendly message', async () => {
    const responseInterceptor = api.interceptors.response.handlers[0];
    const errorObj = {
      config: { url: '/api/auth/login' },
      response: {
        status: 429,
        data: { message: 'Too many requests' },
      },
    };

    try {
      await responseInterceptor.rejected(errorObj);
    } catch (err) {
      expect(err.normalizedMessage).toBe('Too many attempts. Please wait a moment and try again.');
    }
  });

  it('normalizes 401 invalid credentials to friendly message', async () => {
    const responseInterceptor = api.interceptors.response.handlers[0];
    const errorObj = {
      config: { url: '/api/auth/login' },
      response: {
        status: 401,
        data: { message: 'Invalid email or password' },
      },
    };

    try {
      await responseInterceptor.rejected(errorObj);
    } catch (err) {
      expect(err.normalizedMessage).toBe('Email or password is incorrect.');
    }
  });

  it('normalizes 400 duplicate email error', async () => {
    const responseInterceptor = api.interceptors.response.handlers[0];
    const errorObj = {
      config: { url: '/api/auth/register' },
      response: {
        status: 400,
        data: { message: 'Email is already registered' },
      },
    };

    try {
      await responseInterceptor.rejected(errorObj);
    } catch (err) {
      expect(err.normalizedMessage).toBe('An account with this email already exists.');
    }
  });

  it('handles 401 response by removing token and dispatching unauthorized event', async () => {
    localStorage.setItem('skilltrack_token', 'expired-token');
    localStorage.setItem('skilltrack_user', JSON.stringify({ name: 'Test' }));

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const responseInterceptor = api.interceptors.response.handlers[0];

    const errorObj = {
      config: { url: '/courses' },
      response: {
        status: 401,
        data: { message: 'Token expired' },
      },
    };

    try {
      await responseInterceptor.rejected(errorObj);
    } catch (err) {
      expect(localStorage.getItem('skilltrack_token')).toBeNull();
      expect(localStorage.getItem('skilltrack_user')).toBeNull();
      expect(dispatchSpy).toHaveBeenCalled();
    }
  });
});
