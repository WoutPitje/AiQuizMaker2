import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Secure CORS middleware - only allow specific origins
  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    console.log(`CORS: ${req.method} ${req.url} from origin: ${origin}`);
    
    // Define allowed origins
    const allowedOrigins = [
      'https://quizai.nl',
      'https://www.quizai.nl',
      'https://api.quizai.nl',
      'https://www.api.quizai.nl',
      'http://localhost:3000',   // Local development
      'https://localhost:3000'   // Local development with HTTPS
    ];
    
    // Check if origin is allowed or if it's a Cloud Run domain
    const isAllowed = allowedOrigins.includes(origin) || 
                     (origin && origin.endsWith('.run.app'));
    
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      console.log(`CORS: Allowed origin: ${origin}`);
    } else {
      console.log(`CORS: Rejected origin: ${origin}`);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control,X-Requested-With,Accept,Accept-Language');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // SSE-specific headers for streaming support
    if (req.url && req.url.includes('quiz/generate-stream/')) {
      res.setHeader('Access-Control-Expose-Headers', 'Content-Type,Cache-Control,Connection');
    }
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      console.log('CORS: Handling OPTIONS preflight request');
      res.status(200).end();
      return;
    }
    
    next();
  });
  
  const port = process.env.PORT || 3001; // Backend uses port 3001
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Server running on http://localhost:${port}`);
}
bootstrap();
