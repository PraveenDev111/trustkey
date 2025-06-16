const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const { 
  getLogFiles, 
  getLogFileContent, 
  getSystemStats 
} = require('../controllers/adminController');

// Apply auth and admin middleware to all routes
router.use(auth);
router.use(isAdmin);

// Admin routes
router.get('/logs', getLogFiles);
router.get('/logs/:filename', getLogFileContent);
router.get('/stats', getSystemStats);

module.exports = router;
