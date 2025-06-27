import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileServerService } from './file-server.service';
import { DatabaseInitService } from './database-init.service';

// Import new modules
import { AuthModule } from './modules/auth/auth.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { UploadModule } from './modules/upload/upload.module';
import { ConfigModule as AppConfigModule } from './modules/config/config.module';
import { StorageModule } from './modules/storage/storage.module';
import { AiModule } from './modules/ai/ai.module';
import { WebsocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Disable auto-sync for better control
        logging: configService.get('NODE_ENV') === 'development',
        dropSchema: false,
      }),
      inject: [ConfigService],
    }),
    // Import feature modules
    AuthModule,
    QuizModule,
    UploadModule,
    AppConfigModule,
    StorageModule,
    AiModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService, FileServerService, DatabaseInitService],
})
export class AppModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {
    // Middleware configuration can be added here
    // Example: consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
