import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend communication
  app.enableCors({
    origin: ['http://localhost:3000', 'http://142.93.225.222:3000', 'https://quizai.nl', 'http://quizai.nl'], // Frontend port
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  const port = process.env.PORT || 3001; // Backend uses port 3001
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Server running on http://localhost:${port}`);
}
bootstrap();
