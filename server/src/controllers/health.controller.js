const { sendSuccess } = require('../utils/response');

/**
 * Health check controller.
 * Verifies that the API server is up and responsive.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getHealthStatus = (req, res) => {
  return sendSuccess(res, {
    statusCode: 200,
    message: 'SkillTrack API is running'
  });
};

module.exports = {
  getHealthStatus
};
