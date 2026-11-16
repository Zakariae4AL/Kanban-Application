/**
 * Runs before any test file is loaded, so the configuration the app reads
 * at import time is the test configuration (never the developer's .env).
 */
const usingPostgres = process.env.TEST_DB === 'postgres';

Object.assign(process.env, {
  NODE_ENV: 'test',
  JWT_SECRET: 'test-secret-that-is-long-enough-for-validation-1234',
  JWT_EXPIRES_IN: '1h',
  CORS_ORIGINS: 'http://localhost:5173',
  DB_TYPE: usingPostgres ? 'postgres' : 'sqljs',
  DB_SQLITE_PATH: '',
  DATABASE_URL:
    process.env.TEST_DATABASE_URL ?? 'postgres://kanban:kanban@127.0.0.1:5432/kanban_test',
  THROTTLE_AUTH_LIMIT: '1000',
});
