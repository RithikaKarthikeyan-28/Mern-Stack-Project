const rateLimit = require('express-rate-limit');
const config = require('../config');
const { sendError } = require('../utils/response');

/**
 * Custom error handler for rate limit exceeded responses matching SkillTrack error format.
 */
function rateLimitHandler(req, res, next, options) {
  return sendError(res, {
    statusCode: 429,
    message: options.message || 'Too many requests, please try again later.'
  });
}

/**
 * Authentication rate limiter for sensitive auth routes (/api/auth/login, /api/auth/register).
 * In test mode, disabled unless process.env.ENABLE_RATE_LIMIT === 'true'.
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs || 900000,
  max: config.authRateLimitMax || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later.',
  handler: rateLimitHandler,
  skip: (req) => config.isTest && process.env.ENABLE_RATE_LIMIT !== 'true'
});

/**
 * General API rate limiter for all /api routes.
 * In test mode, disabled unless process.env.ENABLE_RATE_LIMIT === 'true'.
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs || 900000,
  max: config.rateLimitMax || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  handler: rateLimitHandler,
  skip: (req) => config.isTest && process.env.ENABLE_RATE_LIMIT !== 'true'
});

module.exports = {
  authLimiter,
  apiLimiter
};
