import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import AuthContext from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLoginPage = (authOverrides = {}) => {
  const defaultAuth = {
    login: vi.fn(),
    user: null,
    isAuthenticated: false,
    loading: false,
    ...authOverrides,
  };

  return {
    ...render(
      <MemoryRouter>
        <ToastProvider>
          <AuthContext.Provider value={defaultAuth}>
            <LoginPage />
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    ),
    auth: defaultAuth,
  };
};

describe('LoginPage (Scenarios 10-16)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 10. Renders form
  it('10. renders login form with email, password, submit button, and registration link', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
  });

  // 11. Email validation
  it('11. displays validation errors for missing or invalid email format', async () => {
    renderLoginPage();

    // Submit with empty inputs
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email address is required/i)).toBeInTheDocument();

    // Enter invalid email
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Secret123!' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  // 12. Password required
  it('12. displays validation error when password is empty', async () => {
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  // 13. Successful login
  it('13. successfully logs in and navigates based on user role', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      success: true,
      user: { role: 'admin', name: 'Admin User' },
    });

    renderLoginPage({ login: mockLogin });

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@corp.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@corp.com',
        password: 'Password123!',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
    });
  });

  // 14. Failed login
  it('14. displays error message banner when login credentials fail', async () => {
    const mockLogin = vi.fn().mockRejectedValue({
      normalizedMessage: 'Email or password is incorrect.',
    });

    renderLoginPage({ login: mockLogin });

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'wrong@corp.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'WrongPass!' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email or password is incorrect/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // 15. Submit loading state
  it('15. displays loading state and disables submit button while request is in flight', async () => {
    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    const mockLogin = vi.fn().mockReturnValue(loginPromise);

    renderLoginPage({ login: mockLogin });

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@corp.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Secret123!' } });
    
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(submitBtn).toBeDisabled();

    // Resolve promise
    resolveLogin({ success: true, user: { role: 'employee' } });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  // 16. Show/hide password
  it('16. toggles password input visibility when eye button is clicked', () => {
    renderLoginPage();

    const passwordInput = screen.getByLabelText(/^password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByLabelText(/show password/i);
    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/hide password/i));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
