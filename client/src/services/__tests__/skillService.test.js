import { describe, it, expect, vi, beforeEach } from 'vitest';
import skillService from '../skillService';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('skillService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMySkills', () => {
    it('fetches authenticated employee skills successfully', async () => {
      const mockPayload = {
        data: {
          data: {
            employeeSkills: [
              { _id: 'es1', skill: { name: 'React', category: 'Frontend' }, proficiencyLevel: 'intermediate' },
            ],
            total: 1,
          },
        },
      };
      api.get.mockResolvedValueOnce(mockPayload);

      const result = await skillService.getMySkills();

      expect(api.get).toHaveBeenCalledWith('/employees/me/skills');
      expect(result.employeeSkills).toHaveLength(1);
      expect(result.employeeSkills[0].proficiencyLevel).toBe('intermediate');
      expect(result.total).toBe(1);
    });

    it('falls back safely when response is empty', async () => {
      api.get.mockResolvedValueOnce({ data: {} });

      const result = await skillService.getMySkills();

      expect(result.employeeSkills).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getSkills', () => {
    it('fetches skills list with query filters', async () => {
      const mockSkills = [
        { _id: 's1', name: 'Node.js', category: 'Backend' },
      ];
      api.get.mockResolvedValueOnce({
        data: {
          data: {
            skills: mockSkills,
            pagination: { page: 1, total: 1 },
          },
        },
      });

      const result = await skillService.getSkills({ category: 'Backend' });

      expect(api.get).toHaveBeenCalledWith('/skills', { params: { category: 'Backend' } });
      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].name).toBe('Node.js');
    });
  });

  describe('getSkillById', () => {
    it('fetches single skill by ID', async () => {
      api.get.mockResolvedValueOnce({
        data: {
          data: {
            skill: { _id: 's1', name: 'GraphQL' },
          },
        },
      });

      const result = await skillService.getSkillById('s1');

      expect(api.get).toHaveBeenCalledWith('/skills/s1');
      expect(result.name).toBe('GraphQL');
    });
  });

  describe('getJobRoles', () => {
    it('fetches job roles with params', async () => {
      const mockRoles = [{ _id: 'jr1', name: 'Frontend Engineer', code: 'FE-01' }];
      api.get.mockResolvedValueOnce({
        data: {
          data: {
            jobRoles: mockRoles,
          },
        },
      });

      const result = await skillService.getJobRoles({ isActive: true });

      expect(api.get).toHaveBeenCalledWith('/job-roles', { params: { isActive: true } });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Frontend Engineer');
    });
  });

  describe('getJobRoleById', () => {
    it('fetches single job role by ID', async () => {
      api.get.mockResolvedValueOnce({
        data: {
          data: {
            jobRole: { _id: 'jr1', name: 'Backend Engineer' },
          },
        },
      });

      const result = await skillService.getJobRoleById('jr1');

      expect(api.get).toHaveBeenCalledWith('/job-roles/jr1');
      expect(result.name).toBe('Backend Engineer');
    });
  });

  describe('getJobRoleRequirements', () => {
    it('fetches requirements for a job role', async () => {
      api.get.mockResolvedValueOnce({
        data: {
          data: {
            requirements: [{ _id: 'req1', skill: { name: 'Node.js' }, requiredLevel: 'advanced', mandatory: true }],
            total: 1,
          },
        },
      });

      const result = await skillService.getJobRoleRequirements('jr1', { mandatory: 'true' });

      expect(api.get).toHaveBeenCalledWith('/job-roles/jr1/requirements', { params: { mandatory: 'true' } });
      expect(result.requirements).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getMySkillGap', () => {
    it('fetches skill gap analysis report with filters', async () => {
      const mockGapReport = {
        summary: {
          overallMatchPercentage: 75,
          mandatoryMatchPercentage: 80,
          totalRequirements: 5,
        },
        gaps: [
          { skill: { name: 'Docker' }, requiredLevel: 'intermediate', status: 'MISSING', mandatory: true },
        ],
      };
      api.get.mockResolvedValueOnce({
        data: {
          data: mockGapReport,
        },
      });

      const result = await skillService.getMySkillGap('jr1', { status: 'MISSING' });

      expect(api.get).toHaveBeenCalledWith('/employees/me/skill-gap/jr1', { params: { status: 'MISSING' } });
      expect(result.summary.overallMatchPercentage).toBe(75);
      expect(result.gaps).toHaveLength(1);
    });
  });

  describe('getMyRecommendations', () => {
    it('fetches recommendations with query parameters', async () => {
      const mockRecReport = {
        summary: { totalGapSkills: 2, returnedCourses: 1 },
        recommendations: [
          { course: { title: 'Docker Mastery' }, score: 90, mandatoryGapCount: 1 },
        ],
      };
      api.get.mockResolvedValueOnce({
        data: {
          data: mockRecReport,
        },
      });

      const result = await skillService.getMyRecommendations('jr1', { minScore: 80 });

      expect(api.get).toHaveBeenCalledWith('/employees/me/recommendations/jr1', { params: { minScore: 80 } });
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].score).toBe(90);
    });
  });
});
