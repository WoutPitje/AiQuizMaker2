# Production Deployment Guide

This guide explains how to deploy 🧠 QuizAi in production using Docker Compose with the production environment configuration.

## Quick Start

### 1. Use Production Environment
```bash
# Copy production environment file
cp .env.production .env

# Or manually set production variables
export OPENAI_API_KEY="your_api_key_here"
export WEB_URL="http://localhost:8000"
export API_URL="http://localhost:8000/api"
```

### 2. Deploy with Docker Compose
```bash
# Build and start all services
docker-compose up -d --build

# Verify deployment
curl http://localhost:8000/health
```

### 3. Access Application
- **Web Application**: http://localhost:8000
- **API Health Check**: http://localhost:8000/api/config
- **Nginx Health Check**: http://localhost:8000/health

## Environment Files Overview

### `.env` (Local Development)
Updated for production Docker setup:
- `WEB_URL=http://localhost:8000`
- `API_URL=http://localhost:8000/api`
- `NODE_ENV=production`

### `.env.production` (Production Template)
Optimized for Docker deployment:
- Production-ready configuration
- Performance tuning options
- Domain configuration examples
- Security best practices

### `env.example` (Template)
Reference template with:
- All available environment variables
- Documentation for each setting
- Development vs production examples

## Deployment Commands

### Standard Deployment
```bash
# Start services in background
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Development Mode
```bash
# Switch back to development
cp env.example .env
# Edit .env with development URLs:
# WEB_URL=http://localhost:3000
# API_URL=http://localhost:3001

# Run development servers separately
cd api && npm run start:dev
cd web && npm run dev
```

### Production with Custom Domain
```bash
# Update .env with your domain
WEB_URL=https://your-domain.com
API_URL=https://your-domain.com/api

# Deploy with SSL (requires nginx.conf update)
docker-compose up -d --build
```

## Monitoring & Maintenance

### Health Checks
```bash
# Check all services
curl http://localhost:8000/health
curl http://localhost:8000/api/config

# Docker service status
docker-compose ps
docker-compose logs proxy
docker-compose logs api
docker-compose logs web
```

### Updates & Maintenance
```bash
# Update application
git pull origin main
docker-compose down
docker-compose up -d --build

# View resource usage
docker stats

# Clean up unused images
docker image prune -f
```

### Backup Data
```bash
# Backup quiz storage
tar -czf quiz-backup-$(date +%Y%m%d).tar.gz \
  -C $(docker volume inspect quizai_api_storage -f '{{.Mountpoint}}') .

# Backup uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz \
  -C $(docker volume inspect quizai_api_uploads -f '{{.Mountpoint}}') .
```

## Troubleshooting

### Common Issues

1. **Port 8000 in use**
   ```bash
   lsof -i :8000
   # Kill process or change port in docker-compose.yml
   ```

2. **API not accessible**
   ```bash
   # Check API service
   docker-compose logs api
   # Test internal API
   docker-compose exec proxy curl http://api:3001/config
   ```

3. **Frontend not loading**
   ```bash
   # Check web service
   docker-compose logs web
   # Test internal web
   docker-compose exec proxy curl http://web:3000
   ```

### Environment Issues
```bash
# Verify environment variables
docker-compose exec api env | grep -E "(OPENAI|API|WEB)_"

# Restart with fresh environment
docker-compose down
docker-compose up -d
```

### Performance Issues
```bash
# Monitor resource usage
docker stats

# Scale services (if needed)
docker-compose up -d --scale api=2

# Check nginx logs
docker-compose logs proxy | grep -E "(error|warn)"
```

## Security Considerations

### Production Security
1. **Environment Variables**
   - Keep `.env` file secure and out of version control
   - Use strong OpenAI API key
   - Regularly rotate API keys

2. **Network Security**
   - Only port 8000 exposed externally
   - All internal communication via Docker network
   - nginx handles security headers

3. **SSL/HTTPS** (Recommended)
   - Add SSL certificates to nginx configuration
   - Update environment URLs to HTTPS
   - Configure proper CORS for your domain

### Monitoring
1. **Log Monitoring**
   - Monitor nginx access logs
   - Track API error rates
   - Monitor quiz generation performance

2. **Resource Monitoring**
   - CPU and memory usage
   - Disk space for uploads and quiz storage
   - Network bandwidth

## Next Steps

1. **Custom Domain**: Update nginx.conf and environment variables
2. **SSL Certificate**: Add HTTPS support for production
3. **Monitoring**: Set up log aggregation and alerting
4. **Backup Strategy**: Implement automated backups
5. **Scaling**: Consider load balancing for high traffic 