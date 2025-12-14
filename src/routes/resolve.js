/**
 * Resolve entangled link
 * GET /:shortcode
 */

import { getPairFromShortcode, collapseState, getKeyForLink, canDecrypt } from '../lib/state.js';
import { reconstructKey, decryptUrl } from '../crypto/entanglement.js';

export async function resolveLink(shortcode, env, ctx) {
  try {
    // Get pair data
    const pairData = await getPairFromShortcode(env, shortcode);
    
    if (!pairData) {
      return new Response('Link not found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Check expiration
    if (Date.now() > pairData.expiresAt) {
      return new Response('Link expired', { 
        status: 410,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Update entanglement state (async, don't wait)
    ctx.waitUntil(collapseState(env, shortcode, pairData));
    
    // Check if we can decrypt (both links accessed)
    if (!canDecrypt(pairData)) {
      // State not yet observed - show waiting page
      return waitingPage(shortcode, pairData);
    }
    
    // Both links accessed - decrypt and redirect
    const { keyA, keyB, encryptedUrl, iv } = pairData;
    const masterKey = await reconstructKey(keyA, keyB);
    const url = await decryptUrl(encryptedUrl, iv, masterKey);
    
    return Response.redirect(url, 302);
    
  } catch (error) {
    console.error('Resolve error:', error);
    return new Response('Internal error', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

function waitingPage(shortcode, pairData) {
  const isLinkA = shortcode === pairData.linkA;
  const twinCode = isLinkA ? pairData.linkB : pairData.linkA;
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Entangled Link - Waiting</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      text-align: center;
    }
    h1 {
      font-size: 3em;
      margin-bottom: 0.5em;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .state {
      font-size: 1.2em;
      margin: 2em 0;
      padding: 1em;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      backdrop-filter: blur(10px);
    }
    .twin-link {
      display: inline-block;
      margin-top: 2em;
      padding: 1em 2em;
      background: rgba(255,255,255,0.2);
      border-radius: 8px;
      text-decoration: none;
      color: white;
      font-weight: bold;
      transition: all 0.3s;
    }
    .twin-link:hover {
      background: rgba(255,255,255,0.3);
      transform: translateY(-2px);
    }
    .info {
      margin-top: 2em;
      opacity: 0.8;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚛️</h1>
    <h2>Entangled Link</h2>
    <div class="state">
      <p><strong>State:</strong> ${pairData.state}</p>
      <p style="margin-top: 1em;">
        This link is entangled with its twin. Both must be accessed to reveal the destination.
      </p>
    </div>
    <a href="/${shortcode}/status" class="twin-link">
      View Status
    </a>
    <div class="info">
      <p>Share the twin link with the intended recipient.</p>
      <p style="margin-top: 0.5em; font-family: monospace;">Twin: ${twinCode}</p>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}
