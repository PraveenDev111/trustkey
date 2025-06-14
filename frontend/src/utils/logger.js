import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Log frontend events to the server
 * @param {string} type - Type of event (e.g., 'register_attempt', 'register_success', 'register_error')
 * @param {string} address - User's wallet address
 * @param {Object} metadata - Additional data to log
 */
export const logEvent = async (type, address, metadata = {}) => {
  try {
    const payload = {
      type,
      address: address?.toLowerCase(),
      timestamp: new Date().toISOString(),
      userAgent: window.navigator.userAgent,
      url: window.location.href,
      ...metadata
    };

    // Send to backend logging endpoint
    await axios.post(`${API_BASE_URL}/api/logs/frontend`, payload, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    // Fail silently in production, but log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to log event:', error);
    }
  }
};

/**
 * Track performance of async operations
 * @param {string} operation - Name of the operation being tracked
 * @param {Function} fn - Async function to execute and measure
 * @param {Object} metadata - Additional metadata to include in the log
 * @returns {Promise<{result: *, duration: number}>}
 */
export const withPerformanceLogging = async (operation, fn, metadata = {}) => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    // Log successful operation
    await logEvent('performance', null, {
      operation,
      status: 'success',
      duration,
      ...metadata
    });
    
    return { result, duration };
  } catch (error) {
    const duration = performance.now() - start;
    
    // Log failed operation
    await logEvent('performance', null, {
      operation,
      status: 'error',
      duration,
      error: error.message,
      ...metadata
    });
    
    throw error;
  }
};

export default {
  logEvent,
  withPerformanceLogging
};
