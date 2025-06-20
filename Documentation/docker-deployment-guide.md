# Docker Deployment Guide

This comprehensive guide explains how to deploy AI Quiz Maker using Docker, including local development, production deployment, and Portainer setup.

## Overview

The AI Quiz Maker uses a multi-container Docker setup with:
- **API Service**: NestJS backend (Node.js)
- **Web Service**: Nuxt.js frontend
- **Proxy Service**: Nginx reverse proxy (production only)
- **Persistent Storage**: Docker volumes for uploads and quiz data

## Architecture

### Development Architecture
```
Port 3000 → Web Service (Nuxt dev server)
Port 3001 → API Service (NestJS)
```

### Production Architecture
```
Port 8000 → Nginx Proxy → ┬→ /api/* → API Service (3001)
                          └→ /* → Web Service (3000)
```

## Quick Start

### Development Deployment
```bash
# 1. Copy environment template
cp env.example .env

# 2. Edit .env with your OpenAI API key
OPENAI_API_KEY=your_actual_openai_api_key

# 3. Start development services
docker-compose up -d

# 4. Access application
# Frontend: http://localhost:3000
# API: http://localhost:3001
```

### Production Deployment
```bash
# 1. Use production environment
cp .env.production .env

# 2. Edit production variables
export OPENAI_API_KEY="your_api_key_here"
export WEB_URL="http://localhost:8000"
export API_URL="http://localhost:8000/api"

# 3. Deploy with Docker Compose
docker-compose up -d --build

# 4. Access application
# Application: http://localhost:8000
# Health Check: http://localhost:8000/health
```

## Docker Platform Requirements

### Architecture Considerations
Docker images must be built for **linux/amd64** architecture when deploying to:
- Cloud Run (Google Cloud)
- Most production servers
- CI/CD pipelines

### Building for Correct Architecture
```bash
# For Apple M1/M2 or other ARM machines
docker buildx build --platform linux/amd64 -t your-image ./api
docker buildx build --platform linux/amd64 -t your-image ./web

# For CI/CD or production builds
docker build --platform linux/amd64 -t your-image .
```

### Common Architecture Issues
- **"exec format error"**: Built for wrong architecture
- **Container startup failures**: Platform mismatch
- **Local works, production fails**: Architecture differences

## Configuration

### Environment Files

#### `.env` (Development)
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Application Settings
MAX_PDF_SIZE=104857600
MAX_PAGES_PER_PDF=200
DEFAULT_QUESTIONS_PER_PAGE=2

# Development URLs
WEB_URL=http://localhost:3000
API_URL=http://localhost:3001
NODE_ENV=development
```

#### `.env.production` (Production)
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Production Settings
MAX_PDF_SIZE=104857600
MAX_PAGES_PER_PDF=200
DEFAULT_QUESTIONS_PER_PAGE=2

# Production URLs (via nginx proxy)
WEB_URL=http://localhost:8000
API_URL=http://localhost:8000/api
NODE_ENV=production

# Optional: Custom domain
# WEB_URL=https://your-domain.com
# API_URL=https://your-domain.com/api
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ | - | OpenAI API key for quiz generation |
| `MAX_PDF_SIZE` | ❌ | 104857600 | Maximum PDF file size (100MB) |
| `MAX_PAGES_PER_PDF` | ❌ | 200 | Maximum pages to process per PDF |
| `DEFAULT_QUESTIONS_PER_PAGE` | ❌ | 2 | Default questions generated per page |
| `WEB_URL` | ❌ | http://localhost:3000 | Frontend URL for CORS |
| `API_URL` | ❌ | http://localhost:3001 | API URL for frontend |
| `NODE_ENV` | ❌ | development | Environment mode |
| `PORT` | ❌ | 3001 | API service port (auto-set in containers) |

### Port Configuration

#### Development Mode
- **Frontend**: 3000 (Nuxt dev server)
- **Backend**: 3001 (NestJS API)

#### Production Mode
- **External**: 8000 (Nginx proxy)
- **Internal API**: 3001 (behind proxy)
- **Internal Web**: 3000 (behind proxy)

## Portainer Deployment

### Method 1: Using Portainer Stacks (Recommended)

1. **Navigate to Portainer UI**
2. **Go to Stacks → Add Stack**
3. **Stack Name**: `quizai`
4. **Build Method**: Choose "Web editor"
5. **Copy docker-compose.yml content**
6. **Environment Variables**:
   ```
   OPENAI_API_KEY=your_actual_openai_api_key
   MAX_PDF_SIZE=104857600
   MAX_PAGES_PER_PDF=200
   DEFAULT_QUESTIONS_PER_PAGE=2
   ```
7. **Click "Deploy the stack"**

### Method 2: Using Git Repository

1. **In Portainer**: Stacks → Add Stack
2. **Stack Name**: `quizai`
3. **Build Method**: "Repository"
4. **Repository URL**: Your git repository URL
5. **Repository reference**: `main`
6. **Compose path**: `docker-compose.yml`
7. **Environment Variables**: Same as Method 1
8. **Deploy the stack**

## Docker Commands

### Basic Operations
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs (all services)
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f proxy

# Check service status
docker-compose ps

# Restart services
docker-compose restart

# Force rebuild and restart
docker-compose up -d --build
```

### Maintenance Commands
```bash
# Update images and restart
docker-compose pull
docker-compose up -d

# Clean up unused resources
docker system prune -f

# View resource usage
docker stats

# Access container shell
docker-compose exec api sh
docker-compose exec web sh

# Scale services (if needed)
docker-compose up -d --scale api=2
```

### Development Commands
```bash
# Switch to development mode
cp env.example .env
# Edit .env with development URLs
docker-compose down
docker-compose up -d

# View development logs
docker-compose logs -f --tail=100

# Restart specific service
docker-compose restart api
```

## Persistent Storage

### Docker Volumes
The setup includes persistent volumes:

- **api_uploads**: `/app/uploads` - Uploaded PDF files
- **api_storage**: `/app/quiz-storage` - Generated quiz data

### Volume Management
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect quizai_api_storage

# Backup data
tar -czf quiz-backup-$(date +%Y%m%d).tar.gz \
  -C $(docker volume inspect quizai_api_storage -f '{{.Mountpoint}}') .

# Restore data
tar -xzf quiz-backup-20241220.tar.gz \
  -C $(docker volume inspect quizai_api_storage -f '{{.Mountpoint}}')
```

## Health Checks

### Built-in Health Checks
Both services include health checks:
- **API**: `wget http://localhost:3001/config`
- **Web**: `wget http://localhost:3000`
- **Proxy**: `curl http://localhost:8000/health`

### Manual Health Checks
```bash
# Check all services
docker-compose ps

# Test endpoints
curl http://localhost:8000/health      # Production
curl http://localhost:8000/api/config  # API via proxy
curl http://localhost:3001/config      # API direct (dev)
curl http://localhost:3000             # Web direct (dev)
```

## Troubleshooting

### Common Issues

#### 1. "nest: not found" Build Error
**Fixed in latest Dockerfile**
- Ensure using updated Dockerfile with proper Node.js setup
- Use `node:18-bullseye-slim` base image

#### 2. "linux is NOT supported" Error
**Fixed by switching base images**
- Updated from Alpine to Ubuntu-based images
- pdf-poppler package requires specific Linux libraries
- Use latest Dockerfile version

#### 3. Port Conflicts
```bash
# Check what's using port
lsof -i :3000
lsof -i :8000

# Kill process or change ports in docker-compose.yml
kill -9 <PID>
```

#### 4. Container Build Failures
```bash
# Clean build (removes cache)
docker-compose build --no-cache

# Check for architecture issues
docker buildx build --platform linux/amd64 .

# Remove old images
docker image prune -f
```

#### 5. API Connection Issues
```bash
# Check API logs
docker-compose logs api

# Verify environment variables
docker-compose exec api env | grep -E "(OPENAI|API|WEB)_"

# Test internal connectivity
docker-compose exec proxy curl http://api:3001/config
```

#### 6. Frontend Loading Issues
```bash
# Check web service
docker-compose logs web

# Test internal web service
docker-compose exec proxy curl http://web:3000

# Verify proxy configuration
docker-compose exec proxy cat /etc/nginx/nginx.conf
```

#### 7. Docker Volume Issues
```bash
# Fix permission issues
docker-compose exec api chown -R node:node /app/uploads
docker-compose exec api chown -R node:node /app/quiz-storage

# Recreate volumes (WARNING: data loss)
docker-compose down -v
docker-compose up -d
```

### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check system resources
df -h
free -h

# Optimize memory usage
docker-compose exec api node --max-old-space-size=512 dist/main.js
```

### Debugging Steps

1. **Check Service Status**
   ```bash
   docker-compose ps
   ```

2. **Review Logs**
   ```bash
   docker-compose logs -f --tail=50
   ```

3. **Test Network Connectivity**
   ```bash
   docker-compose exec proxy ping api
   docker-compose exec proxy ping web
   ```

4. **Environment Verification**
   ```bash
   docker-compose exec api env | grep OPENAI
   ```

## Production Considerations

### Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong OpenAI API keys
   - Rotate API keys regularly

2. **Network Security**
   - Services communicate via internal Docker network
   - Only necessary ports exposed (8000 for production)
   - Nginx handles security headers

3. **File Storage**
   - Uploaded files isolated in Docker volumes
   - Implement file cleanup policies
   - Monitor storage usage

### SSL/HTTPS Setup

For production with custom domains:

1. **Update Environment Variables**
   ```env
   WEB_URL=https://your-domain.com
   API_URL=https://your-domain.com/api
   ```

2. **Add SSL Certificates to Nginx**
   - Mount certificate files to proxy container
   - Update nginx.conf for SSL configuration
   - Use Let's Encrypt for free certificates

3. **Deploy with SSL**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### Monitoring and Logging

1. **Log Management**
   ```bash
   # Rotate logs to prevent disk space issues
   docker-compose logs --tail=1000 > app-logs-$(date +%Y%m%d).log
   ```

2. **Resource Monitoring**
   ```bash
   # Set up monitoring alerts
   docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
   ```

3. **Automated Backups**
   ```bash
   # Add to crontab for daily backups
   0 2 * * * /path/to/backup-script.sh
   ```

## Related Documentation

- [GCP Deployment Guide](./gcp-deployment-guide.md) - For cloud deployment
- [Infrastructure Guide](./infrastructure-guide.md) - For Terraform setup
- [Configuration Guide](./configuration.md) - Detailed configuration options 