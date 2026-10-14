import api from './api';

/**
 * Strips out null, undefined, and empty string properties from query objects
 * so backend validators do not reject empty query values.
 */
const cleanParams = (params = {}) => {
  const cleaned = {};
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      cleaned[key] = val;
    }
  }
  return cleaned;
};

export const analyticsService = {
  // =========================================================================
  // 1. EXECUTIVE OVERVIEW
  // =========================================================================

  /**
   * Retrieves high-level executive overview across all domains.
   * @param {object} [params={}] - Optional filters: { from, to }
   * @returns {Promise<object>} Overview analytics data
   */
  getOverviewAnalytics: async (params = {}) => {
    const res = await api.get('/analytics/overview', { params: cleanParams(params) });
    return res.data?.data || res.data;
  },

  // =========================================================================
  // 2. LEARNING & ENROLLMENTS
  // =========================================================================

  /**
   * Retrieves enrollment metrics, progress percentage, completion times,
   * course and department breakdowns.
   * @param {object} [params={}] - Optional filters: { from, to, courseId, departmentId, status }
   * @returns {Promise<object>} Learning analytics data
   */
  getLearningAnalytics: async (params = {}) => {
    const res = await api.get('/analytics/learning', { params: cleanParams(params) });
    return res.data?.data || res.data;
  },

  // =========================================================================
  // 3. ASSESSMENTS
  // =========================================================================

  /**
   * Retrieves assessment attempts, pass rates, min/max/avg score percentages,
   * and per-assessment breakdown.
   * @param {object} [params={}] - Optional filters: { from, to, courseId, departmentId }
   * @returns {Promise<object>} Assessment analytics data
   */
  getAssessmentAnalytics: async (params = {}) => {
    const res = await api.get('/analytics/assessments', { params: cleanParams(params) });
    return res.data?.data || res.data;
  },

  // =========================================================================
  // 4. COMPLIANCE
  // =========================================================================

  /**
   * Retrieves compliance metrics, requirement breakdown, and department breakdown.
   * @param {object} [params={}] - Optional filters: { from, to, departmentId, requirementId, status }
   * @returns {Promise<object>} Compliance analytics data
   */
  getComplianceAnalytics: async (params = {}) => {
    const res = await api.get('/analytics/compliance', { params: cleanParams(params) });
    return res.data?.data || res.data;
  },

  // =========================================================================
  // 5. CERTIFICATIONS
  // =========================================================================

  /**
   * Retrieves certificate lifecycle metrics (active, expired, revoked, expiring soon, renewals).
   * @param {object} [params={}] - Optional filters: { from, to, courseId, departmentId, status }
   * @returns {Promise<object>} Certification analytics data
   */
  getCertificationAnalytics: async (params = {}) => {
    const res = await api.get('/analytics/certifications', { params: cleanParams(params) });
    return res.data?.data || res.data;
  },

  // =========================================================================
  // 6. EMPLOYEES
  // =========================================================================

  /**
   * Retrieves employee participation, certificates, compliance gaps, and department breakdown.
   * @param {object} [params={}] - Optional filters: { departmentId, page, limit }
   * @returns {Promise<object>} Employee analytics data
   */
  getEmployeeAnalytics: async (params = {}) => {
    const res = await api.get('/analytics/employees', { params: cleanParams(params) });
    return res.data?.data || res.data;
  },

  // =========================================================================
  // 7. DEPARTMENTS
  // =========================================================================

  /**
   * Retrieves department-by-department comparative metrics with pagination.
   * @param {object} [params={}] - Optional filters: { departmentId, page, limit }
   * @returns {Promise<object>} Department analytics data with pagination
   */
  getDepartmentAnalytics: async (params = {}) => {
    const res = await api.get('/analytics/departments', { params: cleanParams(params) });
    return res.data?.data || res.data;
  },

  // =========================================================================
  // 8. COURSES
  // =========================================================================

  /**
   * Retrieves course performance, engagement, completions, assessments, and certifications.
   * @param {object} [params={}] - Optional filters: { courseId, status, level, category, page, limit }
   * @returns {Promise<object>} Course analytics data with pagination
   */
  getCourseAnalytics: async (params = {}) => {
    const res = await api.get('/analytics/courses', { params: cleanParams(params) });
    return res.data?.data || res.data;
  },

  // =========================================================================
  // COMPREHENSIVE COMPOSITE FETCH
  // =========================================================================

  /**
   * Fetches multiple analytics domains in parallel using Promise.allSettled.
   * Ensures that a failure in one domain does not break the entire dashboard.
   * @param {object} [filters={}]
   * @returns {Promise<object>} Aggregated analytics data with partial-failure resilience
   */
  getComprehensiveAnalytics: async (filters = {}) => {
    const { from, to, departmentId, courseId, status } = cleanParams(filters);

    const [
      overviewResult,
      learningResult,
      assessmentsResult,
      complianceResult,
      certificationsResult,
      departmentsResult,
      coursesResult,
    ] = await Promise.allSettled([
      analyticsService.getOverviewAnalytics({ from, to }),
      analyticsService.getLearningAnalytics({ from, to, departmentId, courseId, status }),
      analyticsService.getAssessmentAnalytics({ from, to, departmentId, courseId }),
      analyticsService.getComplianceAnalytics({ from, to, departmentId, status }),
      analyticsService.getCertificationAnalytics({ from, to, departmentId, courseId, status }),
      analyticsService.getDepartmentAnalytics({ departmentId, page: 1, limit: 100 }),
      analyticsService.getCourseAnalytics({ courseId, page: 1, limit: 100 }),
    ]);

    const errors = {};
    if (overviewResult.status === 'rejected') errors.overview = overviewResult.reason?.message;
    if (learningResult.status === 'rejected') errors.learning = learningResult.reason?.message;
    if (assessmentsResult.status === 'rejected') errors.assessments = assessmentsResult.reason?.message;
    if (complianceResult.status === 'rejected') errors.compliance = complianceResult.reason?.message;
    if (certificationsResult.status === 'rejected') errors.certifications = certificationsResult.reason?.message;
    if (departmentsResult.status === 'rejected') errors.departments = departmentsResult.reason?.message;
    if (coursesResult.status === 'rejected') errors.courses = coursesResult.reason?.message;

    return {
      overview: overviewResult.status === 'fulfilled' ? overviewResult.value : null,
      learning: learningResult.status === 'fulfilled' ? learningResult.value : null,
      assessments: assessmentsResult.status === 'fulfilled' ? assessmentsResult.value : null,
      compliance: complianceResult.status === 'fulfilled' ? complianceResult.value : null,
      certifications: certificationsResult.status === 'fulfilled' ? certificationsResult.value : null,
      departments: departmentsResult.status === 'fulfilled' ? departmentsResult.value : null,
      courses: coursesResult.status === 'fulfilled' ? coursesResult.value : null,
      errors: Object.keys(errors).length > 0 ? errors : null,
      hasPartialError: Object.keys(errors).length > 0,
      timestamp: new Date().toISOString(),
    };
  },

  // =========================================================================
  // SAFE CSV EXPORT UTILITY
  // =========================================================================

  /**
   * Safely formats and downloads a CSV file containing aggregated analytics data.
   * Strictly avoids exporting sensitive employee PII (passwords, emails, phone numbers).
   *
   * @param {string} filename - Desired download file name (e.g. 'course_analytics.csv')
   * @param {Array<{ label: string, key: string }>} columns - Column definitions
   * @param {Array<object>} rows - Row data items
   */
  exportToCSV: (filename, columns, rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('No data available to export.');
    }

    const escapeValue = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      // Double up existing quotes
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const headerLine = columns.map((col) => escapeValue(col.label)).join(',');
    const dataLines = rows.map((row) =>
      columns.map((col) => escapeValue(row[col.key] ?? '')).join(',')
    );

    const csvContent = [headerLine, ...dataLines].join('\r\n');
    let url;
    if (typeof window !== 'undefined' && typeof window.URL?.createObjectURL === 'function') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      url = window.URL.createObjectURL(blob);
    } else {
      url = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    }

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof window !== 'undefined' && typeof window.URL?.revokeObjectURL === 'function' && url.startsWith('blob:')) {
      window.URL.revokeObjectURL(url);
    }
  },
};

export default analyticsService;
