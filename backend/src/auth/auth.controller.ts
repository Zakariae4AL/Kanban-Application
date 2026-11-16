import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { EnvironmentVariables } from '../config/env.validation';
import { User } from '../users/user.entity';
import { PublicUser, UsersService } from '../users/users.service';
import { AUTH_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from './decorators';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const parseDuration = (value: string): number => {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 7 * 24 * 3600 * 1000;
  const unit = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] as 's' | 'm' | 'h' | 'd'];
  return Number(match[1]) * unit * 1000;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.register(dto);
    this.setCookie(res, token);
    return { user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.login(dto);
    this.setCookie(res, token);
    return { user };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(AUTH_COOKIE, this.cookieOptions());
  }

  @Get('me')
  me(@CurrentUser() user: User): PublicUser {
    return UsersService.toPublic(user);
  }

  private setCookie(res: Response, token: string): void {
    res.cookie(AUTH_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: parseDuration(this.config.get('JWT_EXPIRES_IN', { infer: true })),
    });
  }

  /** httpOnly (not readable by JavaScript), SameSite=Lax (CSRF protection), Secure in production. */
  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      path: '/',
    };
  }
}
