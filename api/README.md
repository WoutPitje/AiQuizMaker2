# AI Quiz Maker API

NestJS backend API for AI Quiz Maker that handles PDF processing, quiz generation, and data management.

## 🚀 Features

- PDF upload and processing
- AI-powered quiz generation using OpenAI GPT-4
- RESTful API endpoints
- Google Cloud Storage integration
- CORS support for cross-origin requests
- Health check endpoint
- Containerized with Docker

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **AI**: OpenAI API
- **Storage**: Google Cloud Storage
- **Deployment**: Cloud Run
- **Container**: Docker

## 📁 Project Structure

```
api/
├── src/
│   ├── app.module.ts          # Main application module
│   ├── main.ts                # Application entry point
│   ├── config/                # Configuration management
│   ├── pdf/                   # PDF processing module
│   ├── quiz/                  # Quiz generation module
│   └── storage/               # Cloud storage integration
├── test/                      # Test files
├── Dockerfile                 # Container configuration
├── build-and-push.sh         # Build script for Cloud Run
└── package.json              # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Cloud SDK (for deployment)
- Docker (for containerization)

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   OPENAI_API_KEY=your-openai-api-key
   GCS_BUCKET_NAME=your-bucket-name
   PORT=3000
   ```

3. **Run in development mode**:
   ```bash
   npm run start:dev
   ```

   The API will be available at `http://localhost:3000`

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚢 Deployment

### Deploy to Cloud Run

1. **Build and push Docker image**:
   ```bash
   ./build-and-push.sh your-project-id
   ```

2. **Deploy using gcloud**:
   ```bash
   gcloud run deploy aiquizmaker-api \
     --image europe-west4-docker.pkg.dev/your-project-id/aiquizmaker-docker/api:latest \
     --region europe-west4 \
     --allow-unauthenticated
   ```

### Using Terraform

The infrastructure is managed by Terraform. See the [Infrastructure Documentation](../terraform/README.md) for details.

## 📡 API Endpoints

- `GET /health` - Health check endpoint
- `POST /upload` - Upload PDF file
- `POST /generate-quiz-stream/:filename` - Generate quiz from PDF
- `GET /quiz/magic/:magicLink` - Get quiz by magic link
- `GET /config` - Get API configuration
- `GET /languages` - Get supported languages

## 🔧 Configuration

The API uses environment variables for configuration:

- `OPENAI_API_KEY` - OpenAI API key for GPT-4
- `GCS_BUCKET_NAME` - Google Cloud Storage bucket name
- `CORS_ORIGINS` - Allowed CORS origins
- `PORT` - Server port (default: 3000)

## 🐳 Docker

Build the Docker image:
```bash
docker build -t aiquizmaker-api .
```

Run locally:
```bash
docker run -p 3000:3000 --env-file .env aiquizmaker-api
```

**Important**: Always build for linux/amd64 when deploying to Cloud Run:
```bash
docker build --platform linux/amd64 -t aiquizmaker-api .
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
