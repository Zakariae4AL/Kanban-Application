import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test' = 'development';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  CORS_ORIGINS = 'http://localhost:5173';

  /** Refuses to start with a short or default secret. */
  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN = '7d';

  @IsIn(['sqljs', 'postgres'])
  DB_TYPE: 'sqljs' | 'postgres' = 'sqljs';

  @IsOptional()
  @IsString()
  DB_SQLITE_PATH?: string = 'data/kanban.sqlite';

  @ValidateIf((env: EnvironmentVariables) => env.DB_TYPE === 'postgres')
  @IsString()
  DATABASE_URL?: string;

  /** Max login/register attempts per minute and per IP. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  THROTTLE_AUTH_LIMIT = 10;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(env, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors.flatMap((e) => Object.values(e.constraints ?? {})).join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${details}`);
  }

  if (env.NODE_ENV === 'production' && env.JWT_SECRET.startsWith('change-me')) {
    throw new Error('JWT_SECRET must be changed before running in production.');
  }

  return env;
}
