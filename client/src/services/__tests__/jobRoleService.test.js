import { describe, it, expect, vi, beforeEach } from 'vitest';
import jobRoleService from '../jobRoleService';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('jobRoleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getJobRoles fetches roles list', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: {
          jobRoles: [{ _id: 'jr1', name: 'Software Engineer', code: 'SWE-01' }],
        },
      },
    });

    const result = await jobRoleService.getJobRoles();

    expect(api.get).toHaveBeenCalledWith('/job-roles', { params: {} });
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('SWE-01');
  });

  it('getJobRoleById fetches single role', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: {
          jobRole: { _id: 'jr1', name: 'DevOps Engineer' },
        },
      },
    });

    const result = await jobRoleService.getJobRoleById('jr1');

    expect(api.get).toHaveBeenCalledWith('/job-roles/jr1');
    expect(result.name).toBe('DevOps Engineer');
  });

  it('getJobRoleRequirements fetches requirements', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: {
          requirements: [{ _id: 'req1', requiredLevel: 'expert' }],
          total: 1,
        },
      },
    });

    const result = await jobRoleService.getJobRoleRequirements('jr1');

    expect(api.get).toHaveBeenCalledWith('/job-roles/jr1/requirements', { params: {} });
    expect(result.requirements).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});
