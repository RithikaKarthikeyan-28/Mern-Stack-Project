import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LearningPlayerPage from '../LearningPlayerPage';
import AuthContext from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import courseService from '../../services/courseService';
import enrollmentService from '../../services/enrollmentService';
import assessmentService from '../../services/assessmentService';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/courseService', () => ({
  default: {
    getCourseById: vi.fn(),
    getCourseCurriculum: vi.fn(),
  },
}));

vi.mock('../../services/enrollmentService', () => ({
  default: {
    getCourseEnrollment: vi.fn(),
    updateProgress: vi.fn(),
  },
}));

vi.mock('../../services/assessmentService', () => ({
  default: {
    getCourseAssessmentStatus: vi.fn().mockResolvedValue(null),
  },
}));

const mockCourse = {
  _id: 'c200',
  title: 'Full-Stack Testing Essentials',
};

const mockCurriculum = [
  {
    _id: 'm1',
    title: 'Unit Testing with Vitest',
    order: 1,
    lessons: [
      {
        _id: 'l1',
        title: 'Writing Unit Tests',
        contentType: 'text',
        content: 'Unit tests should test pure logic and isolated components.',
        order: 1,
      },
      {
        _id: 'l2',
        title: 'Mocking Dependencies',
        contentType: 'video',
        resourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        content: 'Video guide on vi.mock and vi.fn spies.',
        order: 2,
      },
    ],
  },
  {
    _id: 'm2',
    title: 'Integration Testing',
    order: 2,
    lessons: [
      {
        _id: 'l3',
        title: 'Testing Library Best Practices',
        contentType: 'link',
        resourceUrl: 'https://testing-library.com/docs/',
        content: 'Official documentation and accessibility query guides.',
        order: 1,
      },
    ],
  },
];

const mockEnrollment = {
  _id: 'enr200',
  status: 'in_progress',
  progressPercentage: 33,
  completedLessons: ['l1'],
  course: { _id: 'c200' },
};

const renderPlayer = (initialPath = '/learn/c200') => {
  const authValue = {
    user: { _id: 'u1', name: 'Learner One', role: 'employee' },
    isAuthenticated: true,
    loading: false,
  };

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ToastProvider>
        <AuthContext.Provider value={authValue}>
          <Routes>
            <Route path="/learn/:courseId" element={<LearningPlayerPage />} />
            <Route
              path="/learn/:courseId/module/:moduleId/lesson/:lessonId"
              element={<LearningPlayerPage />}
            />
          </Routes>
        </AuthContext.Provider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('LearningPlayerPage (Automatic Lesson Completion & Progress Flow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    courseService.getCourseById.mockResolvedValue(mockCourse);
    courseService.getCourseCurriculum.mockResolvedValue(mockCurriculum);
    enrollmentService.getCourseEnrollment.mockResolvedValue(mockEnrollment);
  });

  it('17. renders module navigation tree in sidebar', async () => {
    renderPlayer();

    await waitFor(() => {
      expect(screen.getAllByText('Unit Testing with Vitest').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('Integration Testing')).toBeInTheDocument();
  });

  it('18. renders lessons in correct sequence within their modules', async () => {
    renderPlayer();

    await waitFor(() => {
      expect(screen.getByText('Writing Unit Tests')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Mocking Dependencies').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Testing Library Best Practices')).toBeInTheDocument();
  });

  it('19. renders resume lesson content by default (first incomplete lesson)', async () => {
    renderPlayer();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Mocking Dependencies');
    });
    expect(screen.getByText(/Video guide on vi.mock and vi.fn spies/i)).toBeInTheDocument();
  });

  it('20. renders video player embed for video content type', async () => {
    renderPlayer('/learn/c200/module/m1/lesson/l2');

    await waitFor(() => {
      const iframe = screen.getByTitle('Mocking Dependencies');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', expect.stringContaining('youtube.com/embed/'));
    });
  });

  it('20b. renders external resource link for link content type', async () => {
    renderPlayer('/learn/c200/module/m2/lesson/l3');

    await waitFor(() => {
      expect(screen.getByText(/External Learning Resource/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /visit resource/i })).toBeInTheDocument();
  });

  it('21. visually marks completed lessons in sidebar and header', async () => {
    renderPlayer('/learn/c200/module/m1/lesson/l1');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument();
    });
  });

  it('22a. clicking Next Lesson on an already completed lesson advances immediately without calling updateProgress', async () => {
    renderPlayer('/learn/c200/module/m1/lesson/l1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Writing Unit Tests');
    });

    const nextBtn = screen.getByRole('button', { name: /next lesson/i });
    expect(nextBtn).toBeEnabled();
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Mocking Dependencies');
    });
    expect(enrollmentService.updateProgress).not.toHaveBeenCalled();
  });

  it('22b. clicking Next Lesson on an INCOMPLETE lesson automatically calls updateProgress and advances only after backend success', async () => {
    enrollmentService.updateProgress.mockResolvedValue({
      _id: 'enr200',
      status: 'in_progress',
      progressPercentage: 67,
      completedLessons: ['l1', 'l2'],
    });

    renderPlayer('/learn/c200/module/m1/lesson/l2');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Mocking Dependencies');
    });

    const nextBtn = screen.getByRole('button', { name: /next lesson/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(enrollmentService.updateProgress).toHaveBeenCalledWith(
        'enr200',
        'l2',
        true,
        { moduleId: 'm1', courseId: 'c200' }
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Testing Library Best Practices');
    });
  });

  it('22c. next lesson does NOT open if updateProgress fails, displays error, and stays on current lesson', async () => {
    enrollmentService.updateProgress.mockRejectedValue(new Error('Network failure while saving progress'));

    renderPlayer('/learn/c200/module/m1/lesson/l2');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Mocking Dependencies');
    });

    const nextBtn = screen.getByRole('button', { name: /next lesson/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(enrollmentService.updateProgress).toHaveBeenCalled();
    });

    // Stays on l2
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Mocking Dependencies');
  });

  it('23a. clicking Previous Lesson navigates back without calling updateProgress', async () => {
    renderPlayer('/learn/c200/module/m1/lesson/l2');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Mocking Dependencies');
    });

    const prevBtn = screen.getByRole('button', { name: /previous lesson/i });
    expect(prevBtn).toBeEnabled();
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Writing Unit Tests');
    });
    expect(enrollmentService.updateProgress).not.toHaveBeenCalled();
  });

  it('23b. Previous Lesson button is disabled on the first lesson', async () => {
    renderPlayer('/learn/c200/module/m1/lesson/l1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Writing Unit Tests');
    });

    const prevBtn = screen.getByRole('button', { name: /previous lesson/i });
    expect(prevBtn).toBeDisabled();
  });

  it('24. manual mark-as-complete button updates progress with module and course context', async () => {
    enrollmentService.updateProgress.mockResolvedValue({
      _id: 'enr200',
      status: 'in_progress',
      progressPercentage: 67,
      completedLessons: ['l1', 'l2'],
    });

    renderPlayer('/learn/c200/module/m1/lesson/l2');

    const markBtn = await screen.findByRole('button', { name: /mark as complete/i });
    fireEvent.click(markBtn);

    await waitFor(() => {
      expect(enrollmentService.updateProgress).toHaveBeenCalledWith(
        'enr200',
        'l2',
        true,
        { moduleId: 'm1', courseId: 'c200' }
      );
    });

    expect(await screen.findByRole('button', { name: /completed/i })).toBeInTheDocument();
    expect(screen.getByText('67% Complete')).toBeInTheDocument();
  });

  it('25. reverts state when progress update request fails and does not falsely mark lesson', async () => {
    enrollmentService.updateProgress.mockRejectedValue(new Error('Network error'));

    renderPlayer('/learn/c200/module/m1/lesson/l2');

    const markBtn = await screen.findByRole('button', { name: /mark as complete/i });
    fireEvent.click(markBtn);

    await waitFor(() => {
      expect(enrollmentService.updateProgress).toHaveBeenCalled();
    });

    expect(screen.getByRole('button', { name: /mark as complete/i })).toBeInTheDocument();
  });

  it('30. selecting an upcoming lesson from sidebar automatically completes current lesson before navigating', async () => {
    enrollmentService.updateProgress.mockResolvedValue({
      _id: 'enr200',
      status: 'in_progress',
      progressPercentage: 67,
      completedLessons: ['l1', 'l2'],
    });

    // Start on incomplete lesson l2
    renderPlayer('/learn/c200/module/m1/lesson/l2');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Mocking Dependencies');
    });

    // Click upcoming lesson l3 in sidebar
    const l3Button = screen.getByRole('button', { name: /testing library best practices/i });
    fireEvent.click(l3Button);

    await waitFor(() => {
      expect(enrollmentService.updateProgress).toHaveBeenCalledWith(
        'enr200',
        'l2',
        true,
        { moduleId: 'm1', courseId: 'c200' }
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Testing Library Best Practices');
    });
  });

  it('31. on final lesson, Next Lesson is replaced with Complete Course and does not attempt to navigate past end', async () => {
    renderPlayer('/learn/c200/module/m2/lesson/l3');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Testing Library Best Practices');
    });

    expect(screen.queryByRole('button', { name: /^next lesson$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete course/i })).toBeInTheDocument();
  });

  it('32. completing final lesson marks course 100% and displays assessment unlock banner', async () => {
    enrollmentService.updateProgress.mockResolvedValue({
      _id: 'enr200',
      status: 'completed',
      progressPercentage: 100,
      completedLessons: ['l1', 'l2', 'l3'],
    });

    assessmentService.getCourseAssessmentStatus.mockResolvedValue({
      hasAssessment: true,
      assessment: { id: 'asm-999', title: 'Full-Stack Testing Certification' },
      isEligible: true,
    });

    renderPlayer('/learn/c200/module/m2/lesson/l3');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Testing Library Best Practices');
    });

    const completeBtn = screen.getByRole('button', { name: /complete course/i });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(enrollmentService.updateProgress).toHaveBeenCalledWith(
        'enr200',
        'l3',
        true,
        { moduleId: 'm2', courseId: 'c200' }
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('assessment-unlock-banner')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /take certification exam/i })).toBeInTheDocument();
  });

  it('26-28. supports accessible sidebar toggle and mobile menu', async () => {
    renderPlayer('/learn/c200');

    await waitFor(() => {
      expect(screen.getByLabelText(/open curriculum sidebar/i)).toBeInTheDocument();
    });

    const mobileMenuBtn = screen.getByLabelText(/open curriculum sidebar/i);
    fireEvent.click(mobileMenuBtn);

    expect(screen.getAllByText('Unit Testing with Vitest').length).toBeGreaterThanOrEqual(1);
  });

  it('29. handles unenrolled employee by redirecting to course details', async () => {
    enrollmentService.getCourseEnrollment.mockResolvedValue(null);

    renderPlayer('/learn/c200');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/courses/c200', { replace: true });
    });
  });
});
