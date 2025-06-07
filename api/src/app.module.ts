import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileServerService } from './file-server.service';
import { QuizmakerService } from './quizmaker.service';
import { AiService } from './ai.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, FileServerService, QuizmakerService, AiService],
})
export class AppModule {}
