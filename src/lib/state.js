/**
 * Entanglement state management
 * 
 * States:
 * - SUPERPOSITION: Neither link accessed
 * - COLLAPSED_A: Link A accessed first
 * - COLLAPSED_B: Link B accessed first
 * - OBSERVED: Both links accessed
 */

export const EntanglementState = {
  SUPERPOSITION: 'SUPERPOSITION',
  COLLAPSED_A: 'COLLAPSED_A',
  COLLAPSED_B: 'COLLAPSED_B',
  OBSERVED: 'OBSERVED'
};

/**
 * Create initial entangled pair state
 */
export function createEntangledPair(shortcodeA, shortcodeB, encryptedData, keyA, keyB) {
  const now = Date.now();
  
  return {
    // Pair metadata
    pairId: crypto.randomUUID(),
    createdAt: now,
    expiresAt: now + (7 * 24 * 60 * 60 * 1000), // 7 days
    
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
  const { linkA, linkB, pairId } = pairData;
  
  // Store pair data once
  await env.LINKS.put(
    `pair:${pairId}`,
    JSON.stringify(pairData),
    { expirationTtl: 7 * 24 * 60 * 60 }
  );
  
  // Create indexes for both shortcodes
  await env.LINKS.put(`link:${linkA}`, pairId, { expirationTtl: 7 * 24 * 60 * 60 });
  await env.LINKS.put(`link:${linkB}`, pairId, { expirationTtl: 7 * 24 * 60 * 60 });
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
  const { linkA, linkB, state, pairId } = pairData;
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
  
  // Store updated state
  await env.LINKS.put(
    `pair:${pairId}`,
    JSON.stringify(updatedPair),
    { expirationTtl: 7 * 24 * 60 * 60 }
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
