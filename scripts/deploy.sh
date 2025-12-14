#!/bin/bash
#
# Deployment script for Entangled Links
# Usage: ./scripts/deploy.sh [environment]
# Environment: production, staging, preview (default: production)
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get environment from argument or default to production
ENVIRONMENT="${1:-production}"

echo -e "${GREEN}🚀 Deploying Entangled Links to ${ENVIRONMENT}${NC}"
echo ""

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging|preview)$ ]]; then
  echo -e "${RED}❌ Invalid environment: ${ENVIRONMENT}${NC}"
  echo "Valid environments: production, staging, preview"
  exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo -e "${RED}❌ Wrangler CLI not found${NC}"
  echo "Install with: npm install -g wrangler"
  exit 1
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
  echo -e "${YELLOW}⚠️  Not logged in to Cloudflare${NC}"
  echo "Running: wrangler login"
  wrangler login
fi

echo -e "${GREEN}✓ Prerequisites met${NC}"
echo ""

# Run tests before deployment
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm test || {
  echo -e "${RED}❌ Tests failed. Deployment aborted.${NC}"
  exit 1
}
echo -e "${GREEN}✓ Tests passed${NC}"
echo ""

# Deploy to specified environment
echo -e "${YELLOW}📦 Deploying to ${ENVIRONMENT}...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
  wrangler deploy --env production
elif [ "$ENVIRONMENT" = "staging" ]; then
  wrangler deploy --env staging
else
  wrangler deploy --env preview
fi

echo ""
echo -e "${GREEN}✓ Deployment successful!${NC}"
echo ""

# Show deployment URL
if [ "$ENVIRONMENT" = "production" ]; then
  echo -e "Production URL: ${GREEN}https://entangled-links-prod.<your-subdomain>.workers.dev${NC}"
elif [ "$ENVIRONMENT" = "staging" ]; then
  echo -e "Staging URL: ${GREEN}https://entangled-links-staging.<your-subdomain>.workers.dev${NC}"
else
  echo -e "Preview URL: ${GREEN}https://entangled-links-preview.<your-subdomain>.workers.dev${NC}"
fi

echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  1. Test the deployment: curl https://your-worker-url/"
echo "  2. Monitor logs: wrangler tail"
echo "  3. Check analytics in Cloudflare dashboard"
