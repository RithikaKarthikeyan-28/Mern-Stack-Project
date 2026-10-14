import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import AppRoutes from '../AppRoutes';

vi.mock('../../services/trainerService', () => ({
  default: {
    getDashboardOverview: vi.fn().mockResolvedValue({
      courses: { total: 0, published: 0, draft: 0, list: [] },
      assessments: { total: 0, published: 0, draft: 0, list: [] },
      learners: { total: 0, inProgress: 0, completed: 0, averageProgress: 0, list: [] },
    }),
    getMyCourses: vi.fn().mockResolvedValue([]),
    getAssessments: vi.fn().mockResolvedValue([]),
    getLearnerEnrollments: vi.fn().mockResolvedValue([]),
    getCourseById: vi.fn().mockResolvedValue({ _id: 'c-1', title: 'Test Course' }),
    getFullCurriculum: vi.fn().mockResolvedValue([]),
  },
}));

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

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastProvider>
        <AuthContext.Provider value={defaultAuth}>
          <AppRoutes />
        </AuthContext.Provider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Trainer Routes & RBAC Protection', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('redirects unauthenticated user accessing /trainer/dashboard to /login', () => {
    renderWithAuth('/trainer/dashboard', {
      isAuthenticated: false,
      user: null,
      loading: false,
    });
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('redirects employee attempting to access /trainer/dashboard to employee /dashboard', () => {
    renderWithAuth('/trainer/dashboard', {
      isAuthenticated: true,
      loading: false,
      user: { name: 'Bob Employee', role: 'employee' },
    });
    // Employee dashboard greeting is displayed
    expect(screen.getAllByText(/Bob Employee/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Trainer Hub/i)).not.toBeInTheDocument();
  });

  it('redirects employee attempting to access /trainer/courses to employee /dashboard', () => {
    renderWithAuth('/trainer/courses', {
      isAuthenticated: true,
      loading: false,
      user: { name: 'Bob Employee', role: 'employee' },
    });
    expect(screen.getAllByText(/Bob Employee/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Course Management/i)).not.toBeInTheDocument();
  });

  it('redirects employee attempting to access /trainer/assessments to employee /dashboard', () => {
    renderWithAuth('/trainer/assessments', {
      isAuthenticated: true,
      loading: false,
      user: { name: 'Bob Employee', role: 'employee' },
    });
    expect(screen.getAllByText(/Bob Employee/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Assessment Management/i)).not.toBeInTheDocument();
  });

  it('permits authenticated trainer to access /trainer/dashboard', async () => {
    renderWithAuth('/trainer/dashboard', {
      isAuthenticated: true,
      loading: false,
      user: { _id: 't-1', name: 'Diana Trainer', role: 'trainer' },
    });
    expect(await screen.findByText(/Trainer Hub — Diana Trainer/i)).toBeInTheDocument();
  });

  it('permits authenticated trainer to access /trainer/courses', async () => {
    renderWithAuth('/trainer/courses', {
      isAuthenticated: true,
      loading: false,
      user: { _id: 't-1', name: 'Diana Trainer', role: 'trainer' },
    });
    expect(await screen.findByText('Course Management')).toBeInTheDocument();
  });

  it('permits authenticated trainer to access /trainer/assessments', async () => {
    renderWithAuth('/trainer/assessments', {
      isAuthenticated: true,
      loading: false,
      user: { _id: 't-1', name: 'Diana Trainer', role: 'trainer' },
    });
    expect(await screen.findByText('Assessment Management')).toBeInTheDocument();
  });

  it('permits authenticated trainer to access /trainer/learners', async () => {
    renderWithAuth('/trainer/learners', {
      isAuthenticated: true,
      loading: false,
      user: { _id: 't-1', name: 'Diana Trainer', role: 'trainer' },
    });
    expect(
      await screen.findByText('Learner Progress & Performance')
    ).toBeInTheDocument();
  });
});
