# Access Tracking System

## Overview

The AI Quiz Maker now includes a comprehensive access tracking system that monitors who accesses your application. All tracking data is sent to a webhook endpoint for centralized logging and analysis.

## Features

- **API Request Tracking**: Automatically tracks all API calls with response times and status codes
- **Page View Tracking**: Tracks frontend page views and navigation
- **User Session Tracking**: Maintains session IDs for user journey analysis
- **IP Geolocation**: Captures user IP addresses (ready for geolocation integration)
- **Real-time Webhook Delivery**: Sends all tracking data to your configured webhook endpoint

## Architecture

### Backend Components

1. **AccessLogService** (`api/src/access-log.service.ts`)
   - Handles sending tracking data to webhook
   - Formats log entries with app metadata
   - Provides specialized methods for different event types

2. **AccessLogMiddleware** (`api/src/access-log.middleware.ts`)
   - Automatically captures all API requests
   - Extracts client IP from various headers (proxy-aware)
   - Filters out static files and health checks
   - Measures response times

3. **Controller Endpoint** (`/track-page-view`)
   - Receives frontend page view data
   - Processes and forwards to webhook

### Frontend Components

1. **useTracking Composable** (`web/composables/useTracking.ts`)
   - Provides tracking functions for pages and events
   - Manages user session IDs
   - Handles development vs production environments

2. **Tracking Plugin** (`web/plugins/tracking.client.ts`)
   - Automatically tracks page views on route changes
   - Provides global access to tracking functions

## Configuration

### Webhook Endpoint

The tracking data is sent to:
```
https://n8n.pitdigital.nl/webhook-test/fa591fe7-532f-4bc3-bce7-c0c36ad1964b
```

### Environment Variables

```bash
# Enable tracking in development (optional)
ENABLE_TRACKING=true

# Domain for production tracking
DOMAIN=quizai.nl

# API URL for frontend requests
API_URL=https://quizai.nl/api
```

## Data Structure

### Webhook Payload

Each tracking event sends the following data structure:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "method": "GET",
  "url": "/api/quiz/123",
  "referer": "https://quizai.nl/",
  "responseTime": 150,
  "statusCode": 200,
  "sessionId": "uuid-v4-session-id",
  "app": "AiQuizMaker",
  "environment": "production",
  "domain": "quizai.nl"
}
```

### Event Types

1. **API Requests**: `method` contains HTTP method (GET, POST, etc.)
2. **Page Views**: `method` contains "PAGE_VIEW"
3. **Custom Events**: `url` contains event identifier like `/path#event:button_click`

## Usage

### Automatic Tracking

Most tracking happens automatically:
- All API requests are tracked via middleware
- Page views are tracked via the frontend plugin
- No manual intervention needed for basic analytics

### Manual Event Tracking

Track custom events in your Vue components:

```typescript
// In a Vue component
const { $trackEvent } = useNuxtApp()

// Track button clicks
const handleButtonClick = () => {
  $trackEvent('button_click', {
    button_id: 'generate_quiz',
    quiz_type: 'pdf'
  })
}

// Track form submissions
const handleFormSubmit = () => {
  $trackEvent('form_submit', {
    form_type: 'quiz_options',
    language: selectedLanguage.value
  })
}
```

### Manual Page View Tracking

```typescript
// Track specific page views with additional data
const { $trackPageView } = useNuxtApp()

$trackPageView({
  userId: 'user123',
  url: '/special-page'
})
```

## Production Deployment

### With Docker Compose

The tracking system is automatically included in your Docker deployment. Ensure your environment variables are set:

```yaml
# docker-compose.yml
environment:
  - DOMAIN=quizai.nl
  - API_URL=https://quizai.nl/api
  - NODE_ENV=production
```

### Nginx Configuration

Make sure your nginx.conf includes the tracking endpoint:

```nginx
location /api/ {
    proxy_pass http://api:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Monitoring

### Webhook Testing

Test your webhook endpoint:

```bash
curl -X POST https://n8n.pitdigital.nl/webhook-test/fa591fe7-532f-4bc3-bce7-c0c36ad1964b \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Development Logging

In development mode, tracking events are logged to console:

```bash
# Start development server with tracking enabled
ENABLE_TRACKING=true npm run dev
```

## Security & Privacy

### IP Address Handling

- IP addresses are captured for analytics
- Ready for geolocation integration
- Consider GDPR compliance for EU users

### Data Retention

- Data is sent to external webhook
- No local storage of tracking data
- Retention policy managed by webhook destination

### Session Management

- Session IDs are UUID v4 generated client-side
- Stored in localStorage for session continuity
- No personally identifiable information stored

## Troubleshooting

### Common Issues

1. **Webhook Delivery Failures**
   - Check network connectivity
   - Verify webhook URL is accessible
   - Monitor API logs for webhook errors

2. **Missing Page Views**
   - Ensure tracking plugin is loaded
   - Check browser console for errors
   - Verify API_URL configuration

3. **Duplicate Events**
   - Normal for single-page applications
   - Filter duplicates in your analytics system

### Debug Mode

Enable debug logging:

```bash
# Backend
DEBUG=access-log npm run start:dev

# Frontend
ENABLE_TRACKING=true npm run dev
```

## Integration with Analytics

The webhook data can be integrated with various analytics platforms:

- **n8n**: Direct webhook processing
- **Google Analytics**: Custom event forwarding
- **Mixpanel**: Event tracking pipeline
- **Custom Dashboard**: Database storage and visualization

## Future Enhancements

Planned improvements:
- [ ] Geolocation integration (IP to country/city)
- [ ] User authentication tracking
- [ ] Performance metrics
- [ ] A/B testing support
- [ ] Real-time dashboard
- [ ] Data export capabilities

## Support

For tracking system issues:
1. Check webhook endpoint status
2. Review API logs for errors
3. Verify environment configuration
4. Test with curl for webhook connectivity 