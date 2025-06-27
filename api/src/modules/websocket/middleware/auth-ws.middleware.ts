import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';

export type SocketMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => void;

export const AuthWsMiddleware = (
  jwtService: JwtService,
  jwtStrategy: JwtStrategy,
): SocketMiddleware => {
  return async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake?.auth?.token || socket.handshake?.query?.token;

      console.log('🔐 WebSocket Auth Debug:');
      console.log('  - handshake.auth:', socket.handshake?.auth);
      console.log('  - handshake.query:', socket.handshake?.query);
      console.log('  - extracted token:', token ? token.substring(0, 20) + '...' : 'none');

      if (!token) {
        console.log('❌ No token found, setting user to null');
        socket.data.user = null;
        return next();
      }

      const payload = await jwtService.verifyAsync(token);

      const user = await jwtStrategy.validate(payload);

      if (!user) {
        console.log('❌ JWT validation failed - user not found');
        throw new Error('User not found');
      }

      console.log('✅ WebSocket authenticated user:', user.id);
      socket.data.user = user;
      next();
    } catch (error) {
      console.log('❌ WebSocket auth error:', error.message);
      socket.data.user = null;
      next();
    }
  };
};
