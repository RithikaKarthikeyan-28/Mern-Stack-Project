import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExportReportModal from '../ExportReportModal';
import analyticsService from '../../../services/analyticsService';

vi.mock('../../../services/analyticsService', () => ({
  default: {
    exportToCSV: vi.fn(),
  },
}));

describe('ExportReportModal Component', () => {
  const mockData = {
    overview: {
      employees: { total: 50, active: 48 },
      departments: { total: 4 },
      courses: { total: 8, published: 7 },
      enrollments: { total: 100, completed: 75 },
      assessments: { attempts: 40, passRate: 85 },
      certificates: { active: 30 },
      compliance: { complianceRate: 92, overdue: 2 },
    },
    departments: {
      departments: [
        {
          departmentName: 'Engineering',
          employeeCount: 20,
          enrollmentCount: 45,
          completionCount: 30,
          complianceRate: 95,
        },
      ],
    },
    courses: {
      courses: [
        {
          title: 'Full Stack JavaScript',
          status: 'published',
          enrollmentCount: 50,
          completedCount: 35,
          completionRate: 70,
        },
      ],
    },
    compliance: {
      requirementBreakdown: [
        {
          title: 'GDPR Data Security',
          assignedEmployees: 25,
          compliant: 23,
          dueSoon: 2,
          overdue: 0,
          complianceRate: 92,
        },
      ],
    },
    assessments: {
      assessmentBreakdown: [
        {
          title: 'React Skills Quiz',
          attemptCount: 15,
          passed: 12,
          failed: 3,
          passRate: 80,
          averagePercentage: 82,
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ExportReportModal isOpen={false} onClose={vi.fn()} data={mockData} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog with report options and privacy note when open', () => {
    render(<ExportReportModal isOpen={true} onClose={vi.fn()} data={mockData} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Export Analytics Report')).toBeInTheDocument();
    expect(screen.getByText('Executive Overview KPIs')).toBeInTheDocument();
    expect(screen.getByText('Department Performance')).toBeInTheDocument();
    expect(screen.getByText('Course Performance & Metrics')).toBeInTheDocument();
    expect(screen.getByText(/PII Protected:/i)).toBeInTheDocument();
  });

  it('triggers analyticsService.exportToCSV when export button is clicked', () => {
    render(<ExportReportModal isOpen={true} onClose={vi.fn()} data={mockData} />);

    const exportBtn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportBtn);

    expect(analyticsService.exportToCSV).toHaveBeenCalledTimes(1);
    expect(analyticsService.exportToCSV).toHaveBeenCalledWith(
      expect.stringContaining('SkillTrack_Executive_Overview_'),
      expect.any(Array),
      expect.any(Array)
    );
  });

  it('allows selecting another report option and exports corresponding dataset', () => {
    render(<ExportReportModal isOpen={true} onClose={vi.fn()} data={mockData} />);

    // Select departments
    fireEvent.click(screen.getByLabelText(/Department Performance/i));

    const exportBtn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportBtn);

    expect(analyticsService.exportToCSV).toHaveBeenCalledWith(
      expect.stringContaining('SkillTrack_Department_Analytics_'),
      expect.any(Array),
      expect.arrayContaining([
        expect.objectContaining({ departmentName: 'Engineering' }),
      ])
    );
  });

  it('calls onClose when close or cancel button is clicked', () => {
    const handleClose = vi.fn();
    render(<ExportReportModal isOpen={true} onClose={handleClose} data={mockData} />);

    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
