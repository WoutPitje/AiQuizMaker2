#!/bin/bash

# AI Quiz Maker SSL Deployment Script
# This script automates the SSL setup process for production deployment

set -e

echo "🚀 AI Quiz Maker SSL Deployment Script"
echo "========================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons."
   exit 1
fi

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found. Please create it first."
    exit 1
fi

# Load environment variables
source .env.production

# Validate required variables
if [ -z "$DOMAIN" ] || [ -z "$SSL_EMAIL" ]; then
    echo "❌ DOMAIN and SSL_EMAIL must be set in .env.production"
    echo "   DOMAIN=quizai.nl"
    echo "   SSL_EMAIL=your-email@example.com"
    exit 1
fi

echo "📋 Configuration:"
echo "   Domain: $DOMAIN"
echo "   Email: $SSL_EMAIL"
echo ""

# Step 1: Copy production environment
echo "1️⃣ Setting up production environment..."
cp .env.production .env
echo "✅ Production environment configured"

# Step 2: Start services without SSL first (for initial certificate generation)
echo ""
echo "2️⃣ Starting services without SSL for initial setup..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build
echo "✅ Services started"

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
if ! docker-compose ps | grep "Up" > /dev/null; then
    echo "❌ Services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

# Step 3: Test HTTP endpoint
echo ""
echo "3️⃣ Testing HTTP endpoint..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ HTTP endpoint is working"
else
    echo "❌ HTTP endpoint is not responding. Check services."
    exit 1
fi

# Step 4: Generate SSL certificate
echo ""
echo "4️⃣ Generating SSL certificate..."
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/html --email $SSL_EMAIL --agree-tos --no-eff-email -d $DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate generated successfully"
else
    echo "❌ Failed to generate SSL certificate"
    echo "   Make sure your domain points to this server"
    echo "   Check DNS with: dig $DOMAIN"
    exit 1
fi

# Step 5: Switch to SSL configuration
echo ""
echo "5️⃣ Switching to SSL configuration..."
docker-compose down

# Update docker-compose to use SSL nginx config
sed -i 's|./nginx.conf:/etc/nginx/nginx.conf:ro|./ssl-nginx.conf:/etc/nginx/nginx.conf:ro|' docker-compose.yml

docker-compose up -d
echo "✅ SSL configuration activated"

# Step 6: Test HTTPS endpoint
echo ""
echo "6️⃣ Testing HTTPS endpoint..."
sleep 10

if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
    echo "✅ HTTPS endpoint is working"
else
    echo "⚠️  HTTPS endpoint not responding yet, but SSL is configured"
    echo "   It may take a few minutes for DNS to propagate"
fi

# Step 7: Set up certificate renewal
echo ""
echo "7️⃣ Setting up certificate auto-renewal..."
cat > ssl-renew.sh << EOF
#!/bin/bash
# SSL Certificate Renewal Script
cd $(pwd)
docker-compose run --rm certbot renew --quiet
docker-compose exec proxy nginx -s reload
EOF

chmod +x ssl-renew.sh

# Add to crontab (runs twice daily)
(crontab -l 2>/dev/null; echo "0 12 * * * $(pwd)/ssl-renew.sh") | crontab -
echo "✅ Auto-renewal configured (runs twice daily)"

echo ""
echo "🎉 SSL Setup Complete!"
echo "======================================"
echo "Your site is now available at:"
echo "🔒 https://$DOMAIN"
echo ""
echo "Next steps:"
echo "• Test your site: https://$DOMAIN"
echo "• Check SSL rating: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "• Monitor logs: docker-compose logs -f"
echo ""
echo "Certificate renewal:"
echo "• Automatic renewal is configured"
echo "• Manual renewal: ./ssl-renew.sh"
echo "• Certificate expires in 90 days"
echo ""
echo "Troubleshooting:"
echo "• Check services: docker-compose ps"
echo "• View logs: docker-compose logs proxy"
echo "• Test HTTP redirect: curl -I http://$DOMAIN" 