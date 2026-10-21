import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';
import AuthContext from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';

const mockNavigate = vi.fn();

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: [
          { _id: 'dept-1', name: 'Frontend Engineering' },
          { _id: 'dept-2', name: 'Backend Engineering' },
        ],
      },
    }),
    post: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderRegisterPage = (authOverrides = {}) => {
  const defaultAuth = {
    register: vi.fn(),
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
            <RegisterPage />
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    ),
    auth: defaultAuth,
  };
};

describe('RegisterPage (Scenarios 17-23)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 17. Renders form
  it('17. renders registration form with name, email, password, and confirm password', () => {
    renderRegisterPage();

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  // 18. Required fields
  it('18. validates that name, email, password, and confirmation are required', async () => {
    renderRegisterPage();

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email address is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/^password is required\.$/i)).toBeInTheDocument();
    expect(await screen.findByText(/^confirm password is required\.$/i)).toBeInTheDocument();
  });

  // 19. Invalid email
  it('19. validates email format', async () => {
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/please provide a valid email address/i)).toBeInTheDocument();
  });

  // 20. Password mismatch
  it('20. validates that confirm password matches password', async () => {
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@corp.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'DifferentPassword456!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  // 21. Successful registration
  it('21. successfully registers and redirects to /login', async () => {
    const mockRegister = vi.fn().mockResolvedValue({
      user: { id: 'u1', name: 'Jane Doe', email: 'jane@corp.com', role: 'employee' },
    });

    renderRegisterPage({ register: mockRegister });

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@corp.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@corp.com',
        password: 'Password123!',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { email: 'jane@corp.com' } });
    });
  });

  // 22. Failed registration
  it('22. displays duplicate email error banner from server', async () => {
    const mockRegister = vi.fn().mockRejectedValue({
      normalizedMessage: 'An account with this email already exists.',
    });

    renderRegisterPage({ register: mockRegister });

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'duplicate@corp.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/an account with this email already exists/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // 23. Does not expose user privilege role selector (prevents admin/trainer privilege escalation)
  it('23. strictly DOES NOT provide or expose account privilege role selector (admin/trainer)', () => {
    renderRegisterPage();

    expect(screen.queryByLabelText(/user role|privilege role|account type/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/choose role/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/select role/i)).not.toBeInTheDocument();
  });

  it('24. displays department selector, career track / role selector, and employee role indicator', () => {
    renderRegisterPage();

    expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/career track/i)).toBeInTheDocument();
    expect(screen.getByText(/Role: Employee/i)).toBeInTheDocument();
  });

  it('25. provides password123 demo suggestion and fills password fields when clicked', () => {
    renderRegisterPage();

    expect(screen.getByText('password123')).toBeInTheDocument();
    const useSuggestionBtn = screen.getByRole('button', { name: /use suggestion/i });
    fireEvent.click(useSuggestionBtn);

    expect(screen.getByLabelText(/^password/i)).toHaveValue('password123');
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue('password123');
  });
});
