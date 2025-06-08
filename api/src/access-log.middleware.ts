import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AccessLogService } from './access-log.service';

@Injectable()
export class AccessLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AccessLogMiddleware.name);

  constructor(private readonly accessLogService: AccessLogService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    
    // Get client IP address (handle proxies and load balancers)
    const ip = this.getClientIP(req);
    
    // Track the request after it completes
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      // Only log actual API calls, skip static files and health checks
      if (this.shouldLogRequest(req.path)) {
        this.accessLogService.logApiAccess({
          ip,
          userAgent: req.get('User-Agent') || 'Unknown',
          method: req.method,
          url: req.originalUrl || req.url,
          referer: req.get('Referer'),
          responseTime,
          statusCode: res.statusCode,
          sessionId: this.extractSessionId(req),
        });
      }
    });

    next();
  }

  private getClientIP(req: Request): string {
    // Check various headers for the real IP (in order of preference)
    const forwarded = req.get('X-Forwarded-For');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return req.get('X-Real-IP') || 
           req.get('CF-Connecting-IP') || // Cloudflare
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           (req.connection as any)?.socket?.remoteAddress ||
           'unknown';
  }

  private shouldLogRequest(path: string): boolean {
    // Skip logging for these paths
    const skipPaths = [
      '/favicon.ico',
      '/robots.txt',
      '/health',
      '/ping',
      '/_nuxt/',
      '/assets/',
      '/static/',
    ];
    
    return !skipPaths.some(skipPath => path.startsWith(skipPath));
  }

  private extractSessionId(req: Request): string | undefined {
    // Try to extract session ID from various sources
    const sessionCookie = req.cookies?.session;
    const authHeader = req.get('Authorization');
    
    if (sessionCookie) {
      return sessionCookie;
    }
    
    if (authHeader) {
      // Extract session/token from auth header if present
      return authHeader.substring(0, 20) + '...'; // Truncate for privacy
    }
    
    return undefined;
  }
} 