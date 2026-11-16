import { validateEnv } from './env.validation';

const base = { JWT_SECRET: 'x'.repeat(32) };

describe('validateEnv', () => {
  it('applies safe defaults', () => {
    const env = validateEnv(base);

    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      DB_TYPE: 'sqljs',
      JWT_EXPIRES_IN: '7d',
      THROTTLE_AUTH_LIMIT: 10,
    });
  });

  it('converts numeric strings', () => {
    expect(validateEnv({ ...base, PORT: '8081' }).PORT).toBe(8081);
  });

  it('refuses a missing or short JWT secret', () => {
    expect(() => validateEnv({})).toThrow(/JWT_SECRET/);
    expect(() => validateEnv({ JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it('refuses the example secret in production', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'change-me-to-a-long-random-string-of-at-least-32-chars',
      }),
    ).toThrow(/must be changed/);
  });

  it('requires DATABASE_URL for PostgreSQL', () => {
    expect(() => validateEnv({ ...base, DB_TYPE: 'postgres' })).toThrow(/DATABASE_URL/);
    expect(
      validateEnv({ ...base, DB_TYPE: 'postgres', DATABASE_URL: 'postgres://x' }).DB_TYPE,
    ).toBe('postgres');
  });

  it('refuses unknown values', () => {
    expect(() => validateEnv({ ...base, DB_TYPE: 'mongodb' })).toThrow();
    expect(() => validateEnv({ ...base, PORT: '99999' })).toThrow();
  });
});
