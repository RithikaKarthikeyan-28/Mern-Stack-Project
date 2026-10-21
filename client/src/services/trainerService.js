import api from './api';

export const trainerService = {
  // =========================================================================
  // COURSE MANAGEMENT
  // =========================================================================

  /**
   * Retrieves courses for the trainer.
   * Can pass { trainer: userId, status, category, level }.
   * @param {object} [params={}]
   * @returns {Promise<Array>} List of courses
   */
  getMyCourses: async (params = {}) => {
    const res = await api.get('/courses', { params });
    return res.data?.data?.courses || res.data?.courses || [];
  },

  /**
   * Retrieves single course by ID.
   * @param {string} courseId
   * @returns {Promise<object>} Course document
   */
  getCourseById: async (courseId) => {
    const res = await api.get(`/courses/${courseId}`);
    return res.data?.data?.course || res.data?.course;
  },

  /**
   * Creates a new course.
   * Backend automatically associates the course with the authenticated trainer.
   * @param {object} data - { title, description, category, level, duration, status }
   * @returns {Promise<object>} Created course
   */
  createCourse: async (data) => {
    const res = await api.post('/courses', data);
    return res.data?.data?.course || res.data?.course;
  },

  /**
   * Updates course metadata.
   * Backend verifies trainer owns this course.
   * @param {string} courseId
   * @param {object} data - { title, description, category, level, duration, status }
   * @returns {Promise<object>} Updated course
   */
  updateCourse: async (courseId, data) => {
    const res = await api.patch(`/courses/${courseId}`, data);
    return res.data?.data?.course || res.data?.course;
  },

  /**
   * Publishes a course.
   * @param {string} courseId
   * @returns {Promise<object>}
   */
  publishCourse: async (courseId) => {
    return await trainerService.updateCourse(courseId, { status: 'published' });
  },

  /**
   * Archives a course.
   * @param {string} courseId
   * @returns {Promise<object>}
   */
  archiveCourse: async (courseId) => {
    return await trainerService.updateCourse(courseId, { status: 'archived' });
  },

  // =========================================================================
  // CURRICULUM MANAGEMENT (MODULES & LESSONS)
  // =========================================================================

  /**
   * Retrieves all modules for a course.
   * @param {string} courseId
   * @returns {Promise<Array>}
   */
  getCourseModules: async (courseId) => {
    const res = await api.get(`/courses/${courseId}/modules`);
    return res.data?.data?.modules || res.data?.modules || [];
  },

  /**
   * Retrieves single module by ID.
   * @param {string} moduleId
   * @returns {Promise<object>}
   */
  getModuleById: async (moduleId) => {
    const res = await api.get(`/modules/${moduleId}`);
    return res.data?.data?.module || res.data?.module;
  },

  /**
   * Creates a module in a course.
   * @param {object} data - { course: courseId, title, description, order }
   * @returns {Promise<object>}
   */
  createModule: async (data) => {
    const res = await api.post('/modules', data);
    return res.data?.data?.module || res.data?.module;
  },

  /**
   * Updates a module.
   * @param {string} moduleId
   * @param {object} data - { title, description, order }
   * @returns {Promise<object>}
   */
  updateModule: async (moduleId, data) => {
    const res = await api.patch(`/modules/${moduleId}`, data);
    return res.data?.data?.module || res.data?.module;
  },

  /**
   * Deletes (soft-deletes) a module.
   * @param {string} moduleId
   * @returns {Promise<object>}
   */
  deleteModule: async (moduleId) => {
    const res = await api.delete(`/modules/${moduleId}`);
    return res.data?.data?.module || res.data?.module;
  },

  /**
   * Retrieves lessons for a module.
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
   * Creates a lesson in a module.
   * @param {string} moduleId
   * @param {object} data - { title, content, contentType, resourceUrl, order }
   * @returns {Promise<object>}
   */
  createLesson: async (moduleId, data) => {
    const payload = { ...data, module: moduleId };
    const res = await api.post(`/modules/${moduleId}/lessons`, payload);
    return res.data?.data?.lesson || res.data?.lesson;
  },

  /**
   * Updates a lesson.
   * @param {string} lessonId
   * @param {object} data - { title, content, contentType, resourceUrl, order }
   * @returns {Promise<object>}
   */
  updateLesson: async (lessonId, data) => {
    const res = await api.patch(`/lessons/${lessonId}`, data);
    return res.data?.data?.lesson || res.data?.lesson;
  },

  /**
   * Deletes (soft-deletes) a lesson.
   * @param {string} lessonId
   * @returns {Promise<object>}
   */
  deleteLesson: async (lessonId) => {
    const res = await api.delete(`/lessons/${lessonId}`);
    return res.data?.data?.lesson || res.data?.lesson;
  },

  /**
   * Fetches full curriculum with lessons populated under each module.
   * @param {string} courseId
   * @returns {Promise<Array>}
   */
  getFullCurriculum: async (courseId) => {
    const modules = await trainerService.getCourseModules(courseId);
    if (!modules || modules.length === 0) return [];

    const populated = await Promise.all(
      modules.map(async (mod) => {
        const modId = mod._id || mod.id;
        try {
          const lessons = await trainerService.getModuleLessons(modId);
          return { ...mod, lessons: lessons || [] };
        } catch {
          return { ...mod, lessons: [] };
        }
      })
    );
    return populated;
  },

  // =========================================================================
  // ASSESSMENT MANAGEMENT
  // =========================================================================

  /**
   * Retrieves assessments scoped to the authenticated trainer.
   * Backend automatically restricts to trainer's courses.
   * @param {object} [params={}] - Optional filters: { course, status, module }
   * @returns {Promise<Array>} List of assessments
   */
  getAssessments: async (params = {}) => {
    const res = await api.get('/assessments', { params });
    return res.data?.data?.assessments || res.data?.assessments || [];
  },

  /**
   * Retrieves single assessment by ID.
   * @param {string} assessmentId
   * @returns {Promise<object>} Assessment document
   */
  getAssessmentById: async (assessmentId) => {
    const res = await api.get(`/assessments/${assessmentId}`);
    return res.data?.data?.assessment || res.data?.assessment;
  },

  /**
   * Creates an assessment.
   * Backend verifies trainer owns the parent course.
   * @param {object} data - { title, description, course, module, passingPercentage, timeLimitMinutes, maxAttempts, status }
   * @returns {Promise<object>}
   */
  createAssessment: async (data) => {
    const res = await api.post('/assessments', data);
    return res.data?.data?.assessment || res.data?.assessment;
  },

  /**
   * Updates an assessment.
   * @param {string} assessmentId
   * @param {object} data
   * @returns {Promise<object>}
   */
  updateAssessment: async (assessmentId, data) => {
    const res = await api.patch(`/assessments/${assessmentId}`, data);
    return res.data?.data?.assessment || res.data?.assessment;
  },

  /**
   * Publishes an assessment.
   * @param {string} assessmentId
   * @returns {Promise<object>}
   */
  publishAssessment: async (assessmentId) => {
    const res = await api.patch(`/assessments/${assessmentId}/publish`);
    return res.data?.data?.assessment || res.data?.assessment;
  },

  /**
   * Archives an assessment.
   * @param {string} assessmentId
   * @returns {Promise<object>}
   */
  archiveAssessment: async (assessmentId) => {
    const res = await api.patch(`/assessments/${assessmentId}/archive`);
    return res.data?.data?.assessment || res.data?.assessment;
  },

  /**
   * Deletes (soft-deletes) an assessment.
   * @param {string} assessmentId
   * @returns {Promise<object>}
   */
  deleteAssessment: async (assessmentId) => {
    const res = await api.delete(`/assessments/${assessmentId}`);
    return res.data?.data?.assessment || res.data?.assessment;
  },

  /**
   * Retrieves assessment performance statistics.
   * Only accessible by admin and owning trainer.
   * @param {string} assessmentId
   * @returns {Promise<object>} Performance analytics
   */
  getAssessmentPerformance: async (assessmentId) => {
    const res = await api.get(`/assessments/${assessmentId}/performance`);
    return res.data?.data || res.data;
  },

  // =========================================================================
  // QUESTION MANAGEMENT
  // =========================================================================

  /**
   * Retrieves questions for an assessment.
   * For trainers, includes correctAnswers.
   * @param {string} assessmentId
   * @returns {Promise<Array>}
   */
  getQuestions: async (assessmentId) => {
    const res = await api.get(`/assessments/${assessmentId}/questions`);
    return res.data?.data?.questions || res.data?.questions || [];
  },

  /**
   * Creates a question under an assessment.
   * @param {string} assessmentId
   * @param {object} data - { questionText, questionType, options, correctAnswers, marks, order }
   * @returns {Promise<object>}
   */
  createQuestion: async (assessmentId, data) => {
    const res = await api.post(`/assessments/${assessmentId}/questions`, data);
    return res.data?.data?.question || res.data?.question;
  },

  /**
   * Updates a question.
   * @param {string} assessmentId
   * @param {string} questionId
   * @param {object} data
   * @returns {Promise<object>}
   */
  updateQuestion: async (assessmentId, questionId, data) => {
    const res = await api.patch(`/assessments/${assessmentId}/questions/${questionId}`, data);
    return res.data?.data?.question || res.data?.question;
  },

  /**
   * Deletes a question.
   * @param {string} assessmentId
   * @param {string} questionId
   * @returns {Promise<object>}
   */
  deleteQuestion: async (assessmentId, questionId) => {
    const res = await api.delete(`/assessments/${assessmentId}/questions/${questionId}`);
    return res.data?.data?.question || res.data?.question;
  },

  // =========================================================================
  // LEARNER PROGRESS / ENROLLMENTS
  // =========================================================================

  /**
   * Retrieves learner enrollments for the trainer's courses.
   * Backend automatically scopes to courses owned by this trainer.
   * @param {object} [params={}] - Optional filters: { course, status }
   * @returns {Promise<Array>} Populated enrollments
   */
  getLearnerEnrollments: async (params = {}) => {
    const res = await api.get('/enrollments', { params });
    return res.data?.data?.enrollments || res.data?.enrollments || [];
  },

  /**
   * Retrieves employee directory accessible to trainers and admins.
   * @param {object} [params={}] - Optional filters: { department, isActive }
   * @returns {Promise<Array>} List of employees
   */
  getEmployees: async (params = {}) => {
    const res = await api.get('/employees', { params });
    return res.data?.data?.employees || res.data?.employees || [];
  },

  // =========================================================================
  // TRAINER DASHBOARD OVERVIEW (COMPOSITE)
  // =========================================================================

  /**
   * Aggregates real backend data for the trainer landing page.
   * @param {string} trainerUserId
   * @returns {Promise<object>}
   */
  getDashboardOverview: async (trainerUserId) => {
    const courseParams = trainerUserId ? { trainer: trainerUserId } : {};

    const [coursesResult, assessmentsResult, enrollmentsResult] = await Promise.allSettled([
      trainerService.getMyCourses(courseParams),
      trainerService.getAssessments(),
      trainerService.getLearnerEnrollments(),
    ]);

    const courses = coursesResult.status === 'fulfilled' ? coursesResult.value : [];
    const assessments = assessmentsResult.status === 'fulfilled' ? assessmentsResult.value : [];
    const enrollments = enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value : [];

    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c) => c.status === 'published').length;
    const draftCourses = courses.filter((c) => c.status === 'draft').length;
    const archivedCourses = courses.filter((c) => c.status === 'archived').length;

    const totalAssessments = assessments.length;
    const publishedAssessments = assessments.filter((a) => a.status === 'published').length;
    const draftAssessments = assessments.filter((a) => a.status === 'draft').length;

    const totalEnrollments = enrollments.length;
    const inProgressEnrollments = enrollments.filter((e) => e.status === 'in_progress').length;
    const completedEnrollments = enrollments.filter((e) => e.status === 'completed').length;
    const enrolledOnly = enrollments.filter((e) => e.status === 'enrolled').length;

    let averageProgress = 0;
    if (totalEnrollments > 0) {
      const sum = enrollments.reduce((acc, curr) => acc + (curr.progressPercentage || 0), 0);
      averageProgress = Math.round((sum / totalEnrollments) * 10) / 10;
    }

    return {
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: draftCourses,
        archived: archivedCourses,
        list: courses,
      },
      assessments: {
        total: totalAssessments,
        published: publishedAssessments,
        draft: draftAssessments,
        list: assessments,
      },
      learners: {
        total: totalEnrollments,
        inProgress: inProgressEnrollments,
        completed: completedEnrollments,
        enrolledOnly,
        averageProgress,
        list: enrollments,
      },
      errors: {
        courses: coursesResult.status === 'rejected' ? coursesResult.reason?.message : null,
        assessments: assessmentsResult.status === 'rejected' ? assessmentsResult.reason?.message : null,
        enrollments: enrollmentsResult.status === 'rejected' ? enrollmentsResult.reason?.message : null,
      },
    };
  },
};

export default trainerService;
