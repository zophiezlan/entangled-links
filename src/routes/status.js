/**
 * View entanglement status
 * GET /:shortcode/status
 */

import { getPairFromShortcode } from '../lib/state.js';

export async function viewStatus(shortcode, env) {
  try {
    const pairData = await getPairFromShortcode(env, shortcode);
    
    if (!pairData) {
      return new Response('Link not found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    const isLinkA = shortcode === pairData.linkA;
    const twinCode = isLinkA ? pairData.linkB : pairData.linkA;
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Entanglement Status</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2em;
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 1em;
      text-align: center;
    }
    .status-card {
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 2em;
      margin: 2em 0;
      backdrop-filter: blur(10px);
    }
    .status-item {
      margin: 1em 0;
      padding: 1em;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
    .status-item label {
      display: block;
      font-weight: bold;
      margin-bottom: 0.5em;
      opacity: 0.8;
      font-size: 0.9em;
    }
    .status-item .value {
      font-size: 1.1em;
      font-family: monospace;
    }
    .state-badge {
      display: inline-block;
      padding: 0.5em 1em;
      border-radius: 20px;
      font-weight: bold;
      font-size: 0.9em;
    }
    .state-SUPERPOSITION {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }
    .state-COLLAPSED_A, .state-COLLAPSED_B {
      background: linear-gradient(135deg, #f093fb, #f5576c);
    }
    .state-OBSERVED {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
    }
    .timeline {
      margin-top: 2em;
    }
    .timeline-item {
      padding: 1em;
      margin: 0.5em 0;
      background: rgba(255,255,255,0.05);
      border-left: 3px solid rgba(255,255,255,0.3);
      border-radius: 0 8px 8px 0;
    }
    .back-link {
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
    .back-link:hover {
      background: rgba(255,255,255,0.3);
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚛️ Entanglement Status</h1>
    
    <div class="status-card">
      <div class="status-item">
        <label>Pair ID</label>
        <div class="value">${pairData.pairId}</div>
      </div>
      
      <div class="status-item">
        <label>Current State</label>
        <div class="value">
          <span class="state-badge state-${pairData.state}">
            ${pairData.state}
          </span>
        </div>
      </div>
      
      <div class="status-item">
        <label>This Link</label>
        <div class="value">Link ${isLinkA ? 'A' : 'B'} (${shortcode})</div>
      </div>
      
      <div class="status-item">
        <label>Twin Link</label>
        <div class="value">Link ${isLinkA ? 'B' : 'A'} (${twinCode})</div>
      </div>
      
      <div class="status-item">
        <label>Created</label>
        <div class="value">${new Date(pairData.createdAt).toLocaleString()}</div>
      </div>
      
      <div class="status-item">
        <label>Expires</label>
        <div class="value">${new Date(pairData.expiresAt).toLocaleString()}</div>
      </div>
    </div>
    
    ${pairData.accessLog.length > 0 ? `
    <div class="status-card timeline">
      <h3>Access History</h3>
      ${pairData.accessLog.map(log => `
        <div class="timeline-item">
          <strong>Link ${log.link}</strong> accessed
          <br>
          <small>${new Date(log.timestamp).toLocaleString()}</small>
          <br>
          <small>State → ${log.newState}</small>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <div style="text-align: center;">
      <a href="/${shortcode}" class="back-link">← Back to Link</a>
    </div>
  </div>
  
  <script>
    // Auto-refresh every 5 seconds to show state changes
    setTimeout(() => location.reload(), 5000);
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('Status view error:', error);
    return new Response('Internal error', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
