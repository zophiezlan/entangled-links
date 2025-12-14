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
    input[type="url"] {
      width: 100%;
      padding: 1em;
      border: none;
      border-radius: 8px;
      font-size: 1em;
      background: rgba(255,255,255,0.9);
      color: #333;
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
        <button type="submit" id="submitBtn">
          Generate Entangled Links
        </button>
      </form>
      
      <div id="result" class="result">
        <h3>✨ Entangled Pair Created</h3>
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
          <label>Status Pages</label>
          <a href="" id="statusA" target="_blank">View Link A Status</a>
          <br>
          <a href="" id="statusB" target="_blank">View Link B Status</a>
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
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const url = document.getElementById('url').value;
      
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
          body: JSON.stringify({ url })
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
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}
