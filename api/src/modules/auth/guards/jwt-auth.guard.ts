import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // For public routes, try to authenticate but don't require it
      return this.optionalAuthenticate(context);
    }

    return super.canActivate(context);
  }

  private async optionalAuthenticate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch (error) {
      // Ignore authentication errors for public routes
    }
    return true;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // For public routes, return user if available, null otherwise
      return user || null;
    }

    // For protected routes, require authentication
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
