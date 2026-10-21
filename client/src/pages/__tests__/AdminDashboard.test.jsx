import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../AdminDashboard';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../services/adminService', () => ({
  default: {
    getDashboardOverview: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('AdminDashboard Page', () => {
  const mockUser = {
    _id: 'admin-1',
    name: 'Super Admin',
    role: 'admin',
    email: 'admin@skilltrack.test',
  };

  const mockOverview = {
    employees: {
      total: 120,
      active: 115,
      list: [
        {
          _id: 'e1',
          employeeId: 'EMP-001',
          user: { name: 'Alice Smith', email: 'alice@example.com' },
          department: { name: 'Engineering' },
          designation: 'Staff Engineer',
          isActive: true,
        },
      ],
    },
    departments: {
      total: 8,
      active: 8,
      list: [{ _id: 'd1', name: 'Engineering', isActive: true }],
    },
    courses: {
      total: 42,
      published: 38,
      list: [{ _id: 'c1', title: 'Security Best Practices', level: 'intermediate', status: 'published' }],
    },
    assessments: {
      total: 30,
      published: 28,
      list: [{ _id: 'a1', title: 'Security Exam', status: 'published' }],
    },
    compliance: {
      complianceRate: 94.2,
      totalRequirements: 6,
      totalAssignments: 120,
      compliant: 113,
      dueSoon: 5,
      overdue: 2,
    },
    certificates: {
      total: 89,
      expiringCount: 4,
      recent: [
        {
          _id: 'cert-1',
          certificateNumber: 'CERT-2026-001',
          recipient: { name: 'Alice Smith' },
          course: { title: 'Security Best Practices' },
          status: 'active',
        },
      ],
    },
    enrollments: {
      total: 210,
      recent: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

  it('renders admin welcome hero banner with administrator name', async () => {
    adminService.getDashboardOverview.mockResolvedValueOnce(mockOverview);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/System Administration — Super Admin/i)).toBeInTheDocument();
    });
  });

  it('renders organizational metric cards with accurate data', async () => {
    adminService.getDashboardOverview.mockResolvedValueOnce(mockOverview);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Total Workforce')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();

      expect(screen.getByText('Compliance Standing')).toBeInTheDocument();
      expect(screen.getAllByText('94%').length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Expiring Credentials')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();

      expect(screen.getByText('Course Catalog')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();

      expect(screen.getByText('Issued Certificates')).toBeInTheDocument();
      expect(screen.getAllByText('89').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('does not display redundant shortcut cards or recent employee roster on dashboard', async () => {
    adminService.getDashboardOverview.mockResolvedValueOnce(mockOverview);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/System Administration — Super Admin/i)).toBeInTheDocument();
    });

    // Redundant shortcut cards and recent employee roster should be absent
    expect(screen.queryByText('Recent Employee Profiles')).toBeNull();
    expect(screen.queryByText('View Roster')).toBeNull();
    expect(screen.queryByText('Manage roster')).toBeNull();
  });

  it('renders balanced compliance and technical certification overviews', async () => {
    adminService.getDashboardOverview.mockResolvedValueOnce(mockOverview);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Compliance Standing Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Technical Certification Tracks')).toBeInTheDocument();
      expect(screen.getByText('10 of 10 Tracks Active')).toBeInTheDocument();
    });
  });

  it('refreshes overview data when Refresh Data is clicked', async () => {
    adminService.getDashboardOverview.mockResolvedValue(mockOverview);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/System Administration — Super Admin/i)).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh dashboard/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(adminService.getDashboardOverview).toHaveBeenCalledTimes(2);
    });
  });

  it('displays ErrorState with retry button when overview fails', async () => {
    adminService.getDashboardOverview.mockRejectedValueOnce(
      new Error('Failed to load system metrics.')
    );
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('System Metrics Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Failed to load system metrics.')).toBeInTheDocument();
    });

    // Retry
    adminService.getDashboardOverview.mockResolvedValueOnce(mockOverview);
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));

    await waitFor(() => {
      expect(screen.getByText(/System Administration — Super Admin/i)).toBeInTheDocument();
    });
  });
});
