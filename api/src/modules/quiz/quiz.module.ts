import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { QuizEntity } from './entities/quiz.entity';
import { StorageModule } from '../storage/storage.module';
import { AiModule } from '../ai/ai.module';
import { FileServerService } from '../../file-server.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuizEntity]), StorageModule, AiModule],
  controllers: [QuizController],
  providers: [QuizService, FileServerService],
  exports: [QuizService],
})
export class QuizModule {}
