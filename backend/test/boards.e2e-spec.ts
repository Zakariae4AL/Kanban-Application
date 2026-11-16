import { INestApplication } from '@nestjs/common';
import TestAgent from 'supertest/lib/agent';
import { DataSource } from 'typeorm';
import { BoardColumn } from '../src/boards/entities/board-column.entity';
import { Subtask } from '../src/tasks/entities/subtask.entity';
import { Task } from '../src/tasks/entities/task.entity';
import { createBoard, createTestApp, signUp } from './helpers';

describe('Boards (e2e)', () => {
  let app: INestApplication;
  let alice: TestAgent;
  let bob: TestAgent;

  beforeAll(async () => {
    app = await createTestApp();
    alice = (await signUp(app)).agent;
    bob = (await signUp(app)).agent;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a board with ordered columns and returns its full structure', async () => {
    const board = await createBoard(alice, ['Todo', 'Doing', 'Done'], 'Platform Launch');

    expect(board).toEqual({
      id: expect.any(String),
      name: 'Platform Launch',
      createdAt: expect.any(String),
      columns: [
        { id: expect.any(String), name: 'Todo', position: 0, tasks: [] },
        { id: expect.any(String), name: 'Doing', position: 1, tasks: [] },
        { id: expect.any(String), name: 'Done', position: 2, tasks: [] },
      ],
    });
    expect(JSON.stringify(board)).not.toContain('ownerId');
  });

  it('lists only the current user’s boards', async () => {
    const mine = await createBoard(alice, [], 'Alice only');
    const theirs = await createBoard(bob, [], 'Bob only');

    const res = await alice.get('/api/v1/boards').expect(200);
    const ids = res.body.map((b: { id: string }) => b.id);

    expect(ids).toContain(mine.id);
    expect(ids).not.toContain(theirs.id);
  });

  it('renames, reorders, adds and removes columns in one update', async () => {
    const board = await createBoard(alice, ['Todo', 'Doing', 'Done']);
    const [todo, doing, done] = board.columns;

    // A task in "Doing" must disappear with its column.
    await alice
      .post(`/api/v1/boards/${board.id}/tasks`)
      .send({ title: 'Doomed', columnId: doing.id, subtasks: [{ title: 'also doomed' }] })
      .expect(201);

    const res = await alice
      .patch(`/api/v1/boards/${board.id}`)
      .send({
        name: 'Renamed',
        columns: [
          { id: done.id, name: 'Finished' },
          { name: 'Review' },
          { id: todo.id, name: 'Backlog' },
        ],
      })
      .expect(200);

    expect(res.body.name).toBe('Renamed');
    expect(
      res.body.columns.map((c: { id: string; name: string; position: number }) => [
        c.name,
        c.position,
      ]),
    ).toEqual([
      ['Finished', 0],
      ['Review', 1],
      ['Backlog', 2],
    ]);
    expect(res.body.columns[0].id).toBe(done.id);
    expect(res.body.columns[2].id).toBe(todo.id);

    const ds = app.get(DataSource);
    expect(await ds.getRepository(BoardColumn).existsBy({ id: doing.id })).toBe(false);
    expect(await ds.getRepository(Task).countBy({ columnId: doing.id })).toBe(0);
  });

  it('keeps columns untouched when only the name changes', async () => {
    const board = await createBoard(alice, ['A', 'B']);

    const res = await alice
      .patch(`/api/v1/boards/${board.id}`)
      .send({ name: 'Only name' })
      .expect(200);

    expect(res.body.columns).toEqual(board.columns);
  });

  it.each([
    ['an empty name', { name: '' }],
    ['a name that is too long', { name: 'x'.repeat(51) }],
    ['duplicate column names', { name: 'B', columns: [{ name: 'Todo' }, { name: 'todo' }] }],
    [
      'too many columns',
      { name: 'B', columns: Array.from({ length: 11 }, (_, i) => ({ name: `C${i}` })) },
    ],
    ['a column without a name', { name: 'B', columns: [{ name: ' ' }] }],
    ['unknown fields', { name: 'B', ownerId: '00000000-0000-4000-8000-000000000000' }],
  ])('rejects a board with %s', async (_label, body) => {
    await alice.post('/api/v1/boards').send(body).expect(400);
  });

  it('rejects column ids that belong to another board', async () => {
    const board = await createBoard(alice, ['Todo']);
    const other = await createBoard(alice, ['Elsewhere']);

    await alice
      .patch(`/api/v1/boards/${board.id}`)
      .send({ columns: [{ id: other.columns[0].id, name: 'Stolen' }] })
      .expect(400);

    const unchanged = await alice.get(`/api/v1/boards/${other.id}`).expect(200);
    expect(unchanged.body.columns[0].name).toBe('Elsewhere');
  });

  it('rejects the same column id twice', async () => {
    const board = await createBoard(alice, ['Todo']);
    const id = board.columns[0].id;

    await alice
      .patch(`/api/v1/boards/${board.id}`)
      .send({
        columns: [
          { id, name: 'One' },
          { id, name: 'Two' },
        ],
      })
      .expect(400);
  });

  it('deletes a board and everything in it', async () => {
    const board = await createBoard(alice, ['Todo']);
    const task = await alice
      .post(`/api/v1/boards/${board.id}/tasks`)
      .send({ title: 'Task', columnId: board.columns[0].id, subtasks: [{ title: 'Sub' }] })
      .expect(201);

    await alice.delete(`/api/v1/boards/${board.id}`).expect(204);

    await alice.get(`/api/v1/boards/${board.id}`).expect(404);
    const ds = app.get(DataSource);
    expect(await ds.getRepository(BoardColumn).countBy({ boardId: board.id })).toBe(0);
    expect(await ds.getRepository(Task).existsBy({ id: task.body.id })).toBe(false);
    expect(await ds.getRepository(Subtask).countBy({ taskId: task.body.id })).toBe(0);
  });

  describe('isolation between users', () => {
    it('answers 404 for another user’s board, without changing it', async () => {
      const board = await createBoard(alice, ['Todo'], 'Private');

      await bob.get(`/api/v1/boards/${board.id}`).expect(404);
      await bob.patch(`/api/v1/boards/${board.id}`).send({ name: 'Hacked' }).expect(404);
      await bob.delete(`/api/v1/boards/${board.id}`).expect(404);

      const res = await alice.get(`/api/v1/boards/${board.id}`).expect(200);
      expect(res.body.name).toBe('Private');
    });
  });

  it('rejects ids that are not UUIDs', async () => {
    await alice.get('/api/v1/boards/not-a-uuid').expect(400);
    await alice.get("/api/v1/boards/1' OR '1'='1").expect(400);
  });

  it('returns 404 for a board that does not exist', async () => {
    await alice.get('/api/v1/boards/2f1c4a8e-9b0d-4c3e-8f5a-1b2c3d4e5f60').expect(404);
  });
});
