import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [ConfigController],
})
export class ConfigModule {}
