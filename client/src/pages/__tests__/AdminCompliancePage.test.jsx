import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminCompliancePage from '../AdminCompliancePage';
import adminService from '../../services/adminService';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../services/adminService', () => ({
  default: {
    getComplianceSummary: vi.fn(),
    getComplianceRequirements: vi.fn(),
    getComplianceAssignments: vi.fn(),
    getCourses: vi.fn(),
    getDepartments: vi.fn(),
    getEmployees: vi.fn(),
    createComplianceRequirement: vi.fn(),
    updateComplianceRequirement: vi.fn(),
    deleteComplianceRequirement: vi.fn(),
    assignRequirementToDepartment: vi.fn(),
    assignRequirementToEmployee: vi.fn(),
    refreshComplianceStatuses: vi.fn(),
  },
}));

describe('AdminCompliancePage', () => {
  const mockSummary = {
    complianceRate: 91.5,
    totalRequirements: 3,
    totalAssignments: 45,
    compliant: 41,
    dueSoon: 2,
    overdue: 2,
    inProgress: 0,
    notStarted: 0,
  };

  const mockRequirements = [
    {
      _id: 'req-1',
      title: 'Annual Cybersecurity Refresher',
      description: 'Mandatory information security protocols',
      course: { _id: 'c-1', title: 'Cyber Hygiene 2026' },
      frequency: 'annual',
      dueWithinDays: 30,
      renewalGraceDays: 5,
    },
    {
      _id: 'req-2',
      title: 'Workplace Harassment Prevention',
      description: 'Legal standards and ethical behavior',
      course: { _id: 'c-2', title: 'Workplace Conduct' },
      frequency: 'annual',
      dueWithinDays: 45,
      renewalGraceDays: 0,
    },
  ];

  const mockAssignments = [
    {
      _id: 'as-1',
      employee: {
        _id: 'e-1',
        employeeId: 'EMP-100',
        user: { name: 'Diana Prince', email: 'diana@amazon.test' },
        department: { name: 'Security' },
      },
      complianceRequirement: { title: 'Annual Cybersecurity Refresher' },
      status: 'compliant',
      dueAt: '2026-12-31T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminCompliancePage />
        </ToastProvider>
      </MemoryRouter>
    );

  it('renders compliance overview KPIs and rules catalog tab', async () => {
    adminService.getComplianceSummary.mockResolvedValue(mockSummary);
    adminService.getComplianceRequirements.mockResolvedValue(mockRequirements);
    adminService.getComplianceAssignments.mockResolvedValue({ assignments: mockAssignments });
    adminService.getCourses.mockResolvedValue([]);
    adminService.getDepartments.mockResolvedValue([]);
    adminService.getEmployees.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Compliance Oversight')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('Annual Cybersecurity Refresher')).toBeInTheDocument();
      expect(screen.getByText('Workplace Harassment Prevention')).toBeInTheDocument();
    });
  });

  it('switches between Rules and Workforce Assignments tabs', async () => {
    adminService.getComplianceSummary.mockResolvedValue(mockSummary);
    adminService.getComplianceRequirements.mockResolvedValue(mockRequirements);
    adminService.getComplianceAssignments.mockResolvedValue({ assignments: mockAssignments });
    adminService.getCourses.mockResolvedValue([]);
    adminService.getDepartments.mockResolvedValue([]);
    adminService.getEmployees.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Annual Cybersecurity Refresher')).toBeInTheDocument();
    });

    const assignmentsTabBtn = screen.getByText(/Workforce Assignments/i);
    fireEvent.click(assignmentsTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Diana Prince')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
    });
  });

  it('triggers on-demand status audit refresh', async () => {
    adminService.getComplianceSummary.mockResolvedValue(mockSummary);
    adminService.getComplianceRequirements.mockResolvedValue(mockRequirements);
    adminService.getComplianceAssignments.mockResolvedValue({ assignments: mockAssignments });
    adminService.getCourses.mockResolvedValue([]);
    adminService.getDepartments.mockResolvedValue([]);
    adminService.getEmployees.mockResolvedValue([]);
    adminService.refreshComplianceStatuses.mockResolvedValueOnce({ updatedCount: 4 });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Compliance Oversight')).toBeInTheDocument();
    });

    const auditBtn = screen.getByRole('button', { name: /Recalculate compliance statuses/i });
    fireEvent.click(auditBtn);

    await waitFor(() => {
      expect(adminService.refreshComplianceStatuses).toHaveBeenCalledTimes(1);
    });
  });

  it('opens assign rule modal for a compliance requirement', async () => {
    adminService.getComplianceSummary.mockResolvedValue(mockSummary);
    adminService.getComplianceRequirements.mockResolvedValue(mockRequirements);
    adminService.getComplianceAssignments.mockResolvedValue({ assignments: mockAssignments });
    adminService.getCourses.mockResolvedValue([]);
    adminService.getDepartments.mockResolvedValue([{ _id: 'd1', name: 'Security' }]);
    adminService.getEmployees.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Annual Cybersecurity Refresher')).toBeInTheDocument();
    });

    const assignBtn = screen.getByRole('button', { name: 'Assign Annual Cybersecurity Refresher' });
    fireEvent.click(assignBtn);

    expect(screen.getByText('Assign Compliance Requirement')).toBeInTheDocument();
    expect(screen.getByText(/Entire Department/i)).toBeInTheDocument();
  });
});
