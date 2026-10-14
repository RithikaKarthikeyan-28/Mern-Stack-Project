import api from './api';

export const skillService = {
  /**
   * Retrieves authenticated employee's skills.
   * @returns {Promise<{ employeeSkills: Array, total: number }>}
   */
  getMySkills: async () => {
    const res = await api.get('/employees/me/skills');
    const data = res.data?.data || res.data || {};
    return {
      employeeSkills: data.employeeSkills || [],
      total: data.total || 0,
    };
  },

  /**
   * Retrieves list of platform skills.
   * @param {object} [filters={}]
   * @returns {Promise<{ skills: Array, pagination: object|null }>}
   */
  getSkills: async (filters = {}) => {
    const res = await api.get('/skills', { params: filters });
    const data = res.data?.data || res.data || {};
    return {
      skills: data.skills || [],
      pagination: data.pagination || null,
    };
  },

  /**
   * Retrieves single skill by ID.
   * @param {string} skillId
   * @returns {Promise<object|null>}
   */
  getSkillById: async (skillId) => {
    const res = await api.get(`/skills/${skillId}`);
    return res.data?.data?.skill || res.data?.skill || null;
  },

  /**
   * Retrieves available job roles (active only for employees).
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
   * Retrieves requirements for a specified job role.
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

  /**
   * Analyzes authenticated employee's skill gap against a job role.
   * Supports server-side filtering by status and mandatory flag.
   * @param {string} jobRoleId
   * @param {object} [query={}] - { status, mandatory }
   * @returns {Promise<object|null>}
   */
  getMySkillGap: async (jobRoleId, query = {}) => {
    const res = await api.get(`/employees/me/skill-gap/${jobRoleId}`, { params: query });
    return res.data?.data || res.data || null;
  },

  /**
   * Generates authoritative course recommendations based on employee skill gap.
   * Supports server-side filtering: minScore, mandatoryOnly, limit, page.
   * @param {string} jobRoleId
   * @param {object} [query={}] - { minScore, mandatoryOnly, limit, page }
   * @returns {Promise<object|null>}
   */
  getMyRecommendations: async (jobRoleId, query = {}) => {
    const res = await api.get(`/employees/me/recommendations/${jobRoleId}`, { params: query });
    return res.data?.data || res.data || null;
  },
};

export default skillService;
