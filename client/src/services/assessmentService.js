import api from './api';

export const assessmentService = {
  /**
   * Retrieves assessments list (with learner progression if authenticated as employee).
   * @param {object} params
   * @returns {Promise<Array>}
   */
  getAssessments: async (params = {}) => {
    const res = await api.get('/assessments', { params });
    return res.data?.data?.assessments || res.data?.assessments || [];
  },
  /**
   * Retrieves assessment details by ID.
   * Backend enforces published/active checks for employees.
   * @param {string} assessmentId
   * @returns {Promise<object>}
   */
  getAssessmentById: async (assessmentId) => {
    const res = await api.get(`/assessments/${assessmentId}`);
    return res.data?.data?.assessment || res.data?.assessment;
  },

  /**
   * Retrieves employee-safe assessment attempt data with sanitized questions.
   * Strips correct answers server-side.
   * @param {string} assessmentId
   * @returns {Promise<{ assessment: object, questions: Array }>}
   */
  getAttemptData: async (assessmentId) => {
    const res = await api.get(`/assessments/${assessmentId}/attempt-data`);
    return res.data?.data || res.data;
  },

  /**
   * Starts a new assessment attempt for the authenticated employee.
   * @param {string} assessmentId
   * @returns {Promise<object>}
   */
  startAttempt: async (assessmentId) => {
    const res = await api.post(`/assessments/${assessmentId}/attempts`);
    return res.data?.data?.attempt || res.data?.attempt;
  },

  /**
   * Retrieves an assessment attempt by ID.
   * @param {string} attemptId
   * @returns {Promise<object>}
   */
  getAttemptById: async (attemptId) => {
    const res = await api.get(`/assessments/attempts/${attemptId}`);
    return res.data?.data?.attempt || res.data?.attempt;
  },

  /**
   * Submits an in-progress assessment attempt with validated answers.
   * Payload: { answers: [{ question: string, selectedAnswers: string[] }] }
   * Strictly avoids injecting server-managed fields (score, percentage, result, etc.).
   * @param {string} attemptId
   * @param {{ answers: Array }} answersPayload
   * @returns {Promise<object>}
   */
  submitAttempt: async (attemptId, answersPayload) => {
    const res = await api.patch(`/assessments/attempts/${attemptId}/submit`, answersPayload);
    return res.data?.data?.attempt || res.data?.attempt;
  },

  /**
   * Saves draft answers in real-time for an in-progress attempt.
   * Payload: { answers: [{ question: string, selectedAnswers: string[] }] }
   * @param {string} attemptId
   * @param {{ answers: Array }} answersPayload
   * @returns {Promise<object>}
   */
  saveDraftAnswers: async (attemptId, answersPayload) => {
    const res = await api.patch(`/assessments/attempts/${attemptId}/answers`, answersPayload);
    return res.data?.data?.attempt || res.data?.attempt;
  },

  /**
   * Retrieves the authoritative evaluated result for an attempt.
   * @param {string} attemptId
   * @returns {Promise<object>}
   */
  getAttemptResult: async (attemptId) => {
    const res = await api.get(`/assessments/attempts/${attemptId}/result`);
    return res.data?.data?.result || res.data?.result;
  },

  /**
   * Retrieves the authenticated employee's assessment history.
   * @returns {Promise<Array>}
   */
  getMyAssessmentHistory: async () => {
    const res = await api.get('/assessments/results/me');
    return res.data?.data?.history || res.data?.history || [];
  },

  /**
   * Retrieves matching assessment status, lock status, course progress, and history for a course.
   * @param {string} courseId
   * @returns {Promise<object>}
   */
  getCourseAssessmentStatus: async (courseId) => {
    const res = await api.get(`/assessments/course/${courseId}`);
    return res.data?.data || res.data;
  },
};

export default assessmentService;
