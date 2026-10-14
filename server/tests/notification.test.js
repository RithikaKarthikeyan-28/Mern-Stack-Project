const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');
const Certificate = require('../src/models/Certificate');
const Notification = require('../src/models/Notification');
const config = require('../src/config');
const notificationService = require('../src/services/notification.service');
const {
  validateNotificationQuery,
  validateMarkRead,
  validateNotificationId
} = require('../src/validators/notification.validator');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Notification System Tests (Phase 14)', () => {
  let adminToken;
  let trainerToken;
  let employeeTokenA;
  let employeeTokenB;

  let adminUser;
  let trainerUser;
  let employeeUserA;
  let employeeUserB;

  let department;
  let employeeProfileA;
  let employeeProfileB;
  let inactiveEmployeeUser;
  let inactiveEmployeeProfile;

  let courseA;
  let courseB;

  let enrollmentA;
  let enrollmentB;

  let certActiveA;
  let certExpiringA;
  let certExpiredA;
  let certRevokedA;

  const generateToken = (user) => {
    return jwt.sign(
      {
        id: user._id.toString(),
        userId: user._id.toString(),
        role: user.role,
        email: user.email
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    // Clean up test collections
    await Promise.all([
      User.deleteMany({ email: /@phase14test\.com$/ }),
      Department.deleteMany({ name: /Phase 14/ }),
      Employee.deleteMany({ employeeId: /^EMP-P14/ }),
      Course.deleteMany({ title: /Phase 14/ }),
      Enrollment.deleteMany({}),
      Certificate.deleteMany({ certificateNumber: /^SKILLTRACK-P14/ }),
      Notification.deleteMany({})
    ]);

    // Create users
    adminUser = await User.create({
      name: 'P14 Admin',
      email: 'admin@phase14test.com',
      password: 'Password123!',
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    trainerUser = await User.create({
      name: 'P14 Trainer',
      email: 'trainer@phase14test.com',
      password: 'Password123!',
      role: 'trainer'
    });
    trainerToken = generateToken(trainerUser);

    employeeUserA = await User.create({
      name: 'P14 Employee A',
      email: 'employeeA@phase14test.com',
      password: 'Password123!',
      role: 'employee'
    });
    employeeTokenA = generateToken(employeeUserA);

    employeeUserB = await User.create({
      name: 'P14 Employee B',
      email: 'employeeB@phase14test.com',
      password: 'Password123!',
      role: 'employee'
    });
    employeeTokenB = generateToken(employeeUserB);

    inactiveEmployeeUser = await User.create({
      name: 'P14 Inactive Employee',
      email: 'inactive@phase14test.com',
      password: 'Password123!',
      role: 'employee'
    });

    department = await Department.create({
      name: 'Phase 14 Engineering',
      code: 'P14ENG'
    });

    employeeProfileA = await Employee.create({
      user: employeeUserA._id,
      employeeId: 'EMP-P14-001',
      department: department._id,
      designation: 'Software Engineer',
      isActive: true
    });

    employeeProfileB = await Employee.create({
      user: employeeUserB._id,
      employeeId: 'EMP-P14-002',
      department: department._id,
      designation: 'QA Engineer',
      isActive: true
    });

    inactiveEmployeeProfile = await Employee.create({
      user: inactiveEmployeeUser._id,
      employeeId: 'EMP-P14-003',
      department: department._id,
      designation: 'DevOps Engineer',
      isActive: false
    });

    courseA = await Course.create({
      title: 'Phase 14 Security Mastery',
      description: 'Mastering security and notifications',
      category: 'Engineering',
      level: 'intermediate',
      duration: 120,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    courseB = await Course.create({
      title: 'Phase 14 Advanced Architecture',
      description: 'Enterprise backend architecture',
      category: 'Architecture',
      level: 'advanced',
      duration: 180,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    const courseC = await Course.create({
      title: 'Phase 14 Compliance and Ethics',
      description: 'Compliance rules and ethical conduct',
      category: 'Compliance',
      level: 'beginner',
      duration: 60,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    enrollmentA = await Enrollment.create({
      employee: employeeProfileA._id,
      course: courseA._id,
      status: 'completed',
      progressPercentage: 100,
      completedAt: new Date(),
      isActive: true
    });

    const enrollmentA2 = await Enrollment.create({
      employee: employeeProfileA._id,
      course: courseB._id,
      status: 'completed',
      progressPercentage: 100,
      completedAt: new Date(),
      isActive: true
    });

    const enrollmentA3 = await Enrollment.create({
      employee: employeeProfileA._id,
      course: courseC._id,
      status: 'completed',
      progressPercentage: 100,
      completedAt: new Date(),
      isActive: true
    });

    enrollmentB = await Enrollment.create({
      employee: employeeProfileB._id,
      course: courseA._id,
      status: 'completed',
      progressPercentage: 100,
      completedAt: new Date(),
      isActive: true
    });

    const now = new Date();
    certActiveA = await Certificate.create({
      employee: employeeProfileA._id,
      course: courseA._id,
      enrollment: enrollmentA._id,
      certificateNumber: 'SKILLTRACK-P14-ACT01',
      issuedAt: now,
      expiresAt: new Date(now.getTime() + 180 * 86400000),
      status: 'active'
    });

    certExpiringA = await Certificate.create({
      employee: employeeProfileA._id,
      course: courseB._id,
      enrollment: enrollmentA2._id,
      certificateNumber: 'SKILLTRACK-P14-EXP01',
      issuedAt: new Date(now.getTime() - 350 * 86400000),
      expiresAt: new Date(now.getTime() + 15 * 86400000), // 15 days left (within 30-day window)
      status: 'active'
    });

    certExpiredA = await Certificate.create({
      employee: employeeProfileB._id,
      course: courseA._id,
      enrollment: enrollmentB._id,
      certificateNumber: 'SKILLTRACK-P14-PAST1',
      issuedAt: new Date(now.getTime() - 400 * 86400000),
      expiresAt: new Date(now.getTime() - 10 * 86400000), // 10 days past expiry
      status: 'active'
    });

    certRevokedA = await Certificate.create({
      employee: employeeProfileA._id,
      course: courseC._id,
      enrollment: enrollmentA3._id,
      certificateNumber: 'SKILLTRACK-P14-RVK01',
      issuedAt: new Date(now.getTime() - 300 * 86400000),
      expiresAt: new Date(now.getTime() + 20 * 86400000),
      status: 'revoked',
      revokedAt: now,
      revokedBy: adminUser._id,
      revocationReason: 'Violation of exam policy'
    });
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: /@phase14test\.com$/ }),
      Department.deleteMany({ name: /Phase 14/ }),
      Employee.deleteMany({ employeeId: /^EMP-P14/ }),
      Course.deleteMany({ title: /Phase 14/ }),
      Enrollment.deleteMany({}),
      Certificate.deleteMany({ certificateNumber: /^SKILLTRACK-P14/ }),
      Notification.deleteMany({})
    ]);
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
  });

  // ========================================================
  // 1. MODEL TESTS (14 tests)
  // ========================================================
  describe('1. Notification Model', () => {
    it('1. should create a valid notification successfully', async () => {
      const notif = await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Expiring Soon',
        message: 'Your certificate is expiring soon.',
        relatedCertificate: certActiveA._id,
        relatedCourse: courseA._id
      });

      expect(notif._id).toBeDefined();
      expect(notif.recipient.toString()).toBe(employeeUserA._id.toString());
      expect(notif.type).toBe('certificate_expiring');
      expect(notif.title).toBe('Expiring Soon');
      expect(notif.message).toBe('Your certificate is expiring soon.');
    });

    it('2. should require recipient field', async () => {
      await expect(
        Notification.create({
          type: 'certificate_expiring',
          title: 'Title',
          message: 'Message'
        })
      ).rejects.toThrow(/Recipient reference is required/);
    });

    it('3. should require type field', async () => {
      await expect(
        Notification.create({
          recipient: employeeUserA._id,
          title: 'Title',
          message: 'Message'
        })
      ).rejects.toThrow(/Notification type is required/);
    });

    it('4. should accept all supported notification types', async () => {
      const types = ['certificate_expiring', 'certificate_expired', 'certificate_renewed'];
      for (const type of types) {
        const notif = await Notification.create({
          recipient: employeeUserA._id,
          type,
          title: `Title for ${type}`,
          message: `Message for ${type}`
        });
        expect(notif.type).toBe(type);
      }
    });

    it('5. should reject unsupported notification types', async () => {
      await expect(
        Notification.create({
          recipient: employeeUserA._id,
          type: 'course_completed',
          title: 'Title',
          message: 'Message'
        })
      ).rejects.toThrow(/Notification type must be one of/);
    });

    it('6. should require title field', async () => {
      await expect(
        Notification.create({
          recipient: employeeUserA._id,
          type: 'certificate_expiring',
          message: 'Message'
        })
      ).rejects.toThrow(/Notification title is required/);
    });

    it('7. should require message field', async () => {
      await expect(
        Notification.create({
          recipient: employeeUserA._id,
          type: 'certificate_expiring',
          title: 'Title'
        })
      ).rejects.toThrow(/Notification message is required/);
    });

    it('8. should default isRead to false', async () => {
      const notif = await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Title',
        message: 'Message'
      });
      expect(notif.isRead).toBe(false);
    });

    it('9. should default isActive to true', async () => {
      const notif = await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Title',
        message: 'Message'
      });
      expect(notif.isActive).toBe(true);
    });

    it('10. should default readAt to null', async () => {
      const notif = await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Title',
        message: 'Message'
      });
      expect(notif.readAt).toBeNull();
    });

    it('11. should store relatedCertificate reference', async () => {
      const notif = await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Title',
        message: 'Message',
        relatedCertificate: certActiveA._id
      });
      expect(notif.relatedCertificate.toString()).toBe(certActiveA._id.toString());
    });

    it('12. should store relatedCourse reference', async () => {
      const notif = await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Title',
        message: 'Message',
        relatedCourse: courseA._id
      });
      expect(notif.relatedCourse.toString()).toBe(courseA._id.toString());
    });

    it('13. should set createdAt and updatedAt timestamps', async () => {
      const notif = await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Title',
        message: 'Message'
      });
      expect(notif.createdAt).toBeInstanceOf(Date);
      expect(notif.updatedAt).toBeInstanceOf(Date);
    });

    it('14. should enforce unique partial index on eventKey', async () => {
      await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'First',
        message: 'First msg',
        eventKey: 'unique-event-key-1'
      });

      await expect(
        Notification.create({
          recipient: employeeUserA._id,
          type: 'certificate_expiring',
          title: 'Duplicate',
          message: 'Duplicate msg',
          eventKey: 'unique-event-key-1'
        })
      ).rejects.toThrow();
    });
  });

  // ========================================================
  // 2. VALIDATION & ANTI-INJECTION TESTS (7 tests)
  // ========================================================
  describe('2. Validation & Anti-Injection', () => {
    it('15. should reject invalid notification ID format', () => {
      expect(() => validateNotificationId({ id: 'invalid-id' })).toThrow(
        /Invalid Notification ID format/
      );
    });

    it('16. should reject negative or zero page number', () => {
      expect(() => validateNotificationQuery({ page: 0 })).toThrow(
        /Page must be a positive integer/
      );
      expect(() => validateNotificationQuery({ page: -5 })).toThrow(
        /Page must be a positive integer/
      );
    });

    it('17. should reject invalid limit number', () => {
      expect(() => validateNotificationQuery({ limit: 'abc' })).toThrow(
        /Limit must be a positive integer/
      );
      expect(() => validateNotificationQuery({ limit: 0 })).toThrow(
        /Limit must be a positive integer/
      );
    });

    it('18. should reject limit exceeding maximum of 100', () => {
      expect(() => validateNotificationQuery({ limit: 101 })).toThrow(
        /Limit cannot exceed maximum of 100/
      );
    });

    it('19. should reject non-boolean isRead query filter', () => {
      expect(() => validateNotificationQuery({ isRead: 'maybe' })).toThrow(
        /isRead filter must be a boolean/
      );
    });

    it('20. should reject unsupported type query filter', () => {
      expect(() => validateNotificationQuery({ type: 'unknown_type' })).toThrow(
        /Invalid notification type/
      );
    });

    it('21. should reject client injection of protected fields in query', () => {
      expect(() => validateNotificationQuery({ recipient: 'fake-id' })).toThrow(
        /Client specification of 'recipient' is not allowed/
      );
      expect(() => validateNotificationQuery({ readAt: new Date() })).toThrow(
        /Client specification of 'readAt' is not allowed/
      );
      expect(() => validateNotificationQuery({ eventKey: 'hack' })).toThrow(
        /Client specification of 'eventKey' is not allowed/
      );
    });
  });

  // ========================================================
  // 3. AUTHENTICATION GATES (6 tests)
  // ========================================================
  describe('3. Authentication Gates', () => {
    it('22. should return 401 on unauthenticated list request', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('23. should return 401 on unauthenticated unread count request', async () => {
      const res = await request(app).get('/api/notifications/unread-count');
      expect(res.status).toBe(401);
    });

    it('24. should return 401 on unauthenticated detail request', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/notifications/${dummyId}`);
      expect(res.status).toBe(401);
    });

    it('25. should return 401 on unauthenticated mark read request', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app).patch(`/api/notifications/${dummyId}/read`);
      expect(res.status).toBe(401);
    });

    it('26. should return 401 on unauthenticated mark-all-read request', async () => {
      const res = await request(app).patch('/api/notifications/read-all');
      expect(res.status).toBe(401);
    });

    it('27. should return 401 on unauthenticated delete request', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/notifications/${dummyId}`);
      expect(res.status).toBe(401);
    });
  });

  // ========================================================
  // 4. OWNERSHIP & IDOR PROTECTION (9 tests)
  // ========================================================
  describe('4. Ownership & IDOR Protection', () => {
    let notifA;
    let notifB;
    let notifTrainer;

    beforeEach(async () => {
      notifA = await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Notice for Employee A',
        message: 'Message A'
      });

      notifB = await Notification.create({
        recipient: employeeUserB._id,
        type: 'certificate_expiring',
        title: 'Notice for Employee B',
        message: 'Message B'
      });

      notifTrainer = await Notification.create({
        recipient: trainerUser._id,
        type: 'certificate_renewed',
        title: 'Notice for Trainer',
        message: 'Message Trainer'
      });
    });

    it('28. employee sees own notifications only in inbox', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].title).toBe('Notice for Employee A');
    });

    it('29. employee cannot see foreign notification by ID (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/notifications/${notifB._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Notification not found/);
    });

    it('30. trainer sees own notifications only in inbox', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].title).toBe('Notice for Trainer');
    });

    it('31. trainer cannot see foreign employee notification (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/notifications/${notifA._id}`)
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(404);
    });

    it('32. admin sees only notifications where recipient is admin', async () => {
      const adminNotif = await Notification.create({
        recipient: adminUser._id,
        type: 'certificate_expired',
        title: 'Notice for Admin',
        message: 'Admin message'
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].title).toBe('Notice for Admin');
    });

    it('33. admin cannot see employee notification by ID (returns 404 anti-enumeration)', async () => {
      const res = await request(app)
        .get(`/api/notifications/${notifA._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('34. requesting nonexistent notification returns 404', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/notifications/${randomId}`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(404);
    });

    it('35. foreign read attempt returns 404', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notifB._id}/read`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(404);
    });

    it('36. foreign delete attempt returns 404', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${notifB._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(404);
    });
  });

  // ========================================================
  // 5. INBOX LIST & PAGINATION (8 tests)
  // ========================================================
  describe('5. Inbox List & Pagination', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 5; i++) {
        await Notification.create({
          recipient: employeeUserA._id,
          type: 'certificate_expiring',
          title: `Notification ${i}`,
          message: `Message content ${i}`,
          createdAt: new Date(Date.now() + i * 1000)
        });
      }
    });

    it('37. should return newest notifications first', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      const notifs = res.body.data.notifications;
      expect(notifs).toHaveLength(5);
      expect(notifs[0].title).toBe('Notification 5');
      expect(notifs[4].title).toBe('Notification 1');
    });

    it('38. should support pagination with limit', async () => {
      const res = await request(app)
        .get('/api/notifications?limit=2')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.total).toBe(5);
      expect(res.body.data.pagination.totalPages).toBe(3);
    });

    it('39. should support page 2 navigation', async () => {
      const res = await request(app)
        .get('/api/notifications?page=2&limit=2')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.notifications[0].title).toBe('Notification 3');
      expect(res.body.data.notifications[1].title).toBe('Notification 2');
    });

    it('40. should support custom limit', async () => {
      const res = await request(app)
        .get('/api/notifications?limit=4')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(4);
    });

    it('41. should return accurate total count in pagination', async () => {
      const res = await request(app)
        .get('/api/notifications?limit=1')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.total).toBe(5);
    });

    it('42. should return accurate totalPages calculation', async () => {
      const res = await request(app)
        .get('/api/notifications?limit=2')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.totalPages).toBe(3);
    });

    it('43. should return empty list when user has no notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${employeeTokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(0);
      expect(res.body.data.pagination.total).toBe(0);
      expect(res.body.data.pagination.totalPages).toBe(1);
    });

    it('44. should exclude inactive (soft-deleted) notifications from inbox', async () => {
      await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Deleted Notif',
        message: 'Deleted content',
        isActive: false
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(5);
      expect(res.body.data.notifications.some((n) => n.title === 'Deleted Notif')).toBe(false);
    });
  });

  // ========================================================
  // 6. FILTERING (5 tests)
  // ========================================================
  describe('6. Filtering', () => {
    beforeEach(async () => {
      await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Unread Expiring',
        message: 'Msg',
        isRead: false
      });
      await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expired',
        title: 'Read Expired',
        message: 'Msg',
        isRead: true,
        readAt: new Date()
      });
      await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_renewed',
        title: 'Unread Renewed',
        message: 'Msg',
        isRead: false
      });
    });

    it('45. should filter by isRead=true', async () => {
      const res = await request(app)
        .get('/api/notifications?isRead=true')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].title).toBe('Read Expired');
    });

    it('46. should filter by isRead=false', async () => {
      const res = await request(app)
        .get('/api/notifications?isRead=false')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.notifications.every((n) => n.isRead === false)).toBe(true);
    });

    it('47. should filter by notification type', async () => {
      const res = await request(app)
        .get('/api/notifications?type=certificate_renewed')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].title).toBe('Unread Renewed');
    });

    it('48. should reject invalid type filter with 400', async () => {
      const res = await request(app)
        .get('/api/notifications?type=invalid_type')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid notification type/);
    });

    it('49. filters remain recipient-scoped even when matching foreign items', async () => {
      await Notification.create({
        recipient: employeeUserB._id,
        type: 'certificate_renewed',
        title: 'User B Renewed',
        message: 'Msg'
      });

      const res = await request(app)
        .get('/api/notifications?type=certificate_renewed')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].title).toBe('Unread Renewed');
    });
  });

  // ========================================================
  // 7. UNREAD COUNT (4 tests)
  // ========================================================
  describe('7. Unread Count', () => {
    beforeEach(async () => {
      await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Unread 1',
        message: 'Msg',
        isRead: false
      });
      await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Unread 2',
        message: 'Msg',
        isRead: false
      });
      await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expired',
        title: 'Read 1',
        message: 'Msg',
        isRead: true,
        readAt: new Date()
      });
      await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Deleted Unread',
        message: 'Msg',
        isRead: false,
        isActive: false
      });
      await Notification.create({
        recipient: employeeUserB._id,
        type: 'certificate_expiring',
        title: 'User B Unread',
        message: 'Msg',
        isRead: false
      });
    });

    it('50. should return correct unread count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(2);
    });

    it('51. should exclude read notifications from unread count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(2);
    });

    it('52. should exclude inactive notifications from unread count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(2);
    });

    it('53. should exclude foreign user notifications from unread count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${employeeTokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(1);
    });
  });

  // ========================================================
  // 8. MARK AS READ (5 tests)
  // ========================================================
  describe('8. Mark as Read', () => {
    let unreadNotif;

    beforeEach(async () => {
      unreadNotif = await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Unread',
        message: 'Msg',
        isRead: false
      });
    });

    it('54. own notification can be marked read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${unreadNotif._id}/read`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notification.isRead).toBe(true);
      expect(res.body.data.notification.readAt).toBeDefined();
    });

    it('55. readAt is server generated and accurate', async () => {
      const before = new Date();
      const res = await request(app)
        .patch(`/api/notifications/${unreadNotif._id}/read`)
        .set('Authorization', `Bearer ${employeeTokenA}`);
      const after = new Date();

      expect(res.status).toBe(200);
      const readAt = new Date(res.body.data.notification.readAt);
      expect(readAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
      expect(readAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
    });

    it('56. client cannot inject readAt timestamp', async () => {
      const fakeDate = new Date('2020-01-01');
      const res = await request(app)
        .patch(`/api/notifications/${unreadNotif._id}/read`)
        .send({ readAt: fakeDate })
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Client injection of 'readAt' is not allowed/);
    });

    it('57. repeated mark as read is idempotent', async () => {
      // First read
      await request(app)
        .patch(`/api/notifications/${unreadNotif._id}/read`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      // Second read
      const res = await request(app)
        .patch(`/api/notifications/${unreadNotif._id}/read`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notification.isRead).toBe(true);
    });

    it('58. foreign read attempt returns 404', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${unreadNotif._id}/read`)
        .set('Authorization', `Bearer ${employeeTokenB}`);

      expect(res.status).toBe(404);
    });
  });

  // ========================================================
  // 9. MARK ALL AS READ (4 tests)
  // ========================================================
  describe('9. Mark All as Read', () => {
    beforeEach(async () => {
      await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Unread 1',
        message: 'Msg',
        isRead: false
      });
      await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expired',
        title: 'Unread 2',
        message: 'Msg',
        isRead: false
      });
      await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_renewed',
        title: 'Already Read',
        message: 'Msg',
        isRead: true,
        readAt: new Date('2025-01-01')
      });
      await Notification.create({
        recipient: employeeUserB._id,
        type: 'certificate_expiring',
        title: 'User B Unread',
        message: 'Msg',
        isRead: false
      });
    });

    it('59. all own unread notifications are marked read', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.updatedCount).toBe(2);

      const unreadCountRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${employeeTokenA}`);
      expect(unreadCountRes.body.data.unreadCount).toBe(0);
    });

    it('60. already-read notifications retain original readAt timestamp', async () => {
      await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      const readNotif = await Notification.findOne({ title: 'Already Read' });
      expect(readNotif.readAt.toISOString()).toContain('2025-01-01');
    });

    it('61. foreign notifications remain untouched', async () => {
      await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      const userBNotif = await Notification.findOne({ recipient: employeeUserB._id });
      expect(userBNotif.isRead).toBe(false);
    });

    it('62. client cannot specify another recipient in mark-all-read', async () => {
      await request(app)
        .patch('/api/notifications/read-all')
        .send({ recipient: employeeUserB._id })
        .set('Authorization', `Bearer ${employeeTokenA}`);

      // User B unread must still be unread
      const userBNotif = await Notification.findOne({ recipient: employeeUserB._id });
      expect(userBNotif.isRead).toBe(false);
    });
  });

  // ========================================================
  // 10. SOFT DELETION (5 tests)
  // ========================================================
  describe('10. Soft Deletion', () => {
    let notifToDelete;

    beforeEach(async () => {
      notifToDelete = await Notification.create({
        recipient: employeeUserA._id,
        type: 'certificate_expiring',
        title: 'Delete Me',
        message: 'Msg',
        isRead: false
      });
    });

    it('63. own notification can be soft deleted', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${notifToDelete._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);
    });

    it('64. soft deleted notification is hidden from inbox', async () => {
      await request(app)
        .delete(`/api/notifications/${notifToDelete._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(listRes.body.data.notifications).toHaveLength(0);
    });

    it('65. soft deleted notification is excluded from unread count', async () => {
      await request(app)
        .delete(`/api/notifications/${notifToDelete._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(countRes.body.data.unreadCount).toBe(0);
    });

    it('66. foreign delete attempt returns 404', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${notifToDelete._id}`)
        .set('Authorization', `Bearer ${employeeTokenB}`);

      expect(res.status).toBe(404);
    });

    it('67. physical record is preserved in MongoDB with isActive=false', async () => {
      await request(app)
        .delete(`/api/notifications/${notifToDelete._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      const rawDoc = await Notification.findById(notifToDelete._id);
      expect(rawDoc).not.toBeNull();
      expect(rawDoc.isActive).toBe(false);
    });
  });

  // ========================================================
  // 11. CERTIFICATE EXPIRING NOTIFICATION (8 tests)
  // ========================================================
  describe('11. Certificate Expiring Notification', () => {
    it('68. generates certificate_expiring notification successfully', async () => {
      const notif = await notificationService.createCertificateExpiringNotification(certExpiringA);
      expect(notif).not.toBeNull();
      expect(notif.type).toBe('certificate_expiring');
    });

    it('69. routes notification to correct employee user', async () => {
      const notif = await notificationService.createCertificateExpiringNotification(certExpiringA);
      expect(notif.recipient.toString()).toBe(employeeUserA._id.toString());
    });

    it('70. links related certificate reference accurately', async () => {
      const notif = await notificationService.createCertificateExpiringNotification(certExpiringA);
      expect(notif.relatedCertificate.toString()).toBe(certExpiringA._id.toString());
    });

    it('71. links related course reference accurately', async () => {
      const notif = await notificationService.createCertificateExpiringNotification(certExpiringA);
      expect(notif.relatedCourse.toString()).toBe(certExpiringA.course.toString());
    });

    it('72. excludes revoked certificates from expiry notifications', async () => {
      const notif = await notificationService.createCertificateExpiringNotification(certRevokedA);
      expect(notif).toBeNull();
    });

    it('73. excludes already expired certificates from expiring notifications', async () => {
      const notif = await notificationService.createCertificateExpiringNotification(certExpiredA);
      expect(notif).toBeNull();
    });

    it('74. inactive employee profile is excluded from notification generation', async () => {
      const inactiveCert = await Certificate.create({
        employee: inactiveEmployeeProfile._id,
        course: courseA._id,
        enrollment: enrollmentA._id,
        certificateNumber: 'SKILLTRACK-P14-INACT',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 86400000),
        status: 'active'
      });

      const notif = await notificationService.createCertificateExpiringNotification(inactiveCert);
      expect(notif).toBeNull();
    });

    it('75. server controls title and message content', async () => {
      const notif = await notificationService.createCertificateExpiringNotification(certExpiringA);
      expect(notif.title).toBe('Certificate Expiring Soon');
      expect(notif.message).toContain(certExpiringA.certificateNumber);
      expect(notif.message).toContain('Phase 14 Advanced Architecture');
    });
  });

  // ========================================================
  // 12. CERTIFICATE EXPIRED NOTIFICATION (4 tests)
  // ========================================================
  describe('12. Certificate Expired Notification', () => {
    it('76. generates certificate_expired notification for past certificate', async () => {
      const notif = await notificationService.createCertificateExpiredNotification(certExpiredA);
      expect(notif).not.toBeNull();
      expect(notif.type).toBe('certificate_expired');
      expect(notif.title).toBe('Certificate Expired');
      expect(notif.message).toContain('has expired');
    });

    it('77. active unexpired certificate is excluded from expired notifications', async () => {
      const notif = await notificationService.createCertificateExpiredNotification(certActiveA);
      expect(notif).toBeNull();
    });

    it('78. revoked certificate is excluded from expired notifications', async () => {
      const notif = await notificationService.createCertificateExpiredNotification(certRevokedA);
      expect(notif).toBeNull();
    });

    it('79. expired notification routes to correct employee user', async () => {
      const notif = await notificationService.createCertificateExpiredNotification(certExpiredA);
      expect(notif.recipient.toString()).toBe(employeeUserB._id.toString());
    });
  });

  // ========================================================
  // 13. CERTIFICATE RENEWED NOTIFICATION (5 tests)
  // ========================================================
  describe('13. Certificate Renewed Notification', () => {
    let renewedCert;

    beforeEach(async () => {
      await Certificate.deleteMany({ certificateNumber: /^SKILLTRACK-P14-RNW/ });
      renewedCert = await Certificate.create({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: enrollmentA._id,
        certificateNumber: 'SKILLTRACK-P14-RNW-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 86400000),
        status: 'active',
        renewedFrom: new mongoose.Types.ObjectId()
      });
    });

    afterEach(async () => {
      await Certificate.deleteMany({ certificateNumber: /^SKILLTRACK-P14-RNW/ });
    });

    it('80. generates certificate_renewed notification successfully', async () => {
      const notif = await notificationService.createCertificateRenewedNotification(renewedCert);
      expect(notif).not.toBeNull();
      expect(notif.type).toBe('certificate_renewed');
      expect(notif.title).toBe('Certificate Renewed');
    });

    it('81. routes renewed notification to correct employee user', async () => {
      const notif = await notificationService.createCertificateRenewedNotification(renewedCert);
      expect(notif.recipient.toString()).toBe(employeeUserA._id.toString());
    });

    it('82. links new certificate reference correctly', async () => {
      const notif = await notificationService.createCertificateRenewedNotification(renewedCert);
      expect(notif.relatedCertificate.toString()).toBe(renewedCert._id.toString());
    });

    it('83. links related course reference correctly', async () => {
      const notif = await notificationService.createCertificateRenewedNotification(renewedCert);
      expect(notif.relatedCourse.toString()).toBe(courseA._id.toString());
    });

    it('84. renewal notification includes course title in message', async () => {
      const notif = await notificationService.createCertificateRenewedNotification(renewedCert);
      expect(notif.message).toContain('Phase 14 Security Mastery');
    });
  });

  // ========================================================
  // 14. IDEMPOTENCY & DUPLICATE PREVENTION (6 tests)
  // ========================================================
  describe('14. Idempotency & Duplicate Prevention', () => {
    it('85. prevents duplicate expiring notification for the same certificate', async () => {
      const notif1 = await notificationService.createCertificateExpiringNotification(certExpiringA);
      const notif2 = await notificationService.createCertificateExpiringNotification(certExpiringA);

      expect(notif1._id.toString()).toBe(notif2._id.toString());

      const count = await Notification.countDocuments({
        eventKey: `certificate-expiring:${certExpiringA._id}`
      });
      expect(count).toBe(1);
    });

    it('86. prevents duplicate expired notification for the same certificate', async () => {
      const notif1 = await notificationService.createCertificateExpiredNotification(certExpiredA);
      const notif2 = await notificationService.createCertificateExpiredNotification(certExpiredA);

      expect(notif1._id.toString()).toBe(notif2._id.toString());

      const count = await Notification.countDocuments({
        eventKey: `certificate-expired:${certExpiredA._id}`
      });
      expect(count).toBe(1);
    });

    it('87. prevents duplicate renewed notification for the same renewed certificate', async () => {
      const notif1 = await notificationService.createCertificateRenewedNotification(certActiveA);
      const notif2 = await notificationService.createCertificateRenewedNotification(certActiveA);

      expect(notif1._id.toString()).toBe(notif2._id.toString());

      const count = await Notification.countDocuments({
        eventKey: `certificate-renewed:${certActiveA._id}`
      });
      expect(count).toBe(1);
    });

    it('88. handles duplicate-key race condition safely without throwing', async () => {
      const eventKey = `test-race:${certActiveA._id}`;
      const [res1, res2] = await Promise.all([
        Notification.create({
          recipient: employeeUserA._id,
          type: 'certificate_expiring',
          title: 'Race 1',
          message: 'Msg',
          eventKey
        }),
        notificationService.createCertificateExpiringNotification(certExpiringA)
      ]);

      expect(res1).toBeDefined();
      expect(res2).toBeDefined();
    });

    it('89. uses deterministic eventKey prefix format', async () => {
      const notif = await notificationService.createCertificateExpiringNotification(certExpiringA);
      const raw = await Notification.findById(notif._id);
      expect(raw.eventKey).toBe(`certificate-expiring:${certExpiringA._id.toString()}`);
    });

    it('90. single certificate can have separate expiring and expired keys over lifecycle', async () => {
      // Event 1: Expiring
      const notifExpiring = await notificationService.createCertificateExpiringNotification(certExpiringA);
      expect(notifExpiring).not.toBeNull();

      // Simulate time passing: expiresAt is now past
      certExpiringA.expiresAt = new Date(Date.now() - 1000);
      await certExpiringA.save();

      // Event 2: Expired
      const notifExpired = await notificationService.createCertificateExpiredNotification(certExpiringA);
      expect(notifExpired).not.toBeNull();
      expect(notifExpiring._id.toString()).not.toBe(notifExpired._id.toString());

      // Reset certExpiringA
      certExpiringA.expiresAt = new Date(Date.now() + 15 * 86400000);
      await certExpiringA.save();
    });
  });

  // ========================================================
  // 15. EXPIRY SCANNING PROCESSOR (7 tests)
  // ========================================================
  describe('15. Expiry Scanning Processor', () => {
    it('91. finds and generates notifications for expiring certificates', async () => {
      const result = await notificationService.processCertificateExpiryNotifications();
      expect(result.expiringProcessed).toBeGreaterThanOrEqual(1);

      const notif = await Notification.findOne({
        eventKey: `certificate-expiring:${certExpiringA._id}`
      });
      expect(notif).not.toBeNull();
    });

    it('92. finds and generates notifications for expired certificates', async () => {
      const result = await notificationService.processCertificateExpiryNotifications();
      expect(result.expiredProcessed).toBeGreaterThanOrEqual(1);

      const notif = await Notification.findOne({
        eventKey: `certificate-expired:${certExpiredA._id}`
      });
      expect(notif).not.toBeNull();
    });

    it('93. ignores revoked certificates during batch scan', async () => {
      await notificationService.processCertificateExpiryNotifications();

      const revokedNotif = await Notification.findOne({
        relatedCertificate: certRevokedA._id
      });
      expect(revokedNotif).toBeNull();
    });

    it('94. does not treat fully active unexpired certificates as expired', async () => {
      await notificationService.processCertificateExpiryNotifications();

      const activeExpiredNotif = await Notification.findOne({
        eventKey: `certificate-expired:${certActiveA._id}`
      });
      expect(activeExpiredNotif).toBeNull();
    });

    it('95. repeated scanner invocations are idempotent and safe', async () => {
      const run1 = await notificationService.processCertificateExpiryNotifications();
      const count1 = await Notification.countDocuments({});

      const run2 = await notificationService.processCertificateExpiryNotifications();
      const count2 = await Notification.countDocuments({});

      expect(count1).toBe(count2);
    });

    it('96. processes multiple expiring/expired certificates correctly', async () => {
      // Create additional expiring cert for employee B
      const extraCert = await Certificate.create({
        employee: employeeProfileB._id,
        course: courseB._id,
        enrollment: enrollmentB._id,
        certificateNumber: 'SKILLTRACK-P14-EXTRA',
        issuedAt: new Date(Date.now() - 350 * 86400000),
        expiresAt: new Date(Date.now() + 5 * 86400000),
        status: 'active'
      });

      const result = await notificationService.processCertificateExpiryNotifications();
      expect(result.expiringProcessed).toBeGreaterThanOrEqual(2);
    });

    it('97. routes notifications to distinct employees during batch scan', async () => {
      await notificationService.processCertificateExpiryNotifications();

      const notifsA = await Notification.find({ recipient: employeeUserA._id });
      const notifsB = await Notification.find({ recipient: employeeUserB._id });

      expect(notifsA.length).toBeGreaterThan(0);
      expect(notifsB.length).toBeGreaterThan(0);
    });
  });

  // ========================================================
  // 16. MAINTENANCE ENDPOINT (4 tests)
  // ========================================================
  describe('16. Maintenance Endpoint', () => {
    it('98. admin can invoke process-expiries maintenance endpoint', async () => {
      const res = await request(app)
        .post('/api/notifications/process-expiries')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/processed successfully/i);
      expect(res.body.data.expiringProcessed).toBeDefined();
      expect(res.body.data.expiredProcessed).toBeDefined();
    });

    it('99. employee cannot invoke process-expiries (returns 403)', async () => {
      const res = await request(app)
        .post('/api/notifications/process-expiries')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(403);
    });

    it('100. trainer cannot invoke process-expiries (returns 403)', async () => {
      const res = await request(app)
        .post('/api/notifications/process-expiries')
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(403);
    });

    it('101. unauthenticated user cannot invoke process-expiries (returns 401)', async () => {
      const res = await request(app).post('/api/notifications/process-expiries');
      expect(res.status).toBe(401);
    });
  });

  // ========================================================
  // 17. DATA SECURITY & REGRESSION (5 tests)
  // ========================================================
  describe('17. Data Security & Regression', () => {
    it('102. notification response never leaks password, password hash, or secrets', async () => {
      await notificationService.createCertificateExpiringNotification(certExpiringA);

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      const jsonStr = JSON.stringify(res.body);
      expect(jsonStr).not.toContain('password');
      expect(jsonStr).not.toContain('Password123');
      expect(jsonStr).not.toContain('$2a$');
      expect(jsonStr).not.toContain('$2b$');
    });

    it('103. related certificate and course fields are sanitized and exclude internals', async () => {
      await notificationService.createCertificateExpiringNotification(certExpiringA);

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      const notif = res.body.data.notifications[0];
      if (notif.relatedCertificate) {
        expect(notif.relatedCertificate.certificateNumber).toBeDefined();
        expect(notif.relatedCertificate.revocationReason).toBeUndefined();
      }
      if (notif.relatedCourse) {
        expect(notif.relatedCourse.title).toBeDefined();
        expect(notif.relatedCourse.trainer).toBeUndefined();
      }
    });

    it('104. Phase 12 certificate verification endpoint remains fully operational', async () => {
      const res = await request(app).get(
        `/api/certificates/verify/${certActiveA.certificateNumber}`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.certificate.certificateNumber).toBe(certActiveA.certificateNumber);
      expect(res.body.data.certificate.lifecycleStatus).toBe('active');
    });

    it('105. Phase 13 renewal flow creates renewal notification automatically', async () => {
      // Clean previous notifications and any prior renewals of certExpiringA
      await Notification.deleteMany({});
      await Certificate.deleteMany({ renewedFrom: certExpiringA._id });

      // Renew certExpiringA via API
      const res = await request(app)
        .post(`/api/certificates/${certExpiringA._id}/renew`)
        .send({ reason: 'Annual license renewal' })
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(201);
      const newCertNumber = res.body.data.certificate.certificateNumber;

      // Verify certificate_renewed notification was generated automatically
      const notifRes = await request(app)
        .get('/api/notifications?type=certificate_renewed')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(notifRes.status).toBe(200);
      expect(notifRes.body.data.notifications.length).toBeGreaterThanOrEqual(1);
      expect(notifRes.body.data.notifications[0].title).toBe('Certificate Renewed');
    });

    it('106. renewed notification preserves source certificate immutability', async () => {
      const sourceCertAfter = await Certificate.findById(certExpiringA._id);
      expect(sourceCertAfter.status).toBe('active');
      expect(sourceCertAfter.certificateNumber).toBe('SKILLTRACK-P14-EXP01');
    });
  });
});
