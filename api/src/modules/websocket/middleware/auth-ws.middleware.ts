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

      if (!token) {
        socket.data.user = null;
        return next();
      }

      const payload = await jwtService.verifyAsync(token);

      const user = await jwtStrategy.validate(payload);

      if (!user) {
        throw new Error('User not found');
      }

      socket.data.user = user;
      next();
    } catch (error) {
      socket.data.user = null;
      next();
    }
  };
};
