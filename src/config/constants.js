/**
 * Application-wide constants
 * Centralizes all magic numbers and configuration values
 */

// Shortcode generation
export const SHORTCODE_LENGTH = 8;
export const SHORTCODE_MIN_LENGTH = 3;
export const SHORTCODE_MAX_LENGTH = 20;
export const SHORTCODE_PATTERN = /^[a-zA-Z0-9]{3,20}$/;

// Rate limiting
export const RATE_LIMIT_MAX_REQUESTS = 20;
export const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

// Request limits
export const MAX_REQUEST_SIZE_BYTES = 10240; // 10KB
export const MAX_URL_LENGTH = 2048;

// Expiration times
export const DEFAULT_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const MIN_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Time multipliers for expiration parsing
export const TIME_MULTIPLIERS = {
  m: 60 * 1000,              // minutes
  h: 60 * 60 * 1000,         // hours
  d: 24 * 60 * 60 * 1000,    // days
  w: 7 * 24 * 60 * 60 * 1000 // weeks
};

// Reserved shortcodes
export const RESERVED_SHORTCODES = [
  'generate',
  'status',
  'analytics',
  'api',
  'admin',
  'health',
  'ping',
  'metrics'
];

// KV key prefixes
export const KV_PREFIX_PAIR = 'pair:';
export const KV_PREFIX_LINK = 'link:';
export const KV_PREFIX_RATELIMIT = 'ratelimit:';

// QR Code settings
export const QR_CODE_SIZE = 200;
export const QR_CODE_CORRECTION_LEVEL = 'H';

// Cache settings
export const CACHE_TTL_LANDING_PAGE = 300; // 5 minutes
export const CACHE_TTL_STATUS_PAGE = 5; // 5 seconds
export const CACHE_TTL_STATIC = 3600; // 1 hour

// Status page refresh interval
export const STATUS_PAGE_REFRESH_MS = 5000; // 5 seconds

// CORS settings
export const DEFAULT_CORS_ORIGINS = ['*']; // Should be configured per environment
export const DEFAULT_CORS_METHODS = ['GET', 'POST', 'OPTIONS'];
export const DEFAULT_CORS_HEADERS = ['Content-Type', 'Authorization'];
export const CORS_MAX_AGE = 86400; // 24 hours

// Security
export const HSTS_MAX_AGE = 31536000; // 1 year

// Retry settings
export const KV_MAX_RETRIES = 3;
export const KV_RETRY_BASE_DELAY_MS = 100;
export const KV_RETRY_MAX_DELAY_MS = 5000;
