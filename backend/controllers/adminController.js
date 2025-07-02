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

// --- Aggregated Log Stats ---

// Helper: parse log file lines (filtering out summary blocks for performance.log)
function parseLogLines(filePath, filterFn = null) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  let jsonLines = [];
  for (const line of lines) {
    // Skip summary blocks (Performance Metrics:)
    if (line.startsWith('[') && line.includes('Performance Metrics:')) continue;
    if (line.startsWith('  ')) continue;
    try {
      const obj = JSON.parse(line);
      if (!filterFn || filterFn(obj)) jsonLines.push(obj);
    } catch (e) {
      // Not JSON, skip
    }
  }
  return jsonLines;
}

// GET /admin/logstats/performance
const getPerformanceLogStats = async (req, res) => {
  try {
    const perfLogPath = path.join(LOGS_DIR, 'performance.log');
    const logs = parseLogLines(perfLogPath);
    const operations = {};
    const errorsByType = {};
    const timeline = {};

    logs.forEach(entry => {
      if (!entry.operation) return;
      // Aggregate by operation
      if (!operations[entry.operation]) {
        operations[entry.operation] = { count: 0, totalDuration: 0, errors: 0, failures: 0, successes: 0 };
      }
      operations[entry.operation].count++;
      operations[entry.operation].totalDuration += Number(entry.durationMs || 0);
      if (entry.status === 'error') {
        operations[entry.operation].errors++;
        if (entry.error) {
          errorsByType[entry.error] = (errorsByType[entry.error] || 0) + 1;
        }
      } else if (entry.status === 'failure') {
        operations[entry.operation].failures++;
        if (entry.metadata && entry.metadata.reason) {
          errorsByType[entry.metadata.reason] = (errorsByType[entry.metadata.reason] || 0) + 1;
        }
      } else if (entry.status === 'success') {
        operations[entry.operation].successes++;
      }
      // Timeline (per minute)
      if (entry.timestamp) {
        const minute = entry.timestamp.slice(0, 16); // 'YYYY-MM-DD HH:MM'
        if (!timeline[minute]) timeline[minute] = 0;
        timeline[minute]++;
      }
    });
    // Prepare response
    const opStats = {};
    Object.entries(operations).forEach(([op, data]) => {
      opStats[op] = {
        count: data.count,
        avgDuration: data.count ? (data.totalDuration / data.count) : 0,
        errors: data.errors,
        failures: data.failures,
        successes: data.successes
      };
    });
    const timelineArr = Object.entries(timeline).map(([minute, requests]) => ({ minute, requests })).sort((a, b) => a.minute.localeCompare(b.minute));
    res.json({
      success: true,
      operations: opStats,
      errorsByType,
      timeline: timelineArr
    });
  } catch (error) {
    console.error('Error aggregating performance log stats:', error);
    res.status(500).json({ success: false, error: 'Failed to aggregate performance log stats' });
  }
};

// GET /admin/logstats/auth
const getAuthLogStats = async (req, res) => {
  try {
    const authLogPath = path.join(LOGS_DIR, 'auth.log');
    const logs = parseLogLines(authLogPath);
    const loginAttempts = [];
    const outcomes = { success: 0, failure: 0, locked: 0, error: 0 };
    const reasons = {};
    const timeline = {};
    logs.forEach(entry => {
      if (entry.type === 'login') {
        loginAttempts.push({ timestamp: entry.timestamp, status: entry.status });
        if (entry.status === 'success') outcomes.success++;
        else if (entry.status === 'failure') outcomes.failure++;
        else if (entry.status === 'locked') outcomes.locked++;
        else if (entry.status === 'error') outcomes.error++;
        if (entry.metadata && entry.metadata.reason) {
          reasons[entry.metadata.reason] = (reasons[entry.metadata.reason] || 0) + 1;
        }
        // Timeline (per minute, by status)
        if (entry.timestamp) {
          const minute = entry.timestamp.slice(0, 16);
          if (!timeline[minute]) timeline[minute] = { success: 0, failure: 0, locked: 0, error: 0 };
          timeline[minute][entry.status] = (timeline[minute][entry.status] || 0) + 1;
        }
      }
    });
    const timelineArr = Object.entries(timeline).map(([minute, v]) => ({ minute, ...v })).sort((a, b) => a.minute.localeCompare(b.minute));
    res.json({
      success: true,
      loginAttempts,
      outcomes,
      reasons,
      timeline: timelineArr
    });
  } catch (error) {
    console.error('Error aggregating auth log stats:', error);
    res.status(500).json({ success: false, error: 'Failed to aggregate auth log stats' });
  }
};

module.exports = {
  getLogFiles,
  getLogFileContent,
  getSystemStats,
  getPerformanceLogStats,
  getAuthLogStats
};
