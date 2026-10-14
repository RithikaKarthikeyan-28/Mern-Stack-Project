import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CertificateStatusBadge from '../CertificateStatusBadge';
import CertificateCard from '../CertificateCard';
import RenewalHistory from '../RenewalHistory';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Certificate Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CertificateStatusBadge', () => {
    it('renders Active badge for valid active certificate', () => {
      render(<CertificateStatusBadge status="active" />);
      expect(screen.getByTestId('certificate-status-active')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders Expiring Soon badge when active certificate expires within 30 days', () => {
      // Expiry 10 days in future
      const soon = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      render(<CertificateStatusBadge status="active" expiresAt={soon} />);
      expect(screen.getByTestId('certificate-status-expiring-soon')).toBeInTheDocument();
      expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
    });

    it('renders Expired badge when isExpired is true or status is expired', () => {
      render(<CertificateStatusBadge status="expired" />);
      expect(screen.getByTestId('certificate-status-expired')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();

      const { unmount } = render(<CertificateStatusBadge status="active" isExpired={true} />);
      expect(screen.getAllByTestId('certificate-status-expired')).toHaveLength(2);
      unmount();
    });

    it('renders Revoked badge for revoked status', () => {
      render(<CertificateStatusBadge status="revoked" />);
      expect(screen.getByTestId('certificate-status-revoked')).toBeInTheDocument();
      expect(screen.getByText('Revoked')).toBeInTheDocument();
    });

    it('supports size variants and icon toggling', () => {
      const { container } = render(
        <CertificateStatusBadge status="active" size="lg" showIcon={false} />
      );
      expect(container.querySelector('svg')).toBeNull();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('CertificateCard', () => {
    const mockCert = {
      id: 'cert01',
      certificateNumber: 'SKILLTRACK-2026-TEST0001',
      status: 'active',
      issuedAt: '2026-01-15T00:00:00.000Z',
      expiresAt: '2027-01-15T00:00:00.000Z',
      course: {
        title: 'Full Stack Architecture Masterclass',
        category: 'Engineering',
        level: 'Advanced',
      },
    };

    it('renders course information, certificate number, and status', () => {
      render(
        <MemoryRouter>
          <CertificateCard certificate={mockCert} />
        </MemoryRouter>
      );

      expect(screen.getByText('Full Stack Architecture Masterclass')).toBeInTheDocument();
      expect(screen.getByText('SKILLTRACK-2026-TEST0001')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('copies certificate number to clipboard when copy button is clicked', () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(),
        },
      });

      render(
        <MemoryRouter>
          <CertificateCard certificate={mockCert} />
        </MemoryRouter>
      );

      const copyBtn = screen.getByRole('button', { name: /copy certificate number/i });
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('SKILLTRACK-2026-TEST0001');
    });

    it('renders renewed chip when certificate was renewed from another', () => {
      const renewedCert = {
        ...mockCert,
        renewedFrom: 'certOld123',
      };

      render(
        <MemoryRouter>
          <CertificateCard certificate={renewedCert} />
        </MemoryRouter>
      );

      expect(screen.getByText('Renewed Credential')).toBeInTheDocument();
    });

    it('renders Renew button when expired and invokes onRenewClick callback', () => {
      const expiredCert = {
        ...mockCert,
        status: 'active',
        isExpired: true,
      };
      const onRenewMock = vi.fn();

      render(
        <MemoryRouter>
          <CertificateCard certificate={expiredCert} onRenewClick={onRenewMock} />
        </MemoryRouter>
      );

      const renewBtn = screen.getByRole('button', { name: /renew/i });
      expect(renewBtn).toBeInTheDocument();

      fireEvent.click(renewBtn);
      expect(onRenewMock).toHaveBeenCalledWith(expiredCert);
    });

    it('does NOT render Renew button when certificate is revoked', () => {
      const revokedCert = {
        ...mockCert,
        status: 'revoked',
        lifecycleStatus: 'revoked',
      };

      render(
        <MemoryRouter>
          <CertificateCard certificate={revokedCert} />
        </MemoryRouter>
      );

      expect(screen.queryByRole('button', { name: /renew/i })).toBeNull();
    });

    it('navigates to details page when View button is clicked', () => {
      render(
        <MemoryRouter>
          <CertificateCard certificate={mockCert} />
        </MemoryRouter>
      );

      const viewBtn = screen.getByRole('button', { name: /view/i });
      fireEvent.click(viewBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/certificates/cert01');
    });

    it('navigates to verify page when Verify button is clicked', () => {
      render(
        <MemoryRouter>
          <CertificateCard certificate={mockCert} />
        </MemoryRouter>
      );

      const verifyBtn = screen.getByRole('button', { name: /verify/i });
      fireEvent.click(verifyBtn);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/verify-certificate/SKILLTRACK-2026-TEST0001'
      );
    });
  });

  describe('RenewalHistory', () => {
    const mockCurrent = {
      id: 'certCurr',
      certificateNumber: 'SKILLTRACK-2026-CURRENT',
      status: 'active',
      issuedAt: '2026-06-01T00:00:00.000Z',
      expiresAt: '2027-06-01T00:00:00.000Z',
    };

    it('renders original standalone issuance message when no parent or renewals exist', () => {
      render(
        <MemoryRouter>
          <RenewalHistory certificate={mockCurrent} parent={null} renewals={[]} />
        </MemoryRouter>
      );

      expect(screen.getByText('Initial Certificate Issuance')).toBeInTheDocument();
      expect(screen.getByText(/original standalone certificate/i)).toBeInTheDocument();
    });

    it('renders full lineage with parent certificate, current certificate, and subsequent renewals', () => {
      const mockParent = {
        id: 'certParent',
        certificateNumber: 'SKILLTRACK-2025-ORIGINAL',
        status: 'active',
        issuedAt: '2025-06-01T00:00:00.000Z',
        expiresAt: '2026-06-01T00:00:00.000Z',
      };
      const mockRenewals = [
        {
          id: 'certNext',
          certificateNumber: 'SKILLTRACK-2027-FUTURE',
          status: 'active',
          renewedAt: '2027-06-01T00:00:00.000Z',
          expiresAt: '2028-06-01T00:00:00.000Z',
          renewalReason: 'Company annual retraining completed',
        },
      ];

      render(
        <MemoryRouter>
          <RenewalHistory
            certificate={mockCurrent}
            parent={mockParent}
            renewals={mockRenewals}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Original Certificate')).toBeInTheDocument();
      expect(screen.getByText('SKILLTRACK-2025-ORIGINAL')).toBeInTheDocument();

      expect(screen.getByText('Renewed Credential (Current)')).toBeInTheDocument();
      expect(screen.getByText('SKILLTRACK-2026-CURRENT')).toBeInTheDocument();

      expect(screen.getByText('Subsequent Renewal')).toBeInTheDocument();
      expect(screen.getByText('SKILLTRACK-2027-FUTURE')).toBeInTheDocument();
      expect(
        screen.getByText(/Reason: Company annual retraining completed/i)
      ).toBeInTheDocument();
    });

    it('renders revocation notice when certificate is revoked', () => {
      const revoked = {
        ...mockCurrent,
        status: 'revoked',
        revokedAt: '2026-07-01T00:00:00.000Z',
        revocationReason: 'Compliance audit discrepancy',
      };

      render(
        <MemoryRouter>
          <RenewalHistory certificate={revoked} parent={null} renewals={[]} />
        </MemoryRouter>
      );

      expect(screen.getByText('Certificate Revoked')).toBeInTheDocument();
      expect(
        screen.getByText(/Compliance audit discrepancy/i)
      ).toBeInTheDocument();
    });
  });
});
