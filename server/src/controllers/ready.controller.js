const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Readiness check controller.
 * Verifies that the API server is ready to accept requests and core dependencies (MongoDB) are available.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getReadinessStatus = (req, res) => {
  const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);

  if (isDbConnected) {
    return sendSuccess(res, {
      statusCode: 200,
      message: 'SkillTrack API is ready',
      data: {
        status: 'ready',
        database: 'connected'
      }
    });
  }

  return sendError(res, {
    statusCode: 503,
    message: 'SkillTrack API is not ready',
    data: {
      status: 'not_ready',
      database: 'disconnected'
    }
  });
};

module.exports = {
  getReadinessStatus
};
