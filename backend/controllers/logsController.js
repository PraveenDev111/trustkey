const { logAuthAttempt } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

const frontendLogsPath = path.join(__dirname, '../logs/frontend.log');

// Ensure logs directory exists
const ensureLogsDirectory = () => {
  const logsDir = path.dirname(frontendLogsPath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
};

/**
 * Log frontend events
 */
exports.logFrontendEvent = async (req, res) => {
  try {
    const { type, address, ...metadata } = req.body;
    
    // Basic validation
    if (!type) {
      return res.status(400).json({ success: false, error: 'Event type is required' });
    }

    ensureLogsDirectory();
    
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const logEntry = {
      timestamp,
      type,
      address: address?.toLowerCase(),
      ip: req.ip,
      ...metadata
    };

    // Write to log file
    fs.appendFileSync(
      frontendLogsPath, 
      JSON.stringify(logEntry) + '\n',
      'utf8'
    );

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${timestamp}] Frontend ${type}:`, address || 'no-address', metadata);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging frontend event:', error);
    res.status(500).json({ success: false, error: 'Failed to log event' });
  }
};

/**
 * Get frontend logs (protected, for admin use)
 */
exports.getFrontendLogs = async (req, res) => {
  try {
    if (!fs.existsSync(frontendLogsPath)) {
      return res.json({ success: true, logs: [] });
    }

    const logData = fs.readFileSync(frontendLogsPath, 'utf8');
    const logs = logData
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error reading frontend logs:', error);
    res.status(500).json({ success: false, error: 'Failed to read logs' });
  }
};
