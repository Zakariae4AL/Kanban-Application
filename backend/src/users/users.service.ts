import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'createdAt'>;

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  /** Includes the password hash, for authentication only. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async create(data: { email: string; name: string; passwordHash: string }): Promise<User> {
    const email = data.email.toLowerCase();

    if (await this.users.existsBy({ email })) {
      throw new ConflictException('An account already exists with this email.');
    }

    return this.users.save(this.users.create({ ...data, email }));
  }

  static toPublic(user: User): PublicUser {
    return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
  }
}
