import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { sub: userId, sessionId } = payload;

    // Find user and verify they're still active
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        isActive: true,
      },
      relations: ['sessions'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Verify the session is still valid
    const session = user.sessions?.find((s) => s.id === sessionId && s.isValid);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return user;
  }
}
