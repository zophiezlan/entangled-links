/**
 * Landing page with link generator
 */

export function landingPage() {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Entangled Links - Quantum-Inspired URL Shortener</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      font-size: 3em;
      text-align: center;
      margin-bottom: 0.2em;
      animation: fadeIn 1s;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .tagline {
      text-align: center;
      font-size: 1.2em;
      opacity: 0.9;
      margin-bottom: 2em;
    }
    .features {
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 2em;
      margin: 2em 0;
      backdrop-filter: blur(10px);
    }
    .features h2 {
      margin-bottom: 1em;
    }
    .features ul {
      list-style: none;
    }
    .features li {
      padding: 0.5em 0;
      padding-left: 1.5em;
      position: relative;
    }
    .features li:before {
      content: "⚛️";
      position: absolute;
      left: 0;
    }
    .generator {
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 2em;
      margin: 2em 0;
      backdrop-filter: blur(10px);
    }
    .generator h2 {
      margin-bottom: 1em;
    }
    .form-group {
      margin: 1.5em 0;
    }
    label {
      display: block;
      margin-bottom: 0.5em;
      font-weight: bold;
    }
    input[type="url"], input[type="text"], select {
      width: 100%;
      padding: 1em;
      border: none;
      border-radius: 8px;
      font-size: 1em;
      background: rgba(255,255,255,0.9);
      color: #333;
    }
    select {
      cursor: pointer;
    }
    small {
      font-size: 0.85em;
    }
    button {
      width: 100%;
      padding: 1em 2em;
      border: none;
      border-radius: 8px;
      font-size: 1.1em;
      font-weight: bold;
      background: linear-gradient(135deg, #f093fb, #f5576c);
      color: white;
      cursor: pointer;
      transition: all 0.3s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .result {
      margin-top: 2em;
      padding: 1.5em;
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      display: none;
    }
    .result.show {
      display: block;
      animation: slideIn 0.5s;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .link-box {
      margin: 1em 0;
      padding: 1em;
      background: rgba(0,0,0,0.2);
      border-radius: 8px;
      word-break: break-all;
    }
    .link-box label {
      font-size: 0.9em;
      opacity: 0.8;
      margin-bottom: 0.5em;
    }
    .link-box a {
      color: #4facfe;
      text-decoration: none;
      font-family: monospace;
    }
    .link-box a:hover {
      text-decoration: underline;
    }
    .copy-btn {
      width: auto;
      padding: 0.5em 1em;
      font-size: 0.9em;
      margin-top: 0.5em;
      background: rgba(255,255,255,0.2);
    }
    .error {
      color: #ff6b6b;
      margin-top: 1em;
      padding: 1em;
      background: rgba(255,107,107,0.1);
      border-radius: 8px;
    }
    .qr-container {
      display: flex;
      justify-content: space-around;
      margin: 2em 0;
      flex-wrap: wrap;
      gap: 1em;
    }
    .qr-box {
      background: white;
      padding: 1em;
      border-radius: 10px;
      text-align: center;
      flex: 1;
      min-width: 200px;
    }
    .qr-box h4 {
      color: #333;
      margin-bottom: 0.5em;
      font-size: 1em;
    }
    .qr-code {
      margin: 0 auto;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .download-btn {
      width: 100%;
      padding: 0.5em 1em;
      font-size: 0.85em;
      margin-top: 0.5em;
      background: #667eea;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚛️ Entangled Links</h1>
    <p class="tagline">The world's first quantum-inspired URL shortener</p>
    
    <div class="features">
      <h2>How It Works</h2>
      <ul>
        <li><strong>Create a pair:</strong> Generate two cryptographically entangled short links</li>
        <li><strong>Split the key:</strong> Each link contains half the decryption key</li>
        <li><strong>Share both links:</strong> Send them to different parties</li>
        <li><strong>Collapse the state:</strong> Both links must be accessed to reveal the destination</li>
      </ul>
    </div>
    
    <div class="generator">
      <h2>Generate Entangled Pair</h2>
      <form id="generateForm">
        <div class="form-group">
          <label for="url">Destination URL</label>
          <input
            type="url"
            id="url"
            placeholder="https://example.com"
            required
          >
        </div>
        <div class="form-group">
          <label for="expiresIn">Link Expiration</label>
          <select id="expiresIn">
            <option value="30m">30 minutes</option>
            <option value="1h">1 hour</option>
            <option value="6h">6 hours</option>
            <option value="1d">1 day</option>
            <option value="7d" selected>7 days (default)</option>
            <option value="14d">14 days</option>
            <option value="30d">30 days</option>
            <option value="custom">Custom...</option>
          </select>
        </div>
        <div class="form-group" id="customExpirationGroup" style="display: none;">
          <label for="customExpiration">Custom Expiration</label>
          <input
            type="text"
            id="customExpiration"
            placeholder="e.g., 2h, 3d, 1w"
          >
          <small style="display: block; margin-top: 0.5em; opacity: 0.7;">
            Format: number + unit (m=minutes, h=hours, d=days, w=weeks)
          </small>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="useCustomShortcodes" style="width: auto; display: inline-block; margin-right: 0.5em;">
            Use custom shortcodes
          </label>
        </div>
        <div id="customShortcodesGroup" style="display: none;">
          <div class="form-group">
            <label for="customShortcodeA">Custom Shortcode A</label>
            <input
              type="text"
              id="customShortcodeA"
              placeholder="e.g., mylink1"
              pattern="[a-zA-Z0-9]{3,20}"
            >
            <small style="display: block; margin-top: 0.5em; opacity: 0.7;">
              3-20 alphanumeric characters
            </small>
          </div>
          <div class="form-group">
            <label for="customShortcodeB">Custom Shortcode B</label>
            <input
              type="text"
              id="customShortcodeB"
              placeholder="e.g., mylink2"
              pattern="[a-zA-Z0-9]{3,20}"
            >
            <small style="display: block; margin-top: 0.5em; opacity: 0.7;">
              3-20 alphanumeric characters
            </small>
          </div>
        </div>
        <button type="submit" id="submitBtn">
          Generate Entangled Links
        </button>
      </form>
      
      <div id="result" class="result">
        <h3>✨ Entangled Pair Created</h3>

        <div class="qr-container">
          <div class="qr-box">
            <h4>🔗 Link A QR Code</h4>
            <div id="qrCodeA" class="qr-code"></div>
            <button class="download-btn" onclick="downloadQR('qrCodeA', 'LinkA')">Download QR</button>
          </div>
          <div class="qr-box">
            <h4>🔗 Link B QR Code</h4>
            <div id="qrCodeB" class="qr-code"></div>
            <button class="download-btn" onclick="downloadQR('qrCodeB', 'LinkB')">Download QR</button>
          </div>
        </div>

        <div class="link-box">
          <label>Link A</label>
          <a href="" id="linkA" target="_blank"></a>
          <br>
          <button class="copy-btn" onclick="copyLink('linkA')">Copy</button>
        </div>
        <div class="link-box">
          <label>Link B</label>
          <a href="" id="linkB" target="_blank"></a>
          <br>
          <button class="copy-btn" onclick="copyLink('linkB')">Copy</button>
        </div>
        <div class="link-box">
          <label>Status & Analytics</label>
          <a href="" id="statusA" target="_blank">📊 Link A Status</a> •
          <a href="" id="analyticsA" target="_blank">Analytics</a>
          <br>
          <a href="" id="statusB" target="_blank">📊 Link B Status</a> •
          <a href="" id="analyticsB" target="_blank">Analytics</a>
        </div>
        <p style="margin-top: 1em; opacity: 0.8; font-size: 0.9em;">
          Share these links with different parties. Both must be accessed to reveal the destination.
        </p>
      </div>
      
      <div id="error" class="error" style="display: none;"></div>
    </div>
  </div>
  
  <script>
    const form = document.getElementById('generateForm');
    const submitBtn = document.getElementById('submitBtn');
    const result = document.getElementById('result');
    const error = document.getElementById('error');
    const expiresInSelect = document.getElementById('expiresIn');
    const customExpirationGroup = document.getElementById('customExpirationGroup');
    const useCustomShortcodes = document.getElementById('useCustomShortcodes');
    const customShortcodesGroup = document.getElementById('customShortcodesGroup');

    // Show/hide custom expiration input
    expiresInSelect.addEventListener('change', () => {
      if (expiresInSelect.value === 'custom') {
        customExpirationGroup.style.display = 'block';
      } else {
        customExpirationGroup.style.display = 'none';
      }
    });

    // Show/hide custom shortcodes input
    useCustomShortcodes.addEventListener('change', () => {
      if (useCustomShortcodes.checked) {
        customShortcodesGroup.style.display = 'block';
      } else {
        customShortcodesGroup.style.display = 'none';
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const url = document.getElementById('url').value;

      // Get expiration time
      let expiresIn = expiresInSelect.value;
      if (expiresIn === 'custom') {
        expiresIn = document.getElementById('customExpiration').value;
        if (!expiresIn) {
          error.textContent = 'Please enter a custom expiration time';
          error.style.display = 'block';
          return;
        }
      }

      // Get custom shortcodes if enabled
      const requestBody = { url, expiresIn };
      if (useCustomShortcodes.checked) {
        const customShortcodeA = document.getElementById('customShortcodeA').value;
        const customShortcodeB = document.getElementById('customShortcodeB').value;

        if (!customShortcodeA || !customShortcodeB) {
          error.textContent = 'Please enter both custom shortcodes';
          error.style.display = 'block';
          return;
        }

        // Validate format
        const pattern = /^[a-zA-Z0-9]{3,20}$/;
        if (!pattern.test(customShortcodeA)) {
          error.textContent = 'Custom Shortcode A must be 3-20 alphanumeric characters';
          error.style.display = 'block';
          return;
        }

        if (!pattern.test(customShortcodeB)) {
          error.textContent = 'Custom Shortcode B must be 3-20 alphanumeric characters';
          error.style.display = 'block';
          return;
        }

        if (customShortcodeA === customShortcodeB) {
          error.textContent = 'Custom shortcodes must be different';
          error.style.display = 'block';
          return;
        }

        requestBody.customShortcodeA = customShortcodeA;
        requestBody.customShortcodeB = customShortcodeB;
      }

      // Disable form
      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating...';
      result.classList.remove('show');
      error.style.display = 'none';

      try {
        const response = await fetch('/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate links');
        }
        
        // Display results
        document.getElementById('linkA').href = data.pair.linkA;
        document.getElementById('linkA').textContent = data.pair.linkA;
        document.getElementById('linkB').href = data.pair.linkB;
        document.getElementById('linkB').textContent = data.pair.linkB;
        document.getElementById('statusA').href = data.pair.statusA;
        document.getElementById('statusB').href = data.pair.statusB;

        // Set analytics links
        const shortcodeA = data.pair.linkA.split('/').pop();
        const shortcodeB = data.pair.linkB.split('/').pop();
        const baseUrl = new URL(data.pair.linkA).origin;
        document.getElementById('analyticsA').href = baseUrl + '/' + shortcodeA + '/analytics';
        document.getElementById('analyticsB').href = baseUrl + '/' + shortcodeB + '/analytics';

        // Clear previous QR codes
        document.getElementById('qrCodeA').innerHTML = '';
        document.getElementById('qrCodeB').innerHTML = '';

        // Generate QR codes
        new QRCode(document.getElementById('qrCodeA'), {
          text: data.pair.linkA,
          width: 200,
          height: 200,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });

        new QRCode(document.getElementById('qrCodeB'), {
          text: data.pair.linkB,
          width: 200,
          height: 200,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });

        result.classList.add('show');
        
      } catch (err) {
        error.textContent = err.message;
        error.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate Entangled Links';
      }
    });
    
    function copyLink(elementId) {
      const link = document.getElementById(elementId).textContent;
      navigator.clipboard.writeText(link).then(() => {
        alert('Link copied to clipboard!');
      });
    }

    function downloadQR(qrElementId, linkName) {
      const canvas = document.querySelector('#' + qrElementId + ' canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'EntangledLink_' + linkName + '_QRCode.png';
        link.href = url;
        link.click();
      }
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}
