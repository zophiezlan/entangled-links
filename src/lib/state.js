/**
 * Entanglement state management
 *
 * States:
 * - SUPERPOSITION: Neither link accessed
 * - COLLAPSED_A: Link A accessed first
 * - COLLAPSED_B: Link B accessed first
 * - OBSERVED: Both links accessed
 */

import { DEFAULT_EXPIRATION_MS } from '../config/constants.js';

export const EntanglementState = {
  SUPERPOSITION: 'SUPERPOSITION',
  COLLAPSED_A: 'COLLAPSED_A',
  COLLAPSED_B: 'COLLAPSED_B',
  OBSERVED: 'OBSERVED'
};

/**
 * Create initial entangled pair state
 * @param {string} shortcodeA - Link A shortcode
 * @param {string} shortcodeB - Link B shortcode
 * @param {object} encryptedData - Encrypted URL data
 * @param {string} keyA - Key A
 * @param {string} keyB - Key B
 * @param {number} expiresIn - Expiration time in milliseconds (default: 7 days)
 */
export function createEntangledPair(shortcodeA, shortcodeB, encryptedData, keyA, keyB, expiresIn = DEFAULT_EXPIRATION_MS) {
  const now = Date.now();

  return {
    // Pair metadata
    pairId: crypto.randomUUID(),
    createdAt: now,
    expiresAt: now + expiresIn,

    // Entanglement state
    state: EntanglementState.SUPERPOSITION,

    // Link identifiers
    linkA: shortcodeA,
    linkB: shortcodeB,

    // Encrypted payload
    encryptedUrl: encryptedData.ciphertext,
    iv: encryptedData.iv,

    // Split keys (each link gets one)
    keyA: keyA,
    keyB: keyB,

    // Access tracking
    accessLog: []
  };
}

/**
 * Store entangled pair in KV
 */
export async function storePair(env, pairData) {
  const { linkA, linkB, pairId, expiresAt } = pairData;
  const now = Date.now();
  const remainingMs = expiresAt - now;
  const ttlSeconds = Math.ceil(remainingMs / 1000);

  // Store pair data once
  await env.LINKS.put(
    `pair:${pairId}`,
    JSON.stringify(pairData),
    { expirationTtl: ttlSeconds }
  );

  // Create indexes for both shortcodes
  await env.LINKS.put(`link:${linkA}`, pairId, { expirationTtl: ttlSeconds });
  await env.LINKS.put(`link:${linkB}`, pairId, { expirationTtl: ttlSeconds });
}

/**
 * Get pair data from shortcode
 */
export async function getPairFromShortcode(env, shortcode) {
  // Get pair ID from shortcode index
  const pairId = await env.LINKS.get(`link:${shortcode}`);
  if (!pairId) return null;
  
  // Get pair data
  const pairJson = await env.LINKS.get(`pair:${pairId}`);
  if (!pairJson) return null;
  
  return JSON.parse(pairJson);
}

/**
 * Update entanglement state when link is accessed
 */
export async function collapseState(env, shortcode, pairData) {
  const { linkA, linkB, state, pairId, expiresAt } = pairData;
  const isLinkA = shortcode === linkA;
  const now = Date.now();

  // Determine new state
  let newState = state;

  if (state === EntanglementState.SUPERPOSITION) {
    // First access - collapse
    newState = isLinkA ? EntanglementState.COLLAPSED_A : EntanglementState.COLLAPSED_B;
  } else if (
    (state === EntanglementState.COLLAPSED_A && !isLinkA) ||
    (state === EntanglementState.COLLAPSED_B && isLinkA)
  ) {
    // Second link accessed - fully observed
    newState = EntanglementState.OBSERVED;
  }

  // Update access log
  const accessLog = [...pairData.accessLog, {
    link: isLinkA ? 'A' : 'B',
    timestamp: now,
    newState: newState
  }];

  // Update pair data
  const updatedPair = {
    ...pairData,
    state: newState,
    accessLog
  };

  // Store updated state with remaining TTL (FIX: preserve remaining time, not original duration)
  const remainingMs = expiresAt - now;
  const ttlSeconds = Math.ceil(remainingMs / 1000);

  await env.LINKS.put(
    `pair:${pairId}`,
    JSON.stringify(updatedPair),
    { expirationTtl: ttlSeconds }
  );

  return updatedPair;
}

/**
 * Get which key this shortcode has access to
 */
export function getKeyForLink(pairData, shortcode) {
  return shortcode === pairData.linkA ? pairData.keyA : pairData.keyB;
}

/**
 * Check if both keys are available (state is OBSERVED)
 */
export function canDecrypt(pairData) {
  return pairData.state === EntanglementState.OBSERVED;
}
