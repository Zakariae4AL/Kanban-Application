import { INestApplication } from '@nestjs/common';
import TestAgent from 'supertest/lib/agent';
import { BoardBody, createBoard, createTestApp, signUp } from './helpers';

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let alice: TestAgent;
  let bob: TestAgent;
  let board: BoardBody;
  let todo: string;
  let doing: string;
  let done: string;

  const titles = async (agent: TestAgent, boardId: string) => {
    const res = await agent.get(`/api/v1/boards/${boardId}`).expect(200);
    return res.body.columns.map((c: BoardBody['columns'][number]) =>
      c.tasks.map((t) => `${t.title}@${t.position}`),
    );
  };

  const addTask = async (columnId: string, title: string, subtasks: string[] = []) =>
    (
      await alice
        .post(`/api/v1/boards/${board.id}/tasks`)
        .send({ title, columnId, subtasks: subtasks.map((s) => ({ title: s })) })
        .expect(201)
    ).body;

  beforeAll(async () => {
    app = await createTestApp();
    alice = (await signUp(app)).agent;
    bob = (await signUp(app)).agent;
  });

  beforeEach(async () => {
    board = await createBoard(alice, ['Todo', 'Doing', 'Done']);
    [todo, doing, done] = board.columns.map((c) => c.id);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a task with subtasks at the end of its column', async () => {
    await addTask(todo, 'First');
    const task = await addTask(todo, 'Second', ['Design', 'Build']);

    expect(task).toEqual({
      id: expect.any(String),
      title: 'Second',
      description: '',
      position: 1,
      columnId: todo,
      subtasks: [
        { id: expect.any(String), title: 'Design', isCompleted: false, position: 0 },
        { id: expect.any(String), title: 'Build', isCompleted: false, position: 1 },
      ],
    });
  });

  it.each([
    ['no title', { title: '' }],
    ['a title that is too long', { title: 'x'.repeat(101) }],
    ['a description that is too long', { description: 'x'.repeat(2001) }],
    ['too many subtasks', { subtasks: Array.from({ length: 21 }, (_, i) => ({ title: `S${i}` })) }],
    ['an empty subtask', { subtasks: [{ title: '' }] }],
    ['an invalid column id', { columnId: 'nope' }],
  ])('rejects a task with %s', async (_label, override) => {
    await alice
      .post(`/api/v1/boards/${board.id}/tasks`)
      .send({ title: 'Valid', columnId: todo, ...override })
      .expect(400);
  });

  it('rejects a column from another board', async () => {
    const other = await createBoard(alice, ['Elsewhere']);

    await alice
      .post(`/api/v1/boards/${board.id}/tasks`)
      .send({ title: 'Wrong board', columnId: other.columns[0].id })
      .expect(400);
  });

  it('edits a task, syncs its subtasks and moves it when the status changes', async () => {
    await addTask(doing, 'Already there');
    const task = await addTask(todo, 'Task', ['Keep', 'Remove']);
    const [keep] = task.subtasks;

    const res = await alice
      .patch(`/api/v1/tasks/${task.id}`)
      .send({
        title: 'Renamed',
        description: 'Details',
        columnId: doing,
        subtasks: [{ title: 'New first' }, { id: keep.id, title: 'Kept', isCompleted: true }],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      title: 'Renamed',
      description: 'Details',
      columnId: doing,
      position: 1, // appended after "Already there"
    });
    expect(res.body.subtasks).toEqual([
      { id: expect.any(String), title: 'New first', isCompleted: false, position: 0 },
      { id: keep.id, title: 'Kept', isCompleted: true, position: 1 },
    ]);
  });

  it('rejects subtask ids that belong to another task', async () => {
    const a = await addTask(todo, 'A', ['A1']);
    const b = await addTask(todo, 'B', ['B1']);

    await alice
      .patch(`/api/v1/tasks/${a.id}`)
      .send({ subtasks: [{ id: b.subtasks[0].id, title: 'Stolen' }] })
      .expect(400);
  });

  it('reorders within a column (drag and drop)', async () => {
    await addTask(todo, 'A');
    await addTask(todo, 'B');
    const c = await addTask(todo, 'C');

    await alice
      .patch(`/api/v1/tasks/${c.id}/move`)
      .send({ columnId: todo, position: 0 })
      .expect(200);

    expect((await titles(alice, board.id))[0]).toEqual(['C@0', 'A@1', 'B@2']);
  });

  it('moves across columns and renumbers both columns', async () => {
    const a = await addTask(todo, 'A');
    await addTask(todo, 'B');
    await addTask(done, 'X');
    await addTask(done, 'Y');

    const res = await alice
      .patch(`/api/v1/tasks/${a.id}/move`)
      .send({ columnId: done, position: 1 })
      .expect(200);

    expect(res.body).toMatchObject({ columnId: done, position: 1 });
    expect(await titles(alice, board.id)).toEqual([['B@0'], [], ['X@0', 'A@1', 'Y@2']]);
  });

  it('appends when the position is past the end', async () => {
    const a = await addTask(todo, 'A');
    await addTask(doing, 'D');

    await alice
      .patch(`/api/v1/tasks/${a.id}/move`)
      .send({ columnId: doing, position: 99 })
      .expect(200);

    expect((await titles(alice, board.id))[1]).toEqual(['D@0', 'A@1']);
  });

  it('cannot move a task to another board', async () => {
    const a = await addTask(todo, 'A');
    const other = await createBoard(alice, ['Elsewhere']);

    await alice
      .patch(`/api/v1/tasks/${a.id}/move`)
      .send({ columnId: other.columns[0].id, position: 0 })
      .expect(400);
    await alice.patch(`/api/v1/tasks/${a.id}`).send({ columnId: other.columns[0].id }).expect(400);
  });

  it('rejects a negative position', async () => {
    const a = await addTask(todo, 'A');
    await alice
      .patch(`/api/v1/tasks/${a.id}/move`)
      .send({ columnId: todo, position: -1 })
      .expect(400);
  });

  it('toggles a subtask', async () => {
    const task = await addTask(todo, 'A', ['Sub']);

    const res = await alice
      .patch(`/api/v1/subtasks/${task.subtasks[0].id}`)
      .send({ isCompleted: true })
      .expect(200);

    expect(res.body).toEqual({ ...task.subtasks[0], isCompleted: true });
    await alice
      .patch(`/api/v1/subtasks/${task.subtasks[0].id}`)
      .send({ isCompleted: 'yes' })
      .expect(400);
  });

  it('deletes a task', async () => {
    const task = await addTask(todo, 'A', ['Sub']);

    await alice.delete(`/api/v1/tasks/${task.id}`).expect(204);

    expect((await titles(alice, board.id))[0]).toEqual([]);
    await alice
      .patch(`/api/v1/subtasks/${task.subtasks[0].id}`)
      .send({ isCompleted: true })
      .expect(404);
  });

  describe('isolation between users', () => {
    it('answers 404 to every action on someone else’s tasks', async () => {
      const task = await addTask(todo, 'Private', ['Secret']);
      const sub = task.subtasks[0].id;

      await bob
        .post(`/api/v1/boards/${board.id}/tasks`)
        .send({ title: 'Intruder', columnId: todo })
        .expect(404);
      await bob.patch(`/api/v1/tasks/${task.id}`).send({ title: 'Hacked' }).expect(404);
      await bob
        .patch(`/api/v1/tasks/${task.id}/move`)
        .send({ columnId: done, position: 0 })
        .expect(404);
      await bob.patch(`/api/v1/subtasks/${sub}`).send({ isCompleted: true }).expect(404);
      await bob.delete(`/api/v1/tasks/${task.id}`).expect(404);

      expect(await titles(alice, board.id)).toEqual([['Private@0'], [], []]);
      const fresh = await alice.get(`/api/v1/boards/${board.id}`).expect(200);
      expect(fresh.body.columns[0].tasks[0].subtasks[0].isCompleted).toBe(false);
    });

    it('cannot move own task into someone else’s column', async () => {
      const bobsBoard = await createBoard(bob, ['Bob column']);
      const mine = (await signUp(app)).agent;
      const myBoard = await createBoard(mine, ['Mine']);
      const task = (
        await mine
          .post(`/api/v1/boards/${myBoard.id}/tasks`)
          .send({ title: 'Mine', columnId: myBoard.columns[0].id })
          .expect(201)
      ).body;

      await mine
        .patch(`/api/v1/tasks/${task.id}/move`)
        .send({ columnId: bobsBoard.columns[0].id, position: 0 })
        .expect(404);
    });
  });
});
