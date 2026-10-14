import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AssessmentsPage from '../AssessmentsPage';
import AuthContext from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import assessmentService from '../../services/assessmentService';

vi.mock('../../services/assessmentService', () => ({
  default: {
    getMyAssessmentHistory: vi.fn(),
  },
}));

const mockHistory = [
  {
    id: 'att1',
    attemptId: 'att1',
    assessmentId: 'a101',
    assessmentTitle: 'React Fundamentals Quiz',
    courseId: 'c101',
    courseTitle: 'Enterprise React Masterclass',
    attemptNumber: 1,
    obtainedMarks: 18,
    totalMarks: 20,
    percentage: 90,
    result: 'passed',
    submittedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'att2',
    attemptId: 'att2',
    assessmentId: 'a102',
    assessmentTitle: 'Node.js Express Security Evaluation',
    courseId: 'c102',
    courseTitle: 'Backend Security Architecture',
    attemptNumber: 1,
    obtainedMarks: 10,
    totalMarks: 20,
    percentage: 50,
    result: 'failed',
    submittedAt: '2026-10-02T12:00:00.000Z',
  },
];

const mockUser = {
  id: 'u1',
  name: 'Alex Employee',
  email: 'alex@company.com',
  role: 'employee',
};

const renderComponent = () => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/assessments']}>
          <Routes>
            <Route path="/assessments" element={<AssessmentsPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>
  );
};

describe('AssessmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assessmentService.getMyAssessmentHistory.mockResolvedValue(mockHistory);
  });

  it('renders my assessments page with KPI metric stat cards', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('My Assessments')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Attempts')).toBeInTheDocument();
    expect(screen.getByText('Passed Quizzes')).toBeInTheDocument();
    expect(screen.getByText('Overall Pass Rate')).toBeInTheDocument();
    expect(screen.getByText('Average Score')).toBeInTheDocument();

    // Stats values: total 2, passed 1, passRate 50%, avgScore 70%
    expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('70%').length).toBeGreaterThanOrEqual(1);
  });

  it('renders list of past attempts in table', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('React Fundamentals Quiz')).toBeInTheDocument();
    });

    expect(screen.getByText('Node.js Express Security Evaluation')).toBeInTheDocument();
    expect(screen.getByText('Enterprise React Masterclass')).toBeInTheDocument();
    expect(screen.getByText('Backend Security Architecture')).toBeInTheDocument();
  });

  it('filters attempts by search query', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('React Fundamentals Quiz')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by assessment or course title/i);
    fireEvent.change(searchInput, { target: { value: 'Security' } });

    await waitFor(() => {
      expect(screen.queryByText('React Fundamentals Quiz')).not.toBeInTheDocument();
      expect(screen.getByText('Node.js Express Security Evaluation')).toBeInTheDocument();
    });
  });

  it('filters attempts by passed and failed status tabs', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('React Fundamentals Quiz')).toBeInTheDocument();
    });

    // Click Passed filter
    fireEvent.click(screen.getByRole('button', { name: /passed \(1\)/i }));

    await waitFor(() => {
      expect(screen.getByText('React Fundamentals Quiz')).toBeInTheDocument();
      expect(screen.queryByText('Node.js Express Security Evaluation')).not.toBeInTheDocument();
    });

    // Click Failed filter
    fireEvent.click(screen.getByRole('button', { name: /failed \(1\)/i }));

    await waitFor(() => {
      expect(screen.queryByText('React Fundamentals Quiz')).not.toBeInTheDocument();
      expect(screen.getByText('Node.js Express Security Evaluation')).toBeInTheDocument();
    });
  });

  it('renders empty state when no assessments have been taken', async () => {
    assessmentService.getMyAssessmentHistory.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No Assessments Taken Yet')).toBeInTheDocument();
    });
  });

  it('handles error state on API failure and retries successfully', async () => {
    assessmentService.getMyAssessmentHistory.mockRejectedValueOnce(new Error('Failed to retrieve history'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Error Loading Assessments')).toBeInTheDocument();
    });

    assessmentService.getMyAssessmentHistory.mockResolvedValue(mockHistory);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByText('React Fundamentals Quiz')).toBeInTheDocument();
    });
  });
});
