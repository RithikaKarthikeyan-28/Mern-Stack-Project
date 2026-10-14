import { describe, it, expect, vi, beforeEach } from 'vitest';
import certificateService from '../certificateService';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('certificateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyCertificates', () => {
    it('fetches authenticated employee certificates with pagination', async () => {
      const mockPayload = {
        data: {
          data: {
            certificates: [
              { id: 'cert1', certificateNumber: 'SKILLTRACK-2026-ABCD1234', status: 'active' },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        },
      };
      api.get.mockResolvedValueOnce(mockPayload);

      const result = await certificateService.getMyCertificates({ page: 1, status: 'active' });

      expect(api.get).toHaveBeenCalledWith('/certificates/me', {
        params: { page: 1, status: 'active' },
      });
      expect(result.certificates).toHaveLength(1);
      expect(result.certificates[0].certificateNumber).toBe('SKILLTRACK-2026-ABCD1234');
      expect(result.pagination.total).toBe(1);
    });

    it('falls back to empty certificates array and default pagination if response is empty', async () => {
      api.get.mockResolvedValueOnce({ data: {} });

      const result = await certificateService.getMyCertificates();

      expect(result.certificates).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getCertificateById', () => {
    it('fetches a single certificate by ID', async () => {
      const mockCert = { id: 'cert123', certificateNumber: 'SKILLTRACK-2026-9999AAAA' };
      api.get.mockResolvedValueOnce({
        data: {
          data: { certificate: mockCert },
        },
      });

      const result = await certificateService.getCertificateById('cert123');

      expect(api.get).toHaveBeenCalledWith('/certificates/cert123');
      expect(result).toEqual(mockCert);
    });
  });

  describe('renewCertificate', () => {
    it('calls POST /certificates/:id/renew and returns new certificate and isExisting flag', async () => {
      const mockRenewedCert = { id: 'certNew', certificateNumber: 'SKILLTRACK-2026-NEW0001' };
      api.post.mockResolvedValueOnce({
        data: {
          data: { certificate: mockRenewedCert, isExisting: false },
        },
      });

      const result = await certificateService.renewCertificate('certOld', {
        reason: 'Annual recertification',
      });

      expect(api.post).toHaveBeenCalledWith('/certificates/certOld/renew', {
        reason: 'Annual recertification',
      });
      expect(result.certificate).toEqual(mockRenewedCert);
      expect(result.isExisting).toBe(false);
    });
  });

  describe('getCertificateRenewals', () => {
    it('fetches renewal chain and unwraps parent, certificate, and renewals', async () => {
      const chainData = {
        certificate: { id: 'currCert', certificateNumber: 'SKILLTRACK-2026-CURR' },
        parent: { id: 'parentCert', certificateNumber: 'SKILLTRACK-2025-PARENT' },
        renewals: [{ id: 'renewCert', certificateNumber: 'SKILLTRACK-2027-RENEW' }],
      };
      api.get.mockResolvedValueOnce({
        data: {
          data: chainData,
        },
      });

      const result = await certificateService.getCertificateRenewals('currCert');

      expect(api.get).toHaveBeenCalledWith('/certificates/currCert/renewals');
      expect(result.parent.certificateNumber).toBe('SKILLTRACK-2025-PARENT');
      expect(result.certificate.certificateNumber).toBe('SKILLTRACK-2026-CURR');
      expect(result.renewals).toHaveLength(1);
    });
  });

  describe('verifyCertificate', () => {
    it('calls public verify endpoint with normalized uppercase certificate number', async () => {
      const mockVerification = {
        certificateNumber: 'SKILLTRACK-2026-A1B2C3D4',
        lifecycleStatus: 'active',
        employeeName: 'Jane Doe',
      };
      api.get.mockResolvedValueOnce({
        data: {
          data: { certificate: mockVerification },
        },
      });

      const result = await certificateService.verifyCertificate('  skilltrack-2026-a1b2c3d4  ');

      expect(api.get).toHaveBeenCalledWith(
        '/certificates/verify/SKILLTRACK-2026-A1B2C3D4'
      );
      expect(result.certificateNumber).toBe('SKILLTRACK-2026-A1B2C3D4');
      expect(result.employeeName).toBe('Jane Doe');
    });
  });

  describe('issueCertificate', () => {
    it('issues a certificate upon completed course enrollment', async () => {
      const mockCert = { id: 'newCert', certificateNumber: 'SKILLTRACK-2026-FIRST123' };
      api.post.mockResolvedValueOnce({
        data: {
          data: { certificate: mockCert, isExisting: false },
        },
      });

      const result = await certificateService.issueCertificate({ enrollmentId: 'enr101' });

      expect(api.post).toHaveBeenCalledWith('/certificates', { enrollmentId: 'enr101' });
      expect(result.certificate).toEqual(mockCert);
      expect(result.isExisting).toBe(false);
    });
  });
});
