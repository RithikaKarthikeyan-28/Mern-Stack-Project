import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CertificatesPage from '../CertificatesPage';
import certificateService from '../../services/certificateService';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../services/certificateService', () => ({
  default: {
    getMyCertificates: vi.fn(),
    renewCertificate: vi.fn(),
  },
}));

const mockCertificates = [
  {
    id: 'c1',
    certificateNumber: 'SKILLTRACK-2026-AAA111',
    status: 'active',
    lifecycleStatus: 'active',
    issuedAt: '2026-02-01T00:00:00.000Z',
    expiresAt: '2027-02-01T00:00:00.000Z',
    course: {
      title: 'Full Stack Node.js & React',
      category: 'Software Engineering',
      level: 'Advanced',
    },
  },
  {
    id: 'c2',
    certificateNumber: 'SKILLTRACK-2026-BBB222',
    status: 'active',
    lifecycleStatus: 'expired',
    isExpired: true,
    issuedAt: '2025-01-01T00:00:00.000Z',
    expiresAt: '2026-01-01T00:00:00.000Z',
    course: {
      title: 'Enterprise Cloud Security',
      category: 'Security',
      level: 'Expert',
    },
  },
];

const renderComponent = () => {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/certificates']}>
        <Routes>
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route
            path="/certificates/:certificateId"
            element={<div data-testid="cert-details-route">Details Page</div>}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('CertificatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    certificateService.getMyCertificates.mockResolvedValue({
      certificates: mockCertificates,
      pagination: { page: 1, limit: 9, total: 2, totalPages: 1 },
    });
  });

  it('renders page header with dark-teal gradient banner, contrast badge, and stat cards', async () => {
    renderComponent();

    const banner = screen.getByTestId('certificates-hero-banner');
    expect(banner).toBeInTheDocument();
    expect(banner.className).toContain('bg-gradient-to-r');
    expect(banner.className).toContain('from-[#0F766E]');
    expect(banner.className).toContain('text-white');

    const badge = screen.getByText('Verified Learning Achievements');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('div').className).toContain('bg-[#ECFDF5]');
    expect(badge.closest('div').className).toContain('text-[#0F766E]');

    const heading = screen.getByRole('heading', { level: 1, name: 'My Certificates' });
    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain('text-white');

    expect(
      screen.getByText(/access your verified course completion credentials/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Full Stack Node.js & React')).toBeInTheDocument();
      expect(screen.getByText('Enterprise Cloud Security')).toBeInTheDocument();
    });

    expect(screen.getByText('SKILLTRACK-2026-AAA111')).toBeInTheDocument();
    expect(screen.getByText('SKILLTRACK-2026-BBB222')).toBeInTheDocument();
  });

  it('switches tabs and requests filtered certificates', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Full Stack Node.js & React')).toBeInTheDocument();
    });

    const activeTab = screen.getByRole('button', { name: /active credentials/i });
    fireEvent.click(activeTab);

    await waitFor(() => {
      expect(certificateService.getMyCertificates).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' })
      );
    });
  });

  it('filters certificates by search query client-side', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Full Stack Node.js & React')).toBeInTheDocument();
      expect(screen.getByText('Enterprise Cloud Security')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by course or cert #/i);
    fireEvent.change(searchInput, { target: { value: 'Node.js' } });

    expect(screen.getByText('Full Stack Node.js & React')).toBeInTheDocument();
    expect(screen.queryByText('Enterprise Cloud Security')).toBeNull();
  });

  it('opens renewal modal, enters reason, and submits renewal', async () => {
    certificateService.renewCertificate.mockResolvedValueOnce({
      certificate: { id: 'cNew99', certificateNumber: 'SKILLTRACK-2026-NEW999' },
      isExisting: false,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Enterprise Cloud Security')).toBeInTheDocument();
    });

    // The expired certificate has a Renew button
    const renewBtns = screen.getAllByRole('button', { name: /renew/i });
    fireEvent.click(renewBtns[0]);

    // Modal opens
    expect(screen.getByText('Renew Certificate Credential')).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(/annual compliance renewal/i);
    fireEvent.change(reasonInput, { target: { value: 'Annual retraining requirement' } });

    const confirmBtn = screen.getByRole('button', { name: /confirm & renew/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(certificateService.renewCertificate).toHaveBeenCalledWith('c2', {
        reason: 'Annual retraining requirement',
      });
      expect(screen.getByTestId('cert-details-route')).toBeInTheDocument();
    });
  });

  it('renders empty state when no certificates are found', async () => {
    certificateService.getMyCertificates.mockResolvedValue({
      certificates: [],
      pagination: { page: 1, limit: 9, total: 0, totalPages: 1 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('certificates-empty')).toBeInTheDocument();
      expect(screen.getByText('No certificates earned yet')).toBeInTheDocument();
    });
  });
});
