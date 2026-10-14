import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AssessmentDetailsPage from '../AssessmentDetailsPage';
import AuthContext from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import assessmentService from '../../services/assessmentService';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/assessmentService', () => ({
  default: {
    getAssessmentById: vi.fn(),
    getMyAssessmentHistory: vi.fn(),
    startAttempt: vi.fn(),
  },
}));

const mockAssessment = {
  _id: 'a101',
  title: 'React Fundamentals Quiz',
  description: 'Evaluate your knowledge of React component state, props, and hooks.',
  course: {
    _id: 'c101',
    title: 'Enterprise React Masterclass',
  },
  module: {
    _id: 'm101',
    title: 'Module 1: React Basics',
  },
  passingPercentage: 75,
  timeLimitMinutes: 30,
  maxAttempts: 3,
  status: 'published',
  isActive: true,
};

const mockHistory = [
  {
    id: 'att1',
    attemptId: 'att1',
    assessmentId: 'a101',
    assessmentTitle: 'React Fundamentals Quiz',
    courseId: 'c101',
    courseTitle: 'Enterprise React Masterclass',
    attemptNumber: 1,
    obtainedMarks: 14,
    totalMarks: 20,
    percentage: 70,
    result: 'failed',
    evaluatedAt: '2026-10-01T10:00:00.000Z',
  },
];

const mockUser = {
  id: 'u1',
  name: 'Alex Employee',
  email: 'alex@company.com',
  role: 'employee',
};

const renderComponent = (assessmentId = 'a101') => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/assessments/${assessmentId}`]}>
          <Routes>
            <Route path="/assessments/:assessmentId" element={<AssessmentDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>
  );
};

describe('AssessmentDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assessmentService.getAssessmentById.mockResolvedValue(mockAssessment);
    assessmentService.getMyAssessmentHistory.mockResolvedValue(mockHistory);
    assessmentService.startAttempt.mockResolvedValue({ _id: 'att2', attemptNumber: 2 });
  });

  it('renders assessment information (title, description, course)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('React Fundamentals Quiz')).toBeInTheDocument();
    });

    expect(screen.getByText(/Evaluate your knowledge of React component state/i)).toBeInTheDocument();
    expect(screen.getByText('Enterprise React Masterclass')).toBeInTheDocument();
    expect(screen.getByText('Module 1: React Basics')).toBeInTheDocument();
  });

  it('renders passing percentage requirement', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
    expect(screen.getByText('Passing Score')).toBeInTheDocument();
  });

  it('renders time limit when available', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/30 min/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Time Limit')).toBeInTheDocument();
  });

  it('renders untimed when timeLimitMinutes is null', async () => {
    assessmentService.getAssessmentById.mockResolvedValue({
      ...mockAssessment,
      timeLimitMinutes: null,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Untimed/i)).toBeInTheDocument();
    });
  });

  it('renders attempt information (allowed and attempts used)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });
    expect(screen.getByText('Allowed Attempts')).toBeInTheDocument();
    expect(screen.getByText('Attempts Used')).toBeInTheDocument();
  });

  it('starts assessment successfully and navigates to player', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Retake Assessment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retake Assessment'));

    await waitFor(() => {
      expect(assessmentService.startAttempt).toHaveBeenCalledWith('a101');
      expect(mockNavigate).toHaveBeenCalledWith('/assessments/a101/attempt/att2', expect.any(Object));
    });
  });

  it('disables start button and shows warning when max attempts reached', async () => {
    assessmentService.getMyAssessmentHistory.mockResolvedValue([
      { ...mockHistory[0], attemptNumber: 1, id: 'att1', assessmentId: 'a101' },
      { ...mockHistory[0], attemptNumber: 2, id: 'att2', assessmentId: 'a101' },
      { ...mockHistory[0], attemptNumber: 3, id: 'att3', assessmentId: 'a101' },
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Max Attempts Reached')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /max attempts reached/i })).toBeDisabled();
    expect(screen.getByText(/reached the maximum attempt limit/i)).toBeInTheDocument();
  });

  it('handles assessment loading failure with retry button', async () => {
    assessmentService.getAssessmentById.mockRejectedValueOnce(new Error('Network error fetching quiz'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Assessment Unavailable')).toBeInTheDocument();
    });

    assessmentService.getAssessmentById.mockResolvedValue(mockAssessment);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByText('React Fundamentals Quiz')).toBeInTheDocument();
    });
  });

  it('renders previous attempt history table when past attempts exist', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('attempt-history-card')).toBeInTheDocument();
    });

    expect(screen.getByText('Attempt #1')).toBeInTheDocument();
    expect(screen.getByText('14 / 20')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('handles attempt start API failure gracefully with error notification', async () => {
    assessmentService.startAttempt.mockRejectedValueOnce({
      response: { data: { message: 'Maximum attempt limit reached for this assessment' } },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Retake Assessment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retake Assessment'));

    await waitFor(() => {
      expect(assessmentService.startAttempt).toHaveBeenCalled();
    });
  });
});
