# Use Node.js LTS version with Ubuntu base (instead of Alpine for better PDF processing support)
FROM node:18-bullseye-slim

# Install system dependencies for PDF processing
RUN apt-get update && apt-get install -y \
    poppler-utils \
    libjpeg-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libgif-dev \
    build-essential \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create directories for file storage
RUN mkdir -p uploads quiz-storage

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV GOOGLE_ANALYTICS_ID=G-D817VJ3RW5

# Start the application
CMD ["npm", "run", "start:prod"] 