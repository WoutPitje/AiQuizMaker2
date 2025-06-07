# Production Environment Variables Guide

## Server Information
- **Production Server IP**: 142.93.225.222
- **Environment**: Production Docker Deployment

## Required Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# ============================================
# REQUIRED - OpenAI API Configuration
# ============================================
OPENAI_API_KEY=sk-your-production-openai-api-key-here

# ============================================
# PRODUCTION SERVER CONFIGURATION
# ============================================
# Your production API URL - using your server IP
NUXT_PUBLIC_API_URL=http://142.93.225.222:3001

# ============================================
# FILE UPLOAD LIMITS (Production Optimized)
# ============================================
# Maximum PDF file size (200MB for production)
MAX_PDF_SIZE=209715200

# Maximum pages to process per PDF
MAX_PAGES_PER_PDF=100

# Default questions generated per page
DEFAULT_QUESTIONS_PER_PAGE=2

# ============================================
# PERFORMANCE SETTINGS
# ============================================
# Node.js environment
NODE_ENV=production

# API server port (matches docker-compose)
PORT=3001

# Logging level for production (minimal logging)
LOG_LEVEL=warn
```

## Optional Performance Variables

For high-traffic production environments, add these to your `.env`:

```bash
# ============================================
# ADVANCED PERFORMANCE SETTINGS
# ============================================
# Node.js memory limit (4GB recommended for production)
NODE_OPTIONS="--max-old-space-size=4096"

# Stack size for complex PDF processing
NODE_OPTIONS="--stack-size=2048"
```

## Secure Production Setup

### 1. OpenAI API Key
- **Never use development keys in production**
- Get a dedicated production key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Set appropriate usage limits and monitoring

### 2. File Security
- The `.env` file should **NEVER** be committed to git
- Ensure `.env` is in your `.gitignore` file
- Keep backups of your production environment variables securely

### 3. Server Access
- Configure firewall rules to only allow necessary ports (3000, 3001)
- Consider using HTTPS with SSL certificates
- Set up monitoring for your application

## Docker Deployment Commands

With your environment variables set, deploy using:

```bash
# Build and start services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Health Check URLs

Once deployed, verify your services:
- **Frontend**: http://142.93.225.222:3000
- **API Health**: http://142.93.225.222:3001/config
- **API Status**: http://142.93.225.222:3001

## Environment Variable Validation

Your docker-compose.yml will use these variables:
- `OPENAI_API_KEY` → API service authentication
- `NUXT_PUBLIC_API_URL` → Frontend to API communication
- `MAX_PDF_SIZE` → File upload limits
- `MAX_PAGES_PER_PDF` → Processing limits
- `DEFAULT_QUESTIONS_PER_PAGE` → Quiz generation settings

## Troubleshooting

### Common Issues:
1. **API Connection Failed**: Verify `NUXT_PUBLIC_API_URL` matches your server IP
2. **File Upload Errors**: Check `MAX_PDF_SIZE` setting
3. **OpenAI Errors**: Verify API key is valid and has sufficient credits
4. **Performance Issues**: Increase `NODE_OPTIONS` memory limit

### Monitoring Commands:
```bash
# Check container resource usage
docker stats

# Check container logs
docker-compose logs api
docker-compose logs web

# Restart specific service
docker-compose restart api
```

## Next Steps

1. Create your `.env` file with the variables above
2. Replace `your-production-openai-api-key-here` with your actual OpenAI API key
3. Deploy using `docker-compose up -d --build`
4. Test the application at http://142.93.225.222:3000
5. Monitor logs and performance 