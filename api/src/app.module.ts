import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileServerService } from './file-server.service';
import { QuizmakerService } from './quizmaker.service';
import { AiService } from './ai.service';
import { GcsService } from './gcs.service';
import { StorageService } from './storage.service';
import { QuizWebSocketGateway } from './quiz-websocket.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    FileServerService, 
    QuizmakerService, 
    AiService, 
    GcsService,
    StorageService,
    QuizWebSocketGateway
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer
    //   .forRoutes('*'); // Apply to all routes
  }
}
