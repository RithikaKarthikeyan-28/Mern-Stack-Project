import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AssessmentResultPage from '../AssessmentResultPage';
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
    getAttemptResult: vi.fn(),
    getMyAssessmentHistory: vi.fn(),
  },
}));

const mockPassedResult = {
  _id: 'att100',
  attemptNumber: 1,
  status: 'submitted',
  obtainedMarks: 18,
  totalMarks: 20,
  percentage: 90,
  result: 'passed',
  evaluatedAt: '2026-10-02T14:30:00.000Z',
  assessment: {
    _id: 'a101',
    title: 'Advanced State Management Quiz',
    passingPercentage: 70,
    maxAttempts: 3,
    course: {
      _id: 'c101',
      title: 'Full-Stack Architecture',
    },
  },
  // Ensure NO correct answers exist in attempt object
  answers: [
    { question: 'q1', selectedAnswers: ['A'] },
    { question: 'q2', selectedAnswers: ['B', 'C'] },
  ],
};

const mockFailedResult = {
  ...mockPassedResult,
  _id: 'att101',
  attemptNumber: 2,
  obtainedMarks: 10,
  totalMarks: 20,
  percentage: 50,
  result: 'failed',
};

const mockHistory = [
  {
    id: 'att100',
    attemptId: 'att100',
    assessmentId: 'a101',
    attemptNumber: 1,
    obtainedMarks: 18,
    totalMarks: 20,
    percentage: 90,
    result: 'passed',
    submittedAt: '2026-10-02T14:30:00.000Z',
  },
];

const mockUser = {
  id: 'u1',
  name: 'Alex Employee',
  email: 'alex@company.com',
  role: 'employee',
};

const renderComponent = (assessmentId = 'a101', attemptId = 'att100') => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/assessments/${assessmentId}/result/${attemptId}`]}>
          <Routes>
            <Route
              path="/assessments/:assessmentId/result/:attemptId"
              element={<AssessmentResultPage />}
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>
  );
};

describe('AssessmentResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assessmentService.getAttemptResult.mockResolvedValue(mockPassedResult);
    assessmentService.getMyAssessmentHistory.mockResolvedValue(mockHistory);
  });

  it('renders server-evaluated score and marks', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('18')).toBeInTheDocument();
    });

    expect(screen.getByText('/ 20')).toBeInTheDocument();
    expect(screen.getByText('Marks Obtained')).toBeInTheDocument();
  });

  it('renders server percentage and passing mark requirement', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('90%').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('Passing Mark')).toBeInTheDocument();
  });

  it('renders passed state banner and congratulations message', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Congratulations!/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Assessment Passed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue learning/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view certificate/i })).toBeInTheDocument();
  });

  it('renders failed state with keep learning guidance and retake button', async () => {
    assessmentService.getAttemptResult.mockResolvedValue(mockFailedResult);

    renderComponent('a101', 'att101');

    await waitFor(() => {
      expect(screen.getByText(/Keep Learning/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Assessment Not Passed/i)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retake assessment/i })).toBeInTheDocument();
  });

  it('SECURITY TEST: does NOT expose or fabricate correct answers', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('90%').length).toBeGreaterThanOrEqual(1);
    });

    // Verify there are no correct answer text or reveals in DOM
    expect(screen.queryByText(/Correct Answer:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Correct Option:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Solution:/i)).not.toBeInTheDocument();
  });

  it('renders attempt history when historical attempts are available', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('attempt-history-card')).toBeInTheDocument();
    });

    expect(screen.getByText('All Attempts for This Assessment')).toBeInTheDocument();
    expect(screen.getByText('Attempt #1')).toBeInTheDocument();
  });

  it('navigates to assessment details when Retake Assessment is clicked', async () => {
    assessmentService.getAttemptResult.mockResolvedValue(mockFailedResult);

    renderComponent('a101', 'att101');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retake assessment/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /retake assessment/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/assessments/a101');
  });

  it('handles result loading failure with error state and retry', async () => {
    assessmentService.getAttemptResult.mockRejectedValueOnce(new Error('Result not found'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Result Unavailable')).toBeInTheDocument();
    });
  });
});
