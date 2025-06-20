#!/bin/bash
set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting API deployment to Google Cloud Run${NC}"

# Check if required environment variables are set
if [ -z "$GCP_PROJECT_ID" ]; then
    echo -e "${RED}Error: GCP_PROJECT_ID environment variable is not set${NC}"
    echo "Please set it with: export GCP_PROJECT_ID=your-project-id"
    exit 1
fi

if [ -z "$GCP_REGION" ]; then
    echo -e "${YELLOW}GCP_REGION not set, using default: europe-west4${NC}"
    GCP_REGION="europe-west4"
fi

# Variables
SERVICE_NAME="aiquizmaker-api"
IMAGE_NAME="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/aiquizmaker-docker/api"
IMAGE_TAG="${IMAGE_NAME}:latest"

echo -e "${BLUE}Configuration:${NC}"
echo -e "  Project ID: ${GCP_PROJECT_ID}"
echo -e "  Region: ${GCP_REGION}"
echo -e "  Service: ${SERVICE_NAME}"
echo -e "  Image: ${IMAGE_TAG}"
echo -e "  Platform: linux/amd64 (x86_64)"

# Navigate to API directory
cd api

# Configure Docker authentication
echo -e "${GREEN}Configuring Docker authentication...${NC}"
gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev --quiet

# Check if Docker buildx is available
if docker buildx version &> /dev/null; then
    echo -e "${GREEN}Using Docker buildx for multi-platform build...${NC}"
    
    # Create builder instance if it doesn't exist
    if ! docker buildx ls | grep -q "multiplatform"; then
        echo -e "${YELLOW}Creating buildx builder instance...${NC}"
        docker buildx create --name multiplatform --use
    else
        docker buildx use multiplatform
    fi
    
    # Build and push in one step with buildx
    echo -e "${GREEN}Building and pushing Docker image for linux/amd64...${NC}"
    docker buildx build \
        --platform linux/amd64 \
        --tag ${IMAGE_TAG} \
        --push \
        .
else
    echo -e "${YELLOW}Docker buildx not available, using standard build with DOCKER_DEFAULT_PLATFORM${NC}"
    
    # Set platform for standard docker build
    export DOCKER_DEFAULT_PLATFORM=linux/amd64
    
    # Build the Docker image
    echo -e "${GREEN}Building Docker image for linux/amd64...${NC}"
    docker build --platform linux/amd64 -t ${IMAGE_TAG} .
    
    # Push the image
    echo -e "${GREEN}Pushing Docker image...${NC}"
    docker push ${IMAGE_TAG}
fi

# Deploy to Cloud Run
echo -e "${GREEN}Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_TAG} \
    --region ${GCP_REGION} \
    --platform managed \
    --allow-unauthenticated \
    --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${GCP_REGION} --format 'value(status.url)')

echo -e "${GREEN}API deployment complete!${NC}"
echo -e "Service URL: ${SERVICE_URL}"
echo -e ""
echo -e "${YELLOW}Note: Make sure this URL is set in your frontend deployment as CLOUD_RUN_URL${NC}" 