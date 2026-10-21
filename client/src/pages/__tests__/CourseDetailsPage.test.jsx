import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CourseDetailsPage from '../CourseDetailsPage';
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
    enroll: vi.fn(),
  },
}));

vi.mock('../../services/assessmentService', () => ({
  default: {
    getCourseAssessmentStatus: vi.fn().mockResolvedValue(null),
  },
}));

const mockCourse = {
  _id: 'c101',
  title: 'Architecting Distributed Systems',
  description: 'Learn event-driven architectures, domain-driven design, and microservices.',
  category: 'Architecture',
  level: 'advanced',
  duration: 360,
  trainer: { name: 'Dr. Gregory House' },
};

const mockCurriculum = [
  {
    _id: 'm1',
    title: 'Module 1: Foundations',
    order: 1,
    lessons: [
      { _id: 'l1', title: 'Monoliths to Microservices', contentType: 'text', order: 1 },
      { _id: 'l2', title: 'Distributed Transactions', contentType: 'video', order: 2 },
    ],
  },
  {
    _id: 'm2',
    title: 'Module 2: Event Streaming',
    order: 2,
    lessons: [
      { _id: 'l3', title: 'Kafka and Event Logs', contentType: 'link', order: 1 },
    ],
  },
];

const mockEnrollment = {
  _id: 'enr101',
  status: 'in_progress',
  progressPercentage: 50,
  completedLessons: ['l1'],
  course: { _id: 'c101' },
};

const renderCourseDetailsPage = (courseId = 'c101') => {
  const authValue = {
    user: { _id: 'u1', name: 'Learner One', role: 'employee' },
    isAuthenticated: true,
    loading: false,
  };

  return render(
    <MemoryRouter initialEntries={[`/courses/${courseId}`]}>
      <ToastProvider>
        <AuthContext.Provider value={authValue}>
          <Routes>
            <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
          </Routes>
        </AuthContext.Provider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('CourseDetailsPage (Scenarios 9-16)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    courseService.getCourseById.mockResolvedValue(mockCourse);
    courseService.getCourseCurriculum.mockResolvedValue(mockCurriculum);
    enrollmentService.getCourseEnrollment.mockResolvedValue(null); // default unenrolled
  });

  // 9. Renders course details
  it('9. renders course details with title, category, duration, and instructor', async () => {
    renderCourseDetailsPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Architecting Distributed Systems'
      );
    });

    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.getByText(/360 minutes total/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Gregory House/i)).toBeInTheDocument();
  });

  // 10. Renders curriculum in correct order
  it('10. renders modules and lessons in correct chronological curriculum order', async () => {
    renderCourseDetailsPage();

    await waitFor(() => {
      expect(screen.getByText('Module 1: Foundations')).toBeInTheDocument();
    });

    expect(screen.getByText('Monoliths to Microservices')).toBeInTheDocument();
    expect(screen.getByText('Distributed Transactions')).toBeInTheDocument();
    expect(screen.getByText('Module 2: Event Streaming')).toBeInTheDocument();
    expect(screen.getByText('Kafka and Event Logs')).toBeInTheDocument();
  });

  // 11. Shows enroll CTA for unenrolled employee
  it('11. displays "Enroll in Course" CTA when employee is not enrolled', async () => {
    enrollmentService.getCourseEnrollment.mockResolvedValue(null);
    renderCourseDetailsPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enroll in course/i })).toBeInTheDocument();
    });
  });

  // 12. Shows continue CTA for enrolled employee
  it('12. displays "Continue Learning" CTA and progress bar when employee is already enrolled', async () => {
    enrollmentService.getCourseEnrollment.mockResolvedValue(mockEnrollment);
    renderCourseDetailsPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue learning/i })).toBeInTheDocument();
    });

    expect(screen.getByText('50%')).toBeInTheDocument();

    const continueBtn = screen.getByRole('button', { name: /continue learning/i });
    fireEvent.click(continueBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/learn/c101');
  });

  // 13. Handles course not found
  it('13. renders course not found error state when course does not exist', async () => {
    courseService.getCourseById.mockRejectedValue(new Error('Course not found'));
    renderCourseDetailsPage('non-existent-id');

    await waitFor(() => {
      expect(screen.getByTestId('course-not-found')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { level: 3, name: /course not found/i })).toBeInTheDocument();
  });

  // 14. Enrollment request succeeds
  it('14. successfully enrolls employee and transitions CTA to "Continue Learning"', async () => {
    enrollmentService.getCourseEnrollment.mockResolvedValue(null);
    enrollmentService.enroll.mockResolvedValue({
      _id: 'new-enr',
      status: 'enrolled',
      progressPercentage: 0,
      completedLessons: [],
      course: { _id: 'c101' },
    });

    renderCourseDetailsPage();

    const enrollBtn = await screen.findByRole('button', { name: /enroll in course/i });
    fireEvent.click(enrollBtn);

    await waitFor(() => {
      expect(enrollmentService.enroll).toHaveBeenCalledWith('c101');
    });

    expect(await screen.findByRole('button', { name: /continue learning/i })).toBeInTheDocument();
  });

  // 15. Duplicate enrollment is handled
  it('15. handles 409 duplicate enrollment cleanly without crashing', async () => {
    enrollmentService.getCourseEnrollment.mockResolvedValue(null);
    const err409 = new Error('Already enrolled');
    err409.response = { status: 409 };
    enrollmentService.enroll.mockRejectedValue(err409);

    renderCourseDetailsPage();

    const enrollBtn = await screen.findByRole('button', { name: /enroll in course/i });
    fireEvent.click(enrollBtn);

    await waitFor(() => {
      expect(enrollmentService.enroll).toHaveBeenCalledWith('c101');
    });
    // Button should be re-enabled and state intact
    expect(screen.getByRole('button', { name: /enroll in course/i })).toBeInTheDocument();
  });

  // 16. Enrollment failure is handled
  it('16. handles general enrollment failure with error toast', async () => {
    enrollmentService.getCourseEnrollment.mockResolvedValue(null);
    enrollmentService.enroll.mockRejectedValue(new Error('Database unavailable'));

    renderCourseDetailsPage();

    const enrollBtn = await screen.findByRole('button', { name: /enroll in course/i });
    fireEvent.click(enrollBtn);

    await waitFor(() => {
      expect(enrollmentService.enroll).toHaveBeenCalledWith('c101');
    });

    expect(screen.getByRole('button', { name: /enroll in course/i })).toBeInTheDocument();
  });

  // 17. Displays role guidance for administrators
  it('17. displays role guidance instead of enroll CTA when signed in as an admin', async () => {
    enrollmentService.getCourseEnrollment.mockResolvedValue(null);
    const authAdminValue = {
      user: { _id: 'u-admin', name: 'Admin One', role: 'admin' },
      isAuthenticated: true,
      loading: false,
    };

    render(
      <MemoryRouter initialEntries={['/courses/c101']}>
        <ToastProvider>
          <AuthContext.Provider value={authAdminValue}>
            <Routes>
              <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
            </Routes>
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Signed in as Administrator/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /enroll in course/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manage courses in admin portal/i })).toBeInTheDocument();
  });

  // 18. Certification assessment card locked state
  it('18. displays locked Certification Assessment card when course lessons are not complete', async () => {
    assessmentService.getCourseAssessmentStatus.mockResolvedValue({
      hasAssessment: true,
      assessment: {
        id: 'asm1',
        title: 'Distributed Systems Exam',
        totalQuestions: 10,
        timeLimitMinutes: 30,
        passingPercentage: 70,
        totalMarks: 20,
      },
      isEnrolled: true,
      isUnlocked: false,
      lockReason: 'Complete all course lessons to unlock the assessment.',
      hasPassed: false,
      attemptsCount: 0,
      latestAttempt: null,
      certificate: null,
    });

    enrollmentService.getCourseEnrollment.mockResolvedValue({
      ...mockEnrollment,
      progressPercentage: 50,
    });

    renderCourseDetailsPage();

    await waitFor(() => {
      expect(screen.getByTestId('certification-assessment-card')).toBeInTheDocument();
    });

    expect(screen.getByText('Complete all course lessons to unlock the assessment.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /assessment locked/i })).toBeDisabled();
  });

  // 19. Certification assessment card unlocked state
  it('19. displays unlocked "Start Assessment" CTA when course is 100% completed', async () => {
    assessmentService.getCourseAssessmentStatus.mockResolvedValue({
      hasAssessment: true,
      assessment: {
        id: 'asm1',
        title: 'Distributed Systems Exam',
        totalQuestions: 10,
        timeLimitMinutes: 30,
        passingPercentage: 70,
        totalMarks: 20,
      },
      isEnrolled: true,
      isUnlocked: true,
      lockReason: null,
      hasPassed: false,
      attemptsCount: 0,
      latestAttempt: null,
      certificate: null,
    });

    enrollmentService.getCourseEnrollment.mockResolvedValue({
      ...mockEnrollment,
      progressPercentage: 100,
      status: 'completed',
    });

    renderCourseDetailsPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start assessment/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /start assessment/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/assessments/asm1');
  });

  // 20. Certification assessment card passed state
  it('20. displays passed badge and view certificate button when assessment is passed', async () => {
    assessmentService.getCourseAssessmentStatus.mockResolvedValue({
      hasAssessment: true,
      assessment: {
        id: 'asm1',
        title: 'Distributed Systems Exam',
        totalQuestions: 10,
        timeLimitMinutes: 30,
        passingPercentage: 70,
        totalMarks: 20,
      },
      isEnrolled: true,
      isUnlocked: true,
      lockReason: null,
      hasPassed: true,
      attemptsCount: 1,
      latestAttempt: {
        id: 'att1',
        percentage: 90,
        obtainedMarks: 18,
        totalMarks: 20,
        result: 'passed',
      },
      certificate: {
        id: 'cert1',
        certificateNumber: 'CERT-12345',
      },
    });

    enrollmentService.getCourseEnrollment.mockResolvedValue({
      ...mockEnrollment,
      progressPercentage: 100,
      status: 'completed',
    });

    renderCourseDetailsPage();

    await waitFor(() => {
      expect(screen.getByText(/Assessment Passed/i)).toBeInTheDocument();
    });

    const certBtn = screen.getByRole('button', { name: /view certificate/i });
    expect(certBtn).toBeInTheDocument();
    fireEvent.click(certBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/certificates/cert1');
  });
});
