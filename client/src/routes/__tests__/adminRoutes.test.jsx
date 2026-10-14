import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import AppRoutes from '../AppRoutes';

vi.mock('../../services/adminService', () => ({
  default: {
    getDashboardOverview: vi.fn().mockResolvedValue({
      employees: { total: 0, active: 0, list: [] },
      departments: { total: 0, active: 0, list: [] },
      courses: { total: 0, published: 0, list: [] },
      assessments: { total: 0, published: 0, list: [] },
      compliance: { complianceRate: 0, compliant: 0, dueSoon: 0, overdue: 0 },
      certificates: { total: 0, expiringCount: 0, recent: [] },
      enrollments: { total: 0, recent: [] },
    }),
    getEmployees: vi.fn().mockResolvedValue([]),
    getDepartments: vi.fn().mockResolvedValue([]),
    getCourses: vi.fn().mockResolvedValue([]),
    getAssessments: vi.fn().mockResolvedValue([]),
    getComplianceSummary: vi.fn().mockResolvedValue({}),
    getComplianceRequirements: vi.fn().mockResolvedValue([]),
    getComplianceAssignments: vi.fn().mockResolvedValue({ assignments: [] }),
    getCertificates: vi.fn().mockResolvedValue({ certificates: [] }),
    getExpiringCertificates: vi.fn().mockResolvedValue([]),
    getExpiredCertificates: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/trainerService', () => ({
  default: {
    getCourseModules: vi.fn().mockResolvedValue([]),
    getDashboardOverview: vi.fn().mockResolvedValue({
      courses: { total: 0, published: 0, draft: 0, archived: 0, list: [] },
      assessments: { total: 0, published: 0, draft: 0, list: [] },
      learners: { total: 0, inProgress: 0, completed: 0, list: [] },
    }),
  },
}));

vi.mock('../../services/analyticsService', () => ({
  default: {
    getComprehensiveAnalytics: vi.fn().mockResolvedValue({
      overview: {
        employees: { total: 0, active: 0, inactive: 0 },
        departments: { total: 0, active: 0 },
        courses: { total: 0, published: 0, draft: 0, archived: 0 },
        enrollments: { total: 0, enrolled: 0, inProgress: 0, completed: 0, dropped: 0 },
        assessments: { total: 0, attempts: 0, passed: 0, failed: 0, passRate: 100 },
        certificates: { active: 0, expired: 0, revoked: 0 },
        compliance: { total: 0, compliant: 0, dueSoon: 0, overdue: 0, complianceRate: 100 },
      },
      learning: null,
      assessments: null,
      compliance: null,
      certifications: null,
      departments: null,
      courses: null,
      hasPartialError: false,
    }),
  },
}));

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: {} } }),
    post: vi.fn().mockResolvedValue({ data: { data: {} } }),
    patch: vi.fn().mockResolvedValue({ data: { data: {} } }),
    delete: vi.fn().mockResolvedValue({ data: { data: {} } }),
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

describe('Admin Routes & RBAC Protection', () => {
  const adminUser = { _id: 'u-admin', name: 'Global Admin', role: 'admin' };
  const employeeUser = { _id: 'u-emp', name: 'Staff Member', role: 'employee' };
  const trainerUser = { _id: 'u-trainer', name: 'Instructor Joe', role: 'trainer' };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('allows admin role to access /admin dashboard', async () => {
    renderWithAuth('/admin', {
      isAuthenticated: true,
      loading: false,
      user: adminUser,
    });
    expect(screen.getByText(/System Administration — Global Admin/i)).toBeInTheDocument();
  });

  it('allows admin role to access /admin/employees', async () => {
    renderWithAuth('/admin/employees', {
      isAuthenticated: true,
      loading: false,
      user: adminUser,
    });
    expect(screen.getByText('Workforce Management')).toBeInTheDocument();
  });

  it('allows admin role to access /admin/departments', async () => {
    renderWithAuth('/admin/departments', {
      isAuthenticated: true,
      loading: false,
      user: adminUser,
    });
    expect(screen.getByRole('heading', { name: /^Departments$/i })).toBeInTheDocument();
  });

  it('allows admin role to access /admin/courses', async () => {
    renderWithAuth('/admin/courses', {
      isAuthenticated: true,
      loading: false,
      user: adminUser,
    });
    expect(screen.getByText('Course Administration')).toBeInTheDocument();
  });

  it('allows admin role to access /admin/assessments', async () => {
    renderWithAuth('/admin/assessments', {
      isAuthenticated: true,
      loading: false,
      user: adminUser,
    });
    expect(screen.getByText('Assessment Oversight')).toBeInTheDocument();
  });

  it('allows admin role to access /admin/compliance', async () => {
    renderWithAuth('/admin/compliance', {
      isAuthenticated: true,
      loading: false,
      user: adminUser,
    });
    expect(screen.getByText('Compliance Oversight')).toBeInTheDocument();
  });

  it('allows admin role to access /admin/certificates', async () => {
    renderWithAuth('/admin/certificates', {
      isAuthenticated: true,
      loading: false,
      user: adminUser,
    });
    expect(screen.getByText('Certificates Oversight')).toBeInTheDocument();
  });

  it('allows admin role to access /admin/analytics page', async () => {
    renderWithAuth('/admin/analytics', {
      isAuthenticated: true,
      loading: false,
      user: adminUser,
    });
    expect(screen.getByRole('heading', { level: 1, name: /analytics & reports/i })).toBeInTheDocument();
  });

  it('denies employee role from /admin and redirects to /dashboard', async () => {
    renderWithAuth('/admin/employees', {
      isAuthenticated: true,
      loading: false,
      user: employeeUser,
    });
    expect(screen.getByText(/Welcome back, Staff Member!/i)).toBeInTheDocument();
    expect(screen.queryByText('Workforce Management')).not.toBeInTheDocument();
  });

  it('denies trainer role from /admin and redirects to /trainer/dashboard', async () => {
    renderWithAuth('/admin/courses', {
      isAuthenticated: true,
      loading: false,
      user: trainerUser,
    });
    expect(screen.getByText(/Trainer Hub — Instructor Joe/i)).toBeInTheDocument();
    expect(screen.queryByText('Course Administration')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated user away from /admin to /login', async () => {
    renderWithAuth('/admin/dashboard', {
      isAuthenticated: false,
      user: null,
      loading: false,
    });
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
