import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyLearningPage from '../MyLearningPage';
import AuthContext from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import enrollmentService from '../../services/enrollmentService';
import assessmentService from '../../services/assessmentService';

vi.mock('../../services/enrollmentService', () => ({
  default: {
    getMyEnrollments: vi.fn(),
  },
}));

vi.mock('../../services/assessmentService', () => ({
  default: {
    getCourseAssessmentStatus: vi.fn(),
  },
}));

const mockEnrollments = [
  {
    _id: 'enr1',
    status: 'in_progress',
    progressPercentage: 50,
    totalLessons: 4,
    completedLessonsCount: 2,
    completedLessons: ['l1', 'l2'],
    course: {
      _id: 'c1',
      title: 'Java Programming Fundamentals',
      category: 'Programming',
      description: 'Master Java syntax and OOP principles.',
      duration: 8,
    },
  },
  {
    _id: 'enr2',
    status: 'enrolled',
    progressPercentage: 0,
    totalLessons: 4,
    completedLessonsCount: 0,
    completedLessons: [],
    course: {
      _id: 'c2',
      title: 'React.js Development',
      category: 'Web Development',
      description: 'Modern front-end architecture with React.',
      duration: 10,
    },
  },
  {
    _id: 'enr3',
    status: 'completed',
    progressPercentage: 100,
    totalLessons: 4,
    completedLessonsCount: 4,
    completedLessons: ['l1', 'l2', 'l3', 'l4'],
    course: {
      _id: 'c3',
      title: 'SQL and Database Management',
      category: 'Database & Storage',
      description: 'Relational database schema design and queries.',
      duration: 6,
    },
  },
];

const mockUser = {
  id: 'u1',
  name: 'Rithika Learner',
  email: 'rithika@skilltrack.test',
  role: 'employee',
};

const renderComponent = () => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
      <ToastProvider>
        <MemoryRouter>
          <MyLearningPage />
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>
  );
};

describe('MyLearningPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService.getMyEnrollments.mockResolvedValue(mockEnrollments);
    assessmentService.getCourseAssessmentStatus.mockImplementation(async (courseId) => {
      if (courseId === 'c3') {
        return {
          hasAssessment: true,
          assessmentId: 'asm3',
          isUnlocked: true,
          hasPassed: true,
          certificate: { id: 'cert3', certificateNumber: 'SKILLTRACK-2026-SQL001' },
        };
      }
      return null;
    });
  });

  it('renders hero banner and page header', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /my learning/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Enrolled Curriculum Progress/i)).toBeInTheDocument();
  });

  it('renders actual employee enrollments with progress and lesson counts', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Java Programming Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('React.js Development')).toBeInTheDocument();
      expect(screen.getByText('SQL and Database Management')).toBeInTheDocument();
    });

    // Check lesson counts and progress percentages
    expect(screen.getByText('2 of 4 lessons')).toBeInTheDocument();
    expect(screen.getByText('0 of 4 lessons')).toBeInTheDocument();
    expect(screen.getByText('4 of 4 lessons')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays correct action buttons based on enrollment progress', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Java Programming Fundamentals')).toBeInTheDocument();
    });

    // 0% progress course has "Start Learning"
    expect(screen.getByRole('button', { name: /start learning/i })).toBeInTheDocument();
    // 50% progress course has "Continue Learning"
    expect(screen.getByRole('button', { name: /continue learning/i })).toBeInTheDocument();
    // 100% progress course has "Review Lessons"
    expect(screen.getByRole('button', { name: /review lessons/i })).toBeInTheDocument();
  });

  it('displays certificate badge and button for completed course with certificate', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Certificate Earned!/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /view official certificate/i })).toBeInTheDocument();
  });

  it('filters courses by status tab', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Java Programming Fundamentals')).toBeInTheDocument();
    });

    // Click "Completed" tab
    fireEvent.click(screen.getByRole('button', { name: /completed \(1\)/i }));

    expect(screen.getByText('SQL and Database Management')).toBeInTheDocument();
    expect(screen.queryByText('Java Programming Fundamentals')).not.toBeInTheDocument();
    expect(screen.queryByText('React.js Development')).not.toBeInTheDocument();

    // Click "In Progress" tab
    fireEvent.click(screen.getByRole('button', { name: /in progress \(1\)/i }));

    expect(screen.getByText('Java Programming Fundamentals')).toBeInTheDocument();
    expect(screen.queryByText('SQL and Database Management')).not.toBeInTheDocument();
  });

  it('filters courses by search query', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Java Programming Fundamentals')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search enrolled courses/i);
    fireEvent.change(searchInput, { target: { value: 'react' } });

    expect(screen.getByText('React.js Development')).toBeInTheDocument();
    expect(screen.queryByText('Java Programming Fundamentals')).not.toBeInTheDocument();
    expect(screen.queryByText('SQL and Database Management')).not.toBeInTheDocument();
  });

  it('renders polished empty state with Browse Courses button when employee has no enrollments', async () => {
    enrollmentService.getMyEnrollments.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No Enrolled Courses Yet/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /browse all courses/i })).toBeInTheDocument();
  });

  it('renders error state with retry option on API failure', async () => {
    enrollmentService.getMyEnrollments.mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Unable to Load My Learning/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
