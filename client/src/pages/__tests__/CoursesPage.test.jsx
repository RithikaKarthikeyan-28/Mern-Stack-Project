import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CoursesPage from '../CoursesPage';
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
    getCourses: vi.fn(),
  },
}));

vi.mock('../../services/enrollmentService', () => ({
  default: {
    getMyEnrollments: vi.fn(),
  },
}));

const mockCourses = [
  {
    _id: 'c1',
    title: 'Full-Stack React Architecture',
    description: 'Learn modern React patterns, state management, and testing.',
    category: 'Engineering',
    level: 'intermediate',
    duration: 180,
    trainer: { name: 'John Doe' },
  },
  {
    _id: 'c2',
    title: 'Cybersecurity Fundamentals',
    description: 'Core concepts in information security and zero trust.',
    category: 'Security',
    level: 'beginner',
    duration: 90,
    trainer: { name: 'Alice Smith' },
  },
  {
    _id: 'c3',
    title: 'DevOps & CI/CD Pipelines',
    description: 'Automated continuous integration and deployment.',
    category: 'DevOps',
    level: 'advanced',
    duration: 240,
    trainer: { name: 'Bob Jones' },
  },
];

const mockEnrollments = [
  {
    _id: 'enr1',
    status: 'in_progress',
    progressPercentage: 50,
    course: { _id: 'c1' },
  },
];

const renderCoursesPage = () => {
  const authValue = {
    user: { _id: 'u1', name: 'Test Learner', role: 'employee' },
    isAuthenticated: true,
    loading: false,
  };

  return render(
    <MemoryRouter>
      <ToastProvider>
        <AuthContext.Provider value={authValue}>
          <CoursesPage />
        </AuthContext.Provider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('CoursesPage (Scenarios 1-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    courseService.getCourses.mockResolvedValue(mockCourses);
    enrollmentService.getMyEnrollments.mockResolvedValue(mockEnrollments);
  });

  // 1. Renders course page
  it('1. renders course discovery page with hero banner and filters', async () => {
    renderCoursesPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Explore Courses/i);
    expect(screen.getByPlaceholderText(/search courses/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('courses-loading-skeleton')).not.toBeInTheDocument();
    });
  });

  // 2. Renders loading skeleton
  it('2. renders loading skeleton while courses are fetching', () => {
    courseService.getCourses.mockReturnValue(new Promise(() => {}));
    enrollmentService.getMyEnrollments.mockReturnValue(new Promise(() => {}));
    renderCoursesPage();

    expect(screen.getByTestId('courses-loading-skeleton')).toBeInTheDocument();
  });

  // 3. Renders available courses
  it('3. renders available courses with category, level, and enrollment badges', async () => {
    renderCoursesPage();

    await waitFor(() => {
      expect(screen.getByText('Full-Stack React Architecture')).toBeInTheDocument();
    });

    expect(screen.getByText('Cybersecurity Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('DevOps & CI/CD Pipelines')).toBeInTheDocument();

    // Check enrollment badge on c1
    expect(screen.getAllByText('Enrolled').length).toBeGreaterThanOrEqual(1);
  });

  // 4. Renders empty state
  it('4. renders empty state when no courses exist in catalog', async () => {
    courseService.getCourses.mockResolvedValue([]);
    renderCoursesPage();

    await waitFor(() => {
      expect(screen.getByText('No published courses available')).toBeInTheDocument();
    });
  });

  // 5. Renders API error
  it('5. renders error state when course retrieval fails', async () => {
    courseService.getCourses.mockRejectedValue(new Error('Network error'));
    renderCoursesPage();

    await waitFor(() => {
      expect(screen.getByText('Unable to load courses')).toBeInTheDocument();
    });
  });

  // 6. Retry works
  it('6. re-fetches courses when retry button is clicked', async () => {
    courseService.getCourses.mockRejectedValueOnce(new Error('Network error'));
    renderCoursesPage();

    await waitFor(() => {
      expect(screen.getByText('Unable to load courses')).toBeInTheDocument();
    });

    courseService.getCourses.mockResolvedValue(mockCourses);
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Full-Stack React Architecture')).toBeInTheDocument();
    });
  });

  // 7. Search filters courses
  it('7. filters courses by search query', async () => {
    renderCoursesPage();

    await waitFor(() => {
      expect(screen.getByText('Full-Stack React Architecture')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search courses/i);
    fireEvent.change(searchInput, { target: { value: 'Cybersecurity' } });

    expect(screen.getByText('Cybersecurity Fundamentals')).toBeInTheDocument();
    expect(screen.queryByText('Full-Stack React Architecture')).not.toBeInTheDocument();
    expect(screen.queryByText('DevOps & CI/CD Pipelines')).not.toBeInTheDocument();
  });

  // 8. Category filter works
  it('8. filters courses by category select option', async () => {
    renderCoursesPage();

    await waitFor(() => {
      expect(screen.getByText('Full-Stack React Architecture')).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText(/filter by category/i);
    fireEvent.change(categorySelect, { target: { value: 'DevOps' } });

    expect(screen.getByText('DevOps & CI/CD Pipelines')).toBeInTheDocument();
    expect(screen.queryByText('Full-Stack React Architecture')).not.toBeInTheDocument();
    expect(screen.queryByText('Cybersecurity Fundamentals')).not.toBeInTheDocument();
  });

  // Navigation from cards
  it('navigates to course details or player upon clicking action button', async () => {
    renderCoursesPage();

    await waitFor(() => {
      expect(screen.getByText('Full-Stack React Architecture')).toBeInTheDocument();
    });

    // Enrolled course action button -> /learn/c1
    const continueBtn = screen.getByRole('button', { name: /continue learning/i });
    fireEvent.click(continueBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/learn/c1');

    // Unenrolled course card click -> /courses/c2
    const unenrolledCard = screen.getByTestId('course-card-c2');
    fireEvent.click(unenrolledCard);
    expect(mockNavigate).toHaveBeenCalledWith('/courses/c2');
  });
});
