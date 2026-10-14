import api from './api';

export const complianceService = {
  /**
   * Retrieves authenticated employee's compliance summary metrics.
   * @returns {Promise<{
   *   totalRequirements: number,
   *   totalAssignments: number,
   *   compliant: number,
   *   dueSoon: number,
   *   overdue: number,
   *   inProgress: number,
   *   notStarted: number,
   *   complianceRate: number
   * }>}
   */
  getMyComplianceSummary: async () => {
    const res = await api.get('/employees/me/compliance/summary');
    const data = res.data?.data || res.data || {};
    return {
      totalRequirements: data.totalRequirements || data.totalAssignments || 0,
      totalAssignments: data.totalAssignments || data.totalRequirements || 0,
      compliant: data.compliant || 0,
      dueSoon: data.dueSoon || 0,
      overdue: data.overdue || 0,
      inProgress: data.inProgress || 0,
      notStarted: data.notStarted || 0,
      complianceRate: typeof data.complianceRate === 'number' ? data.complianceRate : 100,
    };
  },

  /**
   * Retrieves authenticated employee's compliance assignments list.
   * @param {object} [params={}]
   * @returns {Promise<Array>}
   */
  getMyComplianceAssignments: async (params = {}) => {
    const res = await api.get('/employees/me/compliance', { params });
    const data = res.data?.data || res.data || {};
    return data.assignments || (Array.isArray(data) ? data : []);
  },
};

export default complianceService;
