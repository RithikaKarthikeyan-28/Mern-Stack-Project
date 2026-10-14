import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TrainerLearnersPage from '../TrainerLearnersPage';
import trainerService from '../../services/trainerService';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../services/trainerService', () => ({
  default: {
    getLearnerEnrollments: vi.fn(),
    getMyCourses: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('TrainerLearnersPage', () => {
  const mockUser = { _id: 'trainer-123', name: 'Sarah Connor', role: 'trainer' };

  const mockCourses = [
    { _id: 'c-1', title: 'Fullstack Microservices' },
  ];

  const mockEnrollments = [
    {
      _id: 'e-1',
      employee: {
        employeeId: 'EMP-100',
        user: { name: 'Michael Scott', email: 'michael@dunder.test' },
        department: { name: 'Sales' },
      },
      course: { _id: 'c-1', title: 'Fullstack Microservices' },
      status: 'in_progress',
      progressPercentage: 45,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <TrainerLearnersPage />
      </MemoryRouter>
    );

  it('renders page header and learners progress table', async () => {
    trainerService.getLearnerEnrollments.mockResolvedValueOnce(mockEnrollments);
    trainerService.getMyCourses.mockResolvedValueOnce(mockCourses);

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Learner Progress & Performance')
      ).toBeInTheDocument();
      expect(screen.getByText('Michael Scott')).toBeInTheDocument();
      expect(screen.getByText('michael@dunder.test')).toBeInTheDocument();
      expect(screen.getAllByText('Fullstack Microservices').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('45%')).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    trainerService.getLearnerEnrollments.mockResolvedValue(mockEnrollments);
    trainerService.getMyCourses.mockResolvedValue(mockCourses);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Michael Scott')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Refresh learners/i }));

    await waitFor(() => {
      expect(trainerService.getLearnerEnrollments).toHaveBeenCalledTimes(2);
    });
  });

  it('handles error state with retry', async () => {
    trainerService.getLearnerEnrollments.mockRejectedValueOnce(
      new Error('Enrollments endpoint unavailable')
    );
    trainerService.getMyCourses.mockResolvedValueOnce([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Could Not Load Learners')).toBeInTheDocument();
      expect(
        screen.getByText('Enrollments endpoint unavailable')
      ).toBeInTheDocument();
    });
  });
});
