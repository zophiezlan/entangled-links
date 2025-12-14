/**
 * Validation utilities
 */

import {
  SHORTCODE_PATTERN,
  SHORTCODE_MIN_LENGTH,
  SHORTCODE_MAX_LENGTH,
  RESERVED_SHORTCODES
} from '../config/constants.js';

/**
 * Validate shortcode format
 * @param {string} shortcode - Shortcode to validate
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateShortcode(shortcode) {
  if (!shortcode) {
    return { valid: false, error: 'Shortcode is required' };
  }

  if (typeof shortcode !== 'string') {
    return { valid: false, error: 'Shortcode must be a string' };
  }

  // Check length
  if (shortcode.length < SHORTCODE_MIN_LENGTH || shortcode.length > SHORTCODE_MAX_LENGTH) {
    return {
      valid: false,
      error: `Shortcode must be ${SHORTCODE_MIN_LENGTH}-${SHORTCODE_MAX_LENGTH} characters`
    };
  }

  // Check pattern (alphanumeric)
  if (!SHORTCODE_PATTERN.test(shortcode)) {
    return {
      valid: false,
      error: `Shortcode must be ${SHORTCODE_MIN_LENGTH}-${SHORTCODE_MAX_LENGTH} alphanumeric characters`
    };
  }

  // Check reserved words
  if (RESERVED_SHORTCODES.includes(shortcode.toLowerCase())) {
    return { valid: false, error: 'This shortcode is reserved' };
  }

  return { valid: true, error: null };
}

/**
 * Sanitize URL input
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 * @throws {Error} If URL is invalid
 */
export function sanitizeUrl(url) {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP and HTTPS protocols are allowed');
    }

    // Block localhost and private IPs
    const hostname = parsed.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];

    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        throw new Error('Private/local URLs are not allowed');
      }
    }

    return parsed.toString();
  } catch (error) {
    if (error.message.includes('Private/local') || error.message.includes('protocol')) {
      throw error;
    }
    throw new Error(`Invalid URL: ${error.message}`);
  }
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @param {number} maxLength - Maximum URL length
 * @returns {{valid: boolean, error: string|null, sanitized: string|null}}
 */
export function validateUrl(url, maxLength = 2048) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required and must be a string', sanitized: null };
  }

  if (url.length > maxLength) {
    return { valid: false, error: `URL must be less than ${maxLength} characters`, sanitized: null };
  }

  try {
    const sanitized = sanitizeUrl(url);
    return { valid: true, error: null, sanitized };
  } catch (error) {
    return { valid: false, error: error.message, sanitized: null };
  }
}
