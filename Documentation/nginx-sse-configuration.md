# Nginx Server-Sent Events (SSE) Configuration

## Overview
This document explains the nginx configuration required for Server-Sent Events (SSE) to work properly in the 🧠 QuizAi Docker Compose setup, specifically for the streaming quiz generation feature.

## The Problem
By default, nginx buffers HTTP responses, which breaks Server-Sent Events (SSE) streaming. When nginx acts as a reverse proxy in front of your Node.js backend, it needs special configuration to handle long-running SSE connections properly.

## Key Configuration Elements

### 1. Proxy Buffering
```nginx
proxy_buffering off;
proxy_cache off;
```
- **Critical for SSE**: Disables nginx response buffering
- Without this, SSE events are buffered and not sent to the client immediately
- Must be disabled for real-time streaming to work

### 2. HTTP Version
```nginx
proxy_http_version 1.1;
proxy_set_header Connection '';
```
- Forces HTTP/1.1 for persistent connections
- Clears the Connection header to prevent connection pooling issues
- Required for SSE keep-alive connections

### 3. Timeouts
```nginx
proxy_read_timeout 3600s;
proxy_send_timeout 3600s;
```
- Extends timeout for long-running SSE connections
- Quiz generation can take several minutes, so longer timeouts are needed
- Prevents nginx from closing the connection prematurely

### 4. Cache Control Headers
```nginx
add_header Cache-Control "no-cache, no-store, must-revalidate";
add_header Pragma "no-cache";
add_header Expires "0";
```
- Prevents caching of SSE responses
- Ensures browsers don't cache streaming content
- Critical for real-time updates

## Complete Configuration

### Main API Location Block
```nginx
location /api {
    limit_req zone=api burst=20 nodelay;
    
    rewrite ^/api(.*)$ $1 break;
    
    proxy_pass http://api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # SSE-specific configuration
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
    
    # CORS headers
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, Cache-Control";
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

### Optimized SSE Endpoint Configuration
```nginx
location ~ ^/api/generate-quiz-stream/ {
    # No rate limiting for streaming to avoid interruptions
    
    rewrite ^/api(.*)$ $1 break;
    
    proxy_pass http://api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Optimized SSE configuration
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
    
    # SSE-specific headers
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    
    # CORS for SSE
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, Cache-Control";
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

## Backend SSE Implementation

The backend properly sets SSE headers in `api/src/app.controller.ts`:

```typescript
@Post('generate-quiz-stream/:filename')
generateQuizStream(@Res() response: Response) {
  // Set SSE headers
  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  // Stream processing...
}
```

## Testing SSE Configuration

### 1. Direct Backend Test
```bash
# Test directly against the backend (bypass nginx)
curl -X POST http://localhost:3001/generate-quiz-stream/test.pdf \
  -H "Content-Type: application/json" \
  -d '{"questionsPerPage": 2}'
```

### 2. Through Nginx Proxy
```bash
# Test through nginx proxy
curl -X POST http://localhost:80/api/generate-quiz-stream/test.pdf \
  -H "Content-Type: application/json" \
  -d '{"questionsPerPage": 2}'
```

### 3. Browser Developer Tools
1. Open browser DevTools (F12)
2. Go to Network tab
3. Start quiz generation with "Generate Live ⚡"
4. Look for `generate-quiz-stream` request
5. Check Response Headers for proper SSE headers:
   - `Content-Type: text/event-stream`
   - `Cache-Control: no-cache`
   - `Connection: keep-alive`

## Common Issues and Solutions

### Issue: No SSE Events Received
**Cause**: nginx buffering is enabled
**Solution**: Ensure `proxy_buffering off;` is set in nginx config

### Issue: Connection Timeout During Generation
**Cause**: Default nginx timeouts are too short
**Solution**: Increase `proxy_read_timeout` and `proxy_send_timeout`

### Issue: CORS Errors
**Cause**: Missing or incorrect CORS headers
**Solution**: Verify CORS headers in both nginx and backend

### Issue: Events Stop Mid-Stream
**Cause**: Rate limiting or connection pooling
**Solution**: Remove rate limiting for SSE endpoints and set `Connection ''`

## Docker Compose Considerations

### Volume Mounting
Ensure nginx.conf is properly mounted:
```yaml
volumes:
  - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

### Service Dependencies
```yaml
depends_on:
  - api
  - web
```

### Health Checks
Monitor nginx health to ensure it's running:
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80"]
  timeout: 5s
  retries: 5
```

## Restarting Services

After updating nginx configuration:

```bash
# Restart nginx container
docker-compose restart proxy

# Or rebuild and restart all services
docker-compose down
docker-compose up --build -d
```

## Monitoring

### Nginx Logs
```bash
# View nginx access logs
docker-compose logs proxy

# Monitor SSE requests in real-time
docker-compose logs -f proxy | grep "generate-quiz-stream"
```

### Backend Logs
```bash
# Monitor backend streaming events
docker-compose logs -f api | grep "🌊\|📡\|🎉"
```

## Security Considerations

### Rate Limiting Exemption
The SSE endpoint has rate limiting disabled to prevent interruptions:
```nginx
# No rate limiting for streaming endpoints
location ~ ^/api/generate-quiz-stream/ {
    # No limit_req directive here
}
```

Consider implementing application-level rate limiting in the backend if needed.

### CORS Configuration
Currently set to allow all origins (`*`) for development:
```nginx
add_header Access-Control-Allow-Origin *;
```

For production, specify exact origins:
```nginx
add_header Access-Control-Allow-Origin https://yourdomain.com;
```

## Performance Optimization

### Worker Connections
Ensure adequate worker connections for concurrent SSE streams:
```nginx
events {
    worker_connections 1024;  # Adjust based on expected load
}
```

### Connection Pooling
SSE endpoints disable connection pooling for proper streaming:
```nginx
proxy_set_header Connection '';
```

This ensures each SSE connection is independent and properly maintained. 