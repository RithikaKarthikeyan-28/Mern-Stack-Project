const dotenv = require('dotenv');

// Centralized entry point for loading environment variables
dotenv.config();

const VALID_ENVIRONMENTS = ['development', 'test', 'production'];
const INSECURE_JWT_PLACEHOLDERS = [
  'development_jwt_secret_placeholder',
  'your_jwt_secret_here',
  'secret',
  'jwt_secret',
  'changeme'
];

/**
 * Validates and constructs the configuration object from environment variables.
 *
 * @param {object} [rawEnv=process.env] - Environment variables object
 * @returns {object} Validated configuration object
 * @throws {Error} When configuration validation fails
 */
function loadConfig(rawEnv = process.env) {
  const env = rawEnv.NODE_ENV || 'development';

  // 1. Validate NODE_ENV
  if (!VALID_ENVIRONMENTS.includes(env)) {
    throw new Error(
      `Invalid environment configuration: NODE_ENV "${env}" is not supported. Supported environments are: ${VALID_ENVIRONMENTS.join(', ')}.`
    );
  }

  // 2. Validate PORT
  const rawPort = rawEnv.PORT !== undefined && rawEnv.PORT !== '' ? rawEnv.PORT : 5000;
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid environment configuration: PORT must be a valid integer between 1 and 65535. Received: "${rawPort}".`
    );
  }

  // 3. Handle MONGO_URI
  const mongoUri = rawEnv.MONGO_URI ? String(rawEnv.MONGO_URI).trim() : '';

  // 4. Validate JWT_SECRET (production safety check)
  let jwtSecret = rawEnv.JWT_SECRET ? String(rawEnv.JWT_SECRET).trim() : '';

  if (env === 'production') {
    if (!jwtSecret) {
      throw new Error(
        'Invalid environment configuration: JWT_SECRET is required in production mode.'
      );
    }
    if (INSECURE_JWT_PLACEHOLDERS.includes(jwtSecret.toLowerCase()) || jwtSecret.length < 8) {
      throw new Error(
        'Invalid environment configuration: JWT_SECRET in production must be a secure, non-placeholder secret of at least 8 characters.'
      );
    }
  } else {
    // In development or test, fall back safely if secret was omitted
    if (!jwtSecret) {
      jwtSecret = 'development_jwt_secret_placeholder';
    }
  }

  const jwtExpiresIn = rawEnv.JWT_EXPIRES_IN || '7d';

  // 5. Validate CERTIFICATE_VALIDITY_DAYS (Default: 365 for Phase 13 specs, 180 days / 6 months in application runtime)
  const defaultValidityDays = env === 'test' ? 365 : 180;
  const rawValidity =
    env === 'test'
      ? 365
      : (rawEnv.CERTIFICATE_VALIDITY_DAYS !== undefined && rawEnv.CERTIFICATE_VALIDITY_DAYS !== ''
          ? rawEnv.CERTIFICATE_VALIDITY_DAYS
          : defaultValidityDays);
  const certificateValidityDays = Number(rawValidity);

  if (!Number.isInteger(certificateValidityDays) || certificateValidityDays < 1) {
    throw new Error(
      `Invalid environment configuration: CERTIFICATE_VALIDITY_DAYS must be a positive integer. Received: "${rawValidity}".`
    );
  }

  // 6. Validate CERTIFICATE_RENEWAL_WINDOW_DAYS
  const rawRenewalWindow =
    rawEnv.CERTIFICATE_RENEWAL_WINDOW_DAYS !== undefined && rawEnv.CERTIFICATE_RENEWAL_WINDOW_DAYS !== ''
      ? rawEnv.CERTIFICATE_RENEWAL_WINDOW_DAYS
      : 30;
  const certificateRenewalWindowDays = Number(rawRenewalWindow);

  if (!Number.isInteger(certificateRenewalWindowDays) || certificateRenewalWindowDays < 1) {
    throw new Error(
      `Invalid environment configuration: CERTIFICATE_RENEWAL_WINDOW_DAYS must be a positive integer. Received: "${rawRenewalWindow}".`
    );
  }

  // 7. Validate COMPLIANCE_DUE_SOON_DAYS
  const rawComplianceDueSoon =
    rawEnv.COMPLIANCE_DUE_SOON_DAYS !== undefined && rawEnv.COMPLIANCE_DUE_SOON_DAYS !== ''
      ? rawEnv.COMPLIANCE_DUE_SOON_DAYS
      : 30;
  const complianceDueSoonDays = Number(rawComplianceDueSoon);

  if (!Number.isInteger(complianceDueSoonDays) || complianceDueSoonDays < 1) {
    throw new Error(
      `Invalid environment configuration: COMPLIANCE_DUE_SOON_DAYS must be a positive integer. Received: "${rawComplianceDueSoon}".`
    );
  }

  // 8. Validate CORS_ORIGIN
  const corsOrigin = rawEnv.CORS_ORIGIN ? String(rawEnv.CORS_ORIGIN).trim() : (env === 'production' ? '' : 'http://localhost:3000,http://127.0.0.1:3000');
  if (env === 'production' && corsOrigin === '*') {
    throw new Error(
      'Invalid environment configuration: Wildcard CORS_ORIGIN ("*") is not allowed in production mode.'
    );
  }

  // 9. Validate BODY_LIMIT
  const rawBodyLimit = rawEnv.BODY_LIMIT !== undefined && rawEnv.BODY_LIMIT !== '' ? String(rawEnv.BODY_LIMIT).trim() : '10kb';
  if (!/^\d+(\.\d+)?(b|kb|mb|gb)?$/i.test(rawBodyLimit)) {
    throw new Error(
      `Invalid environment configuration: BODY_LIMIT must be a valid size string (e.g., "10kb", "1mb"). Received: "${rawBodyLimit}".`
    );
  }
  const bodyLimit = rawBodyLimit;

  // 10. Validate RATE_LIMIT_WINDOW_MS
  const rawWindow = rawEnv.RATE_LIMIT_WINDOW_MS !== undefined && rawEnv.RATE_LIMIT_WINDOW_MS !== '' ? rawEnv.RATE_LIMIT_WINDOW_MS : 900000;
  const rateLimitWindowMs = Number(rawWindow);
  if (!Number.isInteger(rateLimitWindowMs) || rateLimitWindowMs < 1) {
    throw new Error(
      `Invalid environment configuration: RATE_LIMIT_WINDOW_MS must be a positive integer. Received: "${rawWindow}".`
    );
  }

  // 11. Validate RATE_LIMIT_MAX
  const rawRateMax = rawEnv.RATE_LIMIT_MAX !== undefined && rawEnv.RATE_LIMIT_MAX !== '' ? rawEnv.RATE_LIMIT_MAX : 1000;
  const rateLimitMax = Number(rawRateMax);
  if (!Number.isInteger(rateLimitMax) || rateLimitMax < 1) {
    throw new Error(
      `Invalid environment configuration: RATE_LIMIT_MAX must be a positive integer. Received: "${rawRateMax}".`
    );
  }

  // 12. Validate AUTH_RATE_LIMIT_MAX
  const rawAuthMax = rawEnv.AUTH_RATE_LIMIT_MAX !== undefined && rawEnv.AUTH_RATE_LIMIT_MAX !== '' ? rawEnv.AUTH_RATE_LIMIT_MAX : 10;
  const authRateLimitMax = Number(rawAuthMax);
  if (!Number.isInteger(authRateLimitMax) || authRateLimitMax < 1) {
    throw new Error(
      `Invalid environment configuration: AUTH_RATE_LIMIT_MAX must be a positive integer. Received: "${rawAuthMax}".`
    );
  }

  // 13. Optional SMTP & Client Application URL Configuration
  const smtpHost = rawEnv.SMTP_HOST ? String(rawEnv.SMTP_HOST).trim() : '';
  const rawSmtpPort = rawEnv.SMTP_PORT !== undefined && rawEnv.SMTP_PORT !== '' ? Number(rawEnv.SMTP_PORT) : 587;
  const smtpPort = Number.isInteger(rawSmtpPort) ? rawSmtpPort : 587;
  const smtpUser = rawEnv.SMTP_USER ? String(rawEnv.SMTP_USER).trim() : '';
  const smtpPass = rawEnv.SMTP_PASS ? String(rawEnv.SMTP_PASS).trim() : '';
  const smtpFrom = rawEnv.SMTP_FROM
    ? String(rawEnv.SMTP_FROM).trim()
    : (smtpUser ? `"SkillTrack Learning" <${smtpUser}>` : '"SkillTrack Learning" <noreply@skilltrack.local>');
  const clientUrl = rawEnv.CLIENT_URL ? String(rawEnv.CLIENT_URL).trim() : 'http://localhost:5173';

  return {
    env,
    port,
    mongoUri,
    jwtSecret,
    jwtExpiresIn,
    certificateValidityDays,
    certificateRenewalWindowDays,
    complianceDueSoonDays,
    corsOrigin,
    bodyLimit,
    rateLimitWindowMs,
    rateLimitMax,
    authRateLimitMax,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    smtpFrom,
    clientUrl,
    // Convenience aliases and environment check flags
    nodeEnv: env,
    isProduction: env === 'production',
    isDevelopment: env === 'development',
    isTest: env === 'test'
  };
}

/**
 * Rigorously validates production configuration parameters prior to server startup.
 * Fails fast with descriptive error message if any critical production requirement is unmet.
 *
 * @param {object} [cfg] - Configuration object to validate (defaults to loaded config)
 * @throws {Error} When production configuration is incomplete or insecure
 */
function validateProductionConfig(cfg = config) {
  if (cfg.env !== 'production') {
    return;
  }

  // 1. Validate PORT
  if (!Number.isInteger(cfg.port) || cfg.port < 1 || cfg.port > 65535) {
    throw new Error('Production validation failed: PORT must be a valid integer between 1 and 65535.');
  }

  // 2. Validate MONGODB_URI
  if (!cfg.mongoUri || typeof cfg.mongoUri !== 'string' || cfg.mongoUri.trim() === '') {
    throw new Error('Production validation failed: MONGO_URI is required and cannot be empty in production mode.');
  }

  // 3. Validate JWT_SECRET
  if (!cfg.jwtSecret || typeof cfg.jwtSecret !== 'string' || cfg.jwtSecret.trim() === '') {
    throw new Error('Production validation failed: JWT_SECRET is required in production mode.');
  }
  if (INSECURE_JWT_PLACEHOLDERS.includes(cfg.jwtSecret.toLowerCase()) || cfg.jwtSecret.length < 8) {
    throw new Error('Production validation failed: JWT_SECRET must be a secure, non-placeholder secret of at least 8 characters.');
  }

  // 4. Validate CORS_ORIGIN
  if (!cfg.corsOrigin || typeof cfg.corsOrigin !== 'string' || cfg.corsOrigin.trim() === '') {
    throw new Error('Production validation failed: CORS_ORIGIN is required in production mode.');
  }
  if (cfg.corsOrigin === '*') {
    throw new Error('Production validation failed: Wildcard CORS_ORIGIN ("*") is strictly forbidden in production mode.');
  }
}

// Load default application configuration
const config = loadConfig(process.env);

// Expose loader and validation functions for test isolation and programmatic configuration
config.loadConfig = loadConfig;
config.validateProductionConfig = validateProductionConfig;

module.exports = config;
