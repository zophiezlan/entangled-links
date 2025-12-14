/**
 * Health check endpoint
 * GET /health
 */

import { createSuccessResponse } from '../lib/utils.js';

/**
 * Health check handler
 * Returns service status and basic metrics
 * @param {Request} request - HTTP request
 * @param {object} env - Environment bindings
 * @returns {Response}
 */
export async function healthCheck(request, env) {
  const startTime = Date.now();

  // Check KV connectivity
  let kvHealthy = false;
  let kvLatency = null;

  try {
    const kvStart = Date.now();
    // Simple KV health check - try to get a non-existent key
    await env.LINKS.get('health:check');
    kvLatency = Date.now() - kvStart;
    kvHealthy = true;
  } catch (error) {
    console.error('KV health check failed:', error);
    kvHealthy = false;
  }

  const totalLatency = Date.now() - startTime;

  return createSuccessResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process?.uptime ? Math.floor(process.uptime()) : null,
    service: 'entangled-links',
    version: '0.1.0',
    checks: {
      kv: {
        status: kvHealthy ? 'healthy' : 'unhealthy',
        latency: kvLatency
      }
    },
    latency: {
      total: totalLatency,
      kv: kvLatency
    }
  });
}
