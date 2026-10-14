import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ComplianceStatusBadge from '../ComplianceStatusBadge';
import ComplianceSummaryCards from '../ComplianceSummaryCards';
import ComplianceRequirementCard from '../ComplianceRequirementCard';
import ComplianceRequirementList from '../ComplianceRequirementList';

describe('Compliance Component Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ComplianceStatusBadge', () => {
    it('renders COMPLIANT badge with label and testid', () => {
      render(<ComplianceStatusBadge status="COMPLIANT" />);
      const badge = screen.getByTestId('compliance-status-badge');
      expect(badge).toHaveAttribute('data-status', 'COMPLIANT');
      expect(screen.getByText('Compliant')).toBeInTheDocument();
    });

    it('renders DUE_SOON with customized days remaining', () => {
      const { rerender } = render(<ComplianceStatusBadge status="DUE_SOON" daysRemaining={12} />);
      expect(screen.getByText('Due in 12d')).toBeInTheDocument();

      rerender(<ComplianceStatusBadge status="DUE_SOON" daysRemaining={0} />);
      expect(screen.getByText('Due Today')).toBeInTheDocument();

      rerender(<ComplianceStatusBadge status="DUE_SOON" />);
      expect(screen.getByText('Due Soon')).toBeInTheDocument();
    });

    it('renders OVERDUE with customized overdue days', () => {
      const { rerender } = render(<ComplianceStatusBadge status="OVERDUE" daysRemaining={-4} />);
      expect(screen.getByText('Overdue by 4d')).toBeInTheDocument();

      rerender(<ComplianceStatusBadge status="OVERDUE" />);
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('renders IN_PROGRESS and NOT_STARTED badges', () => {
      const { rerender } = render(<ComplianceStatusBadge status="IN_PROGRESS" />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();

      rerender(<ComplianceStatusBadge status="NOT_STARTED" />);
      expect(screen.getByText('Not Started')).toBeInTheDocument();
    });

    it('supports size variants and hiding icons', () => {
      const { container } = render(
        <ComplianceStatusBadge status="COMPLIANT" size="lg" showIcon={false} />
      );
      expect(container.querySelector('svg')).toBeNull();
      expect(screen.getByText('Compliant')).toBeInTheDocument();
    });
  });

  describe('ComplianceSummaryCards', () => {
    it('renders summary metrics, percentage, and Fully Compliant indicator', () => {
      const mockSummary = {
        totalAssignments: 4,
        compliant: 4,
        dueSoon: 0,
        overdue: 0,
        inProgress: 0,
        notStarted: 0,
        complianceRate: 100,
      };

      render(<ComplianceSummaryCards summary={mockSummary} />);

      expect(screen.getByText('100% Compliant')).toBeInTheDocument();
      expect(screen.getByText(/4 of 4 mandatory requirements satisfied/i)).toBeInTheDocument();
      expect(screen.getByText('Fully Compliant')).toBeInTheDocument();
      expect(screen.getByText('Total Assigned')).toBeInTheDocument();
    });

    it('renders Immediate Action Required when overdue requirements exist', () => {
      const mockSummary = {
        totalAssignments: 5,
        compliant: 2,
        dueSoon: 1,
        overdue: 2,
        inProgress: 0,
        notStarted: 0,
        complianceRate: 40,
      };

      render(<ComplianceSummaryCards summary={mockSummary} />);

      expect(screen.getByText('40% Compliant')).toBeInTheDocument();
      expect(screen.getByText('Immediate Action Required')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('renders Upcoming Deadlines when due soon exists and overdue is zero', () => {
      const mockSummary = {
        totalAssignments: 3,
        compliant: 2,
        dueSoon: 1,
        overdue: 0,
        inProgress: 0,
        notStarted: 0,
        complianceRate: 66.67,
      };

      render(<ComplianceSummaryCards summary={mockSummary} />);

      expect(screen.getByText('Upcoming Deadlines')).toBeInTheDocument();
    });

    it('returns null if summary is missing', () => {
      const { container } = render(<ComplianceSummaryCards summary={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('ComplianceRequirementCard', () => {
    const baseAssignment = {
      _id: 'assign-1',
      dueAt: '2026-11-15T00:00:00.000Z',
      completedAt: null,
      status: 'NOT_STARTED',
      daysRemaining: 25,
      enrollmentStatus: 'not_enrolled',
      certificationStatus: 'none',
      complianceRequirement: {
        title: 'Information Security & Privacy',
        description: 'Annual training on data privacy and cybersecurity standards',
        frequency: 'annual',
        course: {
          _id: 'c-sec-101',
          title: 'Cybersecurity Fundamentals 2026',
          code: 'SEC-101',
        },
      },
    };

    it('renders requirement title, description, frequency, and course link', () => {
      render(
        <MemoryRouter>
          <ComplianceRequirementCard assignment={baseAssignment} />
        </MemoryRouter>
      );

      expect(screen.getByText('Information Security & Privacy')).toBeInTheDocument();
      expect(
        screen.getByText('Annual training on data privacy and cybersecurity standards')
      ).toBeInTheDocument();
      expect(screen.getByText('Annual Certification')).toBeInTheDocument();
      expect(screen.getByText('Cybersecurity Fundamentals 2026')).toBeInTheDocument();
      expect(screen.getByText('[SEC-101]')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Start Required Training/ })).toHaveAttribute(
        'href',
        '/courses/c-sec-101'
      );
    });

    it('renders Continue Learning action when enrollment is in_progress', () => {
      const inProgressAssignment = {
        ...baseAssignment,
        status: 'IN_PROGRESS',
        enrollmentStatus: 'in_progress',
      };

      render(
        <MemoryRouter>
          <ComplianceRequirementCard assignment={inProgressAssignment} />
        </MemoryRouter>
      );

      expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('link', { name: /Continue Learning/ })).toHaveAttribute(
        'href',
        '/learn/c-sec-101'
      );
    });

    it('renders Fulfilled status and View Certificate link when compliant and certified', () => {
      const compliantAssignment = {
        ...baseAssignment,
        status: 'COMPLIANT',
        completedAt: '2026-05-10T00:00:00.000Z',
        enrollmentStatus: 'completed',
        certificationStatus: 'active',
      };

      render(
        <MemoryRouter>
          <ComplianceRequirementCard assignment={compliantAssignment} />
        </MemoryRouter>
      );

      expect(screen.getByText('Fulfilled')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /View Certificate/ })).toHaveAttribute(
        'href',
        '/certificates'
      );
    });

    it('returns null if assignment is missing', () => {
      const { container } = render(<ComplianceRequirementCard assignment={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('ComplianceRequirementList', () => {
    const mockAssignments = [
      {
        _id: 'a1',
        dueAt: '2026-10-20T00:00:00.000Z',
        status: 'OVERDUE',
        daysRemaining: -5,
        complianceRequirement: {
          title: 'Workplace Safety Protocol',
          course: { _id: 'c1', title: 'OSHA Workplace Safety' },
        },
      },
      {
        _id: 'a2',
        dueAt: '2026-11-01T00:00:00.000Z',
        status: 'DUE_SOON',
        daysRemaining: 10,
        complianceRequirement: {
          title: 'Anti-Harassment Awareness',
          course: { _id: 'c2', title: 'Workplace Ethics & Harassment' },
        },
      },
      {
        _id: 'a3',
        dueAt: '2026-12-15T00:00:00.000Z',
        status: 'COMPLIANT',
        daysRemaining: 45,
        complianceRequirement: {
          title: 'Data Privacy Compliance',
          course: { _id: 'c3', title: 'GDPR & CCPA Deep Dive' },
        },
      },
    ];

    it('renders all assignments and calculates filter counts', () => {
      render(
        <MemoryRouter>
          <ComplianceRequirementList assignments={mockAssignments} />
        </MemoryRouter>
      );

      expect(screen.getByText('Workplace Safety Protocol')).toBeInTheDocument();
      expect(screen.getByText('Anti-Harassment Awareness')).toBeInTheDocument();
      expect(screen.getByText('Data Privacy Compliance')).toBeInTheDocument();

      // Filter tabs with counts
      expect(screen.getByTestId('compliance-filter-all')).toBeInTheDocument();
      expect(screen.getByTestId('compliance-filter-overdue')).toBeInTheDocument();
      expect(screen.getByTestId('compliance-filter-due_soon')).toBeInTheDocument();
      expect(screen.getByTestId('compliance-filter-compliant')).toBeInTheDocument();
    });

    it('filters assignments by status button', () => {
      render(
        <MemoryRouter>
          <ComplianceRequirementList assignments={mockAssignments} />
        </MemoryRouter>
      );

      const overdueFilterBtn = screen.getByTestId('compliance-filter-overdue');
      fireEvent.click(overdueFilterBtn);

      expect(screen.getByText('Workplace Safety Protocol')).toBeInTheDocument();
      expect(screen.queryByText('Anti-Harassment Awareness')).not.toBeInTheDocument();
      expect(screen.queryByText('Data Privacy Compliance')).not.toBeInTheDocument();
    });

    it('filters assignments by search input query', () => {
      render(
        <MemoryRouter>
          <ComplianceRequirementList assignments={mockAssignments} />
        </MemoryRouter>
      );

      const searchInput = screen.getByTestId('compliance-search-input');
      fireEvent.change(searchInput, { target: { value: 'Safety' } });

      expect(screen.getByText('Workplace Safety Protocol')).toBeInTheDocument();
      expect(screen.queryByText('Anti-Harassment Awareness')).not.toBeInTheDocument();
    });

    it('sorts assignments by title A-Z', () => {
      render(
        <MemoryRouter>
          <ComplianceRequirementList assignments={mockAssignments} />
        </MemoryRouter>
      );

      const sortSelect = screen.getByTestId('compliance-sort-select');
      fireEvent.change(sortSelect, { target: { value: 'title_asc' } });

      const cards = screen.getAllByTestId('compliance-card');
      expect(cards[0]).toHaveTextContent('Anti-Harassment Awareness');
    });

    it('renders empty state when assignments array is empty', () => {
      render(
        <MemoryRouter>
          <ComplianceRequirementList assignments={[]} />
        </MemoryRouter>
      );

      expect(screen.getByText('No compliance requirements assigned')).toBeInTheDocument();
    });

    it('renders empty state with Reset Filters button when filter matches nothing', () => {
      render(
        <MemoryRouter>
          <ComplianceRequirementList assignments={mockAssignments} />
        </MemoryRouter>
      );

      const searchInput = screen.getByTestId('compliance-search-input');
      fireEvent.change(searchInput, { target: { value: 'Nonexistent Policy' } });

      expect(screen.getByText('No matching requirements found')).toBeInTheDocument();

      const resetBtn = screen.getByRole('button', { name: /Reset Filters/i });
      fireEvent.click(resetBtn);

      expect(screen.getByText('Workplace Safety Protocol')).toBeInTheDocument();
    });
  });
});
