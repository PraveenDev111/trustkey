const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { authorizeRole } = require('../middleware/auth');
const { 
  getLogFiles, 
  getLogFileContent, 
  getSystemStats,
  getPerformanceLogStats,
  getAuthLogStats
} = require('../controllers/adminController');

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(authorizeRole('admin'));

// Admin routes
router.get('/logs', getLogFiles);
router.get('/logs/:filename', getLogFileContent);
router.get('/stats', getSystemStats);

// --- Log Stats Aggregation Endpoints ---
router.get('/logstats/performance', getPerformanceLogStats);
router.get('/logstats/auth', getAuthLogStats);

module.exports = router;
