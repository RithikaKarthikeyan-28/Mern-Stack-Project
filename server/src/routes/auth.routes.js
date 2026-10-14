const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public authentication routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// Authenticated user route
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
