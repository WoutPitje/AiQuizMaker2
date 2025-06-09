# Docker Deployment Guide

This guide explains how to deploy 🧠 QuizAi using Docker, including Portainer setup.

## Quick Start

1. **Copy environment template:**
   ```bash
   cp env.example .env
   ```

2. **Edit .env file with your OpenAI API key:**
   ```env
   OPENAI_API_KEY=your_actual_openai_api_key
   ```

3. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Portainer Deployment

### Method 1: Using Portainer Stacks (Recommended)

1. **Navigate to Portainer UI**
2. **Go to Stacks → Add Stack**
3. **Stack Name:** `quizai`
4. **Build Method:** Choose "Web editor"
5. **Paste the docker-compose.yml content**
6. **Environment Variables:**
   ```
   OPENAI_API_KEY=your_actual_openai_api_key
   MAX_PDF_SIZE=104857600
   MAX_PAGES_PER_PDF=200
   DEFAULT_QUESTIONS_PER_PAGE=2
   ```
7. **Click "Deploy the stack"**

### Method 2: Using Git Repository

1. **In Portainer, go to Stacks → Add Stack**
2. **Stack Name:** `quizai`
3. **Build Method:** Choose "Repository"
4. **Repository URL:** Your git repository URL
5. **Repository reference:** `main` or your branch name
6. **Compose path:** `docker-compose.yml`
7. **Environment Variables:**
   ```
   OPENAI_API_KEY=your_actual_openai_api_key
   MAX_PDF_SIZE=104857600
   MAX_PAGES_PER_PDF=200
   DEFAULT_QUESTIONS_PER_PAGE=2
   ```
8. **Click "Deploy the stack"**

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ | - | OpenAI API key for quiz generation |
| `MAX_PDF_SIZE` | ❌ | 104857600 | Maximum PDF file size (100MB) |
| `MAX_PAGES_PER_PDF` | ❌ | 200 | Maximum number of pages to process per PDF |
| `DEFAULT_QUESTIONS_PER_PAGE` | ❌ | 2 | Default number of questions to generate per page |
| `PORT` | ❌ | 3001 | Backend API port |

### Port Configuration

- **Frontend (web):** 3000
- **Backend (api):** 3001
- **Internal networking:** Containers communicate via `quizai-network`

### Volume Persistence

The setup includes persistent Docker volumes:

- **api_uploads:** `/app/uploads` - Stores uploaded PDF files
- **api_storage:** `/app/quiz-storage` - Stores generated quiz data

These volumes ensure data persists even when containers are recreated.

## Docker Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web

# Check status
docker-compose ps

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
```

### Maintenance

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
```

## Troubleshooting

### Common Issues

1. **Build fails with "nest: not found"**
   - This is fixed in the latest Dockerfile
   - Ensure you're using the updated version

2. **"linux is NOT supported" error**
   - This was fixed by switching from Alpine to Ubuntu-based Node.js image
   - The pdf-poppler package requires specific Linux libraries
   - Ensure you're using the latest Dockerfile with `node:18-bullseye-slim`

3. **Cannot access frontend**
   - Check if port 3000 is available
   - Verify containers are running: `docker-compose ps`

4. **API errors**
   - Verify OPENAI_API_KEY is set correctly
   - Check backend logs: `docker-compose logs api`

5. **Permission issues**
   - Ensure Docker has proper permissions
   - Check volume mount permissions

### Health Checks

Both services include health checks:

- **API:** `wget http://localhost:3001/config`
- **Web:** `wget http://localhost:3000`

Check health status:
```bash
docker-compose ps
```

### Logs and Debugging

```bash
# View all logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# View specific service
docker-compose logs -f api

# Follow logs with timestamps
docker-compose logs -f -t
```

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use strong OpenAI API keys
   - Rotate API keys regularly

2. **Network Security:**
   - Services communicate via internal Docker network
   - Only necessary ports are exposed

3. **File Storage:**
   - Uploaded files are isolated in Docker volumes
   - Consider implementing file cleanup policies

## Performance

### Resource Requirements

- **Memory:** 2GB+ recommended
- **CPU:** 2+ cores recommended
- **Storage:** 10GB+ for file storage
- **Network:** Internet access for OpenAI API

### Scaling

For high-traffic scenarios:

1. **Use a reverse proxy** (nginx, traefik)
2. **Implement load balancing**
3. **Add Redis for session storage**
4. **Use external file storage** (S3, etc.)

## Production Deployment

For production environments:

1. **Use specific image tags** instead of `latest`
2. **Set up monitoring** (health checks, logs)
3. **Configure backup** for persistent volumes
4. **Use secrets management** for API keys
5. **Set up SSL/TLS** termination
6. **Configure log rotation**

### Example Production Setup

```yaml
version: '3.8'

services:
  api:
    image: quizai-api:v1.0.0
    restart: always
    environment:
      - NODE_ENV=production
    volumes:
      - /opt/quizai/uploads:/app/uploads
      - /opt/quizai/storage:/app/quiz-storage
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Support

For issues and questions:

1. Check the logs first
2. Verify environment variables
3. Test with minimal configuration
4. Check Docker and system resources 