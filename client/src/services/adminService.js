import api from './api';

export const adminService = {
  // =========================================================================
  // EMPLOYEE MANAGEMENT
  // =========================================================================

  /**
   * Retrieves all employees with optional filters (department, isActive).
   * @param {object} [params={}]
   * @returns {Promise<Array>} List of employees
   */
  getEmployees: async (params = {}) => {
    const res = await api.get('/employees', { params });
    return res.data?.data?.employees || res.data?.employees || [];
  },

  /**
   * Retrieves a single employee by document ID.
   * @param {string} id
   * @returns {Promise<object>} Employee document
   */
  getEmployeeById: async (id) => {
    const res = await api.get(`/employees/${id}`);
    return res.data?.data?.employee || res.data?.employee;
  },

  /**
   * Creates an employee profile linking a User to a Department.
   * @param {object} data - { user, employeeId, department, designation, phone, dateOfJoining }
   * @returns {Promise<object>} Created employee
   */
  createEmployee: async (data) => {
    const res = await api.post('/employees', data);
    return res.data?.data?.employee || res.data?.employee;
  },

  /**
   * Updates an existing employee profile.
   * @param {string} id
   * @param {object} data - { employeeId, department, designation, phone, dateOfJoining, isActive }
   * @returns {Promise<object>} Updated employee
   */
  updateEmployee: async (id, data) => {
    const res = await api.patch(`/employees/${id}`, data);
    return res.data?.data?.employee || res.data?.employee;
  },

  /**
   * Soft-deletes an employee profile.
   * @param {string} id
   * @returns {Promise<object>}
   */
  deleteEmployee: async (id) => {
    const res = await api.delete(`/employees/${id}`);
    return res.data?.data?.employee || res.data?.employee;
  },

  /**
   * Retrieves compliance assignments for an arbitrary employee.
   * @param {string} employeeId
   * @returns {Promise<Array>} List of assignments
   */
  getEmployeeCompliance: async (employeeId) => {
    const res = await api.get(`/employees/${employeeId}/compliance`);
    return res.data?.data?.assignments || res.data?.assignments || [];
  },

  // =========================================================================
  // DEPARTMENT MANAGEMENT
  // =========================================================================

  /**
   * Retrieves all departments, optionally filtered by active status.
   * @param {object} [params={}]
   * @returns {Promise<Array>} List of departments
   */
  getDepartments: async (params = {}) => {
    const res = await api.get('/departments', { params });
    return res.data?.data?.departments || res.data?.departments || [];
  },

  /**
   * Retrieves a single department by ID.
   * @param {string} id
   * @returns {Promise<object>} Department document
   */
  getDepartmentById: async (id) => {
    const res = await api.get(`/departments/${id}`);
    return res.data?.data?.department || res.data?.department;
  },

  /**
   * Creates a new department.
   * @param {object} data - { name, description }
   * @returns {Promise<object>} Created department
   */
  createDepartment: async (data) => {
    const res = await api.post('/departments', data);
    return res.data?.data?.department || res.data?.department;
  },

  /**
   * Updates a department.
   * @param {string} id
   * @param {object} data - { name, description, isActive }
   * @returns {Promise<object>} Updated department
   */
  updateDepartment: async (id, data) => {
    const res = await api.patch(`/departments/${id}`, data);
    return res.data?.data?.department || res.data?.department;
  },

  /**
   * Soft-deletes a department.
   * @param {string} id
   * @returns {Promise<object>}
   */
  deleteDepartment: async (id) => {
    const res = await api.delete(`/departments/${id}`);
    return res.data?.data?.department || res.data?.department;
  },

  // =========================================================================
  // COURSE OVERSIGHT
  // =========================================================================

  /**
   * Retrieves all courses with optional filters (status, category, level, search).
   * @param {object} [params={}]
   * @returns {Promise<Array>} List of courses
   */
  getCourses: async (params = {}) => {
    const res = await api.get('/courses', { params });
    return res.data?.data?.courses || res.data?.courses || [];
  },

  /**
   * Retrieves single course by ID.
   * @param {string} id
   * @returns {Promise<object>} Course document
   */
  getCourseById: async (id) => {
    const res = await api.get(`/courses/${id}`);
    return res.data?.data?.course || res.data?.course;
  },

  /**
   * Creates a course as admin.
   * @param {object} data - { title, description, category, level, duration, status }
   * @returns {Promise<object>} Created course
   */
  createCourse: async (data) => {
    const res = await api.post('/courses', data);
    return res.data?.data?.course || res.data?.course;
  },

  /**
   * Updates course metadata and status.
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object>} Updated course
   */
  updateCourse: async (id, data) => {
    const res = await api.patch(`/courses/${id}`, data);
    return res.data?.data?.course || res.data?.course;
  },

  /**
   * Admin-only deletion of a course.
   * @param {string} id
   * @returns {Promise<object>}
   */
  deleteCourse: async (id) => {
    const res = await api.delete(`/courses/${id}`);
    return res.data?.data || res.data;
  },

  /**
   * Assigns a course to an individual employee.
   * @param {string} courseId
   * @param {string} employeeId
   * @returns {Promise<object>} Created enrollment
   */
  assignCourseToEmployee: async (courseId, employeeId) => {
    const res = await api.post('/enrollments', { course: courseId, employee: employeeId });
    return res.data?.data?.enrollment || res.data?.enrollment;
  },

  /**
   * Assigns a course to an entire department.
   * @param {string} courseId
   * @param {string} departmentId
   * @param {boolean} [isMandatory=true]
   * @returns {Promise<object>} Assignment summary
   */
  assignCourseToDepartment: async (courseId, departmentId, isMandatory = true) => {
    const res = await api.post('/enrollments/department', { courseId, departmentId, isMandatory });
    return res.data?.data || res.data;
  },

  // =========================================================================
  // ASSESSMENT OVERSIGHT
  // =========================================================================

  /**
   * Retrieves all assessments.
   * @param {object} [params={}]
   * @returns {Promise<Array>} List of assessments
   */
  getAssessments: async (params = {}) => {
    const res = await api.get('/assessments', { params });
    return res.data?.data?.assessments || res.data?.assessments || [];
  },

  /**
   * Retrieves assessment by ID.
   * @param {string} id
   * @returns {Promise<object>} Assessment document
   */
  getAssessmentById: async (id) => {
    const res = await api.get(`/assessments/${id}`);
    return res.data?.data?.assessment || res.data?.assessment;
  },

  /**
   * Creates an assessment.
   * @param {object} data
   * @returns {Promise<object>}
   */
  createAssessment: async (data) => {
    const res = await api.post('/assessments', data);
    return res.data?.data?.assessment || res.data?.assessment;
  },

  /**
   * Updates an assessment.
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  updateAssessment: async (id, data) => {
    const res = await api.patch(`/assessments/${id}`, data);
    return res.data?.data?.assessment || res.data?.assessment;
  },

  /**
   * Publishes an assessment.
   * @param {string} id
   * @returns {Promise<object>}
   */
  publishAssessment: async (id) => {
    const res = await api.patch(`/assessments/${id}/publish`);
    return res.data?.data?.assessment || res.data?.assessment;
  },

  /**
   * Archives an assessment.
   * @param {string} id
   * @returns {Promise<object>}
   */
  archiveAssessment: async (id) => {
    const res = await api.patch(`/assessments/${id}/archive`);
    return res.data?.data?.assessment || res.data?.assessment;
  },

  /**
   * Deletes an assessment.
   * @param {string} id
   * @returns {Promise<object>}
   */
  deleteAssessment: async (id) => {
    const res = await api.delete(`/assessments/${id}`);
    return res.data?.data || res.data;
  },

  /**
   * Retrieves authoritative performance statistics for an assessment.
   * @param {string} id
   * @returns {Promise<object>}
   */
  getAssessmentPerformance: async (id) => {
    const res = await api.get(`/assessments/${id}/performance`);
    return res.data?.data || res.data;
  },

  // =========================================================================
  // COMPLIANCE OVERSIGHT
  // =========================================================================

  /**
   * Retrieves organization-level compliance summary.
   * @param {object} [params={}]
   * @returns {Promise<object>} { totalRequirements, totalAssignments, compliant, dueSoon, overdue, inProgress, notStarted, complianceRate }
   */
  getComplianceSummary: async (params = {}) => {
    const res = await api.get('/compliance/summary', { params });
    return res.data?.data || res.data;
  },

  /**
   * Retrieves all compliance requirements.
   * @param {object} [params={}]
   * @returns {Promise<Array>} List of requirements
   */
  getComplianceRequirements: async (params = {}) => {
    const res = await api.get('/compliance-requirements', { params });
    return res.data?.data?.requirements || res.data?.requirements || [];
  },

  /**
   * Creates a compliance requirement.
   * @param {object} data - { title, description, course, frequency, validityPeriodDays, renewalWindowDays }
   * @returns {Promise<object>}
   */
  createComplianceRequirement: async (data) => {
    const res = await api.post('/compliance-requirements', data);
    return res.data?.data?.requirement || res.data?.requirement;
  },

  /**
   * Updates a compliance requirement.
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  updateComplianceRequirement: async (id, data) => {
    const res = await api.patch(`/compliance-requirements/${id}`, data);
    return res.data?.data?.requirement || res.data?.requirement;
  },

  /**
   * Deletes a compliance requirement.
   * @param {string} id
   * @returns {Promise<object>}
   */
  deleteComplianceRequirement: async (id) => {
    const res = await api.delete(`/compliance-requirements/${id}`);
    return res.data?.data || res.data;
  },

  /**
   * Retrieves all compliance assignments with pagination and status filters.
   * @param {object} [params={}]
   * @returns {Promise<object>} { assignments, pagination }
   */
  getComplianceAssignments: async (params = {}) => {
    const res = await api.get('/compliance/assignments', { params });
    return res.data?.data || res.data || { assignments: [] };
  },

  /**
   * Assigns a compliance requirement to a specific employee.
   * @param {string} requirementId
   * @param {string} employeeId
   * @param {string|Date} [dueAt]
   * @returns {Promise<object>}
   */
  assignRequirementToEmployee: async (requirementId, employeeId, dueAt) => {
    const res = await api.post(`/compliance-requirements/${requirementId}/assignments`, {
      employeeId,
      dueAt,
    });
    return res.data?.data || res.data;
  },

  /**
   * Assigns a compliance requirement to all employees in a department.
   * @param {string} requirementId
   * @param {string} departmentId
   * @param {string|Date} [dueAt]
   * @returns {Promise<object>}
   */
  assignRequirementToDepartment: async (requirementId, departmentId, dueAt) => {
    const res = await api.post(
      `/compliance-requirements/${requirementId}/departments/${departmentId}/assign`,
      { dueAt }
    );
    return res.data?.data || res.data;
  },

  /**
   * Triggers an on-demand compliance status refresh.
   * @returns {Promise<object>}
   */
  refreshComplianceStatuses: async () => {
    const res = await api.post('/compliance/refresh-statuses');
    return res.data?.data || res.data;
  },

  // =========================================================================
  // CERTIFICATE OVERSIGHT
  // =========================================================================

  /**
   * Retrieves all certificates for admin with status filter and pagination.
   * @param {object} [params={}]
   * @returns {Promise<object>} { certificates, pagination }
   */
  getCertificates: async (params = {}) => {
    const res = await api.get('/certificates', { params });
    return res.data?.data || res.data || { certificates: [] };
  },

  /**
   * Retrieves expiring certificates.
   * @param {object} [params={}]
   * @returns {Promise<Array>} List of expiring certificates
   */
  getExpiringCertificates: async (params = {}) => {
    const res = await api.get('/certificates/expiring', { params });
    return res.data?.data?.certificates || res.data?.certificates || [];
  },

  /**
   * Retrieves expired certificates.
   * @param {object} [params={}]
   * @returns {Promise<Array>} List of expired certificates
   */
  getExpiredCertificates: async (params = {}) => {
    const res = await api.get('/certificates/expired', { params });
    return res.data?.data?.certificates || res.data?.certificates || [];
  },

  /**
   * Revokes an active certificate with a reason.
   * @param {string} id
   * @param {string} revocationReason
   * @returns {Promise<object>} Updated certificate
   */
  revokeCertificate: async (id, revocationReason) => {
    const res = await api.patch(`/certificates/${id}/revoke`, { revocationReason });
    return res.data?.data?.certificate || res.data?.certificate;
  },

  /**
   * Retrieves single certificate details.
   * @param {string} id
   * @returns {Promise<object>}
   */
  getCertificateById: async (id) => {
    const res = await api.get(`/certificates/${id}`);
    return res.data?.data?.certificate || res.data?.certificate;
  },

  /**
   * Retrieves certificate renewal history.
   * @param {string} id
   * @returns {Promise<Array>} Chain of certificates
   */
  getCertificateRenewals: async (id) => {
    const res = await api.get(`/certificates/${id}/renewals`);
    return res.data?.data?.renewals || res.data?.renewals || [];
  },

  // =========================================================================
  // ENROLLMENT OVERSIGHT
  // =========================================================================

  /**
   * Retrieves all enrollments across the organization.
   * @param {object} [params={}]
   * @returns {Promise<Array>}
   */
  getAllEnrollments: async (params = {}) => {
    const res = await api.get('/enrollments', { params });
    return res.data?.data?.enrollments || res.data?.enrollments || [];
  },

  // =========================================================================
  // ADMIN DASHBOARD AGGREGATE OVERVIEW
  // =========================================================================

  /**
   * Composes real organizational overview data for the Admin Dashboard.
   * Uses Promise.allSettled for complete error isolation.
   * @returns {Promise<object>}
   */
  getDashboardOverview: async () => {
    const [
      empResult,
      deptResult,
      coursesResult,
      assessmentsResult,
      complianceResult,
      certsResult,
      expiringCertsResult,
      enrollmentsResult,
    ] = await Promise.allSettled([
      adminService.getEmployees(),
      adminService.getDepartments(),
      adminService.getCourses(),
      adminService.getAssessments(),
      adminService.getComplianceSummary(),
      adminService.getCertificates({ limit: 5 }),
      adminService.getExpiringCertificates(),
      adminService.getAllEnrollments({ limit: 5 }),
    ]);

    const employees = empResult.status === 'fulfilled' ? empResult.value : [];
    const departments = deptResult.status === 'fulfilled' ? deptResult.value : [];
    const courses = coursesResult.status === 'fulfilled' ? coursesResult.value : [];
    const assessments = assessmentsResult.status === 'fulfilled' ? assessmentsResult.value : [];
    const compliance = complianceResult.status === 'fulfilled' ? complianceResult.value : null;
    const certsData = certsResult.status === 'fulfilled' ? certsResult.value : { certificates: [] };
    const expiringCerts = expiringCertsResult.status === 'fulfilled' ? expiringCertsResult.value : [];
    const enrollments = enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value : [];

    const totalEmployees = Array.isArray(employees) ? employees.length : 0;
    const activeEmployees = Array.isArray(employees)
      ? employees.filter((e) => e.isActive !== false).length
      : 0;

    const totalDepartments = Array.isArray(departments) ? departments.length : 0;
    const activeDepartments = Array.isArray(departments)
      ? departments.filter((d) => d.isActive !== false).length
      : 0;

    const totalCourses = Array.isArray(courses) ? courses.length : 0;
    const publishedCourses = Array.isArray(courses)
      ? courses.filter((c) => c.status === 'published').length
      : 0;

    const totalAssessments = Array.isArray(assessments) ? assessments.length : 0;
    const publishedAssessments = Array.isArray(assessments)
      ? assessments.filter((a) => a.status === 'published').length
      : 0;

    const certificatesList = certsData.certificates || (Array.isArray(certsData) ? certsData : []);
    const totalCertificates = certsData.pagination?.total ?? certificatesList.length;

    return {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        list: employees.slice(0, 5),
      },
      departments: {
        total: totalDepartments,
        active: activeDepartments,
        list: departments.slice(0, 5),
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        list: courses.slice(0, 5),
      },
      assessments: {
        total: totalAssessments,
        published: publishedAssessments,
        list: assessments.slice(0, 5),
      },
      compliance: compliance || {
        totalRequirements: 0,
        totalAssignments: 0,
        compliant: 0,
        dueSoon: 0,
        overdue: 0,
        complianceRate: 0,
      },
      certificates: {
        total: totalCertificates,
        expiringCount: Array.isArray(expiringCerts) ? expiringCerts.length : 0,
        recent: certificatesList.slice(0, 5),
      },
      enrollments: {
        total: Array.isArray(enrollments) ? enrollments.length : 0,
        recent: Array.isArray(enrollments) ? enrollments.slice(0, 5) : [],
      },
    };
  },
};

export default adminService;
