import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const TestConsumer = ({ onLoginSuccess, onRegisterSuccess }) => {
  const { user, token, isAuthenticated, loading, login, register, logout } = useAuth();

  return (
    <div>
      <span data-testid="loading-state">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="auth-status">{isAuthenticated ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="user-name">{user?.name || 'none'}</span>
      <span data-testid="user-role">{user?.role || 'none'}</span>
      <span data-testid="token-val">{token || 'none'}</span>

      <button
        onClick={async () => {
          try {
            const res = await login({ email: 'test@example.com', password: 'Password123!' });
            if (onLoginSuccess) onLoginSuccess(res);
          } catch (e) {
            // caught
          }
        }}
      >
        Trigger Login
      </button>

      <button
        onClick={async () => {
          try {
            const res = await register({
              name: 'New User',
              email: 'new@example.com',
              password: 'Password123!',
            });
            if (onRegisterSuccess) onRegisterSuccess(res);
          } catch (e) {
            // caught
          }
        }}
      >
        Trigger Register
      </button>

      <button onClick={logout}>Trigger Logout</button>
    </div>
  );
};

describe('AuthContext (Phase F2 Complete Coverage)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // 1. No stored token -> unauthenticated
  it('1. initializes as unauthenticated when no token is in storage', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
    expect(screen.getByTestId('user-name')).toHaveTextContent('none');
    expect(screen.getByTestId('token-val')).toHaveTextContent('none');
  });

  // 2. Valid stored token -> restores user
  it('2. restores authenticated user on valid stored token via /auth/me', async () => {
    const mockUser = { id: 'u1', name: 'Verified User', role: 'trainer', email: 'trainer@corp.com' };
    localStorage.setItem('skilltrack_token', 'valid-jwt');

    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { user: mockUser },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      // wait for initial verification
    });

    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-in');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Verified User');
    expect(screen.getByTestId('user-role')).toHaveTextContent('trainer');
  });

  // 3. Invalid token -> clears session
  it('3. clears session and credentials when /auth/me returns 401', async () => {
    localStorage.setItem('skilltrack_token', 'expired-jwt');
    localStorage.setItem('skilltrack_user', JSON.stringify({ name: 'Expired' }));

    const error = new Error('Unauthorized');
    error.response = { status: 401 };
    api.get.mockRejectedValueOnce(error);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      // wait for effect to run
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
    expect(localStorage.getItem('skilltrack_token')).toBeNull();
    expect(localStorage.getItem('skilltrack_user')).toBeNull();
  });

  // 4. Login success
  it('4. logs in successfully, storing JWT and updating state', async () => {
    const mockUser = { id: 'u2', name: 'Login Success', role: 'employee' };
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          token: 'fresh-jwt-token',
          user: mockUser,
        },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Trigger Login').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-in');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Login Success');
    expect(localStorage.getItem('skilltrack_token')).toBe('fresh-jwt-token');
    expect(JSON.parse(localStorage.getItem('skilltrack_user')).name).toBe('Login Success');
  });

  // 5. Login failure
  it('5. handles login failure without modifying stored session', async () => {
    const error = new Error('Invalid credentials');
    error.response = { status: 401, data: { message: 'Invalid email or password' } };
    error.normalizedMessage = 'Email or password is incorrect.';
    api.post.mockRejectedValueOnce(error);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Trigger Login').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
    expect(localStorage.getItem('skilltrack_token')).toBeNull();
  });

  // 6. Register success
  it('6. calls register endpoint and returns registered data', async () => {
    const onRegisterSuccess = vi.fn();
    const newUser = { id: 'u3', name: 'New User', email: 'new@example.com', role: 'employee' };
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'User registered successfully',
        data: { user: newUser },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer onRegisterSuccess={onRegisterSuccess} />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Trigger Register').click();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'New User',
      email: 'new@example.com',
      password: 'Password123!',
    });
    expect(onRegisterSuccess).toHaveBeenCalled();
  });

  // 7. Register failure
  it('7. propagates registration failure when duplicate email occurs', async () => {
    const error = new Error('Duplicate email');
    error.response = { status: 400, data: { message: 'Email is already registered' } };
    error.normalizedMessage = 'An account with this email already exists.';
    api.post.mockRejectedValueOnce(error);

    const onRegisterSuccess = vi.fn();

    render(
      <AuthProvider>
        <TestConsumer onRegisterSuccess={onRegisterSuccess} />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Trigger Register').click();
    });

    expect(onRegisterSuccess).not.toHaveBeenCalled();
    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
  });

  // 8. Logout
  it('8. logs out cleanly, clearing stored JWT and credentials', async () => {
    localStorage.setItem('skilltrack_token', 'token-to-clear');
    localStorage.setItem('skilltrack_user', JSON.stringify({ name: 'To Logout' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Trigger Logout').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
    expect(localStorage.getItem('skilltrack_token')).toBeNull();
    expect(localStorage.getItem('skilltrack_user')).toBeNull();
  });

  // 9. Unauthorized event clears session
  it('9. handles auth:unauthorized window event by clearing session', async () => {
    localStorage.setItem('skilltrack_token', 'stale-token');
    localStorage.setItem('skilltrack_user', JSON.stringify({ name: 'Alice' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
    expect(localStorage.getItem('skilltrack_token')).toBeNull();
  });
});
