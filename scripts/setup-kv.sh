#!/bin/bash
#
# Setup KV namespaces for all environments
# Usage: ./scripts/setup-kv.sh
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🗄️  Setting up KV namespaces${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo -e "${RED}❌ Wrangler CLI not found${NC}"
  echo "Install with: npm install -g wrangler"
  exit 1
fi

# Create development namespace
echo -e "${YELLOW}Creating development namespace...${NC}"
DEV_OUTPUT=$(wrangler kv:namespace create "LINKS" 2>&1)
DEV_ID=$(echo "$DEV_OUTPUT" | grep -o 'id = "[^"]*"' | head -1 | cut -d'"' -f2)
echo -e "${GREEN}✓ Development namespace created${NC}"
echo -e "  ID: ${BLUE}${DEV_ID}${NC}"
echo ""

# Create production namespace
echo -e "${YELLOW}Creating production namespace...${NC}"
PROD_OUTPUT=$(wrangler kv:namespace create "LINKS" --env production 2>&1)
PROD_ID=$(echo "$PROD_OUTPUT" | grep -o 'id = "[^"]*"' | head -1 | cut -d'"' -f2)
echo -e "${GREEN}✓ Production namespace created${NC}"
echo -e "  ID: ${BLUE}${PROD_ID}${NC}"
echo ""

# Create staging namespace
echo -e "${YELLOW}Creating staging namespace...${NC}"
STAGING_OUTPUT=$(wrangler kv:namespace create "LINKS" --env staging 2>&1)
STAGING_ID=$(echo "$STAGING_OUTPUT" | grep -o 'id = "[^"]*"' | head -1 | cut -d'"' -f2)
echo -e "${GREEN}✓ Staging namespace created${NC}"
echo -e "  ID: ${BLUE}${STAGING_ID}${NC}"
echo ""

# Update wrangler.toml
echo -e "${YELLOW}📝 Update your wrangler.toml with these IDs:${NC}"
echo ""
echo "Development:"
echo "  { binding = \"LINKS\", id = \"${DEV_ID}\" }"
echo ""
echo "Production ([env.production]):"
echo "  { binding = \"LINKS\", id = \"${PROD_ID}\" }"
echo ""
echo "Staging ([env.staging]):"
echo "  { binding = \"LINKS\", id = \"${STAGING_ID}\" }"
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
