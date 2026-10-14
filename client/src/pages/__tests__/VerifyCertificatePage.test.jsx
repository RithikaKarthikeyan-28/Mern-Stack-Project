import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VerifyCertificatePage from '../VerifyCertificatePage';
import certificateService from '../../services/certificateService';

vi.mock('../../services/certificateService', () => ({
  default: {
    verifyCertificate: vi.fn(),
  },
}));

const mockVerifiedCert = {
  certificateNumber: 'SKILLTRACK-2026-PUB001',
  status: 'active',
  lifecycleStatus: 'active',
  issuedAt: '2026-03-01T00:00:00.000Z',
  expiresAt: '2027-03-01T00:00:00.000Z',
  isExpired: false,
  employeeName: 'Sarah Connor',
  courseTitle: 'Cybersecurity Threat Modeling',
  courseCategory: 'Security',
  courseLevel: 'Advanced',
  courseDuration: 24,
  isRenewal: false,
};

const renderComponent = (initialPath = '/verify-certificate') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
        <Route path="/verify-certificate/:certificateNumber" element={<VerifyCertificatePage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('VerifyCertificatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders verify search form and executes verification on submit', async () => {
    certificateService.verifyCertificate.mockResolvedValueOnce(mockVerifiedCert);

    renderComponent();

    expect(screen.getByText('Verify Certificate Credential')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/e\.g\. SKILLTRACK-/i);
    fireEvent.change(input, { target: { value: 'SKILLTRACK-2026-PUB001' } });

    const form = screen.getByTestId('verify-search-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(certificateService.verifyCertificate).toHaveBeenCalledWith(
        'SKILLTRACK-2026-PUB001'
      );
      expect(screen.getByTestId('verify-success')).toBeInTheDocument();
    });

    expect(screen.getByText('Verified Authentic Credential')).toBeInTheDocument();
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    expect(screen.getByText('Cybersecurity Threat Modeling')).toBeInTheDocument();
    expect(screen.getByText('SKILLTRACK-2026-PUB001')).toBeInTheDocument();
  });

  it('automatically verifies if certificate number is present in URL param', async () => {
    certificateService.verifyCertificate.mockResolvedValueOnce(mockVerifiedCert);

    renderComponent('/verify-certificate/SKILLTRACK-2026-PUB001');

    await waitFor(() => {
      expect(certificateService.verifyCertificate).toHaveBeenCalledWith(
        'SKILLTRACK-2026-PUB001'
      );
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    });
  });

  it('displays authentic expired banner when certificate is expired', async () => {
    const expiredCert = {
      ...mockVerifiedCert,
      lifecycleStatus: 'expired',
      isExpired: true,
    };
    certificateService.verifyCertificate.mockResolvedValueOnce(expiredCert);

    renderComponent('/verify-certificate/SKILLTRACK-2026-EXPIRED');

    await waitFor(() => {
      expect(screen.getByText('Authentic Credential (Expired)')).toBeInTheDocument();
    });
  });

  it('displays revocation notice and reason when certificate is revoked', async () => {
    const revokedCert = {
      ...mockVerifiedCert,
      status: 'revoked',
      lifecycleStatus: 'revoked',
      revokedAt: '2026-05-01T00:00:00.000Z',
      revocationReason: 'Credentials revoked following audit failure',
    };
    certificateService.verifyCertificate.mockResolvedValueOnce(revokedCert);

    renderComponent('/verify-certificate/SKILLTRACK-2026-REVOKED');

    await waitFor(() => {
      expect(screen.getByText('Certificate Revoked')).toBeInTheDocument();
      expect(screen.getByText('Certificate Revocation Notice')).toBeInTheDocument();
      expect(
        screen.getByText(/Credentials revoked following audit failure/i)
      ).toBeInTheDocument();
    });
  });

  it('renders not found card when certificate does not exist (404)', async () => {
    certificateService.verifyCertificate.mockRejectedValueOnce({
      response: {
        status: 404,
        data: { message: 'Certificate not found' },
      },
    });

    renderComponent('/verify-certificate/INVALID-123');

    await waitFor(() => {
      expect(screen.getByTestId('verify-not-found')).toBeInTheDocument();
      expect(screen.getByText('Certificate Not Found')).toBeInTheDocument();
    });
  });
});
