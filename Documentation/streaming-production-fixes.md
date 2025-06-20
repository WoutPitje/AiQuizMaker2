# Streaming Production Fixes

## Overview
This document covers the fixes implemented to resolve quiz streaming issues in production environments, specifically for Cloud Run deployments.

## Issues Identified

### 1. Cloud Run Buffering
**Problem**: Cloud Run buffers responses by default, breaking Server-Sent Events (SSE) streaming.
**Impact**: Quiz streaming would hang or fail completely in production.

### 2. Missing SSE Headers
**Problem**: Incomplete SSE headers causing connection issues.
**Impact**: Browsers couldn't establish or maintain SSE connections.

### 3. Connection Timeouts
**Problem**: Long-running quiz generation exceeding Cloud Run timeouts.
**Impact**: Connections would be dropped mid-generation.

### 4. CORS Issues
**Problem**: Production domains had different CORS requirements.
**Impact**: Cross-origin requests would fail.

## Fixes Applied

### 1. Enhanced SSE Headers (API)
```typescript
// Core SSE headers
response.setHeader('Content-Type', 'text/event-stream');
response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
response.setHeader('Connection', 'keep-alive');
response.setHeader('Pragma', 'no-cache');
response.setHeader('Expires', '0');

// Cloud Run specific headers to prevent buffering
response.setHeader('Transfer-Encoding', 'chunked');
response.setHeader('X-Accel-Buffering', 'no');

// CORS headers for streaming
response.setHeader('Access-Control-Allow-Origin', '*');
response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
response.setHeader('Access-Control-Expose-Headers', 'Content-Type, Cache-Control, Connection');
```

### 2. Connection Establishment
```typescript
// Send initial connection event to establish stream
response.write(`data: ${JSON.stringify({ 
  type: 'connection', 
  message: 'Stream connected', 
  timestamp: new Date().toISOString() 
})}\n\n`);
```

### 3. Heartbeat Mechanism
```typescript
// Send periodic heartbeat to keep connection alive
heartbeatInterval = setInterval(() => {
  subject.next({
    type: 'heartbeat',
    data: { 
      message: 'Connection active',
      timestamp: new Date().toISOString()
    }
  });
}, 30000); // Send heartbeat every 30 seconds
```

### 4. Cloud Run Timeout Extension
```hcl
# Increased timeout for long-running streaming
variable "cloud_run_timeout" {
  description = "Cloud Run request timeout in seconds"
  type        = number
  default     = 3600 # 60 minutes for long-running streaming quiz generation
}
```

### 5. Cloud Run Gen2 Runtime
```hcl
# Enable Cloud Run Gen2 for better streaming support
metadata {
  annotations = {
    "autoscaling.knative.dev/minScale" = tostring(var.min_instances)
    "autoscaling.knative.dev/maxScale" = tostring(var.max_instances)
    "run.googleapis.com/cpu-throttling" = "false"
    "run.googleapis.com/execution-environment" = "gen2"
  }
}
```

### 6. Frontend Connection Handling
```typescript
// Enhanced connection handling with timeout
const controller = new AbortController()
const timeoutId = setTimeout(() => {
  controller.abort()
}, 60000) // 60 second timeout for initial connection

const response = await fetch(`${baseURL}/quiz/generate-stream/${filename}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(options || {}),
  signal: controller.signal,
})

// Clear timeout once connected
clearTimeout(timeoutId)
```

### 7. Event Handling Updates
```typescript
// Handle connection and heartbeat events
switch (event.type) {
  case 'connection':
    console.log('🔗 Stream connection established')
    streamingProgress.value = 'Connected to quiz generation stream...'
    break
    
  case 'heartbeat':
    // Ignore heartbeat messages, they're just to keep connection alive
    console.log('💓 Heartbeat received')
    break
    
  // ... other event types
}
```

## Deployment Steps

### 1. Deploy API Changes
```bash
cd api
docker build --platform linux/amd64 -t ${IMAGE_TAG} .
docker push ${IMAGE_TAG}
gcloud run deploy ${SERVICE_NAME} --image ${IMAGE_TAG} --region ${REGION}
```

### 2. Apply Terraform Changes
```bash
cd terraform
terraform plan
terraform apply
```

### 3. Deploy Frontend Changes
```bash
cd web
npm run generate
gsutil -m rsync -r -d .output/public/ gs://${BUCKET_NAME}/
```

## Testing Streaming in Production

### 1. Browser DevTools Test
1. Open browser DevTools (F12)
2. Go to Network tab
3. Start quiz generation with "Generate Live ⚡"
4. Verify streaming events are received
5. Check response headers for proper SSE headers

### 2. Curl Test
```bash
# Test streaming endpoint directly
curl -X POST https://your-domain.com/api/quiz/generate-stream/test.pdf \
  -H "Content-Type: application/json" \
  -d '{"questionsPerPage": 2}' \
  --no-buffer
```

### 3. Log Monitoring
```bash
# Monitor Cloud Run logs for streaming events
gcloud logs read "resource.type=cloud_run_revision" \
  --filter="textPayload:streaming" \
  --format="table(timestamp,textPayload)" \
  --limit=50
```

## Troubleshooting

### Issue: No Streaming Events Received
- **Check**: Response headers include `Content-Type: text/event-stream`
- **Check**: CORS headers are properly set
- **Check**: Cloud Run timeout is sufficient (3600 seconds)

### Issue: Connection Drops Mid-Generation
- **Check**: Heartbeat messages are being sent (every 30 seconds)
- **Check**: Cloud Run Gen2 runtime is enabled
- **Check**: `X-Accel-Buffering: no` header is present

### Issue: CORS Errors in Production
- **Check**: Production domain is included in allowed origins
- **Check**: CORS headers match frontend domain
- **Check**: OPTIONS preflight requests are handled properly

## Monitoring

### Cloud Run Metrics
- **Request Latency**: Should show long-running requests (minutes)
- **Request Count**: Should show SSE connections
- **Error Rate**: Should remain low during streaming

### Application Logs
- **Connection Events**: `🔗 Stream connection established`
- **Heartbeat Events**: `💓 Heartbeat received`
- **Streaming Progress**: `📡 Streaming event received`

## Performance Considerations

### Concurrency
- Cloud Run concurrency set to 1000 for multiple simultaneous streams
- Each SSE connection consumes one concurrent request slot

### Resource Usage
- Memory: Increased to handle multiple concurrent streams
- CPU: Sufficient for AI processing and streaming
- Timeout: Extended to 60 minutes for complex PDFs

### Cost Optimization
- Heartbeat frequency: 30 seconds (balance between connection stability and costs)
- Timeout settings: 60 minutes maximum to prevent runaway processes
- Auto-scaling: Min 0 instances to reduce idle costs

## Security Considerations

### CORS Configuration
- Production should use specific origins instead of `*`
- Streaming endpoints should maintain same security as regular endpoints

### Rate Limiting
- Consider implementing application-level rate limiting for streaming endpoints
- Monitor for abuse of long-running streaming connections

## Future Improvements

### Planned Enhancements
1. **Connection Resumption**: Resume interrupted streaming sessions
2. **Compression**: Implement SSE message compression
3. **Batch Updates**: Group multiple questions in single events
4. **Regional Optimization**: Deploy to multiple regions for better latency

### Monitoring Enhancements
1. **Streaming Metrics**: Custom metrics for streaming performance
2. **Health Checks**: Dedicated health checks for streaming endpoints
3. **Alerting**: Alerts for streaming connection failures 