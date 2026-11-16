import { DataSourceOptions } from 'typeorm';
import { entities } from './entities';
import { InitialSchema1763251200000 } from './migrations/1763251200000-InitialSchema';

export type DatabaseEnv = {
  DB_TYPE: 'sqljs' | 'postgres';
  DB_SQLITE_PATH?: string;
  DATABASE_URL?: string;
};

/**
 * Builds the TypeORM options from the environment.
 * The schema is always managed by migrations (never `synchronize`),
 * and pending migrations run automatically on startup.
 */
export function databaseOptions(env: DatabaseEnv): DataSourceOptions {
  const common = {
    entities,
    migrations: [InitialSchema1763251200000],
    migrationsRun: true,
    synchronize: false,
  };

  if (env.DB_TYPE === 'postgres') {
    return { ...common, type: 'postgres', url: env.DATABASE_URL };
  }

  // An empty path keeps the SQLite database in memory (used by the tests).
  return env.DB_SQLITE_PATH
    ? { ...common, type: 'sqljs', location: env.DB_SQLITE_PATH, autoSave: true }
    : { ...common, type: 'sqljs' };
}
