/**
 * Entangled Links - Main Worker Entry Point
 *
 * Routes:
 * - GET  /                       -> Landing page
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
import { landingPage } from './ui/landing.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { createSecurityMiddleware, handleCORSPreflight } from './middleware/security.js';

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
        maxRequests: 20,
        windowMs: 60000, // 1 minute
        keyPrefix: 'ratelimit:'
      });

      const securityMiddleware = createSecurityMiddleware({
        maxRequestSize: 10240, // 10KB
        allowedOrigins: ['*'], // Adjust for production
        allowedMethods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      });

      // Create router
      const router = new Router();

      // Landing page (no rate limiting)
      router.get('/', () => landingPage());

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
      const errorResponse = new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const securityMiddleware = createSecurityMiddleware();
      return await securityMiddleware(request, () => Promise.resolve(errorResponse));
    }
  }
};
