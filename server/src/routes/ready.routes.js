const express = require('express');
const { getReadinessStatus } = require('../controllers/ready.controller');

const router = express.Router();

// GET /api/ready
router.get('/', getReadinessStatus);

module.exports = router;
