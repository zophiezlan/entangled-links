/**
 * View link analytics
 * GET /:shortcode/analytics
 */

import { getPairFromShortcode } from '../lib/state.js';

export async function viewAnalytics(shortcode, env) {
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

    // Calculate analytics
    const totalAccesses = pairData.accessLog.length;
    const linkAAccesses = pairData.accessLog.filter(log => log.link === 'A').length;
    const linkBAccesses = pairData.accessLog.filter(log => log.link === 'B').length;

    const now = Date.now();
    const timeRemaining = pairData.expiresAt - now;
    const timeElapsed = now - pairData.createdAt;
    const totalLifetime = pairData.expiresAt - pairData.createdAt;
    const percentComplete = Math.min(100, (timeElapsed / totalLifetime) * 100).toFixed(1);

    // Format time remaining
    const formatTime = (ms) => {
      if (ms < 0) return 'Expired';
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ${hours % 24}h`;
      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
      return `${seconds}s`;
    };

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Link Analytics - Entangled Links</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
      color: white;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2em;
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 0.5em;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      opacity: 0.8;
      margin-bottom: 2em;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5em;
      margin: 2em 0;
    }
    .stat-card {
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 1.5em;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .stat-card h3 {
      font-size: 0.9em;
      opacity: 0.8;
      margin-bottom: 0.5em;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .stat-value {
      font-size: 2.5em;
      font-weight: bold;
      margin: 0.3em 0;
    }
    .stat-label {
      font-size: 0.85em;
      opacity: 0.7;
    }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      margin-top: 0.5em;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4facfe, #00f2fe);
      border-radius: 10px;
      transition: width 0.3s ease;
    }
    .chart-container {
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 2em;
      margin: 2em 0;
      backdrop-filter: blur(10px);
    }
    .timeline {
      margin-top: 2em;
    }
    .timeline-item {
      background: rgba(255,255,255,0.05);
      padding: 1em;
      margin: 0.5em 0;
      border-left: 3px solid;
      border-radius: 0 8px 8px 0;
    }
    .timeline-item.link-a {
      border-color: #f093fb;
    }
    .timeline-item.link-b {
      border-color: #4facfe;
    }
    .state-badge {
      display: inline-block;
      padding: 0.3em 0.8em;
      border-radius: 15px;
      font-size: 0.85em;
      font-weight: bold;
      margin-left: 0.5em;
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
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1em;
      margin: 2em 0;
    }
    .info-card {
      background: rgba(255,255,255,0.05);
      padding: 1em;
      border-radius: 8px;
    }
    .info-card label {
      display: block;
      font-size: 0.85em;
      opacity: 0.7;
      margin-bottom: 0.5em;
    }
    .info-card .value {
      font-family: monospace;
      font-size: 0.95em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Link Analytics</h1>
    <p class="subtitle">Detailed insights for your entangled link pair</p>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Accesses</h3>
        <div class="stat-value">${totalAccesses}</div>
        <div class="stat-label">Combined access count</div>
      </div>

      <div class="stat-card">
        <h3>Link A</h3>
        <div class="stat-value">${linkAAccesses}</div>
        <div class="stat-label">Accesses (${totalAccesses > 0 ? ((linkAAccesses/totalAccesses)*100).toFixed(0) : 0}%)</div>
      </div>

      <div class="stat-card">
        <h3>Link B</h3>
        <div class="stat-value">${linkBAccesses}</div>
        <div class="stat-label">Accesses (${totalAccesses > 0 ? ((linkBAccesses/totalAccesses)*100).toFixed(0) : 0}%)</div>
      </div>

      <div class="stat-card">
        <h3>Current State</h3>
        <div class="stat-value" style="font-size: 1.2em;">
          <span class="state-badge state-${pairData.state}">
            ${pairData.state}
          </span>
        </div>
        <div class="stat-label">Entanglement status</div>
      </div>

      <div class="stat-card">
        <h3>Time Remaining</h3>
        <div class="stat-value" style="font-size: 1.5em;">${formatTime(timeRemaining)}</div>
        <div class="stat-label">Until expiration</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentComplete}%"></div>
        </div>
      </div>

      <div class="stat-card">
        <h3>Created</h3>
        <div class="stat-value" style="font-size: 1em;">${new Date(pairData.createdAt).toLocaleDateString()}</div>
        <div class="stat-label">${new Date(pairData.createdAt).toLocaleTimeString()}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <label>Pair ID</label>
        <div class="value">${pairData.pairId}</div>
      </div>
      <div class="info-card">
        <label>Link A (${isLinkA ? 'This Link' : 'Twin Link'})</label>
        <div class="value">${pairData.linkA}</div>
      </div>
      <div class="info-card">
        <label>Link B (${!isLinkA ? 'This Link' : 'Twin Link'})</label>
        <div class="value">${pairData.linkB}</div>
      </div>
      <div class="info-card">
        <label>Expires At</label>
        <div class="value">${new Date(pairData.expiresAt).toLocaleString()}</div>
      </div>
    </div>

    ${pairData.accessLog.length > 0 ? `
    <div class="chart-container">
      <h2>Access Distribution</h2>
      <canvas id="accessChart" height="100"></canvas>
    </div>

    <div class="chart-container timeline">
      <h2>Access Timeline</h2>
      ${pairData.accessLog.map(log => `
        <div class="timeline-item link-${log.link.toLowerCase()}">
          <strong>Link ${log.link}</strong> accessed
          <span class="state-badge state-${log.newState}">${log.newState}</span>
          <br>
          <small>${new Date(log.timestamp).toLocaleString()}</small>
        </div>
      `).reverse().join('')}
    </div>
    ` : '<div class="chart-container"><p style="text-align: center; opacity: 0.7;">No access history yet</p></div>'}

    <div style="text-align: center;">
      <a href="/${shortcode}/status" class="back-link">← Back to Status</a>
      <a href="/" class="back-link" style="margin-left: 1em;">Home</a>
    </div>
  </div>

  <script>
    ${pairData.accessLog.length > 0 ? `
    // Create access distribution chart
    const ctx = document.getElementById('accessChart').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Link A', 'Link B'],
        datasets: [{
          data: [${linkAAccesses}, ${linkBAccesses}],
          backgroundColor: [
            'rgba(240, 147, 251, 0.8)',
            'rgba(79, 172, 254, 0.8)'
          ],
          borderColor: [
            'rgba(240, 147, 251, 1)',
            'rgba(79, 172, 254, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: {
              color: 'white',
              font: {
                size: 14
              }
            }
          }
        }
      }
    });
    ` : ''}
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Analytics view error:', error);
    return new Response('Internal error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
