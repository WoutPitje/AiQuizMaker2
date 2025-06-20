#!/bin/bash
set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting web deployment to Google Cloud Storage (Static Hosting)${NC}"

# Check if required environment variables are set
if [ -z "$GCP_PROJECT_ID" ]; then
    echo -e "${RED}Error: GCP_PROJECT_ID environment variable is not set${NC}"
    echo "Please set it with: export GCP_PROJECT_ID=your-project-id"
    exit 1
fi

if [ -z "$CLOUD_RUN_URL" ]; then
    echo -e "${RED}Error: CLOUD_RUN_URL environment variable is not set${NC}"
    echo "Please set it with the URL of your Cloud Run API service"
    echo "Example: export CLOUD_RUN_URL=https://api-xxxxx-ey.a.run.app"
    exit 1
fi

if [ -z "$DOMAIN_NAME" ]; then
    echo -e "${YELLOW}DOMAIN_NAME not set, using default: quizai.nl${NC}"
    DOMAIN_NAME="quizai.nl"
fi

if [ -z "$ENVIRONMENT" ]; then
    echo -e "${YELLOW}ENVIRONMENT not set, using default: prod${NC}"
    ENVIRONMENT="prod"
fi

# Variables
BUCKET_NAME=$DOMAIN_NAME
API_URL="${CLOUD_RUN_URL}"

echo -e "${BLUE}Configuration:${NC}"
echo -e "  Project ID: ${GCP_PROJECT_ID}"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  Bucket: ${BUCKET_NAME}"
echo -e "  API URL: ${API_URL}"
echo -e "  Domain: ${DOMAIN_NAME}"

echo -e "${GREEN}Building Nuxt static site...${NC}"
cd web

# Set environment variables for build
export NUXT_PUBLIC_API_URL=${API_URL}
export NUXT_PUBLIC_SITE_URL="https://${DOMAIN_NAME}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Generate static site
echo -e "${GREEN}Generating static site...${NC}"
npm run generate

# Check if build was successful
if [ ! -d ".output/public" ]; then
    echo -e "${RED}Error: Build failed, .output/public directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}Deploying to Cloud Storage bucket...${NC}"
# Use gsutil to sync files, deleting old ones
gsutil -m rsync -r -d .output/public/ gs://${BUCKET_NAME}/

# Set proper cache headers for different file types
echo -e "${GREEN}Setting cache headers...${NC}"
# HTML files - no cache
gsutil -m setmeta -h "Cache-Control:no-cache, no-store, must-revalidate" gs://${BUCKET_NAME}/*.html
gsutil -m setmeta -h "Cache-Control:no-cache, no-store, must-revalidate" gs://${BUCKET_NAME}/**/*.html

# Static assets - long cache
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" gs://${BUCKET_NAME}/_nuxt/**

# Images and other assets - medium cache
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" gs://${BUCKET_NAME}/*.{ico,jpg,jpeg,png,gif,svg,webp}

echo -e "${GREEN}Web deployment complete!${NC}"
echo -e ""
echo -e "${BLUE}Access your site:${NC}"
echo -e "  Direct (HTTP): http://${BUCKET_NAME}.storage.googleapis.com"
echo -e "  Via Cloudflare (HTTPS): https://${DOMAIN_NAME}"
echo -e ""
echo -e "${YELLOW}Important Notes:${NC}"
echo -e "  - For HTTPS, configure Cloudflare with CNAME → ${BUCKET_NAME}.storage.googleapis.com"
echo -e "  - Direct bucket access is HTTP only"
echo -e "  - API is accessible at: ${API_URL}"
echo -e "  - Changes may take a few minutes to propagate${NC}" 