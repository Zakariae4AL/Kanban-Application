import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database.options';

process.loadEnvFile?.('.env');

/** Used by the TypeORM CLI (npm run migration:run / migration:revert). */
export default new DataSource(
  databaseOptions({
    DB_TYPE: process.env.DB_TYPE === 'postgres' ? 'postgres' : 'sqljs',
    DB_SQLITE_PATH: process.env.DB_SQLITE_PATH ?? 'data/kanban.sqlite',
    DATABASE_URL: process.env.DATABASE_URL,
  }),
);
