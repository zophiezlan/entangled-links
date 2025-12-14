/**
 * Generate entangled link pair
 * POST /generate
 * Body: { url: "https://example.com" }
 */

import { generateShortcode, generateMasterKey, splitKey, encryptUrl } from '../crypto/entanglement.js';
import { createEntangledPair, storePair } from '../lib/state.js';
import { sanitizeUrl } from '../middleware/security.js';

export async function generatePair(request, env) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { url, expiresIn, customShortcodeA, customShortcodeB } = body;

    // Validate URL exists
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Missing or invalid URL',
          message: 'Request body must contain a valid "url" field'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate URL length
    if (url.length > 2048) {
      return new Response(
        JSON.stringify({
          error: 'URL too long',
          message: 'URL must be less than 2048 characters'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Sanitize and validate URL
    let sanitizedUrl;
    try {
      sanitizedUrl = sanitizeUrl(url);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Invalid URL',
          message: error.message
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate and parse expiration time
    let expirationMs = 7 * 24 * 60 * 60 * 1000; // Default: 7 days
    if (expiresIn !== undefined) {
      // expiresIn can be:
      // - A number in milliseconds
      // - A string like "1h", "2d", "30m", "1w"

      if (typeof expiresIn === 'number') {
        expirationMs = expiresIn;
      } else if (typeof expiresIn === 'string') {
        const match = expiresIn.match(/^(\d+)([mhdw])$/);
        if (!match) {
          return new Response(
            JSON.stringify({
              error: 'Invalid expiration format',
              message: 'Use format like "30m", "2h", "7d", or "1w" (m=minutes, h=hours, d=days, w=weeks)'
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
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
      }

      // Validate expiration time bounds
      const minExpiration = 5 * 60 * 1000; // 5 minutes
      const maxExpiration = 30 * 24 * 60 * 60 * 1000; // 30 days

      if (expirationMs < minExpiration) {
        return new Response(
          JSON.stringify({
            error: 'Expiration too short',
            message: 'Minimum expiration time is 5 minutes'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (expirationMs > maxExpiration) {
        return new Response(
          JSON.stringify({
            error: 'Expiration too long',
            message: 'Maximum expiration time is 30 days'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Helper function to validate shortcode format
    const validateShortcode = (code) => {
      if (!code) return null;
      // Must be alphanumeric, 3-20 characters
      if (!/^[a-zA-Z0-9]{3,20}$/.test(code)) {
        return 'Shortcode must be 3-20 alphanumeric characters';
      }
      // Reserved words check
      const reserved = ['generate', 'status', 'analytics', 'api', 'admin'];
      if (reserved.includes(code.toLowerCase())) {
        return 'This shortcode is reserved';
      }
      return null;
    };

    // Validate custom shortcodes if provided
    let shortcodeA, shortcodeB;

    if (customShortcodeA || customShortcodeB) {
      // Both must be provided if using custom shortcodes
      if (!customShortcodeA || !customShortcodeB) {
        return new Response(
          JSON.stringify({
            error: 'Incomplete custom shortcodes',
            message: 'Both customShortcodeA and customShortcodeB must be provided together'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Validate format
      const errorA = validateShortcode(customShortcodeA);
      if (errorA) {
        return new Response(
          JSON.stringify({
            error: 'Invalid customShortcodeA',
            message: errorA
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const errorB = validateShortcode(customShortcodeB);
      if (errorB) {
        return new Response(
          JSON.stringify({
            error: 'Invalid customShortcodeB',
            message: errorB
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Must be different
      if (customShortcodeA === customShortcodeB) {
        return new Response(
          JSON.stringify({
            error: 'Duplicate shortcodes',
            message: 'customShortcodeA and customShortcodeB must be different'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Check availability
      const existingA = await env.LINKS.get(`link:${customShortcodeA}`);
      if (existingA) {
        return new Response(
          JSON.stringify({
            error: 'Shortcode unavailable',
            message: `Shortcode "${customShortcodeA}" is already in use`
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const existingB = await env.LINKS.get(`link:${customShortcodeB}`);
      if (existingB) {
        return new Response(
          JSON.stringify({
            error: 'Shortcode unavailable',
            message: `Shortcode "${customShortcodeB}" is already in use`
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      shortcodeA = customShortcodeA;
      shortcodeB = customShortcodeB;
    } else {
      // Generate random shortcodes
      shortcodeA = generateShortcode(8);
      shortcodeB = generateShortcode(8);
    }

    // Generate and split encryption key
    const masterKey = await generateMasterKey();
    const { keyA, keyB } = await splitKey(masterKey);

    // Encrypt the URL
    const encryptedData = await encryptUrl(sanitizedUrl, masterKey);

    // Create entangled pair
    const pairData = createEntangledPair(
      shortcodeA,
      shortcodeB,
      encryptedData,
      keyA,
      keyB,
      expirationMs
    );

    // Store in KV
    await storePair(env, pairData);

    // Get base URL from request
    const baseUrl = new URL(request.url).origin;

    // Log successful generation (without sensitive data)
    console.log('Generated entangled pair:', {
      pairId: pairData.pairId,
      shortcodeA,
      shortcodeB,
      timestamp: Date.now()
    });

    // Return the entangled pair
    return new Response(
      JSON.stringify({
        success: true,
        pair: {
          id: pairData.pairId,
          linkA: `${baseUrl}/${shortcodeA}`,
          linkB: `${baseUrl}/${shortcodeB}`,
          statusA: `${baseUrl}/${shortcodeA}/status`,
          statusB: `${baseUrl}/${shortcodeB}/status`,
          state: pairData.state,
          expiresAt: pairData.expiresAt
        }
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Generate pair error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate entangled pair',
        message: 'An unexpected error occurred during pair generation'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
