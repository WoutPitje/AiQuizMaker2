# AI Quiz Maker

An intelligent quiz generation platform that transforms PDF documents into interactive quizzes using AI. Upload any educational content and get automatically generated questions perfect for studying or assessment.

## 🚀 Features

- **PDF to Quiz Conversion**: Upload any PDF and get AI-generated questions
- **Multiple Question Types**: Multiple choice, true/false, and short answer questions
- **Multi-language Support**: Generate quizzes in multiple languages
- **Magic Links**: Share quizzes easily with unique URLs
- **Modern UI**: Clean, responsive interface built with Nuxt 3
- **Cost-Effective Infrastructure**: Serverless architecture that scales to zero

## 🏗️ Architecture

The application uses a modern, cost-effective cloud architecture:

- **Frontend**: Nuxt 3 SSG (Static Site Generation) hosted on Google Cloud Storage
- **Backend**: NestJS API running on Cloud Run (scales to zero)
- **Storage**: Google Cloud Storage for PDFs and quiz data
- **CDN**: Cloudflare for HTTPS and global distribution
- **AI**: OpenAI GPT-4 for question generation

### Why This Architecture?

- **Low Cost**: ~$5/month for typical usage (no load balancer fees)
- **Scalable**: Both frontend and backend scale automatically
- **Secure**: HTTPS via Cloudflare, secure API on Cloud Run
- **Fast**: Static site with CDN, serverless API

## 📁 Project Structure

```
ai-quiz-maker/
├── api/                    # NestJS backend API
│   ├── src/               # Source code
│   └── Dockerfile         # Container configuration
├── web/                   # Nuxt 3 frontend
│   ├── pages/            # Application pages
│   ├── components/       # Vue components
│   └── composables/      # Vue composables
├── mobile_app/           # Flutter mobile app
├── terraform/            # Infrastructure as Code
│   ├── modules/          # Terraform modules
│   └── *.tf              # Terraform configurations
├── Documentation/        # Project documentation
└── deploy-*.sh          # Deployment scripts
```

## 🚀 Quick Start

### Prerequisites

- Google Cloud Platform account with billing enabled
- Node.js 18+ and npm
- Docker Desktop
- Terraform 1.0+
- gcloud CLI

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/ai-quiz-maker.git
cd ai-quiz-maker

# Copy environment files
cp env.example .env
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

### 2. Configure Environment

Edit `terraform/terraform.tfvars`:
```hcl
project_id = "your-gcp-project-id"
openai_api_key = "your-openai-api-key"
domain_name = "yourdomain.com"
```

### 3. Deploy Infrastructure

```bash
cd terraform
terraform init
terraform apply
```

### 4. Build and Deploy

Use the quick deploy script:
```bash
chmod +x quick-deploy.sh
./quick-deploy.sh your-project-id
```

Or deploy manually:
```bash
# Deploy API
cd api
./build-and-push.sh your-project-id
cd ../terraform
terraform apply

# Deploy Frontend
cd ../web
export CLOUD_RUN_URL=<your-api-url>
export GCP_PROJECT_ID=<your-project-id>
./deploy-web.sh
```

### 5. Configure Domain

For HTTPS with custom domain:
1. Add your domain to Cloudflare
2. Create CNAME record → `your-bucket.storage.googleapis.com`
3. Enable Cloudflare proxy
4. Set SSL/TLS to "Full" mode

## 🌐 Accessing Your Site

- **Direct (HTTP)**: `http://your-bucket.storage.googleapis.com`
- **Custom Domain (HTTPS)**: `https://yourdomain.com` (via Cloudflare)
- **API Health Check**: `https://your-api-url.run.app/health`

## 💻 Development

### Local Development

```bash
# API Development
cd api
npm install
npm run start:dev

# Frontend Development
cd web
npm install
npm run dev
```

### Environment Variables

Create `.env` files in both `api/` and `web/` directories. See `.env.example` for required variables.

## 📊 Cost Breakdown

- **Cloud Storage**: ~$0.02/GB/month
- **Cloud Run**: ~$0/month when idle (scales to zero)
- **Bandwidth**: ~$0.12/GB (free with Cloudflare)
- **Total**: Typically under $5/month

## 🔧 Key Scripts

- `deploy-api.sh` - Deploy API to Cloud Run
- `deploy-web.sh` - Deploy frontend to GCS
- `terraform/quick-deploy.sh` - Complete deployment script
- `api/build-and-push.sh` - Build and push Docker image

## 📚 Documentation

### Component Documentation
- [API Documentation](api/README.md) - Backend API setup and development
- [Web App Documentation](web/README.md) - Frontend development and deployment
- [Mobile App Documentation](mobile_app/README.md) - Flutter mobile app development
- [Infrastructure Documentation](terraform/README.md) - Terraform setup and deployment

### Detailed Guides
- [Static Hosting Setup](Documentation/static-hosting-gcs.md)
- [Docker Architecture](Documentation/docker-architecture.md)
- [Deployment Order](Documentation/deployment-order.md)
- [GCP Deployment Guide](Documentation/gcp-deployment-architecture.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🛟 Troubleshooting

### Common Issues

- **"Image not found" error**: Build and push Docker image first
- **CORS errors**: Check API CORS settings and bucket configuration
- **Domain not working**: Verify Cloudflare configuration

See [Documentation](Documentation/) for detailed troubleshooting guides.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Google Cloud Platform
- Cloudflare for CDN services
- The open-source community 