describe('Configuration & Environment Management Tests (Phase 2)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // Test 1 — configuration loads
  describe('Test 1: Configuration Loading', () => {
    it('should expose env, port, mongoUri, and jwtSecret', () => {
      const config = require('../src/config');

      expect(config).toHaveProperty('env');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('mongoUri');
      expect(config).toHaveProperty('jwtSecret');

      expect(typeof config.env).toBe('string');
      expect(typeof config.port).toBe('number');
      expect(typeof config.mongoUri).toBe('string');
      expect(typeof config.jwtSecret).toBe('string');
    });

    it('should expose compatibility aliases and helper flags', () => {
      const config = require('../src/config');

      expect(config).toHaveProperty('nodeEnv');
      expect(config).toHaveProperty('isProduction');
      expect(config).toHaveProperty('isDevelopment');
      expect(config).toHaveProperty('isTest');
      expect(config).toHaveProperty('loadConfig');
      expect(typeof config.loadConfig).toBe('function');
    });
  });

  // Test 2 — default/expected development configuration
  describe('Test 2: Development Configuration Behavior', () => {
    it('should behave correctly with default development settings', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '5000';
      process.env.MONGO_URI = '';
      process.env.JWT_SECRET = 'development_jwt_secret_placeholder';

      const config = require('../src/config');

      expect(config.env).toBe('development');
      expect(config.nodeEnv).toBe('development');
      expect(config.port).toBe(5000);
      expect(config.isDevelopment).toBe(true);
      expect(config.isProduction).toBe(false);
      expect(config.isTest).toBe(false);
      expect(config.mongoUri).toBe('');
      expect(config.jwtSecret).toBe('development_jwt_secret_placeholder');
    });

    it('should fall back to development defaults when optional values are omitted in loadConfig', () => {
      const { loadConfig } = require('../src/config');
      const customConfig = loadConfig({});

      expect(customConfig.env).toBe('development');
      expect(customConfig.port).toBe(5000);
      expect(customConfig.mongoUri).toBe('');
      expect(customConfig.jwtSecret).toBe('development_jwt_secret_placeholder');
      expect(customConfig.isDevelopment).toBe(true);
    });

    it('should support test environment settings', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '5001';

      const config = require('../src/config');

      expect(config.env).toBe('test');
      expect(config.port).toBe(5001);
      expect(config.isTest).toBe(true);
      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(false);
    });
  });

  // Test 3 — invalid port
  describe('Test 3: Port Validation', () => {
    it('should reject non-numeric PORT values', () => {
      process.env.PORT = 'not-a-number';

      expect(() => {
        require('../src/config');
      }).toThrow(/PORT must be a valid integer between 1 and 65535/);
    });

    it('should reject out-of-range PORT values (0 or negative)', () => {
      process.env.PORT = '0';
      expect(() => {
        require('../src/config');
      }).toThrow(/PORT must be a valid integer between 1 and 65535/);

      jest.resetModules();
      process.env.PORT = '-5000';
      expect(() => {
        require('../src/config');
      }).toThrow(/PORT must be a valid integer between 1 and 65535/);
    });

    it('should reject PORT values exceeding 65535', () => {
      process.env.PORT = '70000';

      expect(() => {
        require('../src/config');
      }).toThrow(/PORT must be a valid integer between 1 and 65535/);
    });

    it('should reject decimal PORT values', () => {
      process.env.PORT = '5000.5';

      expect(() => {
        require('../src/config');
      }).toThrow(/PORT must be a valid integer between 1 and 65535/);
    });

    it('should reject invalid ports via loadConfig directly', () => {
      const { loadConfig } = require('../src/config');

      expect(() => {
        loadConfig({ PORT: 'abc' });
      }).toThrow(/PORT must be a valid integer between 1 and 65535/);
    });
  });

  // Test 4 — invalid NODE_ENV
  describe('Test 4: NODE_ENV Validation', () => {
    it('should reject unsupported NODE_ENV values', () => {
      process.env.NODE_ENV = 'staging';

      expect(() => {
        require('../src/config');
      }).toThrow(/NODE_ENV "staging" is not supported/);
    });

    it('should list allowed environments in the error message', () => {
      process.env.NODE_ENV = 'invalid_env';

      expect(() => {
        require('../src/config');
      }).toThrow(/Supported environments are: development, test, production/);
    });

    it('should reject unsupported environments via loadConfig directly', () => {
      const { loadConfig } = require('../src/config');

      expect(() => {
        loadConfig({ NODE_ENV: 'custom' });
      }).toThrow(/Supported environments are: development, test, production/);
    });
  });

  // Test 5 — production JWT validation
  describe('Test 5: Production JWT Validation', () => {
    it('should reject empty or missing JWT_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = '';

      expect(() => {
        require('../src/config');
      }).toThrow(/JWT_SECRET is required in production mode/);
    });

    it('should reject whitespace-only JWT_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = '   ';

      expect(() => {
        require('../src/config');
      }).toThrow(/JWT_SECRET is required in production mode/);
    });

    it('should reject missing JWT_SECRET in production via loadConfig', () => {
      const { loadConfig } = require('../src/config');

      expect(() => {
        loadConfig({ NODE_ENV: 'production' });
      }).toThrow(/JWT_SECRET is required in production mode/);
    });

    it('should reject insecure placeholder JWT_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'development_jwt_secret_placeholder';

      expect(() => {
        require('../src/config');
      }).toThrow(/JWT_SECRET in production must be a secure, non-placeholder/);
    });

    it('should reject short (< 8 chars) JWT_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'short';

      expect(() => {
        require('../src/config');
      }).toThrow(/JWT_SECRET in production must be a secure, non-placeholder secret of at least 8 characters/);
    });

    it('should accept a valid, secure JWT_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '5000';
      process.env.JWT_SECRET = 'a-strong-production-signing-secret-key-32chars';

      const config = require('../src/config');
      expect(config.env).toBe('production');
      expect(config.isProduction).toBe(true);
      expect(config.jwtSecret).toBe('a-strong-production-signing-secret-key-32chars');
    });
  });

  describe('MongoDB URI Handling in Phase 2', () => {
    it('should allow MONGO_URI to remain empty without failing validation', () => {
      process.env.NODE_ENV = 'development';
      process.env.MONGO_URI = '';

      const config = require('../src/config');
      expect(config.mongoUri).toBe('');
    });

    it('should preserve MONGO_URI when provided without connecting', () => {
      process.env.NODE_ENV = 'development';
      process.env.MONGO_URI = 'mongodb://localhost:27017/skilltrack_test';

      const config = require('../src/config');
      expect(config.mongoUri).toBe('mongodb://localhost:27017/skilltrack_test');
    });
  });
});
