import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { validateEnv } from '../src/config/env.validation';

/**
 * End-to-end tests run against SQLite in memory by default.
 * Set TEST_DB=postgres (and TEST_DATABASE_URL) to run the same suite on PostgreSQL.
 */
export const usingPostgres = process.env.TEST_DB === 'postgres';

export async function createTestApp(env: Record<string, string> = {}): Promise<INestApplication> {
  if (usingPostgres) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await client.end();
  }

  // Base values come from setup-env.ts; `env` overrides them for this app only.
  const config = validateEnv({ ...process.env, ...env });

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ConfigService)
    .useValue(new ConfigService(config))
    .compile();
  const app = configureApp(moduleRef.createNestApplication());
  await app.init();
  return app;
}

let counter = 0;

/** Registers a fresh user and returns an agent that keeps the auth cookie. */
export async function signUp(
  app: INestApplication,
  overrides: Partial<{ name: string; email: string; password: string; locale: string }> = {},
): Promise<{ agent: TestAgent; user: { id: string; email: string; name: string } }> {
  const agent = request.agent(app.getHttpServer());
  counter += 1;
  const res = await agent
    .post('/api/v1/auth/register')
    .send({
      name: `User ${counter}`,
      email: `user${counter}-${Date.now()}@example.com`,
      password: 'Secret123',
      ...overrides,
    })
    .expect(201);
  return { agent, user: res.body.user };
}

export type BoardBody = {
  id: string;
  name: string;
  columns: {
    id: string;
    name: string;
    position: number;
    tasks: {
      id: string;
      title: string;
      position: number;
      columnId: string;
      subtasks: { id: string; title: string; isCompleted: boolean }[];
    }[];
  }[];
};

export async function createBoard(
  agent: TestAgent,
  columns = ['Todo', 'Doing', 'Done'],
  name = 'Test board',
): Promise<BoardBody> {
  const res = await agent
    .post('/api/v1/boards')
    .send({ name, columns: columns.map((c) => ({ name: c })) })
    .expect(201);
  return res.body;
}
