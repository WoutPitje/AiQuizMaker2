# Production Docker Setup

This document describes the production-ready Docker configuration for AI Quiz Maker using nginx as a reverse proxy.

## Architecture Overview

The production setup uses a 3-container architecture:

1. **nginx (Reverse Proxy)** - Routes traffic and handles security
2. **API Service** - Backend Node.js/NestJS application
3. **Web Service** - Frontend Nuxt.js application

### Port Configuration

- **External**: Only port `8000` is exposed to the host
- **Internal**: Services communicate via Docker network
  - nginx listens on port 80 (container internal)
  - API service runs on port 3001 (container internal)
  - Web service runs on port 3000 (container internal)

## Request Routing

nginx routes requests as follows:

- **`/api/*`** → Forwarded to API service (port 3001)
  - The `/api` prefix is removed when forwarding
  - Example: `GET /api/config` → `GET /config` (to API service)
- **`/*`** → Forwarded to Web service (port 3000)
- **`/health`** → nginx health check endpoint

## Security Features

### Rate Limiting
- **API endpoints**: 10 requests/second (burst: 20)
- **Web endpoints**: 30 requests/second (burst: 50)

### Security Headers
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection

### CORS Handling
- API endpoints include CORS headers
- Preflight OPTIONS requests handled at proxy level

## Configuration Files

### docker-compose.yml
- Defines the 3-service architecture
- Sets up internal Docker network
- Configures volumes for persistent storage
- Health checks for all services

### nginx.conf
- Upstream server definitions
- Request routing rules
- Security and rate limiting configuration
- CORS handling

## Environment Variables

### Required
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Optional (with defaults)
```bash
WEB_URL=http://localhost:8000
API_URL=http://localhost:8000/api
MAX_PDF_SIZE=104857600
MAX_PAGES_PER_PDF=200
DEFAULT_QUESTIONS_PER_PAGE=2
```

## Deployment Instructions

### 1. Set Environment Variables
Create a `.env` file:
```bash
cp env.example .env
# Edit .env with your actual values
```

### 2. Build and Start Services
```bash
docker-compose up -d --build
```

### 3. Verify Deployment
- **Application**: http://localhost:8000
- **API Health**: http://localhost:8000/api/config
- **Proxy Health**: http://localhost:8000/health

### 4. Monitor Services
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f proxy
docker-compose logs -f api
docker-compose logs -f web
```

## Troubleshooting

### Common Issues

1. **Port 8000 already in use**
   ```bash
   # Check what's using port 8000
   lsof -i :8000
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Services not starting**
   ```bash
   # Check Docker logs
   docker-compose logs
   # Rebuild containers
   docker-compose down && docker-compose up -d --build
   ```

3. **API requests failing**
   - Ensure API_URL environment variable is set to `http://localhost:8000/api`
   - Check nginx.conf routing configuration
   - Verify backend service is healthy

### Health Checks

All services include health checks:
- **Proxy**: `GET /health` returns "healthy"
- **API**: `GET /config` should return configuration
- **Web**: Basic HTTP check on port 3000

## Production Considerations

### SSL/TLS
For production deployment with HTTPS:
1. Add SSL certificates to nginx configuration
2. Update nginx.conf to listen on port 443
3. Add SSL certificate volume mounts to docker-compose.yml

### Domain Configuration
Update environment variables for your domain:
```bash
WEB_URL=https://your-domain.com
API_URL=https://your-domain.com/api
```

### Resource Limits
Consider adding resource limits to docker-compose.yml:
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### Monitoring
- Set up log aggregation (ELK stack, Fluentd)
- Configure metrics collection (Prometheus)
- Set up alerting for service health

## Benefits of This Architecture

1. **Security**: Only one port exposed, nginx handles security headers
2. **Scalability**: Services can be scaled independently
3. **Performance**: nginx optimized for static file serving and proxying
4. **Maintainability**: Clear separation of concerns
5. **Monitoring**: Centralized logging and health checks
6. **Development Parity**: Same architecture as development but production-optimized 