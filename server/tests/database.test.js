const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase, sanitizeMongoUri } = require('../src/config/database');

describe('Database Architecture & Connection Tests (Phase 3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
  });

  // Test 1 — connectDatabase exists
  describe('Test 1: Module Exports', () => {
    it('should expose connectDatabase as a function', () => {
      expect(typeof connectDatabase).toBe('function');
    });

    it('should expose disconnectDatabase as a function', () => {
      expect(typeof disconnectDatabase).toBe('function');
    });

    it('should expose sanitizeMongoUri as a function', () => {
      expect(typeof sanitizeMongoUri).toBe('function');
    });
  });

  // Test 2 — successful connection
  describe('Test 2: Successful Connection', () => {
    it('should call mongoose.connect with the configured URI and return the connection', async () => {
      const mockConnect = jest.spyOn(mongoose, 'connect').mockResolvedValueOnce(mongoose.connection);
      const testUri = 'mongodb://localhost:27017/skilltrack_test_mock';

      const connection = await connectDatabase(testUri);

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockConnect).toHaveBeenCalledWith(testUri);
      expect(connection).toBe(mongoose.connection);
    });
  });

  // Test 3 — missing MongoDB URI
  describe('Test 3: Missing MongoDB URI Handling', () => {
    it('should reject when MONGO_URI is an empty string', async () => {
      await expect(connectDatabase('')).rejects.toThrow(
        /MongoDB connection failed: MONGO_URI is not defined/
      );
    });

    it('should reject when MONGO_URI is whitespace only', async () => {
      await expect(connectDatabase('   ')).rejects.toThrow(
        /MongoDB connection failed: MONGO_URI is not defined/
      );
    });

    it('should reject when MONGO_URI is null or undefined with no config fallback', async () => {
      await expect(connectDatabase(null)).rejects.toThrow(
        /MongoDB connection failed: MONGO_URI is not defined/
      );
    });
  });

  // Test 4 — MongoDB connection failure
  describe('Test 4: MongoDB Connection Failure Propagation', () => {
    it('should propagate connection errors when mongoose.connect fails', async () => {
      const dbError = new Error('Connection refused by MongoDB server at 127.0.0.1:27017');
      jest.spyOn(mongoose, 'connect').mockRejectedValueOnce(dbError);

      await expect(connectDatabase('mongodb://localhost:27017/faildb')).rejects.toThrow(
        'Connection refused by MongoDB server at 127.0.0.1:27017'
      );
    });
  });

  // Test 5 — no automatic connection during app import
  describe('Test 5: App Import Isolation', () => {
    it('should NOT automatically attempt to connect to MongoDB when importing app.js', () => {
      const connectSpy = jest.spyOn(mongoose, 'connect');

      // Require app.js in isolated module scope
      jest.isolateModules(() => {
        require('../src/app');
      });

      expect(connectSpy).not.toHaveBeenCalled();
    });
  });

  // Test 6 — Graceful Disconnection and URI Sanitization
  describe('Test 6: Disconnection & Sanitization', () => {
    it('should call mongoose.connection.close on disconnectDatabase when connected', async () => {
      const closeSpy = jest.spyOn(mongoose.connection, 'close').mockResolvedValueOnce(true);
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

      await disconnectDatabase();

      expect(closeSpy).toHaveBeenCalledTimes(1);

      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    });

    it('should sanitize credentials from MongoDB URIs in logs', () => {
      const secureUri = sanitizeMongoUri('mongodb://admin:superSecretPassword123@cluster0.abc.mongodb.net/prod');
      expect(secureUri).toBe('mongodb://***:***@cluster0.abc.mongodb.net/prod');
      expect(secureUri).not.toContain('superSecretPassword123');

      const plainUri = sanitizeMongoUri('mongodb://localhost:27017/skilltrack');
      expect(plainUri).toBe('mongodb://localhost:27017/skilltrack');
    });
  });
});
