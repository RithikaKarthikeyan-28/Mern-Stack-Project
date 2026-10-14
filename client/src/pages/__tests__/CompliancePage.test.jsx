import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CompliancePage from '../CompliancePage';
import complianceService from '../../services/complianceService';

vi.mock('../../services/complianceService', () => ({
  default: {
    getMyComplianceSummary: vi.fn(),
    getMyComplianceAssignments: vi.fn(),
  },
}));

const mockSummary = {
  totalRequirements: 3,
  totalAssignments: 3,
  compliant: 1,
  dueSoon: 1,
  overdue: 1,
  inProgress: 0,
  notStarted: 0,
  complianceRate: 33.33,
};

const mockAssignments = [
  {
    _id: 'assign-1',
    dueAt: '2026-10-15T00:00:00.000Z',
    completedAt: null,
    status: 'OVERDUE',
    daysRemaining: -3,
    enrollmentStatus: 'not_enrolled',
    certificationStatus: 'none',
    complianceRequirement: {
      title: 'Anti-Bribery & Corruption Policy',
      description: 'Mandatory anti-corruption standards and reporting guidelines',
      frequency: 'annual',
      course: {
        _id: 'c-abc-1',
        title: 'Anti-Bribery Essentials',
        code: 'ABC-101',
      },
    },
  },
  {
    _id: 'assign-2',
    dueAt: '2026-11-20T00:00:00.000Z',
    completedAt: null,
    status: 'DUE_SOON',
    daysRemaining: 15,
    enrollmentStatus: 'in_progress',
    certificationStatus: 'none',
    complianceRequirement: {
      title: 'Data Governance Framework',
      description: 'Enterprise data retention and access policies',
      frequency: 'annual',
      course: {
        _id: 'c-dg-2',
        title: 'Data Governance 2026',
        code: 'DG-201',
      },
    },
  },
  {
    _id: 'assign-3',
    dueAt: '2026-12-31T00:00:00.000Z',
    completedAt: '2026-06-01T00:00:00.000Z',
    status: 'COMPLIANT',
    daysRemaining: 40,
    enrollmentStatus: 'completed',
    certificationStatus: 'active',
    complianceRequirement: {
      title: 'Information Security Standard',
      description: 'Annual ISO 27001 information security guidelines',
      frequency: 'annual',
      course: {
        _id: 'c-sec-3',
        title: 'ISO 27001 Security Training',
        code: 'ISO-301',
      },
    },
  },
];

const renderComponent = () => {
  return render(
    <MemoryRouter initialEntries={['/compliance']}>
      <Routes>
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/courses/:courseId" element={<div data-testid="course-page">Course Page</div>} />
        <Route path="/learn/:courseId" element={<div data-testid="learn-page">Learning Player</div>} />
        <Route path="/certificates" element={<div data-testid="certificates-page">Certificates Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('CompliancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    complianceService.getMyComplianceSummary.mockResolvedValue(mockSummary);
    complianceService.getMyComplianceAssignments.mockResolvedValue(mockAssignments);
  });

  it('renders header hero banner and successfully loads summary & assignments', async () => {
    renderComponent();

    expect(screen.getByText('Compliance Management Hub')).toBeInTheDocument();
    expect(screen.getByText('Regulatory Governance & Compliance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh Status/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('33.33% Compliant')).toBeInTheDocument();
      expect(screen.getByText('Anti-Bribery & Corruption Policy')).toBeInTheDocument();
      expect(screen.getByText('Data Governance Framework')).toBeInTheDocument();
      expect(screen.getByText('Information Security Standard')).toBeInTheDocument();
    });
  });

  it('re-fetches both summary and assignments when Refresh Status is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('33.33% Compliant')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh Status/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(complianceService.getMyComplianceSummary).toHaveBeenCalledTimes(2);
      expect(complianceService.getMyComplianceAssignments).toHaveBeenCalledTimes(2);
    });
  });

  it('handles summary API failure with ErrorState and retry button without breaking assignments', async () => {
    complianceService.getMyComplianceSummary.mockRejectedValueOnce(new Error('Summary error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Summary metrics unavailable')).toBeInTheDocument();
    });

    // Assignments section still loads and renders!
    expect(screen.getByText('Anti-Bribery & Corruption Policy')).toBeInTheDocument();

    // Retry summary
    complianceService.getMyComplianceSummary.mockResolvedValueOnce(mockSummary);
    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('33.33% Compliant')).toBeInTheDocument();
    });
  });

  it('handles assignments API failure with ErrorState and retry button without breaking summary', async () => {
    complianceService.getMyComplianceAssignments.mockRejectedValueOnce(new Error('Assignments error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load policy assignments')).toBeInTheDocument();
    });

    // Summary section still loads and renders!
    expect(screen.getByText('33.33% Compliant')).toBeInTheDocument();

    // Retry assignments
    complianceService.getMyComplianceAssignments.mockResolvedValueOnce(mockAssignments);
    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Anti-Bribery & Corruption Policy')).toBeInTheDocument();
    });
  });

  it('displays empty state when employee has zero compliance assignments', async () => {
    complianceService.getMyComplianceSummary.mockResolvedValueOnce({
      totalRequirements: 0,
      totalAssignments: 0,
      compliant: 0,
      dueSoon: 0,
      overdue: 0,
      inProgress: 0,
      notStarted: 0,
      complianceRate: 100,
    });
    complianceService.getMyComplianceAssignments.mockResolvedValueOnce([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No compliance requirements assigned')).toBeInTheDocument();
    });
  });

  it('navigates to course details when Start Required Training is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Anti-Bribery & Corruption Policy')).toBeInTheDocument();
    });

    const startTrainingBtn = screen.getByRole('link', { name: /Start Required Training/i });
    expect(startTrainingBtn).toHaveAttribute('href', '/courses/c-abc-1');
  });

  it('navigates to learning player when Continue Learning is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Data Governance Framework')).toBeInTheDocument();
    });

    const continueBtn = screen.getByRole('link', { name: /Continue Learning/i });
    expect(continueBtn).toHaveAttribute('href', '/learn/c-dg-2');
  });

  it('navigates to certificates when View Certificate is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Information Security Standard')).toBeInTheDocument();
    });

    const certBtn = screen.getByRole('link', { name: /View Certificate/i });
    expect(certBtn).toHaveAttribute('href', '/certificates');
  });
});
