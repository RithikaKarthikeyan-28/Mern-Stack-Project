import { describe, it, expect, vi, beforeEach } from 'vitest';
import recommendationService from '../recommendationService';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('recommendationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyRecommendations fetches recommendations for self', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: {
          summary: { candidateCourses: 3 },
          recommendations: [{ score: 95 }],
        },
      },
    });

    const result = await recommendationService.getMyRecommendations('jr1', { mandatoryOnly: 'true' });

    expect(api.get).toHaveBeenCalledWith('/employees/me/recommendations/jr1', {
      params: { mandatoryOnly: 'true' },
    });
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].score).toBe(95);
  });

  it('getEmployeeRecommendations fetches recommendations for arbitrary employee (admin)', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: {
          summary: { candidateCourses: 1 },
          recommendations: [{ score: 85 }],
        },
      },
    });

    const result = await recommendationService.getEmployeeRecommendations('emp123', 'jr1');

    expect(api.get).toHaveBeenCalledWith('/employees/emp123/recommendations/jr1', { params: {} });
    expect(result.recommendations[0].score).toBe(85);
  });
});
