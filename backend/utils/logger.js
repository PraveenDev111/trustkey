const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

const logFilePath = path.join(__dirname, '../logs/auth.log');
const perfLogPath = path.join(__dirname, '../logs/performance.log');
const actionsLogPath = path.join(__dirname, '../logs/actions.log');


// Performance metrics store
const perfMetrics = {
  nonceGeneration: { count: 0, totalTime: 0 },
  signatureVerification: { count: 0, totalTime: 0 },
  jwtIssuance: { count: 0, totalTime: 0 },
  blockchainCalls: { count: 0, totalTime: 0 }
};

// Log performance metrics periodically (every 5 minutes)
setInterval(() => {
  try {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    let logEntry = `[${timestamp}] Performance Metrics:\n`;
    
    Object.entries(perfMetrics).forEach(([metric, data]) => {
      if (data.count > 0) {
        const avgTime = data.totalTime / data.count;
        logEntry += `  ${metric}: ${data.count} calls, avg ${avgTime.toFixed(2)}ms\n`;
        // Reset counters
        data.count = 0;
        data.totalTime = 0;
      }
    });
    
    if (logEntry.includes('calls')) {
      ensureLogsDirectory();
      fs.appendFileSync(perfLogPath, logEntry + '\n', 'utf8');
    }
  } catch (error) {
    console.error('Failed to write performance log:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

function ensureLogsDirectory() {
    const logsDir = path.dirname(logFilePath);
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
}

function logAuthAttempt({ type, address, status, ip, metadata = {} }) {
    try {
        ensureLogsDirectory();
        
        const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
        const logEntry = {
            timestamp,
            type,        // 'login', 'register', etc.
            address: address?.toLowerCase(),
            status,      // 'success', 'failure', 'error'
            ip,
            ...metadata  // Additional context like error messages
        };
        
        const logLine = JSON.stringify(logEntry) + '\n';
        
        fs.appendFileSync(logFilePath, logLine, 'utf8');
        
        // Also log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${timestamp}] ${type.toUpperCase()} ${status}: ${address} from ${ip}`);
        }
    } catch (error) {
        console.error('Failed to write to auth log:', error);
    }
}

/**
 * Log performance metrics for API and blockchain operations
 * @param {string} operation - Operation name (e.g., 'nonceGeneration', 'blockchainCall')
 * @param {number} startTime - Performance timestamp when operation started
 * @param {Object} [metadata] - Additional metadata to include in the log
 */
function logPerformance(operation, startTime, metadata = {}) {
    try {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1e6; // Convert nanoseconds to milliseconds
        
        // Update metrics
        if (perfMetrics[operation]) {
            perfMetrics[operation].count++;
            perfMetrics[operation].totalTime += durationMs;
        } else {
            perfMetrics[operation] = { count: 1, totalTime: durationMs };
        }
        
        // Log detailed performance data
        const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
        const perfEntry = {
            timestamp,
            operation,
            durationMs: parseFloat(durationMs.toFixed(2)),
            ...metadata
        };
        
        ensureLogsDirectory();
        fs.appendFileSync(perfLogPath, JSON.stringify(perfEntry) + '\n', 'utf8');
        
        return durationMs;
    } catch (error) {
        console.error('Failed to write performance log:', error);
        return -1;
    }
}

/**
 * Creates a performance tracker for async operations
 * @param {string} operation - Operation name to track
 * @returns {Function} - A function to call when the operation is complete
 */
function trackPerformance(operation) {
    const start = process.hrtime.bigint();
    return (metadata = {}) => logPerformance(operation, start, metadata);
}

// Log rotation (optional)
function setupLogRotation() {
    // Implement log rotation if needed
    // e.g., compress old logs, limit log file size, etc.
}
/**
* Logs a specific action with details
* @param {string} action - The action being performed (e.g., 'certificate_revoked')
* @param {string} address - The Ethereum address of the user performing the action
* @param {Object} metadata - Additional context about the action
* @returns {boolean} - True if logging was successful
*/
function logAction(action, address, metadata = {}) {
   try {
       const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
       const logEntry = {
           timestamp,
           action,
           address: address?.toLowerCase(),
           ...metadata
       };
       
       ensureLogsDirectory();
       fs.appendFileSync(actionsLogPath, JSON.stringify(logEntry) + '\n', 'utf8');
       return true;
   } catch (error) {
       console.error('Failed to write action log:', error);
       return false;
   }
}


module.exports = {
    logAuthAttempt,
    logPerformance,
    trackPerformance,
    setupLogRotation,
    logAction
};
