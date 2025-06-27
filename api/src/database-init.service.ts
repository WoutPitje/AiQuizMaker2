import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class DatabaseInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async onApplicationBootstrap() {
    await this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      this.logger.log('Initializing database schema...');

      // Check if tables exist, if not create them
      const queryRunner = this.dataSource.createQueryRunner();

      try {
        // Create tables if they don't exist
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            is_verified BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            last_login_at TIMESTAMP
          );
        `);

        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS user_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            token_hash VARCHAR(255) NOT NULL,
            refresh_token_hash VARCHAR(255),
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            user_agent VARCHAR(255),
            ip_address INET,
            CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );
        `);

        // Create indexes if they don't exist
        await queryRunner.query(`
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        `);

        await queryRunner.query(`
          CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
        `);

        await queryRunner.query(`
          CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
        `);

        // Create updated_at trigger if it doesn't exist
        await queryRunner.query(`
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = CURRENT_TIMESTAMP;
              RETURN NEW;
          END;
          $$ language 'plpgsql';
        `);

        await queryRunner.query(`
          DROP TRIGGER IF EXISTS update_users_updated_at ON users;
          CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        await queryRunner.query(`
          DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON user_sessions;
          CREATE TRIGGER update_user_sessions_updated_at 
            BEFORE UPDATE ON user_sessions 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        this.logger.log('✅ Database schema initialized successfully');
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error('❌ Failed to initialize database schema:', error);
      throw error;
    }
  }
}
