import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileServerService } from './file-server.service';
import { QuizmakerService } from './quizmaker.service';
import { AiService } from './ai.service';
import { AccessLogService } from './access-log.service';
import { AccessLogMiddleware } from './access-log.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, FileServerService, QuizmakerService, AiService, AccessLogService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AccessLogMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
