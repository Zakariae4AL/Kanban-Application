import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import { User } from '../users/user.entity';
import { IS_PUBLIC_KEY } from './auth.constants';

/** Marks a route as reachable without authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Injects the authenticated user. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User =>
    ctx.switchToHttp().getRequest<Request & { user: User }>().user,
);
