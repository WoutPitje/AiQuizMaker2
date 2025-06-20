#!/bin/bash
set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building and pushing API Docker image for Cloud Run${NC}"

# Check if required parameters are provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Project ID not provided${NC}"
    echo "Usage: ./build-and-push.sh <PROJECT_ID> [REGION]"
    echo "Example: ./build-and-push.sh aiquizmaker-1750103493 europe-west4"
    exit 1
fi

PROJECT_ID=$1
REGION=${2:-europe-west4}
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/aiquizmaker-docker/api:latest"

echo -e "${BLUE}Configuration:${NC}"
echo -e "  Project ID: ${PROJECT_ID}"
echo -e "  Region: ${REGION}"
echo -e "  Image: ${IMAGE_TAG}"
echo -e "  Target Platform: linux/amd64"

# Configure Docker authentication
echo -e "${GREEN}Configuring Docker authentication...${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Clean up any existing buildx issues
echo -e "${YELLOW}Cleaning up Docker buildx...${NC}"
docker buildx rm multiplatform 2>/dev/null || true

# Method 1: Try standard Docker build with platform flag
echo -e "${GREEN}Building Docker image for linux/amd64...${NC}"
echo -e "${YELLOW}Using standard Docker build with --platform flag${NC}"

# Ensure we're using the right platform
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Build the image
if docker build --platform linux/amd64 -t ${IMAGE_TAG} .; then
    echo -e "${GREEN}Build successful!${NC}"
else
    echo -e "${RED}Build failed. Trying alternative method...${NC}"
    
    # Method 2: Build without platform flag and hope for the best
    echo -e "${YELLOW}Building without explicit platform (will use your system default)${NC}"
    docker build -t ${IMAGE_TAG} .
    
    echo -e "${YELLOW}Warning: Image might be built for ARM. This could cause issues on Cloud Run.${NC}"
fi

# Push the image
echo -e "${GREEN}Pushing Docker image...${NC}"
if docker push ${IMAGE_TAG}; then
    echo -e "${GREEN}Push successful!${NC}"
else
    echo -e "${RED}Push failed!${NC}"
    echo -e "${YELLOW}Please check your authentication and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}Docker image successfully built and pushed!${NC}"
echo -e "${BLUE}Image URL: ${IMAGE_TAG}${NC}"
echo -e ""
echo -e "${YELLOW}Next step: Run 'terraform apply' in the terraform directory${NC}" 