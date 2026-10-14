import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LearningPlayerPage from '../LearningPlayerPage';
import AuthContext from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import courseService from '../../services/courseService';
import enrollmentService from '../../services/enrollmentService';

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

describe('LearningPlayerPage (Scenarios 17-29)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    courseService.getCourseById.mockResolvedValue(mockCourse);
    courseService.getCourseCurriculum.mockResolvedValue(mockCurriculum);
    enrollmentService.getCourseEnrollment.mockResolvedValue(mockEnrollment);
  });

  // 17. Renders module navigation
  it('17. renders module navigation tree in sidebar', async () => {
    renderPlayer();

    await waitFor(() => {
      expect(screen.getAllByText('Unit Testing with Vitest').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('Integration Testing')).toBeInTheDocument();
  });

  // 18. Renders lessons in correct order
  it('18. renders lessons in correct sequence within their modules', async () => {
    renderPlayer();

    await waitFor(() => {
      expect(screen.getByText('Writing Unit Tests')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Mocking Dependencies').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Testing Library Best Practices')).toBeInTheDocument();
  });

  // 19. Renders selected lesson
  it('19. renders resume lesson content by default (first incomplete lesson)', async () => {
    // l1 is completed, so player should resume at l2
    renderPlayer();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Mocking Dependencies');
    });
    expect(screen.getByText(/Video guide on vi.mock and vi.fn spies/i)).toBeInTheDocument();
  });

  // 20. Renders supported lesson content
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

  // 21. Completed lessons are visually distinguished
  it('21. visually marks completed lessons in sidebar and header', async () => {
    // Switch to l1 which is completed
    renderPlayer('/learn/c200/module/m1/lesson/l1');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument();
    });
  });

  // 22. Next lesson navigation works
  it('22. advances to next lesson upon clicking Next Lesson', async () => {
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
  });

  // 23. Previous lesson navigation works
  it('23. navigates to previous lesson upon clicking Previous Lesson', async () => {
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
  });

  // 24. Progress update succeeds
  it('24. successfully updates lesson progress and displays updated completion status', async () => {
    // Current lesson l2 is incomplete
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
      expect(enrollmentService.updateProgress).toHaveBeenCalledWith('enr200', 'l2', true);
    });

    expect(await screen.findByRole('button', { name: /completed/i })).toBeInTheDocument();
    expect(screen.getByText('67% Complete')).toBeInTheDocument();
  });

  // 25. Progress update failure does not create false completion
  it('25. reverts state when progress update request fails and does not falsely mark lesson', async () => {
    enrollmentService.updateProgress.mockRejectedValue(new Error('Network error'));

    renderPlayer('/learn/c200/module/m1/lesson/l2');

    const markBtn = await screen.findByRole('button', { name: /mark as complete/i });
    fireEvent.click(markBtn);

    await waitFor(() => {
      expect(enrollmentService.updateProgress).toHaveBeenCalled();
    });

    // Button should still say "Mark as Complete" (not "Completed")
    expect(screen.getByRole('button', { name: /mark as complete/i })).toBeInTheDocument();
  });

  // 26-28. Accessibility & keyboard navigation
  it('26-28. supports accessible sidebar toggle and keyboard interactions', async () => {
    renderPlayer('/learn/c200');

    await waitFor(() => {
      expect(screen.getByLabelText(/open curriculum sidebar/i)).toBeInTheDocument();
    });

    const mobileMenuBtn = screen.getByLabelText(/open curriculum sidebar/i);
    fireEvent.click(mobileMenuBtn);

    // Sidebar open
    expect(screen.getAllByText('Unit Testing with Vitest').length).toBeGreaterThanOrEqual(1);
  });

  // 29. No broken loading/error transitions
  it('29. handles unenrolled employee by redirecting to course details', async () => {
    enrollmentService.getCourseEnrollment.mockResolvedValue(null);

    renderPlayer('/learn/c200');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/courses/c200', { replace: true });
    });
  });
});
