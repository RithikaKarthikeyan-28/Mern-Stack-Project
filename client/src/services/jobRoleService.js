import api from './api';

export const jobRoleService = {
  /**
   * Retrieves active job roles (or all for admins).
   * @param {object} [params={}]
   * @returns {Promise<Array>}
   */
  getJobRoles: async (params = {}) => {
    const res = await api.get('/job-roles', { params });
    return res.data?.data?.jobRoles || res.data?.jobRoles || [];
  },

  /**
   * Retrieves single job role by ID.
   * @param {string} jobRoleId
   * @returns {Promise<object|null>}
   */
  getJobRoleById: async (jobRoleId) => {
    const res = await api.get(`/job-roles/${jobRoleId}`);
    return res.data?.data?.jobRole || res.data?.jobRole || null;
  },

  /**
   * Retrieves skill requirements for a specified job role.
   * @param {string} jobRoleId
   * @param {object} [query={}]
   * @returns {Promise<{ requirements: Array, total: number }>}
   */
  getJobRoleRequirements: async (jobRoleId, query = {}) => {
    const res = await api.get(`/job-roles/${jobRoleId}/requirements`, { params: query });
    const data = res.data?.data || res.data || {};
    return {
      requirements: data.requirements || [],
      total: data.total || 0,
    };
  },
};

export default jobRoleService;
