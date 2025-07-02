const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { logAction } = require('../utils/logger');

// Log directory path
const LOG_DIR = path.join(__dirname, '../logs');
const REGISTRATION_LOG_FILE = path.join(LOG_DIR, 'registrations.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Log registration
router.post('/log-registration', async (req, res) => {
  try {
    const { email, username, address, timestamp } = req.body;
    
    if (!email || !username || !address) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const logEntry = {
      timestamp: timestamp || new Date().toISOString(),
      email,
      username,
      address: address.toLowerCase(), // Normalize address
      ip: req.ip
    };

    // Log to file
    fs.appendFileSync(REGISTRATION_LOG_FILE, JSON.stringify(logEntry) + '\n');
    
    // Also log using the existing logger
    logAction('user_registered', null, {
      email,
      username,
      address: address.toLowerCase()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging registration:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to log registration',
      error: error.message 
    });
  }
});

module.exports = router;
