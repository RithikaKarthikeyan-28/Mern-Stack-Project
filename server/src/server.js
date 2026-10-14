const app = require('./app');
const config = require('./config');
const { connectDatabase, disconnectDatabase } = require('./config/database');

let server = null;
let isShuttingDown = false;

/**
 * Starts the application following the required sequence:
 * 1. Validate production configuration (fail fast)
 * 2. Connect to MongoDB
 * 3. Start HTTP server only upon successful initialization
 *
 * @returns {Promise<object>} The active HTTP server instance
 */
async function startServer() {
  try {
    // 1. Fail-fast configuration validation for production mode
    if (typeof config.validateProductionConfig === 'function') {
      config.validateProductionConfig(config);
    }

    // 2. Establish database connection before accepting traffic
    await connectDatabase();

    // 3. Start HTTP listener
    server = app.listen(config.port, () => {
      console.log(`[SkillTrack Backend] Server running on port ${config.port} in ${config.nodeEnv} mode`);
      console.log(`[SkillTrack Backend] Health check endpoint: http://localhost:${config.port}/api/health`);
      console.log(`[SkillTrack Backend] Readiness check endpoint: http://localhost:${config.port}/api/ready`);
    });

    return server;
  } catch (err) {
    console.error('[SkillTrack Backend] Server startup aborted:', err.message);
    process.exit(1);
  }
}

/**
 * Gracefully shuts down the HTTP server and closes database connections.
 * Prevents reentrant or duplicate shutdown executions.
 *
 * @param {string} signal - Triggering signal name or reason
 */
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  console.log(`[SkillTrack Backend] ${signal} received. Initiating graceful shutdown...`);

  // Safety fallback timer to prevent hanging indefinitely
  const forceExitTimeout = setTimeout(() => {
    console.error('[SkillTrack Backend] Graceful shutdown timeout reached (10s). Forcing termination.');
    process.exit(1);
  }, 10000);
  if (forceExitTimeout.unref) {
    forceExitTimeout.unref();
  }

  if (server) {
    server.close(async () => {
      console.log('[SkillTrack Backend] HTTP server closed cleanly.');
      try {
        await disconnectDatabase();
        clearTimeout(forceExitTimeout);
        process.exit(0);
      } catch (err) {
        console.error('[SkillTrack Backend] Error closing database connection:', err.message);
        clearTimeout(forceExitTimeout);
        process.exit(1);
      }
    });
  } else {
    try {
      await disconnectDatabase();
    } catch (_) {}
    clearTimeout(forceExitTimeout);
    process.exit(0);
  }
}

// Handle process termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unexpected errors
process.on('unhandledRejection', (err) => {
  console.error('[SkillTrack Backend] UNHANDLED REJECTION! Shutting down...', err);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  console.error('[SkillTrack Backend] UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Auto-start server only when executed directly (node src/server.js)
if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  gracefulShutdown
};
