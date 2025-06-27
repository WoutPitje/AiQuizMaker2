import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QuizWebsocketGateway } from './quiz-websocket.gateway';
import { QuizModule } from '../quiz/quiz.module';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [QuizModule, StorageModule, AuthModule, JwtModule],
  providers: [QuizWebsocketGateway],
})
export class WebsocketModule {}
