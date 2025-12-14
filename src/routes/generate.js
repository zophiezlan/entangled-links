/**
 * Generate entangled link pair
 * POST /generate
 * Body: { url: "https://example.com", expiresIn?: "7d"|number, customShortcodeA?: string, customShortcodeB?: string }
 */

import { generateShortcode, generateMasterKey, splitKey, encryptUrl } from '../crypto/entanglement.js';
import { createEntangledPair, storePair } from '../lib/state.js';
import { validateUrl, validateShortcode } from '../lib/validation.js';
import { createErrorResponse, createSuccessResponse, parseExpiration } from '../lib/utils.js';
import {
  DEFAULT_EXPIRATION_MS,
  MIN_EXPIRATION_MS,
  MAX_EXPIRATION_MS,
  MAX_URL_LENGTH,
  KV_PREFIX_LINK
} from '../config/constants.js';

export async function generatePair(request, env) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse(
        'Invalid JSON',
        'Request body must be valid JSON',
        400
      );
    }

    const { url, expiresIn, customShortcodeA, customShortcodeB } = body;

    // Validate URL
    const urlValidation = validateUrl(url, MAX_URL_LENGTH);
    if (!urlValidation.valid) {
      return createErrorResponse('Invalid URL', urlValidation.error, 400);
    }
    const sanitizedUrl = urlValidation.sanitized;

    // Parse and validate expiration time
    const expirationResult = parseExpiration(
      expiresIn,
      DEFAULT_EXPIRATION_MS,
      MIN_EXPIRATION_MS,
      MAX_EXPIRATION_MS
    );
    if (expirationResult.error) {
      return createErrorResponse('Invalid expiration', expirationResult.error, 400);
    }
    const expirationMs = expirationResult.expirationMs;

    // Handle custom shortcodes
    let shortcodeA, shortcodeB;

    if (customShortcodeA || customShortcodeB) {
      // Both must be provided
      if (!customShortcodeA || !customShortcodeB) {
        return createErrorResponse(
          'Incomplete custom shortcodes',
          'Both customShortcodeA and customShortcodeB must be provided together',
          400
        );
      }

      // Validate shortcode A
      const validationA = validateShortcode(customShortcodeA);
      if (!validationA.valid) {
        return createErrorResponse('Invalid customShortcodeA', validationA.error, 400);
      }

      // Validate shortcode B
      const validationB = validateShortcode(customShortcodeB);
      if (!validationB.valid) {
        return createErrorResponse('Invalid customShortcodeB', validationB.error, 400);
      }

      // Must be different
      if (customShortcodeA === customShortcodeB) {
        return createErrorResponse(
          'Duplicate shortcodes',
          'customShortcodeA and customShortcodeB must be different',
          400
        );
      }

      // Check availability
      const existingA = await env.LINKS.get(`${KV_PREFIX_LINK}${customShortcodeA}`);
      if (existingA) {
        return createErrorResponse(
          'Shortcode unavailable',
          `Shortcode "${customShortcodeA}" is already in use`,
          409
        );
      }

      const existingB = await env.LINKS.get(`${KV_PREFIX_LINK}${customShortcodeB}`);
      if (existingB) {
        return createErrorResponse(
          'Shortcode unavailable',
          `Shortcode "${customShortcodeB}" is already in use`,
          409
        );
      }

      shortcodeA = customShortcodeA;
      shortcodeB = customShortcodeB;
    } else {
      // Generate random shortcodes
      shortcodeA = generateShortcode();
      shortcodeB = generateShortcode();
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
    return createSuccessResponse({
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
    }, 201);

  } catch (error) {
    console.error('Generate pair error:', error);
    return createErrorResponse(
      'Failed to generate entangled pair',
      'An unexpected error occurred during pair generation',
      500
    );
  }
}
