import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AssessmentPlayerPage from '../AssessmentPlayerPage';
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
    getAttemptData: vi.fn(),
    startAttempt: vi.fn(),
    getAttemptById: vi.fn(),
    submitAttempt: vi.fn(),
    saveDraftAnswers: vi.fn(),
  },
}));

const mockAttemptData = {
  assessment: {
    id: 'a101',
    title: 'React Hooks and Architecture Assessment',
    course: {
      id: 'c101',
      title: 'Enterprise React Architecture',
    },
    passingPercentage: 70,
    timeLimitMinutes: 20,
    maxAttempts: 3,
    totalQuestions: 2,
    totalMarks: 15,
  },
  questions: [
    {
      id: 'q1',
      questionText: 'Which React hook should be used to run side effects after rendering?',
      questionType: 'single_choice',
      options: [
        { key: 'A', text: 'useState' },
        { key: 'B', text: 'useEffect' },
        { key: 'C', text: 'useMemo' },
        { key: 'D', text: 'useContext' },
      ],
      marks: 5,
      order: 1,
    },
    {
      id: 'q2',
      questionText: 'Which of the following are built-in hooks provided by React? (Select all that apply)',
      questionType: 'multiple_choice',
      options: [
        { key: 'A', text: 'useReducer' },
        { key: 'B', text: 'useCallback' },
        { key: 'C', text: 'useRouter' },
        { key: 'D', text: 'useRef' },
      ],
      marks: 10,
      order: 2,
    },
  ],
};

const mockAttempt = {
  _id: 'att100',
  attemptNumber: 1,
  status: 'in_progress',
  startedAt: new Date(Date.now() - 60000).toISOString(), // 1 min ago
  answers: [],
};

const mockEvaluatedResult = {
  _id: 'att100',
  attemptNumber: 1,
  status: 'submitted',
  obtainedMarks: 15,
  totalMarks: 15,
  percentage: 100,
  result: 'passed',
  evaluatedAt: new Date().toISOString(),
};

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
        <MemoryRouter initialEntries={[`/assessments/${assessmentId}/attempt/${attemptId}`]}>
          <Routes>
            <Route
              path="/assessments/:assessmentId/attempt/:attemptId"
              element={<AssessmentPlayerPage />}
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>
  );
};

describe('AssessmentPlayerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assessmentService.getAttemptData.mockResolvedValue(mockAttemptData);
    assessmentService.getAttemptById.mockResolvedValue(mockAttempt);
    assessmentService.submitAttempt.mockResolvedValue(mockEvaluatedResult);
  });

  it('renders questions and assessment title', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('React Hooks and Architecture Assessment')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Which React hook should be used to run side effects/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Enterprise React Architecture')).toBeInTheDocument();
  });

  it('renders single-choice question with radio buttons', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Single Choice')).toBeInTheDocument();
    });

    expect(screen.getByText('useState')).toBeInTheDocument();
    expect(screen.getByText('useEffect')).toBeInTheDocument();
    expect(screen.getByText('useMemo')).toBeInTheDocument();
    expect(screen.getByText('useContext')).toBeInTheDocument();
  });

  it('selects single answer', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('useEffect')).toBeInTheDocument();
    });

    const optionB = screen.getByText('useEffect');
    fireEvent.click(optionB);

    // Verify option is selected
    const radioB = screen.getByRole('radio', { name: /useEffect/i });
    expect(radioB).toBeChecked();
  });

  it('navigates between questions using Next and Previous buttons', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/Which React hook should be used/i).length).toBeGreaterThanOrEqual(1);
    });

    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);

    // Now on Question 2
    await waitFor(() => {
      expect(screen.getAllByText(/Which of the following are built-in hooks/i).length).toBeGreaterThanOrEqual(1);
    });

    // Previous button should go back to Question 1
    const prevBtn = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Which React hook should be used/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders multiple-choice question and selects multiple answers', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/Which React hook should be used/i).length).toBeGreaterThanOrEqual(1);
    });

    // Go to Q2
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
    });

    // Select options A (useReducer) and B (useCallback)
    fireEvent.click(screen.getByText('useReducer'));
    fireEvent.click(screen.getByText('useCallback'));

    const checkboxA = screen.getByRole('checkbox', { name: /useReducer/i });
    const checkboxB = screen.getByRole('checkbox', { name: /useCallback/i });
    const checkboxC = screen.getByRole('checkbox', { name: /useRouter/i });

    expect(checkboxA).toBeChecked();
    expect(checkboxB).toBeChecked();
    expect(checkboxC).not.toBeChecked();
  });

  it('shows answered and unanswered state in navigator and counters', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/Which React hook should be used/i).length).toBeGreaterThanOrEqual(1);
    });

    // Initially 0 answered, 2 unanswered
    expect(screen.getAllByText(/0 answered/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2 unanswered/i).length).toBeGreaterThan(0);

    // Select answer for Q1
    fireEvent.click(screen.getByText('useEffect'));

    // Now 1 answered, 1 unanswered
    expect(screen.getAllByText(/1 answered/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1 unanswered/i).length).toBeGreaterThan(0);
  });

  it('renders timer when timeLimitMinutes is provided', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('assessment-timer')).toBeInTheDocument();
    });
  });

  it('opens submission review modal and warns about unanswered questions', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /review & submit/i }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: /review & submit/i })[0]);

    await waitFor(() => {
      expect(screen.getByTestId('assessment-review-modal')).toBeInTheDocument();
    });

    expect(screen.getByText(/You have 2 unanswered questions/i)).toBeInTheDocument();
    expect(screen.getByText('Continue Review')).toBeInTheDocument();
    expect(screen.getByText('Confirm & Submit')).toBeInTheDocument();
  });

  it('submits supported answer payload and navigates to authoritative result', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('useEffect')).toBeInTheDocument();
    });

    // Answer Q1
    fireEvent.click(screen.getByText('useEffect'));

    // Open review modal
    fireEvent.click(screen.getAllByRole('button', { name: /review & submit/i })[0]);

    await waitFor(() => {
      expect(screen.getByTestId('assessment-review-modal')).toBeInTheDocument();
    });

    // Confirm submit
    fireEvent.click(screen.getByRole('button', { name: /confirm & submit/i }));

    await waitFor(() => {
      expect(assessmentService.submitAttempt).toHaveBeenCalledWith('att100', {
        answers: [
          { question: 'q1', selectedAnswers: ['B'] },
        ],
      });
      expect(mockNavigate).toHaveBeenCalledWith('/assessments/a101/result/att100', expect.any(Object));
    });
  });

  it('SECURITY TEST: does NOT inject client-controlled score, percentage, result, or employee info', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('useEffect')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('useEffect'));
    fireEvent.click(screen.getAllByRole('button', { name: /review & submit/i })[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm & submit/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm & submit/i }));

    await waitFor(() => {
      expect(assessmentService.submitAttempt).toHaveBeenCalled();
    });

    const submittedPayload = assessmentService.submitAttempt.mock.calls[0][1];

    // Payload must strictly contain ONLY answers array
    expect(submittedPayload.score).toBeUndefined();
    expect(submittedPayload.percentage).toBeUndefined();
    expect(submittedPayload.result).toBeUndefined();
    expect(submittedPayload.attemptNumber).toBeUndefined();
    expect(submittedPayload.employee).toBeUndefined();
    expect(submittedPayload.totalMarks).toBeUndefined();
    expect(submittedPayload.obtainedMarks).toBeUndefined();
    expect(submittedPayload.startedAt).toBeUndefined();
    expect(submittedPayload.submittedAt).toBeUndefined();
    expect(submittedPayload.evaluatedAt).toBeUndefined();
    expect(Array.isArray(submittedPayload.answers)).toBe(true);
  });

  it('handles submission failure and preserves selected answers', async () => {
    assessmentService.submitAttempt.mockRejectedValueOnce(new Error('Network error during submit'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('useEffect')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('useEffect'));

    fireEvent.click(screen.getAllByRole('button', { name: /review & submit/i })[0]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm & submit/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm & submit/i }));

    await waitFor(() => {
      expect(assessmentService.submitAttempt).toHaveBeenCalled();
    });

    // Answer should still be preserved
    const radioB = screen.getByRole('radio', { name: /useEffect/i });
    expect(radioB).toBeChecked();
  });

  it('navigates to question when clicked in question navigator', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/Which React hook should be used/i).length).toBeGreaterThanOrEqual(1);
    });

    // Click Question 2 in navigator
    const q2NavBtn = screen.getByRole('button', { name: /Question 2/i });
    fireEvent.click(q2NavBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Which of the following are built-in hooks/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('autosaves draft answer in real-time when selecting an option', async () => {
    assessmentService.saveDraftAnswers.mockResolvedValue({});
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('useEffect')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('useEffect'));

    await waitFor(() => {
      expect(assessmentService.saveDraftAnswers).toHaveBeenCalledWith('att100', {
        answers: [{ question: 'q1', selectedAnswers: ['B'] }],
      });
    });
  });

  it('restores draft answers from previous in-progress attempt on mount', async () => {
    assessmentService.getAttemptById.mockResolvedValue({
      ...mockAttempt,
      answers: [{ question: 'q1', selectedAnswers: ['B'] }],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('useEffect')).toBeInTheDocument();
    });

    const radioB = screen.getByRole('radio', { name: /useEffect/i });
    expect(radioB).toBeChecked();
  });
});
