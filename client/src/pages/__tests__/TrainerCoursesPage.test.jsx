import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TrainerCoursesPage from '../TrainerCoursesPage';
import trainerService from '../../services/trainerService';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../services/trainerService', () => ({
  default: {
    getMyCourses: vi.fn(),
    createCourse: vi.fn(),
    updateCourse: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('TrainerCoursesPage', () => {
  const mockUser = { _id: 'trainer-123', name: 'Sarah Connor', role: 'trainer' };

  const mockCourses = [
    {
      _id: 'c-101',
      title: 'DevOps & CI/CD Pipelines',
      description: 'Hands-on automated delivery pipeline training.',
      category: 'Engineering',
      level: 'intermediate',
      duration: 16,
      status: 'published',
    },
    {
      _id: 'c-102',
      title: 'Intro to Ethical Hacking',
      description: 'Penetration testing fundamentals.',
      category: 'Security & Compliance',
      level: 'beginner',
      duration: 10,
      status: 'draft',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <TrainerCoursesPage />
      </MemoryRouter>
    );

  it('renders page header and loads trainer courses', async () => {
    trainerService.getMyCourses.mockResolvedValueOnce(mockCourses);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Course Management')).toBeInTheDocument();
      expect(screen.getByText('DevOps & CI/CD Pipelines')).toBeInTheDocument();
      expect(screen.getByText('Intro to Ethical Hacking')).toBeInTheDocument();
    });
  });

  it('filters courses by status tab', async () => {
    trainerService.getMyCourses.mockResolvedValueOnce(mockCourses);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('DevOps & CI/CD Pipelines')).toBeInTheDocument();
    });

    // Click Drafts tab
    fireEvent.click(screen.getByRole('button', { name: /Drafts/i }));

    expect(screen.queryByText('DevOps & CI/CD Pipelines')).not.toBeInTheDocument();
    expect(screen.getByText('Intro to Ethical Hacking')).toBeInTheDocument();
  });

  it('searches courses by keyword', async () => {
    trainerService.getMyCourses.mockResolvedValueOnce(mockCourses);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('DevOps & CI/CD Pipelines')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/Search courses/i);
    fireEvent.change(searchInput, { target: { value: 'Ethical' } });

    expect(screen.queryByText('DevOps & CI/CD Pipelines')).not.toBeInTheDocument();
    expect(screen.getByText('Intro to Ethical Hacking')).toBeInTheDocument();
  });

  it('opens create course modal and submits a new course', async () => {
    trainerService.getMyCourses.mockResolvedValueOnce(mockCourses);
    const newCourse = {
      _id: 'c-103',
      title: 'Kubernetes Mastery',
      description: 'Production cluster management.',
      category: 'Engineering',
      level: 'advanced',
      duration: 20,
      status: 'draft',
    };
    trainerService.createCourse.mockResolvedValueOnce(newCourse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('DevOps & CI/CD Pipelines')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Course/i }));

    // Modal is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Course Title \*/i), {
      target: { value: 'Kubernetes Mastery' },
    });
    fireEvent.change(screen.getByLabelText(/Description \*/i), {
      target: { value: 'Production cluster management.' },
    });
    fireEvent.change(screen.getByLabelText(/Duration/i), {
      target: { value: '20' },
    });

    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /^Create Course$/i })
    );

    await waitFor(() => {
      expect(trainerService.createCourse).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Kubernetes Mastery',
          duration: 20,
        })
      );
      expect(screen.getByText('Kubernetes Mastery')).toBeInTheDocument();
    });
  });

  it('handles publishing a draft course', async () => {
    trainerService.getMyCourses.mockResolvedValueOnce(mockCourses);
    trainerService.updateCourse.mockResolvedValueOnce({
      ...mockCourses[1],
      status: 'published',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Intro to Ethical Hacking')).toBeInTheDocument();
    });

    const publishBtn = screen.getByLabelText(/Publish Intro to Ethical Hacking/i);
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(trainerService.updateCourse).toHaveBeenCalledWith('c-102', {
        status: 'published',
      });
    });
  });

  it('renders ErrorState with retry button when course fetch fails', async () => {
    trainerService.getMyCourses.mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Could Not Load Courses')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    trainerService.getMyCourses.mockResolvedValueOnce(mockCourses);
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));

    await waitFor(() => {
      expect(screen.getByText('DevOps & CI/CD Pipelines')).toBeInTheDocument();
    });
  });
});
