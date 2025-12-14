/**
 * Entangled Links - Main Worker Entry Point
 *
 * Routes:
 * - GET  /                       -> Landing page
 * - GET  /health                 -> Health check
 * - POST /generate               -> Create entangled pair
 * - GET  /:shortcode             -> Resolve and redirect
 * - GET  /:shortcode/status      -> View entanglement state
 * - GET  /:shortcode/analytics   -> View link analytics
 */

import { Router } from './lib/router.js';
import { generatePair } from './routes/generate.js';
import { resolveLink } from './routes/resolve.js';
import { viewStatus } from './routes/status.js';
import { viewAnalytics } from './routes/analytics.js';
import { healthCheck } from './routes/health.js';
import { landingPage } from './ui/landing.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { createSecurityMiddleware, handleCORSPreflight } from './middleware/security.js';
import { createErrorResponse } from './lib/utils.js';
import {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  MAX_REQUEST_SIZE_BYTES,
  DEFAULT_CORS_ORIGINS,
  DEFAULT_CORS_METHODS,
  DEFAULT_CORS_HEADERS,
  KV_PREFIX_RATELIMIT
} from './config/constants.js';

export default {
  async fetch(request, env, ctx) {
    try {
      // Handle CORS preflight
      const preflightResponse = handleCORSPreflight(request);
      if (preflightResponse) {
        return preflightResponse;
      }

      // Create middleware
      const rateLimiter = createRateLimiter(env, {
        maxRequests: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        keyPrefix: KV_PREFIX_RATELIMIT
      });

      const securityMiddleware = createSecurityMiddleware({
        maxRequestSize: MAX_REQUEST_SIZE_BYTES,
        allowedOrigins: DEFAULT_CORS_ORIGINS,
        allowedMethods: DEFAULT_CORS_METHODS,
        allowedHeaders: DEFAULT_CORS_HEADERS
      });

      // Create router
      const router = new Router();

      // Landing page (no rate limiting)
      router.get('/', () => landingPage());

      // Health check (no rate limiting)
      router.get('/health', (req) => healthCheck(req, env));

      // Generate entangled pair (with rate limiting)
      router.post('/generate', async (req) => {
        return await rateLimiter(req, () => generatePair(req, env));
      });

      // View status (no rate limiting for better UX)
      router.get('/:shortcode/status', (req, params) =>
        viewStatus(params.shortcode, env)
      );

      // View analytics (no rate limiting for better UX)
      router.get('/:shortcode/analytics', (req, params) =>
        viewAnalytics(params.shortcode, env)
      );

      // Resolve link (must be last - catch-all, no rate limiting)
      router.get('/:shortcode', (req, params) =>
        resolveLink(params.shortcode, env, ctx)
      );

      // Handle request through router
      const response = await router.handle(request);

      // Apply security middleware to all responses
      return await securityMiddleware(request, () => Promise.resolve(response));

    } catch (error) {
      console.error('Worker error:', error);

      // Apply security headers even to error responses
      const errorResponse = createErrorResponse(
        'Internal Server Error',
        'An unexpected error occurred',
        500
      );

      const securityMiddleware = createSecurityMiddleware();
      return await securityMiddleware(request, () => Promise.resolve(errorResponse));
    }
  }
};
