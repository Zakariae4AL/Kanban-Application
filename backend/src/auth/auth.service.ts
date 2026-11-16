import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BoardsService } from '../boards/boards.service';
import { PublicUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';

export type AuthResult = { user: PublicUser; token: string };

@Injectable()
export class AuthService implements OnModuleInit {
  /** Compared against when the email is unknown, so response time doesn't reveal which emails exist. */
  private dummyHash = '';

  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly boards: BoardsService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await this.passwords.hash('dummy-password-for-timing');
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash: await this.passwords.hash(dto.password),
    });

    await this.boards.createStarterBoard(user.id, dto.locale);

    return this.issue(UsersService.toPublic(user));
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    const valid = await this.passwords.verify(dto.password, user?.passwordHash ?? this.dummyHash);

    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.issue(UsersService.toPublic(user));
  }

  private async issue(user: PublicUser): Promise<AuthResult> {
    return { user, token: await this.jwt.signAsync({ sub: user.id }) };
  }
}
