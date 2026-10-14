import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminCoursesPage from '../AdminCoursesPage';
import adminService from '../../services/adminService';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../services/adminService', () => ({
  default: {
    getCourses: vi.fn(),
    createCourse: vi.fn(),
    updateCourse: vi.fn(),
    deleteCourse: vi.fn(),
  },
}));

describe('AdminCoursesPage', () => {
  const mockCourses = [
    {
      _id: 'c-1',
      title: 'Fullstack Security Fundamentals',
      description: 'Defensive web security techniques',
      category: 'Security',
      level: 'intermediate',
      duration: 12,
      status: 'published',
    },
    {
      _id: 'c-2',
      title: 'Kubernetes for Architects',
      description: 'Cluster administration and resilience',
      category: 'DevOps',
      level: 'advanced',
      duration: 20,
      status: 'draft',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminCoursesPage />
        </ToastProvider>
      </MemoryRouter>
    );

  it('renders courses list and metadata badges', async () => {
    adminService.getCourses.mockResolvedValue(mockCourses);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Course Administration')).toBeInTheDocument();
      expect(screen.getByText('Fullstack Security Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Kubernetes for Architects')).toBeInTheDocument();
      expect(screen.getAllByText('Published').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Draft').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('filters courses by search term', async () => {
    adminService.getCourses.mockResolvedValue(mockCourses);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Fullstack Security Fundamentals')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search courses');
    fireEvent.change(searchInput, { target: { value: 'Kubernetes' } });

    expect(screen.queryByText('Fullstack Security Fundamentals')).not.toBeInTheDocument();
    expect(screen.getByText('Kubernetes for Architects')).toBeInTheDocument();
  });

  it('archives a published course', async () => {
    adminService.getCourses.mockResolvedValue(mockCourses);
    adminService.updateCourse.mockResolvedValueOnce({
      ...mockCourses[0],
      status: 'archived',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Fullstack Security Fundamentals')).toBeInTheDocument();
    });

    const archiveBtn = screen.getByTitle('Archive Course');
    fireEvent.click(archiveBtn);

    await waitFor(() => {
      expect(adminService.updateCourse).toHaveBeenCalledWith('c-1', { status: 'archived' });
    });
  });

  it('deletes course via confirmation dialog', async () => {
    adminService.getCourses.mockResolvedValue(mockCourses);
    adminService.deleteCourse.mockResolvedValueOnce({ success: true });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Fullstack Security Fundamentals')).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByTitle('Delete Course');
    fireEvent.click(deleteBtns[0]);

    expect(screen.getByText('Delete Course')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /^Delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminService.deleteCourse).toHaveBeenCalledWith('c-1');
    });
  });
});
