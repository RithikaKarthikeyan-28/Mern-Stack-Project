const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

/**
 * Endpoint restricted exclusively to 'admin' role.
 */
router.get(
  '/admin',
  authMiddleware,
  authorizeRoles('admin'),
  (req, res) => {
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Admin access granted',
      data: {
        user: req.user,
        role: req.user.role
      }
    });
  }
);

/**
 * Endpoint restricted exclusively to 'trainer' role.
 */
router.get(
  '/trainer',
  authMiddleware,
  authorizeRoles('trainer'),
  (req, res) => {
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Trainer access granted',
      data: {
        user: req.user,
        role: req.user.role
      }
    });
  }
);

/**
 * Endpoint restricted exclusively to 'employee' role.
 */
router.get(
  '/employee',
  authMiddleware,
  authorizeRoles('employee'),
  (req, res) => {
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Employee access granted',
      data: {
        user: req.user,
        role: req.user.role
      }
    });
  }
);

/**
 * Endpoint accessible by both 'admin' and 'trainer' roles.
 */
router.get(
  '/admin-trainer',
  authMiddleware,
  authorizeRoles('admin', 'trainer'),
  (req, res) => {
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Admin and Trainer access granted',
      data: {
        user: req.user,
        role: req.user.role
      }
    });
  }
);

module.exports = router;
