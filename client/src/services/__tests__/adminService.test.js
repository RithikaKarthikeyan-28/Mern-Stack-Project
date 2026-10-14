import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../api';
import adminService from '../adminService';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Employee Management', () => {
    it('getEmployees requests /employees with query params and returns array', async () => {
      const mockEmployees = [{ _id: 'e1', employeeId: 'EMP-01', user: { name: 'Alice' } }];
      api.get.mockResolvedValueOnce({ data: { data: { employees: mockEmployees } } });

      const res = await adminService.getEmployees({ department: 'd1', isActive: true });
      expect(api.get).toHaveBeenCalledWith('/employees', { params: { department: 'd1', isActive: true } });
      expect(res).toEqual(mockEmployees);
    });

    it('getEmployeeById requests /employees/:id and returns employee', async () => {
      const mockEmp = { _id: 'e1', employeeId: 'EMP-01' };
      api.get.mockResolvedValueOnce({ data: { data: { employee: mockEmp } } });

      const res = await adminService.getEmployeeById('e1');
      expect(api.get).toHaveBeenCalledWith('/employees/e1');
      expect(res).toEqual(mockEmp);
    });

    it('createEmployee posts to /employees', async () => {
      const payload = { user: 'u1', employeeId: 'EMP-02', department: 'd1' };
      const created = { _id: 'e2', ...payload };
      api.post.mockResolvedValueOnce({ data: { data: { employee: created } } });

      const res = await adminService.createEmployee(payload);
      expect(api.post).toHaveBeenCalledWith('/employees', payload);
      expect(res).toEqual(created);
    });

    it('updateEmployee patches /employees/:id', async () => {
      const payload = { designation: 'Lead Architect' };
      const updated = { _id: 'e1', ...payload };
      api.patch.mockResolvedValueOnce({ data: { data: { employee: updated } } });

      const res = await adminService.updateEmployee('e1', payload);
      expect(api.patch).toHaveBeenCalledWith('/employees/e1', payload);
      expect(res).toEqual(updated);
    });

    it('deleteEmployee sends delete to /employees/:id', async () => {
      api.delete.mockResolvedValueOnce({ data: { data: { employee: { _id: 'e1', isActive: false } } } });
      const res = await adminService.deleteEmployee('e1');
      expect(api.delete).toHaveBeenCalledWith('/employees/e1');
      expect(res).toEqual({ _id: 'e1', isActive: false });
    });

    it('getEmployeeCompliance requests /employees/:id/compliance', async () => {
      const mockAssignments = [{ _id: 'a1', status: 'compliant' }];
      api.get.mockResolvedValueOnce({ data: { data: { assignments: mockAssignments } } });

      const res = await adminService.getEmployeeCompliance('e1');
      expect(api.get).toHaveBeenCalledWith('/employees/e1/compliance');
      expect(res).toEqual(mockAssignments);
    });
  });

  describe('Department Management', () => {
    it('getDepartments requests /departments and returns departments', async () => {
      const mockDepts = [{ _id: 'd1', name: 'Engineering' }];
      api.get.mockResolvedValueOnce({ data: { data: { departments: mockDepts } } });

      const res = await adminService.getDepartments();
      expect(api.get).toHaveBeenCalledWith('/departments', { params: {} });
      expect(res).toEqual(mockDepts);
    });

    it('getDepartmentById requests /departments/:id', async () => {
      const dept = { _id: 'd1', name: 'HR' };
      api.get.mockResolvedValueOnce({ data: { data: { department: dept } } });

      const res = await adminService.getDepartmentById('d1');
      expect(api.get).toHaveBeenCalledWith('/departments/d1');
      expect(res).toEqual(dept);
    });

    it('createDepartment posts to /departments', async () => {
      const payload = { name: 'Finance', description: 'Fiscal ops' };
      const created = { _id: 'd2', ...payload };
      api.post.mockResolvedValueOnce({ data: { data: { department: created } } });

      const res = await adminService.createDepartment(payload);
      expect(api.post).toHaveBeenCalledWith('/departments', payload);
      expect(res).toEqual(created);
    });

    it('updateDepartment patches /departments/:id', async () => {
      const payload = { name: 'Financial Operations' };
      api.patch.mockResolvedValueOnce({ data: { data: { department: { _id: 'd2', ...payload } } } });

      const res = await adminService.updateDepartment('d2', payload);
      expect(api.patch).toHaveBeenCalledWith('/departments/d2', payload);
      expect(res).toEqual({ _id: 'd2', ...payload });
    });

    it('deleteDepartment sends delete to /departments/:id', async () => {
      api.delete.mockResolvedValueOnce({ data: { data: { department: { _id: 'd2', isActive: false } } } });
      const res = await adminService.deleteDepartment('d2');
      expect(api.delete).toHaveBeenCalledWith('/departments/d2');
      expect(res).toEqual({ _id: 'd2', isActive: false });
    });
  });

  describe('Course Oversight', () => {
    it('getCourses requests /courses with filters', async () => {
      const mockCourses = [{ _id: 'c1', title: 'Data Privacy' }];
      api.get.mockResolvedValueOnce({ data: { data: { courses: mockCourses } } });

      const res = await adminService.getCourses({ status: 'published' });
      expect(api.get).toHaveBeenCalledWith('/courses', { params: { status: 'published' } });
      expect(res).toEqual(mockCourses);
    });

    it('getCourseById requests /courses/:id', async () => {
      const course = { _id: 'c1', title: 'Data Privacy' };
      api.get.mockResolvedValueOnce({ data: { data: { course } } });

      const res = await adminService.getCourseById('c1');
      expect(api.get).toHaveBeenCalledWith('/courses/c1');
      expect(res).toEqual(course);
    });

    it('createCourse posts to /courses', async () => {
      const payload = { title: 'Security Ops', level: 'advanced' };
      api.post.mockResolvedValueOnce({ data: { data: { course: { _id: 'c2', ...payload } } } });

      const res = await adminService.createCourse(payload);
      expect(api.post).toHaveBeenCalledWith('/courses', payload);
      expect(res).toEqual({ _id: 'c2', ...payload });
    });

    it('updateCourse patches /courses/:id', async () => {
      const payload = { status: 'archived' };
      api.patch.mockResolvedValueOnce({ data: { data: { course: { _id: 'c1', ...payload } } } });

      const res = await adminService.updateCourse('c1', payload);
      expect(api.patch).toHaveBeenCalledWith('/courses/c1', payload);
      expect(res).toEqual({ _id: 'c1', ...payload });
    });

    it('deleteCourse deletes /courses/:id', async () => {
      api.delete.mockResolvedValueOnce({ data: { data: { success: true } } });
      const res = await adminService.deleteCourse('c1');
      expect(api.delete).toHaveBeenCalledWith('/courses/c1');
      expect(res).toEqual({ success: true });
    });
  });

  describe('Assessment Oversight', () => {
    it('getAssessments requests /assessments', async () => {
      const mockAssessments = [{ _id: 'a1', title: 'Security Exam' }];
      api.get.mockResolvedValueOnce({ data: { data: { assessments: mockAssessments } } });

      const res = await adminService.getAssessments({ course: 'c1' });
      expect(api.get).toHaveBeenCalledWith('/assessments', { params: { course: 'c1' } });
      expect(res).toEqual(mockAssessments);
    });

    it('getAssessmentById requests /assessments/:id', async () => {
      const mockAssessment = { _id: 'a1', title: 'Security Exam' };
      api.get.mockResolvedValueOnce({ data: { data: { assessment: mockAssessment } } });

      const res = await adminService.getAssessmentById('a1');
      expect(api.get).toHaveBeenCalledWith('/assessments/a1');
      expect(res).toEqual(mockAssessment);
    });

    it('createAssessment, updateAssessment, publishAssessment, archiveAssessment, deleteAssessment', async () => {
      api.post.mockResolvedValueOnce({ data: { data: { assessment: { _id: 'a2', title: 'New Test' } } } });
      const created = await adminService.createAssessment({ title: 'New Test' });
      expect(api.post).toHaveBeenCalledWith('/assessments', { title: 'New Test' });
      expect(created._id).toBe('a2');

      api.patch.mockResolvedValueOnce({ data: { data: { assessment: { _id: 'a2', title: 'Updated' } } } });
      const updated = await adminService.updateAssessment('a2', { title: 'Updated' });
      expect(api.patch).toHaveBeenCalledWith('/assessments/a2', { title: 'Updated' });
      expect(updated.title).toBe('Updated');

      api.patch.mockResolvedValueOnce({ data: { data: { assessment: { _id: 'a2', status: 'published' } } } });
      const pub = await adminService.publishAssessment('a2');
      expect(api.patch).toHaveBeenCalledWith('/assessments/a2/publish');
      expect(pub.status).toBe('published');

      api.patch.mockResolvedValueOnce({ data: { data: { assessment: { _id: 'a2', status: 'archived' } } } });
      const arch = await adminService.archiveAssessment('a2');
      expect(api.patch).toHaveBeenCalledWith('/assessments/a2/archive');
      expect(arch.status).toBe('archived');

      api.delete.mockResolvedValueOnce({ data: { data: { success: true } } });
      const del = await adminService.deleteAssessment('a2');
      expect(api.delete).toHaveBeenCalledWith('/assessments/a2');
      expect(del).toEqual({ success: true });
    });

    it('getAssessmentPerformance requests /assessments/:id/performance', async () => {
      const perf = { passRate: 85, averageScore: 82.4 };
      api.get.mockResolvedValueOnce({ data: { data: perf } });

      const res = await adminService.getAssessmentPerformance('a1');
      expect(api.get).toHaveBeenCalledWith('/assessments/a1/performance');
      expect(res).toEqual(perf);
    });
  });

  describe('Compliance Oversight', () => {
    it('getComplianceSummary requests /compliance/summary', async () => {
      const summary = { complianceRate: 92, totalRequirements: 5 };
      api.get.mockResolvedValueOnce({ data: { data: summary } });

      const res = await adminService.getComplianceSummary();
      expect(api.get).toHaveBeenCalledWith('/compliance/summary', { params: {} });
      expect(res).toEqual(summary);
    });

    it('getComplianceRequirements, create, update, delete', async () => {
      const reqs = [{ _id: 'r1', title: 'OSHA 10' }];
      api.get.mockResolvedValueOnce({ data: { data: { requirements: reqs } } });
      const resGet = await adminService.getComplianceRequirements();
      expect(api.get).toHaveBeenCalledWith('/compliance-requirements', { params: {} });
      expect(resGet).toEqual(reqs);

      api.post.mockResolvedValueOnce({ data: { data: { requirement: { _id: 'r2', title: 'Ethics' } } } });
      const resPost = await adminService.createComplianceRequirement({ title: 'Ethics' });
      expect(api.post).toHaveBeenCalledWith('/compliance-requirements', { title: 'Ethics' });
      expect(resPost.title).toBe('Ethics');

      api.patch.mockResolvedValueOnce({ data: { data: { requirement: { _id: 'r2', title: 'Ethics 2026' } } } });
      const resPatch = await adminService.updateComplianceRequirement('r2', { title: 'Ethics 2026' });
      expect(api.patch).toHaveBeenCalledWith('/compliance-requirements/r2', { title: 'Ethics 2026' });
      expect(resPatch.title).toBe('Ethics 2026');

      api.delete.mockResolvedValueOnce({ data: { data: { message: 'Deleted' } } });
      const resDel = await adminService.deleteComplianceRequirement('r2');
      expect(api.delete).toHaveBeenCalledWith('/compliance-requirements/r2');
      expect(resDel).toEqual({ message: 'Deleted' });
    });

    it('getComplianceAssignments requests /compliance/assignments', async () => {
      const data = { assignments: [{ _id: 'as1' }], pagination: { total: 1 } };
      api.get.mockResolvedValueOnce({ data: { data } });

      const res = await adminService.getComplianceAssignments({ status: 'overdue' });
      expect(api.get).toHaveBeenCalledWith('/compliance/assignments', { params: { status: 'overdue' } });
      expect(res).toEqual(data);
    });

    it('assignRequirementToEmployee and assignRequirementToDepartment', async () => {
      api.post.mockResolvedValueOnce({ data: { data: { assignment: { _id: 'as1' } } } });
      const resEmp = await adminService.assignRequirementToEmployee('r1', 'e1', '2026-12-31');
      expect(api.post).toHaveBeenCalledWith('/compliance-requirements/r1/assignments', {
        employeeId: 'e1',
        dueAt: '2026-12-31',
      });
      expect(resEmp).toEqual({ assignment: { _id: 'as1' } });

      api.post.mockResolvedValueOnce({ data: { data: { created: 10 } } });
      const resDept = await adminService.assignRequirementToDepartment('r1', 'd1', '2026-12-31');
      expect(api.post).toHaveBeenCalledWith('/compliance-requirements/r1/departments/d1/assign', {
        dueAt: '2026-12-31',
      });
      expect(resDept).toEqual({ created: 10 });
    });

    it('refreshComplianceStatuses posts /compliance/refresh-statuses', async () => {
      api.post.mockResolvedValueOnce({ data: { data: { updatedCount: 4 } } });
      const res = await adminService.refreshComplianceStatuses();
      expect(api.post).toHaveBeenCalledWith('/compliance/refresh-statuses');
      expect(res).toEqual({ updatedCount: 4 });
    });
  });

  describe('Certificate Oversight', () => {
    it('getCertificates, getExpiringCertificates, getExpiredCertificates', async () => {
      api.get.mockResolvedValueOnce({ data: { data: { certificates: [{ _id: 'c1' }] } } });
      const certs = await adminService.getCertificates();
      expect(api.get).toHaveBeenCalledWith('/certificates', { params: {} });
      expect(certs).toEqual({ certificates: [{ _id: 'c1' }] });

      api.get.mockResolvedValueOnce({ data: { data: { certificates: [{ _id: 'c2', status: 'expiring' }] } } });
      const expiring = await adminService.getExpiringCertificates();
      expect(api.get).toHaveBeenCalledWith('/certificates/expiring', { params: {} });
      expect(expiring).toEqual([{ _id: 'c2', status: 'expiring' }]);

      api.get.mockResolvedValueOnce({ data: { data: { certificates: [{ _id: 'c3', status: 'expired' }] } } });
      const expired = await adminService.getExpiredCertificates();
      expect(api.get).toHaveBeenCalledWith('/certificates/expired', { params: {} });
      expect(expired).toEqual([{ _id: 'c3', status: 'expired' }]);
    });

    it('revokeCertificate patches /certificates/:id/revoke with reason', async () => {
      const revoked = { _id: 'c1', status: 'revoked', revocationReason: 'Issued in error' };
      api.patch.mockResolvedValueOnce({ data: { data: { certificate: revoked } } });

      const res = await adminService.revokeCertificate('c1', 'Issued in error');
      expect(api.patch).toHaveBeenCalledWith('/certificates/c1/revoke', {
        revocationReason: 'Issued in error',
      });
      expect(res).toEqual(revoked);
    });

    it('getCertificateById and getCertificateRenewals', async () => {
      api.get.mockResolvedValueOnce({ data: { data: { certificate: { _id: 'c1' } } } });
      const cert = await adminService.getCertificateById('c1');
      expect(api.get).toHaveBeenCalledWith('/certificates/c1');
      expect(cert).toEqual({ _id: 'c1' });

      api.get.mockResolvedValueOnce({ data: { data: { renewals: [{ _id: 'c1-renewed' }] } } });
      const renewals = await adminService.getCertificateRenewals('c1');
      expect(api.get).toHaveBeenCalledWith('/certificates/c1/renewals');
      expect(renewals).toEqual([{ _id: 'c1-renewed' }]);
    });
  });

  describe('Enrollment Oversight', () => {
    it('getAllEnrollments requests /enrollments', async () => {
      const enrollments = [{ _id: 'en1', progressPercentage: 50 }];
      api.get.mockResolvedValueOnce({ data: { data: { enrollments } } });

      const res = await adminService.getAllEnrollments();
      expect(api.get).toHaveBeenCalledWith('/enrollments', { params: {} });
      expect(res).toEqual(enrollments);
    });
  });

  describe('Dashboard Overview Aggregator', () => {
    it('successfully computes aggregate metrics across all organizational resources', async () => {
      // Mock the respective calls
      vi.spyOn(adminService, 'getEmployees').mockResolvedValueOnce([
        { _id: 'e1', isActive: true },
        { _id: 'e2', isActive: false },
      ]);
      vi.spyOn(adminService, 'getDepartments').mockResolvedValueOnce([
        { _id: 'd1', isActive: true },
      ]);
      vi.spyOn(adminService, 'getCourses').mockResolvedValueOnce([
        { _id: 'c1', status: 'published' },
        { _id: 'c2', status: 'draft' },
      ]);
      vi.spyOn(adminService, 'getAssessments').mockResolvedValueOnce([
        { _id: 'a1', status: 'published' },
      ]);
      vi.spyOn(adminService, 'getComplianceSummary').mockResolvedValueOnce({
        complianceRate: 88,
        totalRequirements: 4,
        compliant: 12,
        overdue: 1,
      });
      vi.spyOn(adminService, 'getCertificates').mockResolvedValueOnce({
        certificates: [{ _id: 'cert1' }],
        pagination: { total: 25 },
      });
      vi.spyOn(adminService, 'getExpiringCertificates').mockResolvedValueOnce([
        { _id: 'cert2' },
      ]);
      vi.spyOn(adminService, 'getAllEnrollments').mockResolvedValueOnce([
        { _id: 'en1' },
      ]);

      const overview = await adminService.getDashboardOverview();

      expect(overview.employees.total).toBe(2);
      expect(overview.employees.active).toBe(1);
      expect(overview.departments.total).toBe(1);
      expect(overview.departments.active).toBe(1);
      expect(overview.courses.total).toBe(2);
      expect(overview.courses.published).toBe(1);
      expect(overview.assessments.total).toBe(1);
      expect(overview.assessments.published).toBe(1);
      expect(overview.compliance.complianceRate).toBe(88);
      expect(overview.certificates.total).toBe(25);
      expect(overview.certificates.expiringCount).toBe(1);
      expect(overview.enrollments.total).toBe(1);
    });

    it('isolates failures via Promise.allSettled and falls back gracefully', async () => {
      vi.spyOn(adminService, 'getEmployees').mockRejectedValueOnce(new Error('Network down'));
      vi.spyOn(adminService, 'getDepartments').mockResolvedValueOnce([]);
      vi.spyOn(adminService, 'getCourses').mockResolvedValueOnce([]);
      vi.spyOn(adminService, 'getAssessments').mockRejectedValueOnce(new Error('Assessments down'));
      vi.spyOn(adminService, 'getComplianceSummary').mockRejectedValueOnce(new Error('Compliance down'));
      vi.spyOn(adminService, 'getCertificates').mockResolvedValueOnce({ certificates: [] });
      vi.spyOn(adminService, 'getExpiringCertificates').mockResolvedValueOnce([]);
      vi.spyOn(adminService, 'getAllEnrollments').mockResolvedValueOnce([]);

      const overview = await adminService.getDashboardOverview();

      expect(overview.employees.total).toBe(0);
      expect(overview.employees.list).toEqual([]);
      expect(overview.assessments.total).toBe(0);
      expect(overview.compliance.complianceRate).toBe(0);
      expect(overview.certificates.total).toBe(0);
    });
  });
});
