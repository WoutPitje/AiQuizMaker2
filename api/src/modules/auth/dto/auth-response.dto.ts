import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class AuthResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'User registered successfully',
  })
  message: string;

  @ApiProperty({ description: 'User information', required: false })
  user?: Partial<User>;

  @ApiProperty({
    description: 'JWT access token',
    required: false,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken?: string;

  @ApiProperty({
    description: 'JWT refresh token',
    required: false,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken?: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    required: false,
    example: 3600,
  })
  expiresIn?: number;
}

export class UserProfileDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    required: false,
    example: 'John',
  })
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    required: false,
    example: 'Doe',
  })
  lastName?: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  fullName: string;

  @ApiProperty({ description: 'User initials', example: 'JD' })
  initials: string;

  @ApiProperty({ description: 'Email verification status', example: false })
  isVerified: boolean;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last login date',
    required: false,
    example: '2024-01-01T00:00:00.000Z',
  })
  lastLoginAt?: Date;
}
