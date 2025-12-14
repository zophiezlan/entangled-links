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

    const { url } = body;

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

    // Generate unique shortcodes
    const shortcodeA = generateShortcode(8);
    const shortcodeB = generateShortcode(8);

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
      keyB
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
