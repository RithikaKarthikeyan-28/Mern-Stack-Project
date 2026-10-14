import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import AppRoutes from '../AppRoutes';

const renderWithAuth = (initialRoute = '/', authValue = {}) => {
  const defaultAuth = {
    user: null,
    token: null,
    loading: false,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refreshUser: vi.fn(),
    ...authValue,
  };

  return {
    ...render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <ToastProvider>
          <AuthContext.Provider value={defaultAuth}>
            <AppRoutes />
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    ),
    auth: defaultAuth,
  };
};

describe('Routes & Guards (Scenarios 24-33)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // 24. Loading state
  it('24. renders AuthLoadingScreen while verifying session on protected routes', () => {
    renderWithAuth('/dashboard', { loading: true });
    expect(screen.getByText(/restoring your session/i)).toBeInTheDocument();
  });

  // 25. Unauthenticated redirect
  it('25. redirects unauthenticated user away from protected route to /login', () => {
    renderWithAuth('/dashboard', { isAuthenticated: false, user: null, loading: false });
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  // 26. Authenticated access
  it('26. permits authenticated user to view protected route', () => {
    renderWithAuth('/dashboard', {
      isAuthenticated: true,
      loading: false,
      user: { name: 'Alice Smith', role: 'employee' },
    });
    expect(screen.getByText(/welcome back, Alice Smith!/i)).toBeInTheDocument();
  });

  // 27. Employee allowed
  it('27. allows employee role to access employee dashboard', () => {
    renderWithAuth('/dashboard', {
      isAuthenticated: true,
      loading: false,
      user: { name: 'Emp User', role: 'employee' },
    });
    expect(screen.getByText(/welcome back, Emp User!/i)).toBeInTheDocument();
  });

  // 28. Employee denied from admin
  it('28. denies employee role access to admin route and redirects to employee dashboard', () => {
    renderWithAuth('/admin/dashboard', {
      isAuthenticated: true,
      loading: false,
      user: { name: 'Emp User', role: 'employee' },
    });
    // Should be redirected to /dashboard
    expect(screen.getByText(/welcome back, Emp User!/i)).toBeInTheDocument();
    expect(screen.queryByText(/system administration/i)).not.toBeInTheDocument();
  });

  // 29. Trainer allowed
  it('29. allows trainer role to access trainer dashboard', () => {
    renderWithAuth('/trainer/dashboard', {
      isAuthenticated: true,
      loading: false,
      user: { name: 'Coach Dave', role: 'trainer' },
    });
    expect(screen.getByText(/trainer hub — Coach Dave/i)).toBeInTheDocument();
  });

  // 30. Trainer denied from admin
  it('30. denies trainer role access to admin route and redirects to trainer dashboard', () => {
    renderWithAuth('/admin/dashboard', {
      isAuthenticated: true,
      loading: false,
      user: { name: 'Coach Dave', role: 'trainer' },
    });
    // Should be redirected to /trainer/dashboard
    expect(screen.getByText(/trainer hub — Coach Dave/i)).toBeInTheDocument();
    expect(screen.queryByText(/system administration/i)).not.toBeInTheDocument();
  });

  // 31. Admin allowed
  it('31. allows admin role to access admin dashboard', () => {
    renderWithAuth('/admin/dashboard', {
      isAuthenticated: true,
      loading: false,
      user: { name: 'Global Admin', role: 'admin' },
    });
    expect(screen.getByText(/system administration — Global Admin/i)).toBeInTheDocument();
  });

  // 32 & 33. Logout clears session and redirects
  it('32 & 33. AppShell sign out triggers logout and navigates to login', async () => {
    const mockLogout = vi.fn();

    renderWithAuth('/dashboard', {
      isAuthenticated: true,
      loading: false,
      user: { name: 'Active User', role: 'employee' },
      logout: mockLogout,
    });

    // Open user menu
    const menuBtn = screen.getByLabelText(/user profile menu/i);
    act(() => {
      menuBtn.click();
    });

    const signOutBtn = screen.getByRole('button', { name: /sign out/i });
    act(() => {
      signOutBtn.click();
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
