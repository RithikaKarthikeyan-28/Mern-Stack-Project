import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminCertificatesPage from '../AdminCertificatesPage';
import adminService from '../../services/adminService';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../services/adminService', () => ({
  default: {
    getCertificates: vi.fn(),
    getExpiringCertificates: vi.fn(),
    getExpiredCertificates: vi.fn(),
    revokeCertificate: vi.fn(),
  },
}));

describe('AdminCertificatesPage', () => {
  const mockAllCerts = [
    {
      _id: 'cert-1',
      certificateNumber: 'CERT-2026-0001',
      employee: {
        _id: 'e1',
        employeeId: 'EMP-10',
        user: { name: 'Bruce Wayne', email: 'bruce@wayne.test' },
      },
      course: { title: 'Advanced Threat Detection' },
      issueDate: '2026-01-15T00:00:00.000Z',
      expiryDate: '2027-01-15T00:00:00.000Z',
      status: 'active',
    },
    {
      _id: 'cert-2',
      certificateNumber: 'CERT-2026-0002',
      employee: {
        _id: 'e2',
        employeeId: 'EMP-11',
        user: { name: 'Clark Kent', email: 'clark@dailyplanet.test' },
      },
      course: { title: 'Journalism Ethics' },
      issueDate: '2025-01-15T00:00:00.000Z',
      expiryDate: '2026-01-15T00:00:00.000Z',
      status: 'expired',
    },
  ];

  const mockExpiringCerts = [
    {
      _id: 'cert-3',
      certificateNumber: 'CERT-2026-0003',
      employee: {
        _id: 'e3',
        employeeId: 'EMP-12',
        user: { name: 'Barry Allen', email: 'barry@star.test' },
      },
      course: { title: 'Speed & Safety Protocols' },
      status: 'expiring',
    },
  ];

  const mockExpiredCerts = [
    {
      _id: 'cert-2',
      certificateNumber: 'CERT-2026-0002',
      employee: {
        _id: 'e2',
        employeeId: 'EMP-11',
        user: { name: 'Clark Kent', email: 'clark@dailyplanet.test' },
      },
      course: { title: 'Journalism Ethics' },
      status: 'expired',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminCertificatesPage />
        </ToastProvider>
      </MemoryRouter>
    );

  it('renders certificate oversight header and table of credentials', async () => {
    adminService.getCertificates.mockResolvedValue({ certificates: mockAllCerts });
    adminService.getExpiringCertificates.mockResolvedValue(mockExpiringCerts);
    adminService.getExpiredCertificates.mockResolvedValue(mockExpiredCerts);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Certificates Oversight')).toBeInTheDocument();
      expect(screen.getByText('CERT-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('Bruce Wayne')).toBeInTheDocument();
      expect(screen.getByText('Advanced Threat Detection')).toBeInTheDocument();
      expect(screen.getByText('CERT-2026-0002')).toBeInTheDocument();
      expect(screen.getByText('Clark Kent')).toBeInTheDocument();
    });
  });

  it('switches to Expiring Soon tab and shows expiring list', async () => {
    adminService.getCertificates.mockResolvedValue({ certificates: mockAllCerts });
    adminService.getExpiringCertificates.mockResolvedValue(mockExpiringCerts);
    adminService.getExpiredCertificates.mockResolvedValue(mockExpiredCerts);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('CERT-2026-0001')).toBeInTheDocument();
    });

    const expiringTabBtn = screen.getByText(/Expiring Soon/i);
    fireEvent.click(expiringTabBtn);

    await waitFor(() => {
      expect(screen.getByText('CERT-2026-0003')).toBeInTheDocument();
      expect(screen.getByText('Barry Allen')).toBeInTheDocument();
    });
  });

  it('filters certificates by search term', async () => {
    adminService.getCertificates.mockResolvedValue({ certificates: mockAllCerts });
    adminService.getExpiringCertificates.mockResolvedValue(mockExpiringCerts);
    adminService.getExpiredCertificates.mockResolvedValue(mockExpiredCerts);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Bruce Wayne')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search certificates');
    fireEvent.change(searchInput, { target: { value: 'Clark' } });

    expect(screen.queryByText('Bruce Wayne')).not.toBeInTheDocument();
    expect(screen.getByText('Clark Kent')).toBeInTheDocument();
  });

  it('opens revocation modal for active certificate and revokes with reason', async () => {
    adminService.getCertificates.mockResolvedValue({ certificates: mockAllCerts });
    adminService.getExpiringCertificates.mockResolvedValue(mockExpiringCerts);
    adminService.getExpiredCertificates.mockResolvedValue(mockExpiredCerts);
    adminService.revokeCertificate.mockResolvedValueOnce({
      ...mockAllCerts[0],
      status: 'revoked',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('CERT-2026-0001')).toBeInTheDocument();
    });

    const revokeBtn = screen.getByRole('button', { name: 'Revoke certificate CERT-2026-0001' });
    fireEvent.click(revokeBtn);

    expect(screen.getByText('Revoke Issued Certificate')).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(/e\.g\. Credential issued in error/i);
    fireEvent.change(reasonInput, {
      target: { value: 'Revoked due to credential compliance policy violation.' },
    });

    const confirmRevokeBtn = screen.getByRole('button', { name: 'Revoke Certificate' });
    fireEvent.click(confirmRevokeBtn);

    await waitFor(() => {
      expect(adminService.revokeCertificate).toHaveBeenCalledWith(
        'cert-1',
        'Revoked due to credential compliance policy violation.'
      );
    });
  });
});
