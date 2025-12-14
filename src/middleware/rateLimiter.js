/**
 * Rate limiting middleware using Cloudflare KV
 * Implements token bucket algorithm for distributed rate limiting
 */

export class RateLimiter {
  constructor(env, options = {}) {
    this.env = env;
    this.maxRequests = options.maxRequests || 10;
    this.windowMs = options.windowMs || 60000; // 1 minute default
    this.keyPrefix = options.keyPrefix || 'ratelimit:';
  }

  /**
   * Get client identifier from request
   */
  getClientId(request) {
    // Try CF-Connecting-IP header first (Cloudflare)
    const ip = request.headers.get('CF-Connecting-IP') ||
               request.headers.get('X-Forwarded-For') ||
               request.headers.get('X-Real-IP') ||
               'unknown';
    return ip.split(',')[0].trim();
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(request) {
    const clientId = this.getClientId(request);
    const key = `${this.keyPrefix}${clientId}`;
    const now = Date.now();

    // Get current rate limit data
    const dataJson = await this.env.LINKS.get(key);
    let data = dataJson ? JSON.parse(dataJson) : { count: 0, resetAt: now + this.windowMs };

    // Reset window if expired
    if (now > data.resetAt) {
      data = { count: 0, resetAt: now + this.windowMs };
    }

    // Check if limit exceeded
    if (data.count >= this.maxRequests) {
      const retryAfter = Math.ceil((data.resetAt - now) / 1000);
      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetAt: data.resetAt,
        retryAfter
      };
    }

    // Increment counter
    data.count++;

    // Store updated data with TTL
    await this.env.LINKS.put(
      key,
      JSON.stringify(data),
      { expirationTtl: Math.ceil(this.windowMs / 1000) + 10 }
    );

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - data.count,
      resetAt: data.resetAt
    };
  }

  /**
   * Create rate limit response headers
   */
  getRateLimitHeaders(result) {
    return {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
      ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() })
    };
  }

  /**
   * Middleware function
   */
  async handle(request, next) {
    const result = await this.checkLimit(request);
    const headers = this.getRateLimitHeaders(result);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        }
      );
    }

    // Continue to next handler
    const response = await next();

    // Add rate limit headers to successful response
    const newResponse = new Response(response.body, response);
    Object.entries(headers).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  }
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(env, options) {
  const limiter = new RateLimiter(env, options);
  return (request, next) => limiter.handle(request, next);
}
