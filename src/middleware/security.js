/**
 * Security middleware for headers and validation
 */

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response, options = {}) {
  const headers = new Headers(response.headers);

  // Content Security Policy
  const csp = options.csp || [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // unsafe-inline needed for embedded scripts
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  headers.set('Content-Security-Policy', csp);

  // Security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HTTPS enforcement (HSTS)
  if (options.hsts !== false) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * CORS middleware
 */
export function applyCORS(response, options = {}) {
  const headers = new Headers(response.headers);

  const allowedOrigins = options.allowedOrigins || ['*'];
  const allowedMethods = options.allowedMethods || ['GET', 'POST', 'OPTIONS'];
  const allowedHeaders = options.allowedHeaders || ['Content-Type'];

  if (allowedOrigins.includes('*')) {
    headers.set('Access-Control-Allow-Origin', '*');
  } else {
    // In production, check request origin against allowed list
    headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '));
  headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Handle CORS preflight requests
 */
export function handleCORSPreflight(request, options = {}) {
  if (request.method !== 'OPTIONS') {
    return null;
  }

  const allowedMethods = options.allowedMethods || ['GET', 'POST', 'OPTIONS'];
  const allowedHeaders = options.allowedHeaders || ['Content-Type'];

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': allowedMethods.join(', '),
      'Access-Control-Allow-Headers': allowedHeaders.join(', '),
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Validate request body size
 */
export async function validateRequestSize(request, maxSize = 1024 * 10) { // 10KB default
  const contentLength = request.headers.get('Content-Length');

  if (contentLength && parseInt(contentLength) > maxSize) {
    return new Response(
      JSON.stringify({ error: 'Request body too large' }),
      {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return null;
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(url) {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }

    // Block localhost and private IPs in production
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
        throw new Error('Private/local URLs not allowed');
      }
    }

    return parsed.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }
}

/**
 * Validate shortcode format
 */
export function validateShortcode(shortcode) {
  // Must be alphanumeric, 6-12 characters
  const pattern = /^[a-zA-Z0-9]{6,12}$/;

  if (!pattern.test(shortcode)) {
    throw new Error('Invalid shortcode format');
  }

  return shortcode;
}

/**
 * Security middleware wrapper
 */
export function createSecurityMiddleware(options = {}) {
  return async (request, next) => {
    // Handle CORS preflight
    const preflightResponse = handleCORSPreflight(request, options);
    if (preflightResponse) {
      return preflightResponse;
    }

    // Validate request size for POST requests
    if (request.method === 'POST') {
      const sizeError = await validateRequestSize(request, options.maxRequestSize);
      if (sizeError) {
        return sizeError;
      }
    }

    // Continue to next handler
    let response = await next();

    // Apply security headers
    response = applySecurityHeaders(response, options);

    // Apply CORS headers
    response = applyCORS(response, options);

    return response;
  };
}
