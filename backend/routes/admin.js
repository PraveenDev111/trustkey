const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { authorizeRole } = require('../middleware/auth');
const { 
  getLogFiles, 
  getLogFileContent, 
  getSystemStats 
} = require('../controllers/adminController');

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(authorizeRole('admin'));

// Admin routes
router.get('/logs', getLogFiles);
router.get('/logs/:filename', getLogFileContent);
router.get('/stats', getSystemStats);

module.exports = router;
