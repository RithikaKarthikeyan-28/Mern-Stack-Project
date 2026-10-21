import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminAnalyticsPage from '../AdminAnalyticsPage';
import analyticsService from '../../services/analyticsService';
import adminService from '../../services/adminService';

vi.mock('../../services/analyticsService', () => ({
  default: {
    getComprehensiveAnalytics: vi.fn(),
    exportToCSV: vi.fn(),
  },
}));

vi.mock('../../services/adminService', () => ({
  default: {
    getDepartments: vi.fn(),
    getCourses: vi.fn(),
  },
}));

describe('AdminAnalyticsPage Component', () => {
  const mockAnalyticsData = {
    overview: {
      employees: { total: 120, active: 115, inactive: 5 },
      departments: { total: 6, active: 6 },
      courses: { total: 18, published: 15, draft: 2, archived: 1 },
      enrollments: { total: 340, enrolled: 40, inProgress: 100, completed: 180, dropped: 20 },
      assessments: { total: 12, published: 10, attempts: 210, passed: 180, failed: 30, passRate: 85.71 },
      certificates: { active: 160, expired: 15, revoked: 5 },
      compliance: {
        total: 200,
        compliant: 180,
        dueSoon: 12,
        overdue: 8,
        inProgress: 0,
        notStarted: 0,
        complianceRate: 90.0,
      },
    },
    learning: {
      totalEnrollments: 340,
      enrolled: 40,
      inProgress: 100,
      completed: 180,
      dropped: 20,
      completionRate: 52.94,
      averageProgressPercentage: 68.5,
      averageCompletionTimeDays: 14.2,
      courseBreakdown: [
        {
          courseId: 'c1',
          title: 'Cybersecurity Fundamentals',
          enrollmentCount: 90,
          completedCount: 65,
          inProgressCount: 20,
          droppedCount: 5,
          completionRate: 72.22,
          averageProgressPercentage: 78.4,
        },
      ],
      departmentBreakdown: [
        {
          departmentId: 'd1',
          departmentName: 'Engineering',
          employeeCount: 45,
          enrollmentCount: 110,
          completedEnrollments: 75,
          inProgressEnrollments: 25,
          completionRate: 68.18,
          averageProgressPercentage: 74.0,
        },
      ],
    },
    assessments: {
      totalAttempts: 210,
      submittedAttempts: 210,
      passed: 180,
      failed: 30,
      passRate: 85.71,
      averagePercentage: 82.4,
      highestPercentage: 100,
      lowestPercentage: 45,
      averageAttemptsPerEmployee: 1.8,
      assessmentBreakdown: [
        {
          assessmentId: 'a1',
          title: 'Security Compliance Exam',
          courseId: 'c1',
          attemptCount: 95,
          uniqueEmployees: 80,
          passed: 85,
          failed: 10,
          passRate: 89.47,
          averagePercentage: 86.2,
          highestPercentage: 100,
          lowestPercentage: 55,
        },
      ],
    },
    compliance: {
      totalAssignments: 200,
      compliant: 180,
      dueSoon: 12,
      overdue: 8,
      inProgress: 0,
      notStarted: 0,
      complianceRate: 90.0,
      requirementBreakdown: [
        {
          requirementId: 'r1',
          title: 'Information Security Standard',
          courseId: 'c1',
          assignedEmployees: 100,
          compliant: 90,
          dueSoon: 6,
          overdue: 4,
          complianceRate: 90.0,
        },
      ],
      departmentBreakdown: [
        {
          departmentId: 'd1',
          departmentName: 'Engineering',
          assignedEmployees: 60,
          compliant: 55,
          dueSoon: 3,
          overdue: 2,
          complianceRate: 91.67,
        },
      ],
    },
    certifications: {
      totalIssued: 180,
      active: 160,
      expired: 15,
      revoked: 5,
      expiringSoon: 10,
      renewed: 40,
      renewalRate: 22.22,
      courseBreakdown: [
        {
          courseId: 'c1',
          courseTitle: 'Cybersecurity Fundamentals',
          totalIssued: 80,
          active: 72,
          expired: 5,
          revoked: 3,
          renewed: 20,
        },
      ],
    },
    departments: {
      departments: [
        {
          departmentId: 'd1',
          departmentName: 'Engineering',
          employeeCount: 45,
          activeEmployeeCount: 44,
          enrollmentCount: 110,
          completionCount: 75,
          averageProgressPercentage: 74.0,
          assessmentAttempts: 80,
          assessmentPassRate: 88.0,
          complianceAssignments: 60,
          compliantAssignments: 55,
          complianceRate: 91.67,
        },
      ],
      pagination: { page: 1, limit: 100, total: 1, pages: 1 },
    },
    courses: {
      courses: [
        {
          courseId: 'c1',
          title: 'Cybersecurity Fundamentals',
          status: 'published',
          enrollmentCount: 90,
          completedCount: 65,
          averageProgressPercentage: 78.4,
          completionRate: 72.22,
          assessmentAttempts: 95,
          assessmentPassRate: 89.47,
          certificateCount: 80,
        },
      ],
      pagination: { page: 1, limit: 100, total: 1, pages: 1 },
    },
    hasPartialError: false,
    errors: null,
    timestamp: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    analyticsService.getComprehensiveAnalytics.mockResolvedValue(mockAnalyticsData);
    adminService.getDepartments.mockResolvedValue([
      { _id: 'd1', name: 'Engineering' },
    ]);
    adminService.getCourses.mockResolvedValue([
      { _id: 'c1', title: 'Cybersecurity Fundamentals' },
    ]);
  });

  it('renders loading skeleton while analytics data is fetching', async () => {
    // Return a pending promise
    analyticsService.getComprehensiveAnalytics.mockReturnValueOnce(new Promise(() => {}));

    render(<AdminAnalyticsPage />);

    expect(screen.getByTestId('analytics-loading-skeleton')).toBeInTheDocument();
  });

  it('renders page header, title, and overview metrics after data loads', async () => {
    render(<AdminAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /analytics & reports/i })).toBeInTheDocument();
    });

    // Check KPI cards on Overview
    expect(screen.getByText('Workforce')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Pass Rate')).toBeInTheDocument();
    expect(screen.getByText('85.71%')).toBeInTheDocument();
    expect(screen.getAllByText('90%').length).toBeGreaterThanOrEqual(1); // Compliance Rate
  });

  it('switches between tabs and displays domain-specific data', async () => {
    render(<AdminAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Executive Overview')).toBeInTheDocument();
    });

    // 1. Learning & Courses Tab
    fireEvent.click(screen.getByRole('tab', { name: /learning & courses/i }));
    await waitFor(() => {
      expect(screen.getByTestId('analytics-learning-tab')).toBeInTheDocument();
      expect(screen.getByText('Course Performance Breakdown')).toBeInTheDocument();
      expect(screen.getAllByText('Cybersecurity Fundamentals').length).toBeGreaterThanOrEqual(1);
    });

    // 2. Assessments Tab
    fireEvent.click(screen.getByRole('tab', { name: /assessments/i }));
    await waitFor(() => {
      expect(screen.getByTestId('analytics-assessments-tab')).toBeInTheDocument();
      expect(screen.getByText('Assessment Cohort Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Security Compliance Exam')).toBeInTheDocument();
    });

    // 3. Compliance Tab
    fireEvent.click(screen.getByRole('tab', { name: /compliance/i }));
    await waitFor(() => {
      expect(screen.getByTestId('analytics-compliance-tab')).toBeInTheDocument();
      expect(screen.getByText('Compliance Requirement Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Information Security Standard')).toBeInTheDocument();
      expect(screen.getByText('Department Compliance Matrix')).toBeInTheDocument();
    });

    // 4. Certificates Tab
    fireEvent.click(screen.getByRole('tab', { name: /certificates/i }));
    await waitFor(() => {
      expect(screen.getByTestId('analytics-certifications-tab')).toBeInTheDocument();
      expect(screen.getByText('Course Certification Velocity')).toBeInTheDocument();
      expect(screen.getByText('Active Credentials')).toBeInTheDocument();
    });

    // 5. Departments Tab
    fireEvent.click(screen.getByRole('tab', { name: /departments/i }));
    await waitFor(() => {
      expect(screen.getByTestId('analytics-departments-tab')).toBeInTheDocument();
      expect(screen.getByText('Department Comparative Analytics')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
    });

    // 6. Course Catalog Tab
    fireEvent.click(screen.getByRole('tab', { name: /course catalog/i }));
    await waitFor(() => {
      expect(screen.getByTestId('analytics-courses-tab')).toBeInTheDocument();
      expect(screen.getByText('Course Performance & Outcome Matrix')).toBeInTheDocument();
    });
  });

  it('opens export report modal when Export CSV button is clicked', async () => {
    render(<AdminAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export report/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /export report/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Export Analytics Report')).toBeInTheDocument();
  });

  it('renders visible and separate Refresh and Export CSV buttons in the header toolbar', async () => {
    render(<AdminAnalyticsPage />);

    await waitFor(() => {
      const refreshBtn = screen.getByRole('button', { name: /refresh analytics data/i });
      const exportBtn = screen.getByRole('button', { name: /export report/i });

      expect(refreshBtn).toBeInTheDocument();
      expect(exportBtn).toBeInTheDocument();
      expect(refreshBtn).toHaveTextContent('Refresh');
      expect(exportBtn).toHaveTextContent('Export CSV');
    });
  });

  it('renders partial error banner if data.hasPartialError is true', async () => {
    analyticsService.getComprehensiveAnalytics.mockResolvedValueOnce({
      ...mockAnalyticsData,
      hasPartialError: true,
      errors: { learning: 'Timeout' },
    });

    render(<AdminAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Some analytics domains encountered a temporary service issue/i)).toBeInTheDocument();
    });
  });

  it('renders full ErrorState if initial fetch completely fails', async () => {
    analyticsService.getComprehensiveAnalytics.mockRejectedValueOnce(
      new Error('Internal server error')
    );

    render(<AdminAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Analytics System Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
    });
  });
});
