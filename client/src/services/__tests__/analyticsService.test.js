import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../api';
import analyticsService from '../analyticsService';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Individual Domain Endpoints', () => {
    it('getOverviewAnalytics calls /analytics/overview with cleaned params', async () => {
      const mockData = { employees: { total: 10 } };
      api.get.mockResolvedValueOnce({ data: { data: mockData } });

      const result = await analyticsService.getOverviewAnalytics({
        from: '2026-01-01',
        to: '2026-03-31',
        emptyField: '',
        nullField: null,
      });

      expect(api.get).toHaveBeenCalledWith('/analytics/overview', {
        params: { from: '2026-01-01', to: '2026-03-31' },
      });
      expect(result).toEqual(mockData);
    });

    it('getLearningAnalytics calls /analytics/learning with cleaned params', async () => {
      const mockData = { totalEnrollments: 25, completionRate: 80 };
      api.get.mockResolvedValueOnce({ data: { data: mockData } });

      const result = await analyticsService.getLearningAnalytics({
        courseId: 'c123',
        departmentId: 'd456',
        status: 'completed',
        invalid: '',
      });

      expect(api.get).toHaveBeenCalledWith('/analytics/learning', {
        params: { courseId: 'c123', departmentId: 'd456', status: 'completed' },
      });
      expect(result).toEqual(mockData);
    });

    it('getAssessmentAnalytics calls /analytics/assessments with cleaned params', async () => {
      const mockData = { submittedAttempts: 40, passRate: 85 };
      api.get.mockResolvedValueOnce({ data: { data: mockData } });

      const result = await analyticsService.getAssessmentAnalytics({
        courseId: 'c123',
      });

      expect(api.get).toHaveBeenCalledWith('/analytics/assessments', {
        params: { courseId: 'c123' },
      });
      expect(result).toEqual(mockData);
    });

    it('getComplianceAnalytics calls /analytics/compliance with cleaned params', async () => {
      const mockData = { totalAssignments: 50, complianceRate: 92 };
      api.get.mockResolvedValueOnce({ data: { data: mockData } });

      const result = await analyticsService.getComplianceAnalytics({
        departmentId: 'd456',
        status: 'COMPLIANT',
      });

      expect(api.get).toHaveBeenCalledWith('/analytics/compliance', {
        params: { departmentId: 'd456', status: 'COMPLIANT' },
      });
      expect(result).toEqual(mockData);
    });

    it('getCertificationAnalytics calls /analytics/certifications with cleaned params', async () => {
      const mockData = { totalIssued: 30, active: 28 };
      api.get.mockResolvedValueOnce({ data: { data: mockData } });

      const result = await analyticsService.getCertificationAnalytics({
        status: 'active',
      });

      expect(api.get).toHaveBeenCalledWith('/analytics/certifications', {
        params: { status: 'active' },
      });
      expect(result).toEqual(mockData);
    });

    it('getEmployeeAnalytics calls /analytics/employees with cleaned params', async () => {
      const mockData = { totalEmployees: 100, activeEmployees: 95 };
      api.get.mockResolvedValueOnce({ data: { data: mockData } });

      const result = await analyticsService.getEmployeeAnalytics({
        departmentId: 'd456',
        page: 1,
        limit: 10,
      });

      expect(api.get).toHaveBeenCalledWith('/analytics/employees', {
        params: { departmentId: 'd456', page: 1, limit: 10 },
      });
      expect(result).toEqual(mockData);
    });

    it('getDepartmentAnalytics calls /analytics/departments with cleaned params', async () => {
      const mockData = { departments: [{ departmentName: 'Engineering' }] };
      api.get.mockResolvedValueOnce({ data: { data: mockData } });

      const result = await analyticsService.getDepartmentAnalytics({
        page: 1,
        limit: 20,
      });

      expect(api.get).toHaveBeenCalledWith('/analytics/departments', {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockData);
    });

    it('getCourseAnalytics calls /analytics/courses with cleaned params', async () => {
      const mockData = { courses: [{ title: 'React Mastery' }] };
      api.get.mockResolvedValueOnce({ data: { data: mockData } });

      const result = await analyticsService.getCourseAnalytics({
        status: 'published',
        level: 'intermediate',
      });

      expect(api.get).toHaveBeenCalledWith('/analytics/courses', {
        params: { status: 'published', level: 'intermediate' },
      });
      expect(result).toEqual(mockData);
    });

    it('handles response where data is at top level rather than res.data.data', async () => {
      const mockData = { total: 5 };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await analyticsService.getOverviewAnalytics({});
      expect(result).toEqual(mockData);
    });
  });

  describe('Comprehensive Composite Fetch & Error Resilience', () => {
    it('getComprehensiveAnalytics succeeds and returns aggregated datasets when all endpoints resolve', async () => {
      api.get
        .mockResolvedValueOnce({ data: { data: { employees: { total: 50 } } } }) // overview
        .mockResolvedValueOnce({ data: { data: { totalEnrollments: 20 } } }) // learning
        .mockResolvedValueOnce({ data: { data: { passRate: 85 } } }) // assessments
        .mockResolvedValueOnce({ data: { data: { complianceRate: 90 } } }) // compliance
        .mockResolvedValueOnce({ data: { data: { totalIssued: 15 } } }) // certifications
        .mockResolvedValueOnce({ data: { data: { departments: [] } } }) // departments
        .mockResolvedValueOnce({ data: { data: { courses: [] } } }); // courses

      const result = await analyticsService.getComprehensiveAnalytics({
        from: '2026-01-01',
        to: '2026-01-31',
      });

      expect(result.overview).toEqual({ employees: { total: 50 } });
      expect(result.learning).toEqual({ totalEnrollments: 20 });
      expect(result.assessments).toEqual({ passRate: 85 });
      expect(result.compliance).toEqual({ complianceRate: 90 });
      expect(result.certifications).toEqual({ totalIssued: 15 });
      expect(result.hasPartialError).toBe(false);
      expect(result.errors).toBeNull();
      expect(result.timestamp).toBeDefined();
    });

    it('getComprehensiveAnalytics handles partial failure gracefully using Promise.allSettled', async () => {
      api.get
        .mockResolvedValueOnce({ data: { data: { employees: { total: 50 } } } }) // overview
        .mockRejectedValueOnce(new Error('Learning service timeout')) // learning fails
        .mockResolvedValueOnce({ data: { data: { passRate: 85 } } }) // assessments
        .mockResolvedValueOnce({ data: { data: { complianceRate: 90 } } }) // compliance
        .mockResolvedValueOnce({ data: { data: { totalIssued: 15 } } }) // certifications
        .mockResolvedValueOnce({ data: { data: { departments: [] } } }) // departments
        .mockResolvedValueOnce({ data: { data: { courses: [] } } }); // courses

      const result = await analyticsService.getComprehensiveAnalytics({});

      expect(result.overview).toEqual({ employees: { total: 50 } });
      expect(result.learning).toBeNull();
      expect(result.assessments).toEqual({ passRate: 85 });
      expect(result.hasPartialError).toBe(true);
      expect(result.errors).toHaveProperty('learning', 'Learning service timeout');
    });
  });

  describe('Safe CSV Export Utility', () => {
    it('throws error if rows array is empty or non-array', () => {
      expect(() => analyticsService.exportToCSV('report.csv', [], [])).toThrow(
        'No data available to export.'
      );
      expect(() => analyticsService.exportToCSV('report.csv', [], null)).toThrow(
        'No data available to export.'
      );
    });

    it('creates a download link, sets filename, and triggers click on valid data', () => {
      const realLink = document.createElement('a');
      const clickSpy = vi.spyOn(realLink, 'click').mockImplementation(() => {});
      const setAttributeSpy = vi.spyOn(realLink, 'setAttribute');
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(realLink);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      const columns = [
        { label: 'Department Name', key: 'name' },
        { label: 'Employees', key: 'count' },
      ];
      const rows = [
        { name: 'Engineering', count: 42 },
        { name: 'Marketing, Operations', count: 18 },
      ];

      analyticsService.exportToCSV('test_report', columns, rows);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(setAttributeSpy).toHaveBeenCalledWith('download', 'test_report.csv');
      expect(clickSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(realLink);
      expect(removeChildSpy).toHaveBeenCalledWith(realLink);

      createElementSpy.mockRestore();
      clickSpy.mockRestore();
      setAttributeSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});
