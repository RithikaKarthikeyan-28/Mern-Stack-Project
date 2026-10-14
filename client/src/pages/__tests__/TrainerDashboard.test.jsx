import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TrainerDashboard from '../TrainerDashboard';
import trainerService from '../../services/trainerService';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../services/trainerService', () => ({
  default: {
    getDashboardOverview: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('TrainerDashboard Page', () => {
  const mockUser = {
    _id: 'trainer-123',
    name: 'Sarah Connor',
    role: 'trainer',
    email: 'sarah@skilltrack.test',
  };

  const mockOverview = {
    courses: {
      total: 5,
      published: 3,
      draft: 2,
      archived: 0,
      list: [
        {
          _id: 'c-1',
          title: 'Cloud Security Architecture',
          category: 'Security & Compliance',
          level: 'intermediate',
          duration: 12,
          status: 'published',
        },
      ],
    },
    assessments: {
      total: 4,
      published: 3,
      draft: 1,
      list: [
        {
          _id: 'a-1',
          title: 'Cloud Security Midterm',
          status: 'published',
        },
      ],
    },
    learners: {
      total: 28,
      inProgress: 18,
      completed: 10,
      enrolledOnly: 0,
      averageProgress: 76.4,
      list: [
        {
          _id: 'e-1',
          employee: {
            user: { name: 'John Doe', email: 'john@example.com' },
          },
          course: { title: 'Cloud Security Architecture' },
          progressPercentage: 80,
          status: 'in_progress',
        },
      ],
    },
    errors: { courses: null, assessments: null, enrollments: null },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <TrainerDashboard />
      </MemoryRouter>
    );

  it('renders trainer welcome hero banner with instructor name', async () => {
    trainerService.getDashboardOverview.mockResolvedValueOnce(mockOverview);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Trainer Hub — Sarah Connor/i)).toBeInTheDocument();
    });
  });

  it('renders all four KPI stat cards with authoritative counts', async () => {
    trainerService.getDashboardOverview.mockResolvedValueOnce(mockOverview);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Assigned Courses')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();

      expect(screen.getByText('Active Enrollments')).toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();

      expect(screen.getByText('Assessments Authored')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();

      expect(screen.getByText('Avg Learner Progress')).toBeInTheDocument();
      expect(screen.getByText('76.4%')).toBeInTheDocument();
    });
  });

  it('renders quick action navigation links to courses, assessments, and learners', async () => {
    trainerService.getDashboardOverview.mockResolvedValueOnce(mockOverview);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Manage Courses')).toBeInTheDocument();
      expect(screen.getByText('Assessment Builder')).toBeInTheDocument();
      expect(screen.getByText('Learner Progress')).toBeInTheDocument();
    });
  });

  it('renders recent courses and recent learner enrollments lists', async () => {
    trainerService.getDashboardOverview.mockResolvedValueOnce(mockOverview);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('Cloud Security Architecture').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  it('re-fetches dashboard overview when Refresh button is clicked', async () => {
    trainerService.getDashboardOverview.mockResolvedValue(mockOverview);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Assigned Courses')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh dashboard metrics/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(trainerService.getDashboardOverview).toHaveBeenCalledTimes(2);
    });
  });

  it('displays ErrorState with retry trigger when overview service fails', async () => {
    trainerService.getDashboardOverview.mockRejectedValueOnce(
      new Error('Database connectivity issue')
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Trainer Dashboard Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Database connectivity issue')).toBeInTheDocument();
    });

    // Retry
    trainerService.getDashboardOverview.mockResolvedValueOnce(mockOverview);
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));

    await waitFor(() => {
      expect(screen.getByText(/Trainer Hub — Sarah Connor/i)).toBeInTheDocument();
    });
  });
});
