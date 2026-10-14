import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminAssessmentsPage from '../AdminAssessmentsPage';
import adminService from '../../services/adminService';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../services/adminService', () => ({
  default: {
    getAssessments: vi.fn(),
    getCourses: vi.fn(),
    createAssessment: vi.fn(),
    updateAssessment: vi.fn(),
    publishAssessment: vi.fn(),
    archiveAssessment: vi.fn(),
    deleteAssessment: vi.fn(),
    getAssessmentPerformance: vi.fn(),
  },
}));

vi.mock('../../services/trainerService', () => ({
  default: {
    getCourseModules: vi.fn().mockResolvedValue([]),
  },
}));

describe('AdminAssessmentsPage', () => {
  const mockAssessments = [
    {
      _id: 'a-1',
      title: 'OWASP Top 10 Midterm Exam',
      course: { _id: 'c-1', title: 'Web App Security' },
      passingPercentage: 80,
      timeLimitMinutes: 45,
      questionsCount: 20,
      status: 'published',
    },
    {
      _id: 'a-2',
      title: 'DevOps CI/CD Quiz',
      course: { _id: 'c-2', title: 'Continuous Delivery' },
      passingPercentage: 70,
      timeLimitMinutes: 30,
      questionsCount: 15,
      status: 'draft',
    },
  ];

  const mockCourses = [
    { _id: 'c-1', title: 'Web App Security' },
    { _id: 'c-2', title: 'Continuous Delivery' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminAssessmentsPage />
        </ToastProvider>
      </MemoryRouter>
    );

  it('renders assessment oversight header and list of tests', async () => {
    adminService.getAssessments.mockResolvedValue(mockAssessments);
    adminService.getCourses.mockResolvedValue(mockCourses);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Assessment Oversight')).toBeInTheDocument();
      expect(screen.getByText('OWASP Top 10 Midterm Exam')).toBeInTheDocument();
      expect(screen.getByText('DevOps CI/CD Quiz')).toBeInTheDocument();
      expect(screen.getAllByText('Published').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Draft').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('filters assessments by search input', async () => {
    adminService.getAssessments.mockResolvedValue(mockAssessments);
    adminService.getCourses.mockResolvedValue(mockCourses);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('OWASP Top 10 Midterm Exam')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search assessments');
    fireEvent.change(searchInput, { target: { value: 'DevOps' } });

    expect(screen.queryByText('OWASP Top 10 Midterm Exam')).not.toBeInTheDocument();
    expect(screen.getByText('DevOps CI/CD Quiz')).toBeInTheDocument();
  });

  it('inspects assessment performance metrics in a modal', async () => {
    adminService.getAssessments.mockResolvedValue(mockAssessments);
    adminService.getCourses.mockResolvedValue(mockCourses);
    adminService.getAssessmentPerformance.mockResolvedValueOnce({
      totalAttempts: 45,
      passRate: 82.2,
      averageScore: 84.5,
      passedCount: 37,
      failedCount: 8,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('OWASP Top 10 Midterm Exam')).toBeInTheDocument();
    });

    const statsBtns = screen.getAllByTitle('View Performance Analytics');
    fireEvent.click(statsBtns[0]);

    await waitFor(() => {
      expect(adminService.getAssessmentPerformance).toHaveBeenCalledWith('a-1');
      expect(screen.getByText(/Performance: OWASP Top 10 Midterm Exam/i)).toBeInTheDocument();
    });
  });

  it('archives a published assessment', async () => {
    adminService.getAssessments.mockResolvedValue(mockAssessments);
    adminService.getCourses.mockResolvedValue(mockCourses);
    adminService.archiveAssessment.mockResolvedValueOnce({
      ...mockAssessments[0],
      status: 'archived',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('OWASP Top 10 Midterm Exam')).toBeInTheDocument();
    });

    const archiveBtn = screen.getByTitle('Archive Assessment');
    fireEvent.click(archiveBtn);

    await waitFor(() => {
      expect(adminService.archiveAssessment).toHaveBeenCalledWith('a-1');
    });
  });
});
