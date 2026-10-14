const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const { noSqlInjectionGuard, requestIdMiddleware } = require('./middleware/security.middleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const AppError = require('./utils/AppError');

const app = express();

// Disable X-Powered-By header
app.disable('x-powered-by');

// Security HTTP headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
    hsts: config.isProduction ? { maxAge: 15552000, includeSubDomains: true } : false
  })
);

// Cross-Origin Resource Sharing (CORS) hardening
const allowedOrigins = config.corsOrigin
  ? config.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests with no origin (e.g. mobile apps, curl, internal tests)
    if (!origin) return callback(null, true);

    // If wildcard '*' is configured (e.g. in dev/test)
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new AppError('Not allowed by CORS', 403));
  },
  credentials: !allowedOrigins.includes('*'),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id']
};

const restrictedCors = cors(corsOptions);
const publicCors = cors();

app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/health') ||
    req.path === '/health' ||
    req.path.startsWith('/api/ready') ||
    req.path === '/ready'
  ) {
    return publicCors(req, res, next);
  }
  return restrictedCors(req, res, next);
});

// Correlation / Request ID tracking
app.use(requestIdMiddleware);

// Parse incoming JSON requests with body limit
app.use(express.json({ limit: config.bodyLimit }));

// Parse incoming URL-encoded requests with body limit
app.use(express.urlencoded({ extended: true, limit: config.bodyLimit }));

// NoSQL injection and dot-path guard
app.use(noSqlInjectionGuard);

// General API rate limiter and route mounting
app.use('/api', apiLimiter, apiRoutes);

// Catch-all 404 handler for any unmapped route
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
