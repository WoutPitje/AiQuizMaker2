import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../auth/entities/user.entity';

export const WsCurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User | null => {
    const client = ctx.switchToWs().getClient();
    return client.data?.user || null;
  },
);
