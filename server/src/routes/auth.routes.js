const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public authentication routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/departments', authController.getPublicDepartments);
router.get('/job-roles', authController.getPublicJobRoles);

// Authenticated user route
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
