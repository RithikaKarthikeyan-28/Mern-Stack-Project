import api from './api';

export const recommendationService = {
  /**
   * Retrieves course recommendations for authenticated employee against a job role.
   * @param {string} jobRoleId
   * @param {object} [query={}] - { minScore, mandatoryOnly, limit, page }
   * @returns {Promise<object|null>}
   */
  getMyRecommendations: async (jobRoleId, query = {}) => {
    const res = await api.get(`/employees/me/recommendations/${jobRoleId}`, { params: query });
    return res.data?.data || res.data || null;
  },

  /**
   * Retrieves course recommendations for arbitrary employee against a job role (admin only).
   * @param {string} employeeId
   * @param {string} jobRoleId
   * @param {object} [query={}]
   * @returns {Promise<object|null>}
   */
  getEmployeeRecommendations: async (employeeId, jobRoleId, query = {}) => {
    const res = await api.get(`/employees/${employeeId}/recommendations/${jobRoleId}`, { params: query });
    return res.data?.data || res.data || null;
  },
};

export default recommendationService;
