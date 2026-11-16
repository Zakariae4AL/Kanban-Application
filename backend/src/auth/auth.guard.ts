import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';
import { AUTH_COOKIE, IS_PUBLIC_KEY } from './auth.constants';

/**
 * Global guard: every route requires a valid token unless marked @Public().
 * The token lives in an httpOnly cookie, so page scripts can never read it.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException();

    let payload: { sub?: string };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }

    // Make sure the account still exists (deleted users lose access immediately).
    const user = payload.sub ? await this.users.findById(payload.sub) : null;
    if (!user) throw new UnauthorizedException();

    request.user = user;
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.[AUTH_COOKIE] || undefined;
  }
}
