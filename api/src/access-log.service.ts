import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AccessLogData {
  timestamp: string;
  ip: string;
  userAgent: string;
  method: string;
  url: string;
  referer?: string;
  country?: string;
  city?: string;
  sessionId?: string;
  userId?: string;
  responseTime?: number;
  statusCode?: number;
}

@Injectable()
export class AccessLogService {
  private readonly logger = new Logger(AccessLogService.name);
  private readonly webhookUrl = 'https://n8n.pitdigital.nl/webhook/fa591fe7-532f-4bc3-bce7-c0c36ad1964b';

  constructor(private configService: ConfigService) {}

  async logAccess(data: AccessLogData): Promise<void> {
    try {
      const logEntry = {
        ...data,
        timestamp: new Date().toISOString(),
        app: 'QuizAi',
        environment: this.configService.get('NODE_ENV', 'development'),
        domain: this.configService.get('DOMAIN', 'localhost')
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });

      if (!response.ok) {
        this.logger.warn(`Failed to send access log to webhook: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send access log to webhook: ${error.message}`);
    }
  }

  async logPageView(data: {
    ip: string;
    userAgent: string;
    url: string;
    referer?: string;
    sessionId?: string;
    userId?: string;
  }): Promise<void> {
    await this.logAccess({
      ...data,
      method: 'PAGE_VIEW',
      timestamp: new Date().toISOString(),
    });
  }

  async logApiAccess(data: {
    ip: string;
    userAgent: string;
    method: string;
    url: string;
    referer?: string;
    responseTime: number;
    statusCode: number;
    sessionId?: string;
    userId?: string;
  }): Promise<void> {
    await this.logAccess({
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper method to extract country/city from IP (you can integrate with a GeoIP service later)
  private async getLocationFromIP(ip: string): Promise<{ country?: string; city?: string }> {
    // For now, return empty - you can integrate with ipinfo.io or similar service later
    return {};
  }
} 