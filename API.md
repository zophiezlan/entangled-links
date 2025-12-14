# Entangled Links API Documentation

## Overview

Entangled Links provides a RESTful API for creating and managing cryptographically entangled URL pairs. This document describes all available endpoints, request/response formats, and error handling.

**Base URL**: `https://your-worker-url.workers.dev`

## Authentication

Currently, the API does not require authentication. Rate limiting is enforced at 20 requests per minute per IP address.

## Endpoints

### 1. Landing Page

**GET /**

Returns the HTML landing page with the link generator interface.

**Response**:
- `200 OK`: HTML page
- `Content-Type`: text/html

### 2. Generate Entangled Pair

**POST /generate**

Creates a new entangled link pair for the provided URL.

**Request Body**:
```json
{
  "url": "https://example.com/destination"
}
```

**Request Headers**:
- `Content-Type: application/json`

**Validation**:
- URL must be valid HTTP/HTTPS
- URL must be less than 2048 characters
- Private/localhost URLs are rejected
- JavaScript/data URLs are rejected

**Response**:

```json
{
  "success": true,
  "pair": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "linkA": "https://your-worker.workers.dev/abc12345",
    "linkB": "https://your-worker.workers.dev/xyz67890",
    "statusA": "https://your-worker.workers.dev/abc12345/status",
    "statusB": "https://your-worker.workers.dev/xyz67890/status",
    "state": "SUPERPOSITION",
    "expiresAt": 1702339200000
  }
}
```

**Status Codes**:
- `201 Created`: Pair successfully generated
- `400 Bad Request`: Invalid URL or request body
- `413 Payload Too Large`: Request body exceeds 10KB
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

**Rate Limiting**:
- Limit: 20 requests per minute per IP
- Headers included in response:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Window reset time (ISO 8601)
  - `Retry-After`: Seconds until retry (only when limited)

**Example**:

```bash
curl -X POST https://your-worker.workers.dev/generate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### 3. Resolve Link

**GET /:shortcode**

Accesses an entangled link and redirects to destination if both links have been accessed.

**Parameters**:
- `shortcode` (path): The unique identifier for the link (8 alphanumeric characters)

**Behavior**:

1. **SUPERPOSITION → COLLAPSED**: First link access
   - Returns waiting page (HTML)
   - State transitions to COLLAPSED_A or COLLAPSED_B
   - User sees message to wait for twin link

2. **COLLAPSED → OBSERVED**: Second link access (twin)
   - State transitions to OBSERVED
   - Both links now redirect to destination
   - 302 redirect to original URL

3. **OBSERVED → OBSERVED**: Subsequent accesses
   - Direct 302 redirect to destination
   - No state change

**Response**:

- `200 OK`: Waiting page (HTML) when pair not fully accessed
- `302 Found`: Redirect to destination URL when both accessed
- `404 Not Found`: Link does not exist
- `410 Gone`: Link has expired (>7 days old)

**Headers**:
- Security headers applied (CSP, X-Frame-Options, etc.)

**Example**:

```bash
# First access (Link A)
curl -L https://your-worker.workers.dev/abc12345
# Returns waiting page

# Second access (Link B)
curl -L https://your-worker.workers.dev/xyz67890
# Redirects to destination

# Third access (Link A again)
curl -L https://your-worker.workers.dev/abc12345
# Also redirects to destination
```

### 4. View Status

**GET /:shortcode/status**

Returns detailed information about the entanglement state and access history.

**Parameters**:
- `shortcode` (path): The unique identifier for the link

**Response**:

Returns an HTML page displaying:
- Pair ID
- Current entanglement state
- Link identifiers (A/B)
- Twin link shortcode
- Creation timestamp
- Expiration timestamp
- Access history timeline

**Status Codes**:
- `200 OK`: Status page returned
- `404 Not Found`: Link does not exist

**Features**:
- Auto-refreshes every 5 seconds
- Shows real-time state changes
- Privacy-respecting (no tracking)

**Example**:

```bash
curl https://your-worker.workers.dev/abc12345/status
```

## Entanglement States

### State Machine

```
SUPERPOSITION
    ↓ (Link A accessed)
COLLAPSED_A
    ↓ (Link B accessed)
OBSERVED
```

or

```
SUPERPOSITION
    ↓ (Link B accessed)
COLLAPSED_B
    ↓ (Link A accessed)
OBSERVED
```

### State Descriptions

- **SUPERPOSITION**: Neither link has been accessed
  - Both keys stored separately
  - Cannot decrypt destination URL

- **COLLAPSED_A**: Link A accessed first
  - Link A shows waiting page
  - Link B not yet accessed
  - Cannot decrypt until both accessed

- **COLLAPSED_B**: Link B accessed first
  - Link B shows waiting page
  - Link A not yet accessed
  - Cannot decrypt until both accessed

- **OBSERVED**: Both links accessed
  - Keys can be combined (XOR)
  - URL can be decrypted
  - Both links redirect to destination

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error description"
}
```

### Common Errors

**400 Bad Request**
```json
{
  "error": "Invalid URL",
  "message": "Private/local URLs not allowed"
}
```

**429 Too Many Requests**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Security Headers

All responses include comprehensive security headers:

- `Content-Security-Policy`: Prevents XSS attacks
- `X-Content-Type-Options: nosniff`: Prevents MIME sniffing
- `X-Frame-Options: DENY`: Prevents clickjacking
- `X-XSS-Protection: 1; mode=block`: XSS filter
- `Strict-Transport-Security`: Forces HTTPS
- `Referrer-Policy`: Controls referrer information

## CORS

CORS is enabled for all origins (`*`) by default. In production, configure allowed origins in `wrangler.toml`.

**Preflight Requests**:
```bash
curl -X OPTIONS https://your-worker.workers.dev/generate \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST"
```

## Link Lifecycle

1. **Generation**: POST /generate creates pair
   - Master key generated (AES-256-GCM)
   - Key split into halves (XOR)
   - URL encrypted with master key
   - Pair stored in KV with 7-day TTL

2. **First Access**: GET /:shortcode (Link A or B)
   - State: SUPERPOSITION → COLLAPSED_A/B
   - Returns waiting page
   - Access logged

3. **Second Access**: GET /:shortcode (twin)
   - State: COLLAPSED → OBSERVED
   - Keys combined via XOR
   - URL decrypted
   - Redirect to destination
   - Access logged

4. **Subsequent Access**: GET /:shortcode
   - Direct redirect
   - State remains OBSERVED

5. **Expiration**: After 7 days
   - All data deleted from KV
   - Links return 410 Gone

## Rate Limiting

### Generation Endpoint

- **Limit**: 20 requests per minute per IP
- **Window**: 60 seconds (sliding)
- **Storage**: Cloudflare KV
- **Algorithm**: Token bucket

### Rate Limit Headers

Every response includes:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 2024-12-14T12:35:00Z
```

When limited:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Remaining: 0
```

## Performance

- **Link Generation**: <100ms
- **Link Resolution**: <50ms
- **Global Availability**: <100ms from anywhere
- **KV Write Latency**: <300ms (eventual consistency)

## Monitoring

### Logs

```bash
# Real-time logs
wrangler tail

# Filter for errors
wrangler tail | grep ERROR
```

### Metrics

Available in Cloudflare Dashboard:
- Request count
- Error rate
- Response time (p50, p95, p99)
- Geographic distribution

## SDK Examples

### JavaScript/TypeScript

```typescript
async function createEntangledPair(url: string) {
  const response = await fetch('https://your-worker.workers.dev/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.pair;
}

// Usage
const pair = await createEntangledPair('https://example.com');
console.log('Link A:', pair.linkA);
console.log('Link B:', pair.linkB);
```

### Python

```python
import requests

def create_entangled_pair(url):
    response = requests.post(
        'https://your-worker.workers.dev/generate',
        json={'url': url}
    )
    response.raise_for_status()
    return response.json()['pair']

# Usage
pair = create_entangled_pair('https://example.com')
print(f"Link A: {pair['linkA']}")
print(f"Link B: {pair['linkB']}")
```

### cURL

```bash
# Generate pair
RESPONSE=$(curl -s -X POST https://your-worker.workers.dev/generate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}')

LINK_A=$(echo $RESPONSE | jq -r '.pair.linkA')
LINK_B=$(echo $RESPONSE | jq -r '.pair.linkB')

echo "Link A: $LINK_A"
echo "Link B: $LINK_B"
```

## Best Practices

1. **URL Validation**: Always validate URLs client-side before sending
2. **Error Handling**: Implement exponential backoff for rate limits
3. **Link Sharing**: Share Link A and Link B through different channels
4. **Monitoring**: Track pair generation and resolution rates
5. **Security**: Never log or store the destination URLs in plaintext

## Changelog

### v0.1.0 (2024-12-14)
- Initial release
- Core entanglement functionality
- Rate limiting
- Security headers
- Comprehensive validation

## Support

For issues and feature requests, visit the GitHub repository or open an issue.
