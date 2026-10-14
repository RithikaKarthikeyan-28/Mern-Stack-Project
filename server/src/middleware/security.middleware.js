const crypto = require('crypto');
const AppError = require('../utils/AppError');

/**
 * Recursively checks if an object or array contains keys starting with '$',
 * containing '.', or attempting prototype pollution.
 *
 * @param {*} data - Untrusted input to inspect
 * @returns {boolean} True if malicious structure is found, false otherwise
 */
function hasNoSqlInjection(data) {
  if (!data) return false;

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      if (hasNoSqlInjection(data[i])) return true;
    }
    return false;
  }

  if (typeof data === 'object') {
    if (Object.prototype.hasOwnProperty.call(data, '__proto__')) {
      return true;
    }
    const keys = Object.getOwnPropertyNames(data);
    for (const key of keys) {
      if (
        key.startsWith('$') ||
        key.includes('.') ||
        key === '__proto__' ||
        key === 'constructor' ||
        key === 'prototype'
      ) {
        return true;
      }
      if (hasNoSqlInjection(data[key])) return true;
    }
  }

  return false;
}

/**
 * Middleware that inspects untrusted request inputs (query, body, params)
 * and rejects NoSQL operator ($) or dot-path (.) injections with 400 Bad Request.
 */
function noSqlInjectionGuard(req, res, next) {
  if (
    hasNoSqlInjection(req.query) ||
    hasNoSqlInjection(req.body) ||
    hasNoSqlInjection(req.params)
  ) {
    return next(
      new AppError(
        'Malicious input detected: NoSQL operators or dot-paths are forbidden',
        400
      )
    );
  }
  next();
}

/**
 * Middleware that generates an opaque server-side correlation ID for each request.
 * Sets the 'X-Request-Id' response header.
 */
function requestIdMiddleware(req, res, next) {
  const reqId = crypto.randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
}

module.exports = {
  noSqlInjectionGuard,
  requestIdMiddleware,
  hasNoSqlInjection
};
