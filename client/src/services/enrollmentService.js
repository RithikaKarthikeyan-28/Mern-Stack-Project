import api from './api';

export const enrollmentService = {
  /**
   * Retrieves all enrollments for the authenticated employee.
   * @returns {Promise<Array>}
   */
  getMyEnrollments: async () => {
    const res = await api.get('/enrollments/me');
    return res.data?.data?.enrollments || res.data?.enrollments || [];
  },

  /**
   * Retrieves authenticated employee's enrollment for a specific course.
   * @param {string} courseId
   * @returns {Promise<object|null>}
   */
  getCourseEnrollment: async (courseId) => {
    try {
      const res = await api.get(`/courses/${courseId}/enrollment`);
      return res.data?.data?.enrollment || res.data?.enrollment || null;
    } catch (err) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Enrolls authenticated employee in a course.
   * @param {string} courseId
   * @returns {Promise<object>}
   */
  enroll: async (courseId) => {
    const res = await api.post('/enrollments', { course: courseId });
    return res.data?.data?.enrollment || res.data?.enrollment;
  },

  /**
   * Updates lesson completion progress for an enrollment.
   * @param {string} enrollmentId
   * @param {string} lessonId
   * @param {boolean} [completed=true]
   * @returns {Promise<object>} Updated populated enrollment
   */
  updateProgress: async (enrollmentId, lessonId, completed = true, options = {}) => {
    const res = await api.patch(`/enrollments/${enrollmentId}/progress`, {
      lessonId,
      completed,
      ...options,
    });
    return res.data?.data?.enrollment || res.data?.enrollment;
  },

  /**
   * Retrieves single enrollment by ID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  getEnrollmentById: async (id) => {
    const res = await api.get(`/enrollments/${id}`);
    return res.data?.data?.enrollment || res.data?.enrollment;
  },
};

export default enrollmentService;
