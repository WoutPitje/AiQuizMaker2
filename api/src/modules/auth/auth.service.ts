import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`New user registered: ${email}`);

    // Create session and tokens
    const { accessToken, refreshToken } = await this.createSession(savedUser);

    return {
      success: true,
      message: 'User registered successfully',
      user: this.transformUserProfile(savedUser),
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpirationTime(),
    };
  }

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'passwordHash',
        'firstName',
        'lastName',
        'isVerified',
        'isActive',
        'createdAt',
        'lastLoginAt',
      ],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Create session and tokens
    const { accessToken, refreshToken } = await this.createSession(
      user,
      userAgent,
      ipAddress,
    );

    this.logger.log(`User logged in: ${email}`);

    return {
      success: true,
      message: 'Login successful',
      user: this.transformUserProfile(user),
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpirationTime(),
    };
  }

  async logout(
    userId: string,
    sessionId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Remove the specific session
    await this.sessionRepository.delete({ id: sessionId, userId });

    this.logger.log(`User logged out: ${userId}`);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  async logoutAll(
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Remove all sessions for the user
    await this.sessionRepository.delete({ userId });

    this.logger.log(`User logged out from all devices: ${userId}`);

    return {
      success: true,
      message: 'Logged out from all devices successfully',
    };
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.transformUserProfile(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken);
      const { sub: userId, sessionId } = payload;

      // Find the session
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId, userId },
        relations: ['user'],
      });

      if (!session || session.isExpired || !session.user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newPayload: JwtPayload = {
        sub: userId,
        email: session.user.email,
        sessionId: session.id,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '1h'),
      });

      return {
        success: true,
        message: 'Token refreshed successfully',
        user: this.transformUserProfile(session.user),
        accessToken,
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async createSession(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Create session record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = this.sessionRepository.create({
      userId: user.id,
      expiresAt,
      userAgent,
      ipAddress,
      tokenHash: '', // Will be updated after token creation
      refreshTokenHash: '', // Will be updated after token creation
    });

    const savedSession = await this.sessionRepository.save(session);

    // Create JWT payload
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      sessionId: savedSession.id,
    };

    // Generate tokens
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '1h'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    });

    // Hash and store tokens
    savedSession.tokenHash = await bcrypt.hash(accessToken, 10);
    savedSession.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.sessionRepository.save(savedSession);

    return { accessToken, refreshToken };
  }

  private transformUserProfile(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      initials: user.initials,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private getTokenExpirationTime(): number {
    const expiration = this.configService.get<string>('JWT_EXPIRATION', '1h');
    // Convert to seconds (JWT standard)
    if (expiration.endsWith('h')) {
      return parseInt(expiration) * 3600;
    } else if (expiration.endsWith('m')) {
      return parseInt(expiration) * 60;
    } else if (expiration.endsWith('d')) {
      return parseInt(expiration) * 24 * 3600;
    }
    return 3600; // Default 1 hour
  }

  // Cleanup expired sessions (can be called by a cron job)
  async cleanupExpiredSessions(): Promise<void> {
    const deletedCount = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();

    if (deletedCount.affected && deletedCount.affected > 0) {
      this.logger.log(`Cleaned up ${deletedCount.affected} expired sessions`);
    }
  }
}
