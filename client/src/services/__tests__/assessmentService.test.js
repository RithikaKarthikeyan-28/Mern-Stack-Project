import { describe, it, expect, vi, beforeEach } from 'vitest';
import assessmentService from '../assessmentService';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('assessmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAssessmentById makes GET /assessments/:id request', async () => {
    const mockData = { data: { data: { assessment: { id: 'a1', title: 'Quiz 1' } } } };
    api.get.mockResolvedValue(mockData);

    const result = await assessmentService.getAssessmentById('a1');

    expect(api.get).toHaveBeenCalledWith('/assessments/a1');
    expect(result).toEqual({ id: 'a1', title: 'Quiz 1' });
  });

  it('getAttemptData makes GET /assessments/:id/attempt-data request', async () => {
    const mockData = { data: { data: { assessment: {}, questions: [] } } };
    api.get.mockResolvedValue(mockData);

    const result = await assessmentService.getAttemptData('a1');

    expect(api.get).toHaveBeenCalledWith('/assessments/a1/attempt-data');
    expect(result).toEqual({ assessment: {}, questions: [] });
  });

  it('startAttempt makes POST /assessments/:id/attempts request', async () => {
    const mockData = { data: { data: { attempt: { id: 'att1', attemptNumber: 1 } } } };
    api.post.mockResolvedValue(mockData);

    const result = await assessmentService.startAttempt('a1');

    expect(api.post).toHaveBeenCalledWith('/assessments/a1/attempts');
    expect(result).toEqual({ id: 'att1', attemptNumber: 1 });
  });

  it('getAttemptById makes GET /assessments/attempts/:attemptId request', async () => {
    const mockData = { data: { data: { attempt: { id: 'att1' } } } };
    api.get.mockResolvedValue(mockData);

    const result = await assessmentService.getAttemptById('att1');

    expect(api.get).toHaveBeenCalledWith('/assessments/attempts/att1');
    expect(result).toEqual({ id: 'att1' });
  });

  it('submitAttempt makes PATCH /assessments/attempts/:attemptId/submit request with answers payload', async () => {
    const payload = {
      answers: [{ question: 'q1', selectedAnswers: ['A'] }],
    };
    const mockData = { data: { data: { attempt: { id: 'att1', status: 'submitted' } } } };
    api.patch.mockResolvedValue(mockData);

    const result = await assessmentService.submitAttempt('att1', payload);

    expect(api.patch).toHaveBeenCalledWith('/assessments/attempts/att1/submit', payload);
    expect(result).toEqual({ id: 'att1', status: 'submitted' });
  });

  it('getAttemptResult makes GET /assessments/attempts/:attemptId/result request', async () => {
    const mockData = { data: { data: { result: { id: 'att1', percentage: 85 } } } };
    api.get.mockResolvedValue(mockData);

    const result = await assessmentService.getAttemptResult('att1');

    expect(api.get).toHaveBeenCalledWith('/assessments/attempts/att1/result');
    expect(result).toEqual({ id: 'att1', percentage: 85 });
  });

  it('getMyAssessmentHistory makes GET /assessments/results/me request', async () => {
    const mockData = { data: { data: { history: [{ id: 'h1' }] } } };
    api.get.mockResolvedValue(mockData);

    const result = await assessmentService.getMyAssessmentHistory();

    expect(api.get).toHaveBeenCalledWith('/assessments/results/me');
    expect(result).toEqual([{ id: 'h1' }]);
  });

  it('saveDraftAnswers makes PATCH /assessments/attempts/:attemptId/answers request', async () => {
    const payload = {
      answers: [{ question: 'q1', selectedAnswers: ['B'] }],
    };
    const mockData = { data: { data: { attempt: { id: 'att1', answers: payload.answers } } } };
    api.patch.mockResolvedValue(mockData);

    const result = await assessmentService.saveDraftAnswers('att1', payload);

    expect(api.patch).toHaveBeenCalledWith('/assessments/attempts/att1/answers', payload);
    expect(result).toEqual({ id: 'att1', answers: payload.answers });
  });

  it('getCourseAssessmentStatus makes GET /assessments/course/:courseId request', async () => {
    const mockData = { data: { data: { isUnlocked: true, courseProgress: 100 } } };
    api.get.mockResolvedValue(mockData);

    const result = await assessmentService.getCourseAssessmentStatus('c1');

    expect(api.get).toHaveBeenCalledWith('/assessments/course/c1');
    expect(result).toEqual({ isUnlocked: true, courseProgress: 100 });
  });

  it('getAssessments makes GET /assessments request', async () => {
    const mockData = { data: { data: { assessments: [{ id: 'a1' }, { id: 'a2' }] } } };
    api.get.mockResolvedValue(mockData);

    const result = await assessmentService.getAssessments();

    expect(api.get).toHaveBeenCalledWith('/assessments', { params: {} });
    expect(result).toEqual([{ id: 'a1' }, { id: 'a2' }]);
  });
});
