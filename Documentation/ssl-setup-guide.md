# SSL Setup Guide

This guide explains how to add SSL/HTTPS support to your 🧠 QuizAi application running on a VPS with Docker Compose.

## Overview

The SSL setup uses:
- **Let's Encrypt** for free SSL certificates
- **Certbot** for automatic certificate management
- **Nginx** as reverse proxy with SSL termination
- **Docker Compose** for orchestration

## Prerequisites

1. **Domain Setup**: Your domain (quizai.nl) must point to your VPS IP address
2. **DNS Configuration**: Ensure A record points to your server
3. **Port Access**: Ports 80 and 443 must be open on your VPS
4. **Email Address**: Valid email for Let's Encrypt notifications

## Quick Setup

### 1. Configure Environment Variables

Edit `.env.production`:
```bash
# SSL Configuration
DOMAIN=quizai.nl
SSL_EMAIL=your-email@example.com

# Production URLs with HTTPS
WEB_URL=https://quizai.nl
API_URL=https://quizai.nl/api
```

### 2. Run Automated Setup

```bash
# Make sure you're in the project directory
./deploy-ssl.sh
```

The script will:
1. ✅ Set up production environment
2. ✅ Start services for initial setup
3. ✅ Generate SSL certificate via Let's Encrypt
4. ✅ Switch to SSL-enabled nginx configuration
5. ✅ Configure automatic certificate renewal

## Manual Setup (Alternative)

If you prefer manual setup or need to troubleshoot:

### Step 1: Update Environment
```bash
cp .env.production .env
```

### Step 2: Start Initial Services
```bash
docker-compose up -d --build
```

### Step 3: Generate Certificate
```bash
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/html \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d quizai.nl
```

### Step 4: Switch to SSL Configuration
```bash
# Stop services
docker-compose down

# Update docker-compose.yml to use ssl-nginx.conf
sed -i 's|./nginx.conf:/etc/nginx/nginx.conf:ro|./ssl-nginx.conf:/etc/nginx/nginx.conf:ro|' docker-compose.yml

# Start with SSL
docker-compose up -d
```

## Configuration Files

### docker-compose.yml Changes
- Added port 443 for HTTPS
- Added certbot service for certificate management
- Added volumes for certificate storage
- Added SSL nginx configuration mount

### ssl-nginx.conf Features
- **HTTP to HTTPS redirect**: All HTTP traffic redirected to HTTPS
- **Let's Encrypt support**: Serves ACME challenges for certificate validation
- **Security Headers**: HSTS, CSP, and other security headers
- **SSL Configuration**: Modern TLS 1.2/1.3 with secure ciphers
- **CORS Updates**: Updated for HTTPS domain

## Certificate Management

### Automatic Renewal
Certificate renewal is automated via cron job:
```bash
# Runs twice daily at noon
0 12 * * * /path/to/your/project/ssl-renew.sh
```

### Manual Renewal
```bash
# Run renewal script
./ssl-renew.sh

# Or manually:
docker-compose run --rm certbot renew
docker-compose exec proxy nginx -s reload
```

### Check Certificate Status
```bash
# View certificate information
docker-compose run --rm certbot certificates

# Check expiration
openssl x509 -in /path/to/cert -text -noout | grep "Not After"
```

## Security Features

### SSL/TLS Configuration
- **Protocols**: TLS 1.2 and 1.3 only
- **Ciphers**: Strong cipher suites
- **HSTS**: HTTP Strict Transport Security enabled
- **Session Cache**: Optimized for performance

### Security Headers
- `Strict-Transport-Security`: Forces HTTPS for 1 year
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: XSS protection
- `Referrer-Policy`: Controls referrer information
- `Content-Security-Policy`: Basic CSP implementation

### CORS Configuration
- Updated to use HTTPS domain
- Credentials support enabled
- Specific origins instead of wildcards

## Troubleshooting

### Common Issues

1. **Certificate Generation Fails**
   ```bash
   # Check DNS resolution
   dig quizai.nl
   
   # Verify domain points to your server
   curl -I http://quizai.nl/.well-known/acme-challenge/test
   ```

2. **HTTPS Not Working**
   ```bash
   # Check nginx configuration
   docker-compose exec proxy nginx -t
   
   # Check certificate files
   docker-compose exec proxy ls -la /etc/letsencrypt/live/quizai.nl/
   ```

3. **Mixed Content Warnings**
   - Update all HTTP URLs to HTTPS in your frontend
   - Check browser console for mixed content errors

### Debug Commands

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs proxy
docker-compose logs certbot

# Test SSL certificate
curl -vI https://quizai.nl

# Check certificate chain
echo | openssl s_client -servername quizai.nl -connect quizai.nl:443
```

### Log Locations

```bash
# Nginx logs
docker-compose logs proxy

# Certbot logs
docker-compose run --rm certbot logs

# System logs (on host)
journalctl -u docker
```

## Monitoring & Maintenance

### Health Checks
- **HTTP Redirect**: `curl -I http://quizai.nl` should return 301
- **HTTPS Response**: `curl -I https://quizai.nl` should return 200
- **SSL Grade**: Check at https://www.ssllabs.com/ssltest/

### Performance Monitoring
```bash
# Check certificate overhead
time curl -I https://quizai.nl

# Monitor connection stats
docker stats
```

### Regular Maintenance
1. **Monthly**: Check SSL certificate expiration
2. **Quarterly**: Review security headers and configuration
3. **Annually**: Update cipher suites and TLS versions

## Rollback Plan

If SSL setup causes issues:

```bash
# Switch back to HTTP-only
docker-compose down
sed -i 's|./ssl-nginx.conf:/etc/nginx/nginx.conf:ro|./nginx.conf:/etc/nginx/nginx.conf:ro|' docker-compose.yml
docker-compose up -d
```

## Advanced Configuration

### Custom SSL Certificate
If you have your own SSL certificate:

1. Place certificate files in `./ssl/` directory
2. Update `ssl-nginx.conf` certificate paths
3. Remove certbot service from docker-compose.yml

### Multiple Domains
To support multiple domains:

1. Update `DOMAIN` in environment to include all domains
2. Generate certificate for all domains:
   ```bash
   docker-compose run --rm certbot certonly ... -d domain1.com -d domain2.com
   ```

### CDN Integration
For CDN usage (CloudFlare, etc.):
1. Configure CDN for HTTPS
2. Update `server_name` in nginx configuration
3. Consider using Full (Strict) SSL mode in CDN

## Security Best Practices

1. **Keep Certificates Updated**: Monitor expiration dates
2. **Regular Security Scans**: Use SSL Labs or similar tools
3. **Monitor Logs**: Watch for unusual SSL/TLS traffic
4. **Backup Certificates**: Store certificate backups securely
5. **Update Dependencies**: Keep nginx and certbot updated 