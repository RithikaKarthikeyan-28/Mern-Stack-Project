const mongoose = require('mongoose');
const User = require('../src/models/User');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('User Model Tests (Phase 4)', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // Test 1 — User model exists and can create a valid user
  it('Test 1: User model exists and can create a valid user', async () => {
    const userData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Password123'
    };

    const user = await User.create(userData);

    expect(user).toBeDefined();
    expect(user._id).toBeDefined();
    expect(user.name).toBe('Jane Doe');
    expect(user.email).toBe('jane@example.com');
  });

  // Test 2 — Password is hashed
  it('Test 2: Password is hashed and does not equal plaintext password', async () => {
    const rawPassword = 'PlaintextPassword123';
    const user = await User.create({
      name: 'Hash Tester',
      email: 'hash@example.com',
      password: rawPassword
    });

    // Retrieve user including password
    const foundUser = await User.findById(user._id).select('+password');

    expect(foundUser.password).toBeDefined();
    expect(foundUser.password).not.toBe(rawPassword);
    // Standard bcrypt hash starts with $2a$ or $2b$
    expect(foundUser.password).toMatch(/^\$2[ab]\$\d+\$/);
  });

  // Test 3 — Password comparison works
  it('Test 3: Password comparison works for correct and incorrect passwords', async () => {
    const rawPassword = 'SecretPassword123';
    const user = await User.create({
      name: 'Comparison Tester',
      email: 'compare@example.com',
      password: rawPassword
    });

    const userWithPassword = await User.findById(user._id).select('+password');

    const isMatchCorrect = await userWithPassword.comparePassword(rawPassword);
    expect(isMatchCorrect).toBe(true);

    const isMatchWrong = await userWithPassword.comparePassword('WrongPassword123');
    expect(isMatchWrong).toBe(false);
  });

  // Test 4 — Email is normalized
  it('Test 4: Email is normalized to lowercase and trimmed', async () => {
    const user = await User.create({
      name: 'Normalization Tester',
      email: '  TEST@Example.COM  ',
      password: 'Password123'
    });

    expect(user.email).toBe('test@example.com');
  });

  // Test 5 — Duplicate email is rejected
  it('Test 5: Duplicate email is rejected', async () => {
    await User.create({
      name: 'First User',
      email: 'duplicate@example.com',
      password: 'Password123'
    });

    await expect(
      User.create({
        name: 'Second User',
        email: 'DUPLICATE@example.com',
        password: 'AnotherPassword123'
      })
    ).rejects.toThrow();
  });

  // Test 6 — Default role is employee
  it('Test 6: Default role is employee', async () => {
    const user = await User.create({
      name: 'Role Tester',
      email: 'role@example.com',
      password: 'Password123'
    });

    expect(user.role).toBe('employee');
  });

  // Test 7 — Default isActive is true
  it('Test 7: Default isActive is true', async () => {
    const user = await User.create({
      name: 'Active Tester',
      email: 'active@example.com',
      password: 'Password123'
    });

    expect(user.isActive).toBe(true);
  });
});
