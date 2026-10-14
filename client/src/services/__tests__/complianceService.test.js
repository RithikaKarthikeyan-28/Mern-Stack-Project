import { describe, it, expect, vi, beforeEach } from 'vitest';
import complianceService from '../complianceService';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('complianceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyComplianceSummary', () => {
    it('fetches authenticated employee compliance summary metrics', async () => {
      const mockPayload = {
        data: {
          data: {
            totalRequirements: 5,
            totalAssignments: 5,
            compliant: 3,
            dueSoon: 1,
            overdue: 1,
            inProgress: 0,
            notStarted: 0,
            complianceRate: 60,
          },
        },
      };
      api.get.mockResolvedValueOnce(mockPayload);

      const result = await complianceService.getMyComplianceSummary();

      expect(api.get).toHaveBeenCalledWith('/employees/me/compliance/summary');
      expect(result.totalRequirements).toBe(5);
      expect(result.compliant).toBe(3);
      expect(result.dueSoon).toBe(1);
      expect(result.overdue).toBe(1);
      expect(result.complianceRate).toBe(60);
    });

    it('falls back to safe default metrics when response is empty', async () => {
      api.get.mockResolvedValueOnce({ data: {} });

      const result = await complianceService.getMyComplianceSummary();

      expect(result.totalRequirements).toBe(0);
      expect(result.compliant).toBe(0);
      expect(result.complianceRate).toBe(100);
    });

    it('propagates API network rejection', async () => {
      api.get.mockRejectedValueOnce(new Error('Network failure'));

      await expect(complianceService.getMyComplianceSummary()).rejects.toThrow('Network failure');
    });
  });

  describe('getMyComplianceAssignments', () => {
    it('fetches authenticated employee compliance assignments list with params', async () => {
      const mockAssignments = [
        {
          _id: 'ca1',
          status: 'COMPLIANT',
          dueAt: '2026-12-31T00:00:00.000Z',
          complianceRequirement: {
            title: 'Information Security Standard',
          },
        },
      ];
      api.get.mockResolvedValueOnce({
        data: {
          data: {
            assignments: mockAssignments,
          },
        },
      });

      const result = await complianceService.getMyComplianceAssignments({ status: 'COMPLIANT' });

      expect(api.get).toHaveBeenCalledWith('/employees/me/compliance', {
        params: { status: 'COMPLIANT' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('COMPLIANT');
      expect(result[0].complianceRequirement.title).toBe('Information Security Standard');
    });

    it('handles direct array response and empty fallback', async () => {
      api.get.mockResolvedValueOnce({
        data: {
          assignments: [],
        },
      });

      const result = await complianceService.getMyComplianceAssignments();

      expect(result).toEqual([]);
    });

    it('propagates API network rejection for assignments', async () => {
      api.get.mockRejectedValueOnce(new Error('Server unavailable'));

      await expect(complianceService.getMyComplianceAssignments()).rejects.toThrow('Server unavailable');
    });
  });
});
