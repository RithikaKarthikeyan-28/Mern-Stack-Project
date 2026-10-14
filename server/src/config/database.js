const mongoose = require('mongoose');
const config = require('./index');

let listenersRegistered = false;

/**
 * Masks sensitive credentials from MongoDB URI for safe logging.
 *
 * @param {string} uri - Raw MongoDB URI string
 * @returns {string} Masked URI string
 */
function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') {
    return '';
  }
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

/**
 * Registers Mongoose connection event handlers.
 */
function registerConnectionEvents() {
  if (listenersRegistered) {
    return;
  }

  mongoose.connection.on('connected', () => {
    console.log('[SkillTrack Database] Mongoose connection event: connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[SkillTrack Database] Mongoose connection event error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('[SkillTrack Database] Mongoose connection event: disconnected');
  });

  listenersRegistered = true;
}

/**
 * Connects to MongoDB using Mongoose.
 *
 * @param {string} [uri] - Optional MongoDB URI override (defaults to config.mongoUri)
 * @returns {Promise<mongoose.Connection>} Resolves with Mongoose connection
 * @throws {Error} If MONGO_URI is missing or if connection fails
 */
async function connectDatabase(uri) {
  const targetUri = uri !== undefined ? uri : config.mongoUri;

  if (!targetUri || typeof targetUri !== 'string' || targetUri.trim() === '') {
    const error = new Error(
      'MongoDB connection failed: MONGO_URI is not defined. Please set MONGO_URI in your environment configuration.'
    );
    console.error(`[SkillTrack Database] ${error.message}`);
    throw error;
  }

  registerConnectionEvents();

  const sanitized = sanitizeMongoUri(targetUri);
  console.log(`[SkillTrack Database] Connecting to MongoDB at ${sanitized}...`);

  try {
    await mongoose.connect(targetUri);
    console.log(`[SkillTrack Database] Successfully connected to MongoDB at ${sanitized}`);
    return mongoose.connection;
  } catch (err) {
    console.error(`[SkillTrack Database] Failed to connect to MongoDB at ${sanitized}:`, err.message);
    throw err;
  }
}

/**
 * Disconnects from MongoDB cleanly.
 *
 * @returns {Promise<void>}
 */
async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('[SkillTrack Database] MongoDB connection closed cleanly');
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  sanitizeMongoUri
};
