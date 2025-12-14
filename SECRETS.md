# GitHub Secrets Configuration

This document lists all required GitHub secrets for the CI/CD pipeline to function correctly.

## Required Secrets

Configure these in: **Settings → Secrets and variables → Actions**

### 1. CLOUDFLARE_API_TOKEN

**Description**: API token for deploying to Cloudflare Workers

**How to create**:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template or create custom token with:
   - Permissions:
     - Account → Workers Scripts → Edit
     - Account → Workers KV Storage → Edit
   - Account Resources: Include → Your Account
4. Copy the generated token

**Value format**: String (40+ characters)

**Example**: `a1b2c3d4e5f6...`

---

### 2. CLOUDFLARE_ACCOUNT_ID

**Description**: Your Cloudflare account ID

**How to find**:
1. Log in to Cloudflare Dashboard
2. Select any domain or go to Workers & Pages
3. Account ID is displayed in the right sidebar
4. Or find in URL: `dash.cloudflare.com/<ACCOUNT_ID>/...`

**Value format**: Hexadecimal string (32 characters)

**Example**: `a1b2c3d4e5f6789012345678901234ab`

---

### 3. KV_NAMESPACE_ID_STAGING

**Description**: KV namespace ID for staging environment

**How to create**:
```bash
wrangler kv:namespace create "LINKS" --env staging
```

**Output**:
```toml
{ binding = "LINKS", id = "abc123..." }
```

Copy the `id` value.

**Value format**: Hexadecimal string (32 characters)

**Example**: `abcdef1234567890abcdef1234567890`

---

### 4. KV_NAMESPACE_ID_PROD

**Description**: KV namespace ID for production environment

**How to create**:
```bash
wrangler kv:namespace create "LINKS" --env production
```

**Output**:
```toml
{ binding = "LINKS", id = "xyz789..." }
```

Copy the `id` value.

**Value format**: Hexadecimal string (32 characters)

**Example**: `1234567890abcdef1234567890abcdef`

---

## Optional Secrets

### SENTRY_DSN (if using error tracking)

**Description**: Sentry Data Source Name for error monitoring

**How to get**: Create project in Sentry.io and copy DSN

---

## Quick Setup Script

```bash
#!/bin/bash
# Run this locally to get all IDs

echo "=== Cloudflare Account Info ==="
wrangler whoami

echo -e "\n=== Create KV Namespaces ==="
echo "Creating staging namespace..."
wrangler kv:namespace create "LINKS" --env staging

echo "Creating production namespace..."
wrangler kv:namespace create "LINKS" --env production

echo -e "\n=== Copy these values to GitHub Secrets ==="
echo "1. CLOUDFLARE_ACCOUNT_ID: <from wrangler whoami>"
echo "2. CLOUDFLARE_API_TOKEN: <create at dash.cloudflare.com/profile/api-tokens>"
echo "3. KV_NAMESPACE_ID_STAGING: <from staging namespace creation>"
echo "4. KV_NAMESPACE_ID_PROD: <from production namespace creation>"
```

---

## Verification

After adding secrets, verify they're set:

1. Go to **Settings → Secrets and variables → Actions**
2. You should see 4 repository secrets:
   - ✅ CLOUDFLARE_API_TOKEN
   - ✅ CLOUDFLARE_ACCOUNT_ID
   - ✅ KV_NAMESPACE_ID_STAGING
   - ✅ KV_NAMESPACE_ID_PROD

3. Test the CI/CD pipeline by pushing to `develop` or `main` branch

---

## Security Notes

- **Never commit secrets** to the repository
- Secrets are encrypted and only accessible to GitHub Actions
- Rotate API tokens periodically for security
- Use separate KV namespaces for each environment
- Limit API token permissions to minimum required

---

## Troubleshooting

### CI/CD fails with "KV namespace not found"

Check that:
1. The KV namespace ID secret is set correctly
2. The namespace actually exists: `wrangler kv:namespace list`
3. The API token has permission to access KV storage

### CI/CD fails with "Unauthorized"

Check that:
1. CLOUDFLARE_API_TOKEN is set and valid
2. Token hasn't expired
3. Token has Workers Scripts:Edit permission

### Script injection fails

Check that:
1. KV namespace IDs are 32-character hexadecimal strings
2. No extra whitespace in secret values
3. Using correct environment variable names

---

## Related Documentation

- [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [Workers KV](https://developers.cloudflare.com/kv/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
