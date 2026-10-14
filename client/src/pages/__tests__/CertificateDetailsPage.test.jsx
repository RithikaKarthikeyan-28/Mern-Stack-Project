import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CertificateDetailsPage from '../CertificateDetailsPage';
import certificateService from '../../services/certificateService';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../services/certificateService', () => ({
  default: {
    getCertificateById: vi.fn(),
    getCertificateRenewals: vi.fn(),
    renewCertificate: vi.fn(),
  },
}));

const mockCert = {
  id: 'cert101',
  certificateNumber: 'SKILLTRACK-2026-DETAIL01',
  status: 'active',
  lifecycleStatus: 'expired',
  isExpired: true,
  issuedAt: '2025-05-10T00:00:00.000Z',
  expiresAt: '2026-05-10T00:00:00.000Z',
  employee: {
    name: 'Alice Johnson',
    user: { name: 'Alice Johnson' },
    department: { name: 'Cloud Infrastructure' },
  },
  course: {
    title: 'Advanced Kubernetes Orchestration',
    category: 'DevOps',
    level: 'Advanced',
    duration: 36,
  },
};

const renderComponent = (certId = 'cert101') => {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/certificates/${certId}`]}>
        <Routes>
          <Route path="/certificates/:certificateId" element={<CertificateDetailsPage />} />
          <Route path="/certificates" element={<div data-testid="certificates-page">List</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('CertificateDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    certificateService.getCertificateById.mockResolvedValue(mockCert);
    certificateService.getCertificateRenewals.mockResolvedValue({
      parent: null,
      renewals: [],
    });
  });

  it('renders official certificate credential showcase with all verified details', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('certificate-showcase')).toBeInTheDocument();
    });

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Cloud Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Advanced Kubernetes Orchestration')).toBeInTheDocument();
    expect(screen.getByText('SKILLTRACK-2026-DETAIL01')).toBeInTheDocument();
    expect(screen.getByText(/36 hours/i)).toBeInTheDocument();
  });

  it('shows renewal eligibility and allows submitting a renewal request', async () => {
    certificateService.renewCertificate.mockResolvedValueOnce({
      certificate: { id: 'certNew202', certificateNumber: 'SKILLTRACK-2026-RENEW02' },
      isExisting: false,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/This credential is expired and is eligible for renewal/i)).toBeInTheDocument();
    });

    const renewBtn = screen.getByRole('button', { name: /renew certificate/i });
    fireEvent.click(renewBtn);

    expect(screen.getByText('Renew Certificate Credential')).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(/annual recertification/i);
    fireEvent.change(reasonInput, { target: { value: 'Annual compliance requirement' } });

    const submitBtn = screen.getByRole('button', { name: /confirm & renew/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(certificateService.renewCertificate).toHaveBeenCalledWith('cert101', {
        reason: 'Annual compliance requirement',
      });
    });
  });

  it('copies share link when Share Link button is clicked', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /share link/i })).toBeInTheDocument();
    });

    const shareBtn = screen.getByRole('button', { name: /share link/i });
    fireEvent.click(shareBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/verify-certificate/SKILLTRACK-2026-DETAIL01')
    );
  });

  it('renders error state when certificate is not found (anti-enumeration 404)', async () => {
    certificateService.getCertificateById.mockRejectedValueOnce({
      response: {
        status: 404,
        data: { message: 'Certificate not found' },
      },
    });

    renderComponent('unknown-id');

    await waitFor(() => {
      expect(screen.getByText('Certificate Not Available')).toBeInTheDocument();
      expect(screen.getByText('Certificate not found')).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('button', { name: /back to certificates/i });
    fireEvent.click(backBtn);
    expect(screen.getByTestId('certificates-page')).toBeInTheDocument();
  });
});
