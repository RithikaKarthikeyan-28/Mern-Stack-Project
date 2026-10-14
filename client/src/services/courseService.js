import api from './api';

export const courseService = {
  /**
   * Retrieves list of courses with optional filters (category, level, trainer).
   * For employees, backend filters to active & published automatically.
   * @param {object} [filters={}]
   * @returns {Promise<Array>}
   */
  getCourses: async (filters = {}) => {
    const res = await api.get('/courses', { params: filters });
    return res.data?.data?.courses || res.data?.courses || [];
  },

  /**
   * Retrieves course details by ID.
   * @param {string} courseId
   * @returns {Promise<object>}
   */
  getCourseById: async (courseId) => {
    const res = await api.get(`/courses/${courseId}`);
    return res.data?.data?.course || res.data?.course;
  },

  /**
   * Retrieves all modules for a course in authoritative order.
   * @param {string} courseId
   * @returns {Promise<Array>}
   */
  getCourseModules: async (courseId) => {
    const res = await api.get(`/courses/${courseId}/modules`);
    return res.data?.data?.modules || res.data?.modules || [];
  },

  /**
   * Retrieves all lessons for a module in authoritative order.
   * @param {string} moduleId
   * @returns {Promise<Array>}
   */
  getModuleLessons: async (moduleId) => {
    const res = await api.get(`/modules/${moduleId}/lessons`);
    return res.data?.data?.lessons || res.data?.lessons || [];
  },

  /**
   * Retrieves single lesson by ID.
   * @param {string} lessonId
   * @returns {Promise<object>}
   */
  getLessonById: async (lessonId) => {
    const res = await api.get(`/lessons/${lessonId}`);
    return res.data?.data?.lesson || res.data?.lesson;
  },

  /**
   * Assembles the complete course curriculum (modules + lessons).
   * @param {string} courseId
   * @returns {Promise<Array>} List of modules, each with an array of lessons in order
   */
  getCourseCurriculum: async (courseId) => {
    const modules = await courseService.getCourseModules(courseId);
    if (!modules || modules.length === 0) {
      return [];
    }

    // Fetch lessons for all modules in parallel
    const curriculum = await Promise.all(
      modules.map(async (mod) => {
        const modId = mod._id || mod.id;
        try {
          const lessons = await courseService.getModuleLessons(modId);
          return {
            ...mod,
            lessons: lessons || [],
          };
        } catch {
          return {
            ...mod,
            lessons: [],
          };
        }
      })
    );

    return curriculum;
  },
};

export default courseService;
