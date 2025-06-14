const express = require('express');
const router = express.Router();
const { logFrontendEvent, getFrontendLogs } = require('../controllers/logsController');
const authMiddleware = require('../middleware/auth');

// Public endpoint for logging frontend events
router.post('/frontend', logFrontendEvent);

// Protected endpoint to retrieve logs (admin only)
router.get('/frontend', authMiddleware, getFrontendLogs);

module.exports = router;
