import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { PasswordService } from '../src/auth/password.service';
import { Board } from '../src/boards/entities/board.entity';
import { DEMO_USER, seed } from '../src/database/seed';
import { createTestApp } from './helpers';

describe('Database (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('has a migrated schema that exactly matches the entities', async () => {
    const pending = await app.get(DataSource).driver.createSchemaBuilder().log();
    expect(pending.upQueries.map((q) => q.query)).toEqual([]);
  });

  it('can roll the migration back and apply it again', async () => {
    const ds = app.get(DataSource);
    await ds.undoLastMigration();
    expect(await ds.showMigrations()).toBe(true);
    await ds.runMigrations();
    expect(await ds.showMigrations()).toBe(false);
  });

  it('seeds the demo account once, with its three boards', async () => {
    const ds = app.get(DataSource);
    const passwords = app.get(PasswordService);

    expect(await seed(ds, passwords)).toBe(true);
    expect(await seed(ds, passwords)).toBe(false);

    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/v1/auth/login')
      .send({ email: DEMO_USER.email, password: DEMO_USER.password })
      .expect(200);
    const boards = await agent.get('/api/v1/boards').expect(200);

    expect(boards.body.map((b: Board) => b.name)).toEqual([
      'Platform Launch',
      'Marketing Plan',
      'Roadmap',
    ]);

    const launch = await agent.get(`/api/v1/boards/${boards.body[0].id}`).expect(200);
    expect(launch.body.columns.map((c: { tasks: unknown[] }) => c.tasks.length)).toEqual([4, 6, 7]);
  });
});
