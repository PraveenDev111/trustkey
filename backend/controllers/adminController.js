const fs = require('fs');
const path = require('path');
const { logAuthAttempt } = require('../utils/logger');

// Use absolute path for logs directory
const LOGS_DIR = path.resolve(__dirname, '..', 'logs');

// Log the current paths for debugging
console.log('Server paths:', {
  cwd: process.cwd(),
  __dirname: __dirname,
  logsDir: LOGS_DIR,
  logsDirExists: fs.existsSync(LOGS_DIR)
});

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
    console.log(`Created logs directory at: ${LOGS_DIR}`);
  } catch (err) {
    console.error('Error creating logs directory:', err);
  }
}

// Get all available log files
getLogFiles = async (req, res) => {
  console.log('Getting log files from:', LOGS_DIR);
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      console.error(`Logs directory not found at: ${LOGS_DIR}`);
      return res.status(500).json({ 
        success: false, 
        error: 'Logs directory not found',
        path: LOGS_DIR
      });
    }
    
    const files = fs.readdirSync(LOGS_DIR)
      .filter(file => file.endsWith('.log') || file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(LOGS_DIR, file);
        try {
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            modified: stats.mtime
          };
        } catch (err) {
          console.error(`Error reading file stats for ${file}:`, err);
          return null;
        }
      })
      .filter(file => file !== null); // Remove any files that had errors
    
    res.json({ success: true, files });
  } catch (error) {
    console.error('Error getting log files:', error);
    res.status(500).json({ success: false, error: 'Failed to get log files' });
  }
};

// Get log file content
getLogFileContent = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Basic security check for filename
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, error: 'Invalid filename' });
    }
    
    const filePath = path.join(LOGS_DIR, filename);
    
    // Security check to prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(LOGS_DIR))) {
      return res.status(400).json({ success: false, error: 'Invalid file path' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Log file not found' });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Parse JSON lines if it's a JSON log file
    const isJsonLog = filename.endsWith('.log') || filename.endsWith('.json');
    let parsedLines = content;
    
    if (isJsonLog) {
      parsedLines = lines
        .filter(line => line.trim() !== '')
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return line; // Return as is if not valid JSON
          }
        });
    }
    
    res.json({ 
      success: true, 
      content: parsedLines,
      isJson: isJsonLog,
      filename
    });
  } catch (error) {
    console.error('Error reading log file:', error);
    res.status(500).json({ success: false, error: 'Failed to read log file' });
  }
};

// Get system stats
getSystemStats = async (req, res) => {
  try {
    const stats = {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV || 'development'
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get system stats' });
  }
};

module.exports = {
  getLogFiles,
  getLogFileContent,
  getSystemStats
};
