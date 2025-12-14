# Entangled Links - Complete Setup Guide

This guide will walk you through setting up and deploying Entangled Links from scratch.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **Git** installed
- **Cloudflare account** (free tier works fine)
- **Terminal/Command line** access

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 3. Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser window to authorize Wrangler.

### 4. Create KV Namespaces

Use the automated setup script:

```bash
./scripts/setup-kv.sh
```

Or create manually:

```bash
# Development
wrangler kv:namespace create "LINKS"
# Copy the ID and update wrangler.toml

# Production
wrangler kv:namespace create "LINKS" --env production
# Copy the ID and update wrangler.toml [env.production]

# Staging
wrangler kv:namespace create "LINKS" --env staging
# Copy the ID and update wrangler.toml [env.staging]
```

### 5. Update Configuration

Edit `wrangler.toml` and replace placeholder IDs:

```toml
kv_namespaces = [
  { binding = "LINKS", id = "your_actual_id_here" }
]

[env.production]
kv_namespaces = [
  { binding = "LINKS", id = "your_production_id_here" }
]
```

### 6. Test Locally

```bash
npm run dev
```

Visit http://localhost:8787 to test the application.

### 7. Deploy to Production

```bash
npm run deploy

# Or use the deployment script
./scripts/deploy.sh production
```

🎉 Done! Your worker is now live at `https://entangled-links-prod.<your-subdomain>.workers.dev`

---

## Detailed Setup

### Environment Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Fill in your credentials:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

**Getting your Account ID:**
- Log in to Cloudflare Dashboard
- Click on Workers & Pages
- Your Account ID is shown on the right sidebar

**Creating an API Token:**
- Go to https://dash.cloudflare.com/profile/api-tokens
- Click "Create Token"
- Use "Edit Cloudflare Workers" template
- Required permissions:
  - Account > Workers Scripts > Edit
  - Account > Workers KV Storage > Edit

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Local Development

```bash
# Start dev server
npm run dev

# The server runs on http://localhost:8787

# Tail logs in real-time
wrangler tail
```

### Deployment Environments

#### Development (Default)
```bash
wrangler deploy
```

#### Staging
```bash
npm run deploy -- staging
# or
wrangler deploy --env staging
```

#### Production
```bash
npm run deploy -- production
# or
wrangler deploy --env production
```

### Custom Domain Setup

1. Add your domain to Cloudflare
2. Update `wrangler.toml`:

```toml
[[routes]]
pattern = "links.yourdomain.com/*"
zone_name = "yourdomain.com"
```

3. Deploy:

```bash
wrangler deploy
```

4. Your worker is now available at `https://links.yourdomain.com`

---

## GitHub Actions CI/CD

### Setup

1. Add secrets to your GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `CLOUDFLARE_API_TOKEN`: Your API token
     - `CLOUDFLARE_ACCOUNT_ID`: Your account ID

2. The workflow automatically:
   - Runs tests on every push/PR
   - Deploys to staging on push to `develop` branch
   - Deploys to production on push to `main` branch

### Workflow Triggers

```yaml
# Runs on push to main or develop
on:
  push:
    branches: [main, develop]
```

### Manual Deployment

```bash
# Trigger via GitHub Actions
gh workflow run ci.yml
```

---

## Production Checklist

Before deploying to production, ensure:

- [ ] All tests pass (`npm test`)
- [ ] KV namespaces created for all environments
- [ ] `wrangler.toml` configured with correct namespace IDs
- [ ] Environment variables set (if using custom config)
- [ ] Custom domain configured (optional)
- [ ] GitHub secrets added for CI/CD
- [ ] Rate limiting configured appropriately
- [ ] Security headers reviewed

---

## Monitoring & Observability

### Real-time Logs

```bash
# Tail all logs
wrangler tail

# Filter by environment
wrangler tail --env production

# Filter by HTTP method
wrangler tail | grep POST
```

### Cloudflare Dashboard

View metrics at:
- https://dash.cloudflare.com
- Navigate to Workers & Pages → Your Worker
- See:
  - Request count
  - Error rate
  - CPU time
  - Geographic distribution

### Debugging

```bash
# Check worker status
wrangler whoami

# List KV namespaces
wrangler kv:namespace list

# View KV keys
wrangler kv:key list --binding LINKS

# Get specific key
wrangler kv:key get "pair:UUID" --binding LINKS
```

---

## Troubleshooting

### "KV namespace not found"

**Problem**: Worker can't access KV namespace

**Solution**:
1. Verify namespace ID in `wrangler.toml` matches created namespace
2. Run `wrangler kv:namespace list` to see all namespaces
3. Update `wrangler.toml` with correct ID

### "Module not found" errors

**Problem**: Import paths incorrect

**Solution**:
- Ensure all imports use `.js` extension
- Check file paths are relative
- Verify `type: "module"` in `package.json`

### Rate limiting not working

**Problem**: Rate limits not enforced

**Solution**:
- Ensure KV namespace is accessible
- Check `LINKS` binding is correct
- Verify middleware is applied in `index.js`

### CORS errors

**Problem**: Browser blocks requests

**Solution**:
- Check CORS headers in middleware
- Update `allowedOrigins` in `index.js`
- Ensure OPTIONS requests handled

### Tests failing

**Problem**: Tests don't pass

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests with verbose output
npm test -- --reporter=verbose
```

---

## Performance Optimization

### Edge Caching

Add caching headers for static responses:

```javascript
return new Response(html, {
  headers: {
    'Content-Type': 'text/html',
    'Cache-Control': 'public, max-age=3600'
  }
});
```

### KV Best Practices

- Use TTL on all KV writes
- Minimize KV reads per request
- Cache frequently accessed data
- Use `ctx.waitUntil()` for non-blocking writes

### Rate Limiting Tuning

Adjust in `src/index.js`:

```javascript
const rateLimiter = createRateLimiter(env, {
  maxRequests: 20,     // Requests per window
  windowMs: 60000,     // Window size in ms
  keyPrefix: 'ratelimit:'
});
```

---

## Security Hardening

### Production Security Headers

Configured in `src/middleware/security.js`:

- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- X-XSS-Protection

### URL Validation

Blocks:
- Private/localhost IPs
- Non-HTTP(S) protocols
- URLs > 2048 characters

### Input Sanitization

All inputs validated:
- Request body size limited to 10KB
- JSON parsing error handling
- URL format validation
- Shortcode format validation

---

## Updating

### Pull Latest Changes

```bash
git pull origin main
npm install
npm test
npm run deploy
```

### Database Migrations

KV is schemaless. If data structure changes:

1. Deploy new code
2. Old data continues to work (backwards compatible)
3. New data uses new structure
4. Old data expires naturally (7-day TTL)

---

## Cost Estimation

Cloudflare Workers Free Tier:
- 100,000 requests/day
- 10ms CPU time per request
- Unlimited KV reads
- 1,000 KV writes/day

Estimated capacity on free tier:
- ~3,000 link pairs/day
- ~100,000 redirects/day
- $0/month for typical usage

Paid tier ($5/month):
- 10 million requests/month
- 50ms CPU time per request
- Unlimited KV operations
- Perfect for production

---

## Next Steps

1. **Customize**: Modify UI, add features, extend functionality
2. **Monitor**: Set up alerts in Cloudflare dashboard
3. **Scale**: Upgrade to paid tier if needed
4. **Integrate**: Use API to create links programmatically
5. **Extend**: Add webhook notifications, analytics, etc.

---

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [API Documentation](./API.md)
- [Feature Overview](./FEATURES.md)

---

## Support

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Security**: Report security issues privately

---

**You're all set! 🚀**

Your Entangled Links instance is ready for production deployment.
