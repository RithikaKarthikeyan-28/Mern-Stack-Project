import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EmployeeDashboard from '../EmployeeDashboard';
import AuthContext from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import enrollmentService from '../../services/enrollmentService';
import certificateService from '../../services/certificateService';
import complianceService from '../../services/complianceService';
import skillService from '../../services/skillService';
import notificationService from '../../services/notificationService';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/enrollmentService', () => ({
  default: {
    getMyEnrollments: vi.fn(),
    getCourseEnrollment: vi.fn(),
  },
}));

vi.mock('../../services/certificateService', () => ({
  default: {
    getMyCertificates: vi.fn(),
  },
}));

vi.mock('../../services/complianceService', () => ({
  default: {
    getMyComplianceSummary: vi.fn(),
    getMyComplianceAssignments: vi.fn(),
  },
}));

vi.mock('../../services/skillService', () => ({
  default: {
    getMySkills: vi.fn(),
    getJobRoles: vi.fn(),
    getMySkillGap: vi.fn(),
  },
}));

vi.mock('../../services/notificationService', () => ({
  default: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

const mockUser = {
  _id: 'emp123',
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'employee',
};

const mockEnrollments = [
  {
    _id: 'enr1',
    status: 'in_progress',
    progressPercentage: 60,
    course: {
      _id: 'c1',
      title: 'Advanced React Architecture',
      category: 'Engineering',
      duration: 120,
    },
  },
  {
    _id: 'enr2',
    status: 'enrolled',
    progressPercentage: 0,
    course: {
      _id: 'c2',
      title: 'Cloud Security Fundamentals',
      category: 'Security',
      duration: 90,
    },
  },
  {
    _id: 'enr3',
    status: 'completed',
    progressPercentage: 100,
    completedAt: '2026-10-01T10:00:00Z',
    course: {
      _id: 'c3',
      title: 'Docker Essentials',
      category: 'DevOps',
      duration: 60,
    },
  },
  {
    _id: 'enr4',
    status: 'dropped',
    progressPercentage: 10,
    course: {
      _id: 'c4',
      title: 'Legacy Cobol',
      category: 'Legacy',
      duration: 30,
    },
  },
];

const mockCertificates = {
  certificates: [
    {
      _id: 'cert1',
      certificateNumber: 'CERT-2026-001',
      status: 'active',
      issuedAt: '2026-10-02T12:00:00Z',
      course: { title: 'Docker Essentials' },
    },
  ],
  pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

const mockComplianceSummary = {
  totalRequirements: 5,
  totalAssignments: 5,
  compliant: 4,
  dueSoon: 1,
  overdue: 0,
  complianceRate: 80,
};

const mockSkills = {
  employeeSkills: [{ skillId: 's1', proficiencyLevel: 3 }],
  total: 4,
};

const mockJobRoles = [
  { _id: 'role1', title: 'Senior Software Engineer' },
];

const mockSkillGap = {
  summary: {
    overallMatchPercentage: 75,
    totalRequirements: 4,
    meetsRequiredSkills: 3,
    belowRequiredSkills: 1,
    missingSkills: 0,
  },
};

const mockNotifications = {
  notifications: [
    {
      _id: 'notif1',
      title: 'New Assessment Assigned',
      message: 'You have been assigned the React quiz.',
      isRead: false,
      createdAt: '2026-10-06T10:00:00Z',
    },
  ],
  pagination: { total: 1, page: 1, limit: 3, totalPages: 1 },
};

const renderDashboard = (userOverrides = {}) => {
  const authValue = {
    user: { ...mockUser, ...userOverrides },
    isAuthenticated: true,
    loading: false,
  };

  return render(
    <MemoryRouter>
      <ToastProvider>
        <AuthContext.Provider value={authValue}>
          <EmployeeDashboard />
        </AuthContext.Provider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('EmployeeDashboard (Phase F3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    enrollmentService.getMyEnrollments.mockResolvedValue(mockEnrollments);
    certificateService.getMyCertificates.mockResolvedValue(mockCertificates);
    complianceService.getMyComplianceSummary.mockResolvedValue(mockComplianceSummary);
    skillService.getMySkills.mockResolvedValue(mockSkills);
    skillService.getJobRoles.mockResolvedValue(mockJobRoles);
    skillService.getMySkillGap.mockResolvedValue(mockSkillGap);
    notificationService.getNotifications.mockResolvedValue(mockNotifications);
  });

  // 1. Personalized greeting
  it('1. renders personalized greeting based on time of day', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    const greetingHeading = screen.getByRole('heading', { level: 1 });
    expect(greetingHeading.textContent).toMatch(/Good (morning|afternoon|evening)/i);
  });

  // 2. Uses authenticated user name from context
  it('2. uses authenticated user name from context', async () => {
    renderDashboard({ name: 'Jane Doe' });

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Jane Doe');
  });

  // 3. Renders loading skeleton while fetching
  it('3. renders loading skeleton while fetching data', () => {
    enrollmentService.getMyEnrollments.mockReturnValue(new Promise(() => {}));
    certificateService.getMyCertificates.mockReturnValue(new Promise(() => {}));
    complianceService.getMyComplianceSummary.mockReturnValue(new Promise(() => {}));
    skillService.getMySkills.mockReturnValue(new Promise(() => {}));
    notificationService.getNotifications.mockReturnValue(new Promise(() => {}));

    renderDashboard();

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  // 4. Renders KPI data correctly
  it('4. renders KPI metrics correctly', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    // Learning Progress: (60 + 0) / 2 = 30%
    expect(screen.getByText('Learning Progress')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    // Courses Completed
    expect(screen.getByText('Courses Completed')).toBeInTheDocument();
    // Active Certificates
    expect(screen.getByText('Active Certificates')).toBeInTheDocument();
    // Compliance Status: 80%
    expect(screen.getByText('Compliance Status')).toBeInTheDocument();
    expect(screen.getAllByText('80%').length).toBeGreaterThanOrEqual(1);
  });

  // 5. Renders active learning courses (enrolled / in_progress)
  it('5. renders active learning courses in Continue Learning', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Advanced React Architecture')).toBeInTheDocument();
    expect(screen.getByText('Cloud Security Fundamentals')).toBeInTheDocument();
  });

  // 6. Excludes completed and dropped courses from continue learning
  it('6. excludes completed and dropped courses from continue learning cards', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    // In Continue Learning section
    expect(screen.queryByText('Legacy Cobol')).not.toBeInTheDocument();
    // Docker Essentials is completed; check that it does not appear as a course card in continue learning
    // Note: Docker Essentials is also in certificate description, but under Continue Learning it shouldn't have a continue button
    expect(screen.getAllByRole('button', { name: /continue learning/i })).toHaveLength(2);
  });

  // 7. Renders empty state when no enrollments exist
  it('7. renders empty state when no active enrollments exist', async () => {
    enrollmentService.getMyEnrollments.mockResolvedValue([]);
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Start your learning journey')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse courses/i })).toBeInTheDocument();
  });

  // 8. Renders certificate summary
  it('8. renders certificate summary and credentials', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/1 Active Certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/1 total issued/i)).toBeInTheDocument();
    expect(screen.getAllByText(/CERT-2026-001/i).length).toBeGreaterThanOrEqual(1);
  });

  // 9. Renders notifications preview with relative time
  it('9. renders notifications preview with relative time', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getAllByText('New Assessment Assigned').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('You have been assigned the React quiz.').length).toBeGreaterThanOrEqual(1);
  });

  // 10. Renders notification empty state when empty
  it('10. renders notification empty state when no notifications exist', async () => {
    notificationService.getNotifications.mockResolvedValue({ notifications: [] });
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
  });

  // 11. Renders skill summary when available
  it('11. renders skill summary when skill gap data is available', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Overall Skill Match')).toBeInTheDocument();
    expect(screen.getAllByText('75%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/3 of 4 role requirements met/i)).toBeInTheDocument();
  });

  // 12. Renders compliance summary when available
  it('12. renders compliance summary when available', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Compliance Standing')).toBeInTheDocument();
    expect(screen.getByText('Attention Required')).toBeInTheDocument();
    expect(screen.getByText(/4 of 5 requirements fulfilled/i)).toBeInTheDocument();
  });

  // 13. Handles individual API failure gracefully (per-section error state)
  it('13. handles individual API failure gracefully with section error state', async () => {
    enrollmentService.getMyEnrollments.mockRejectedValue(new Error('Network error'));
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Unable to load learning data')).toBeInTheDocument();
    // Other cards should still render successfully
    expect(screen.getByText('Compliance Overview')).toBeInTheDocument();
    expect(screen.getByText('Certificates')).toBeInTheDocument();
  });

  // 14. Section retry button works
  it('14. re-fetches section data when retry button is clicked', async () => {
    enrollmentService.getMyEnrollments.mockRejectedValueOnce(new Error('Network error'));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Unable to load learning data')).toBeInTheDocument();
    });

    enrollmentService.getMyEnrollments.mockResolvedValue(mockEnrollments);

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Advanced React Architecture')).toBeInTheDocument();
    });
  });

  // 15. Dashboard action buttons navigate correctly
  it('15. navigates when action buttons are clicked', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    // Click Continue Learning button
    const continueBtns = screen.getAllByRole('button', { name: /continue learning/i });
    fireEvent.click(continueBtns[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/my-learning');

    // Click Explore Skill Benchmarks
    const skillBtn = screen.getByRole('button', { name: /explore skill benchmarks/i });
    fireEvent.click(skillBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/skills');

    // Click View All Certificates
    const certBtn = screen.getByRole('button', { name: /view all certificates/i });
    fireEvent.click(certBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/certificates');

    // Click Open Notifications Center
    const notifBtn = screen.getByRole('button', { name: /open notifications center/i });
    fireEvent.click(notifBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/notifications');

    // Click Review Compliance Requirements
    const complianceBtn = screen.getByRole('button', { name: /review compliance requirements/i });
    fireEvent.click(complianceBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/compliance');
  });

  // 16. Refresh button updates dashboard data
  it('16. refreshes dashboard data when Refresh button is clicked', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /refresh employee dashboard/i });
    expect(refreshBtn).toBeInTheDocument();

    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(enrollmentService.getMyEnrollments).toHaveBeenCalledTimes(2);
      expect(certificateService.getMyCertificates).toHaveBeenCalledTimes(2);
    });
  });
});
