# Development Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create KV Namespace
```bash
# Create KV namespace for development
wrangler kv:namespace create "LINKS"

# Update wrangler.toml with the ID returned
```

### 3. Run Development Server
```bash
npm run dev
```

Visit http://localhost:8787

### 4. Deploy to Production
```bash
# Create production KV namespace
wrangler kv:namespace create "LINKS" --env production

# Deploy
npm run deploy
```

## Architecture Overview

### Core Flow

1. **User visits landing page** (`GET /`)
   - Displays form to enter URL
   - JavaScript calls `/generate` endpoint

2. **Generate entangled pair** (`POST /generate`)
   - Generate two unique shortcodes
   - Create master encryption key
   - Split key into keyA and keyB (XOR-based)
   - Encrypt destination URL with master key
   - Store pair in KV with state = SUPERPOSITION
   - Return both short links

3. **User accesses Link A** (`GET /:shortcode`)
   - Check if pair exists
   - Update state: SUPERPOSITION → COLLAPSED_A
   - Show "waiting for twin" page (can't decrypt yet)

4. **User accesses Link B** (`GET /:shortcode`)
   - Check if pair exists
   - Update state: COLLAPSED_A → OBSERVED
   - Both keys now available
   - Reconstruct master key (keyA XOR keyB)
   - Decrypt URL
   - Redirect to destination

### Cryptographic Design

**Key Splitting (XOR-based)**
```
Master Key = 256-bit random value
Key A = 256-bit random value
Key B = Master Key XOR Key A

To reconstruct:
Master Key = Key A XOR Key B
```

**Encryption**
- Algorithm: AES-GCM (256-bit)
- IV: 12 bytes random (stored with ciphertext)
- Each link stores: encrypted URL + IV + one key half

### State Machine

```
SUPERPOSITION → (access A) → COLLAPSED_A → (access B) → OBSERVED
              → (access B) → COLLAPSED_B → (access A) → OBSERVED
```

Only in OBSERVED state can both keys be combined to decrypt.

## File Structure

```
entangled-links/
├── src/
│   ├── index.js              # Main worker entry point
│   ├── routes/
│   │   ├── generate.js       # POST /generate - create pair
│   │   ├── resolve.js        # GET /:code - access link
│   │   └── status.js         # GET /:code/status - view state
│   ├── lib/
│   │   ├── router.js         # Simple URL router
│   │   └── state.js          # Entanglement state management
│   ├── crypto/
│   │   └── entanglement.js   # Cryptographic primitives
│   └── ui/
│       └── landing.js        # Landing page HTML
├── wrangler.toml             # Cloudflare config
├── package.json
└── README.md
```

## Testing Locally

1. **Generate a pair**:
```bash
curl -X POST http://localhost:8787/generate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

2. **Access Link A**:
```bash
curl http://localhost:8787/abc123
# Returns waiting page (state: COLLAPSED_A)
```

3. **Check status**:
```bash
curl http://localhost:8787/abc123/status
# Shows current entanglement state
```

4. **Access Link B**:
```bash
curl -L http://localhost:8787/def456
# Redirects to https://example.com (state: OBSERVED)
```

## Next Steps

### Phase 1 Enhancements
- [ ] Add expiration time picker
- [ ] Custom shortcode option
- [ ] QR code generation for links
- [ ] Better error handling

### Phase 2 Features
- [ ] Link analytics (privacy-respecting)
- [ ] Custom domains support
- [ ] Password protection
- [ ] One-time access option

### Phase 3 Advanced
- [ ] Cascade networks (3+ entangled links)
- [ ] Conditional decryption rules
- [ ] Webhook notifications
- [ ] API for integrations

## Debugging

### View KV Storage
```bash
wrangler kv:key list --binding LINKS
wrangler kv:key get "pair:xxx" --binding LINKS
```

### Logs
```bash
wrangler tail
```

### Common Issues

**"KV namespace not found"**
- Run `wrangler kv:namespace create "LINKS"`
- Update wrangler.toml with the returned ID

**"Module not found"**
- Ensure all imports use `.js` extension
- Check file paths are correct

**"Crypto operation failed"**
- Check browser console for Web Crypto API errors
- Ensure HTTPS in production (required for crypto APIs)

## Security Notes

- URLs are encrypted at rest
- Keys split across two links
- No analytics/tracking by default
- CORS enabled for API access
- Rate limiting recommended for production

## Performance

- Cloudflare Workers run at the edge (fast)
- KV storage has eventual consistency
- State updates are async (don't block redirects)
- Typical latency: <50ms globally

---

Ready to build something genuinely novel? Let's do this! 🚀
