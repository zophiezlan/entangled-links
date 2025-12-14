/**
 * Utility functions for common operations
 */

import { KV_MAX_RETRIES, KV_RETRY_BASE_DELAY_MS, KV_RETRY_MAX_DELAY_MS } from '../config/constants.js';

/**
 * Create standardized JSON error response
 * @param {string} error - Error type
 * @param {string} message - Human-readable error message
 * @param {number} status - HTTP status code
 * @param {object} extra - Additional data to include in response
 * @returns {Response}
 */
export function createErrorResponse(error, message, status = 500, extra = {}) {
  return new Response(
    JSON.stringify({
      error,
      message,
      ...extra
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create standardized JSON success response
 * @param {object} data - Response data
 * @param {number} status - HTTP status code
 * @returns {Response}
 */
export function createSuccessResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a KV operation with exponential backoff
 * @param {Function} operation - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<any>} Result of the operation
 */
export async function retryKVOperation(operation, maxRetries = KV_MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break;
      }

      // Calculate delay with exponential backoff
      const baseDelay = KV_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      const jitter = Math.random() * KV_RETRY_BASE_DELAY_MS;
      const delay = Math.min(baseDelay + jitter, KV_RETRY_MAX_DELAY_MS);

      console.log(`KV operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Validate and parse expiration time
 * @param {string|number|undefined} expiresIn - Expiration time input
 * @param {number} defaultMs - Default expiration in milliseconds
 * @param {number} minMs - Minimum allowed expiration
 * @param {number} maxMs - Maximum allowed expiration
 * @returns {{expirationMs: number, error: null}|{expirationMs: null, error: string}}
 */
export function parseExpiration(expiresIn, defaultMs, minMs, maxMs) {
  if (expiresIn === undefined) {
    return { expirationMs: defaultMs, error: null };
  }

  let expirationMs;

  if (typeof expiresIn === 'number') {
    expirationMs = expiresIn;
  } else if (typeof expiresIn === 'string') {
    const match = expiresIn.match(/^(\d+)([mhdw])$/);
    if (!match) {
      return {
        expirationMs: null,
        error: 'Invalid expiration format. Use format like "30m", "2h", "7d", or "1w" (m=minutes, h=hours, d=days, w=weeks)'
      };
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      m: 60 * 1000,              // minutes
      h: 60 * 60 * 1000,         // hours
      d: 24 * 60 * 60 * 1000,    // days
      w: 7 * 24 * 60 * 60 * 1000 // weeks
    };

    expirationMs = value * multipliers[unit];
  } else {
    return {
      expirationMs: null,
      error: 'Expiration must be a number (milliseconds) or string (e.g., "7d")'
    };
  }

  // Validate bounds
  if (expirationMs < minMs) {
    return {
      expirationMs: null,
      error: `Expiration too short. Minimum is ${minMs / 1000 / 60} minutes`
    };
  }

  if (expirationMs > maxMs) {
    return {
      expirationMs: null,
      error: `Expiration too long. Maximum is ${maxMs / 1000 / 60 / 60 / 24} days`
    };
  }

  return { expirationMs, error: null };
}

/**
 * Format timestamp for display
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}
