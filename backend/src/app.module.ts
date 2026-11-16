import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { Request } from 'express';
import { AuthModule } from './auth/auth.module';
import { BoardsModule } from './boards/boards.module';
import { EnvironmentVariables, validateEnv } from './config/env.validation';
import { databaseOptions } from './database/database.options';
import { HealthController } from './health.controller';
import { TasksModule } from './tasks/tasks.module';

const AUTH_ROUTES = /\/auth\/(login|register)$/;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        databaseOptions({
          DB_TYPE: config.get('DB_TYPE', { infer: true }),
          DB_SQLITE_PATH: config.get('DB_SQLITE_PATH', { infer: true }),
          DATABASE_URL: config.get('DATABASE_URL', { infer: true }),
        }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => [
        // General limit for every route, per IP.
        { name: 'default', ttl: 60_000, limit: 300 },
        // Strict limit on login/register to slow down password guessing.
        {
          name: 'auth',
          ttl: 60_000,
          limit: config.get('THROTTLE_AUTH_LIMIT', { infer: true }),
          skipIf: (ctx) => !AUTH_ROUTES.test(ctx.switchToHttp().getRequest<Request>().path),
        },
      ],
    }),
    AuthModule,
    BoardsModule,
    TasksModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
