# Deployment & Testing Guide

## Pre-Deployment Checklist

### 1. Cloudflare Account Setup
- [ ] Create Cloudflare account (free tier works)
- [ ] Install Wrangler CLI: `npm install -g wrangler`
- [ ] Authenticate: `wrangler login`

### 2. KV Namespace Creation
```bash
# Development
wrangler kv:namespace create "LINKS"
# Copy the ID to wrangler.toml under kv_namespaces

# Production
wrangler kv:namespace create "LINKS" --env production
# Copy the ID to wrangler.toml under [env.production]
```

### 3. Configuration
- [ ] Update `wrangler.toml` with your KV namespace IDs
- [ ] Choose a name for your worker (update `name` in wrangler.toml)
- [ ] Optional: Configure custom domain

### 4. Deploy
```bash
# Deploy to production
npm run deploy

# Your worker will be available at:
# https://entangled-links.YOUR-SUBDOMAIN.workers.dev
```

## Testing Scenarios

### Test 1: Basic Flow
**Objective**: Verify core entanglement functionality

1. Generate pair via UI
2. Access Link A first → should see waiting page
3. Check Link A status → should show COLLAPSED_A
4. Access Link B → should redirect to destination
5. Access Link A again → should also redirect

**Expected States**:
- Initial: SUPERPOSITION
- After A: COLLAPSED_A
- After B: OBSERVED

### Test 2: Reverse Order
**Objective**: Verify order independence

1. Generate pair
2. Access Link B first → waiting page
3. Access Link A → redirect
4. Both should now redirect

**Expected States**:
- Initial: SUPERPOSITION  
- After B: COLLAPSED_B
- After A: OBSERVED

### Test 3: Concurrent Access
**Objective**: Test race conditions

1. Generate pair
2. Open both links simultaneously in different tabs
3. Both should eventually redirect
4. Check status page for accurate state

**Expected**: Eventually consistent state (OBSERVED)

### Test 4: Expiration
**Objective**: Verify TTL enforcement

1. Generate pair
2. Wait for expiration (default: 7 days)
3. Access link → should return 410 Gone

**Expected**: Proper expiration handling

### Test 5: Invalid Shortcodes
**Objective**: Error handling

1. Access non-existent shortcode
2. Should return 404 Not Found

### Test 6: Status Page
**Objective**: Real-time state updates

1. Generate pair
2. Open status page for Link A
3. In another tab, access Link B
4. Status page should update (auto-refreshes every 5s)

**Expected**: Live state changes visible

## Manual Testing Commands

### Generate via cURL
```bash
curl -X POST https://entangled-links.YOUR-SUBDOMAIN.workers.dev/generate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

Expected response:
```json
{
  "success": true,
  "pair": {
    "id": "uuid-here",
    "linkA": "https://..../shortcodeA",
    "linkB": "https://..../shortcodeB",
    "statusA": "https://..../shortcodeA/status",
    "statusB": "https://..../shortcodeB/status",
    "state": "SUPERPOSITION",
    "expiresAt": 1234567890
  }
}
```

### Access Link
```bash
curl -L https://entangled-links.YOUR-SUBDOMAIN.workers.dev/SHORTCODE
```

### View Status
```bash
curl https://entangled-links.YOUR-SUBDOMAIN.workers.dev/SHORTCODE/status
```

### Inspect KV Storage
```bash
# List all keys
wrangler kv:key list --binding LINKS

# Get specific pair
wrangler kv:key get "pair:UUID" --binding LINKS

# Get link index
wrangler kv:key get "link:SHORTCODE" --binding LINKS
```

## Performance Testing

### Load Test
```bash
# Install k6: https://k6.io/
# Create test.js:
import http from 'k6/http';

export default function() {
  http.post('https://entangled-links.YOUR-SUBDOMAIN.workers.dev/generate',
    JSON.stringify({ url: 'https://example.com' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

# Run:
k6 run --vus 10 --duration 30s test.js
```

### Expected Performance
- Link generation: <100ms
- Link resolution: <50ms
- Global availability: <100ms from anywhere
- KV write latency: <300ms (eventual consistency)

## Monitoring

### Cloudflare Dashboard
- View requests/responses
- Error rates
- Geographic distribution
- Response times

### Wrangler Tail (Real-time Logs)
```bash
wrangler tail
```

### Custom Metrics
Add to worker:
```javascript
// In resolve.js
console.log('Link accessed:', {
  shortcode,
  state: pairData.state,
  timestamp: Date.now()
});
```

## Security Checklist

- [x] URLs encrypted at rest (AES-256-GCM)
- [x] Keys split across links (XOR)
- [x] No plaintext URLs in logs
- [x] CORS configured appropriately
- [x] Rate limiting implemented (Token bucket algorithm, 20 req/min per IP)
- [x] CSP headers set
- [x] HTTPS enforced
- [x] No tracking/analytics by default

## Production Hardening

### Rate Limiting Configuration

Rate limiting is implemented using a token bucket algorithm in `src/middleware/rateLimiter.js`.

**Current settings** (configurable in `src/index.js`):
```javascript
const rateLimiter = createRateLimiter(env, {
  maxRequests: 20,        // Maximum requests per window
  windowMs: 60000,        // 1 minute window
  keyPrefix: 'ratelimit:'
});
```

**To customize per environment**, update `wrangler.toml`:
```toml
[env.production.vars]
RATE_LIMIT_MAX = "10"
RATE_LIMIT_WINDOW_MS = "60000"
```

### Custom Domain
```toml
# In wrangler.toml
routes = [
  { pattern = "links.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### Environment Variables
```bash
# Set secrets
wrangler secret put API_KEY
wrangler secret put WEBHOOK_URL
```

## Troubleshooting

### Issue: "KV namespace not found"
**Solution**: Create KV namespace and update wrangler.toml

### Issue: "Module not found"  
**Solution**: Ensure .js extensions in imports

### Issue: Links don't redirect
**Solution**: Check KV storage, verify state is OBSERVED

### Issue: State not updating
**Solution**: KV has eventual consistency (~60s globally)

### Issue: Crypto errors in dev
**Solution**: Use `wrangler dev --local=false` for network KV

## Next Steps

1. Add rate limiting
2. Implement analytics (privacy-respecting)
3. Create API documentation
4. Build webhook notifications
5. Add cascade networks (3+ links)
6. Custom shortcode generation
7. QR code integration

---

Ready to launch something genuinely novel! 🚀
