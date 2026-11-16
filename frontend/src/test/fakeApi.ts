import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Board, Task, User } from '../api/types';

/**
 * A small in-memory version of the NestJS API, so tests exercise the real
 * HTTP calls, caching and redirects without a server.
 */
type Db = { user: User & { password: string }; loggedIn: boolean; boards: Board[]; calls: string[] };

let seq = 0;
const id = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;

export function seedBoards(): Board[] {
  const todo = id();
  const doing = id();
  const done = id();
  return [
    {
      id: id(),
      name: 'Platform Launch',
      createdAt: '2026-01-01T00:00:00Z',
      columns: [
        {
          id: todo,
          name: 'Todo',
          position: 0,
          tasks: [
            {
              id: id(),
              title: 'Build UI for onboarding flow',
              description: 'Screens for the first visit.',
              position: 0,
              columnId: todo,
              subtasks: [
                { id: id(), title: 'Sign up page', isCompleted: true, position: 0 },
                { id: id(), title: 'Sign in page', isCompleted: false, position: 1 },
              ],
            },
            { id: id(), title: 'Build UI for search', description: '', position: 1, columnId: todo, subtasks: [] },
          ],
        },
        {
          id: doing,
          name: 'Doing',
          position: 1,
          tasks: [{ id: id(), title: 'Design settings page', description: '', position: 0, columnId: doing, subtasks: [] }],
        },
        { id: done, name: 'Done', position: 2, tasks: [] },
      ],
    },
    { id: id(), name: 'Marketing Plan', createdAt: '2026-01-02T00:00:00Z', columns: [] },
  ];
}

export const db: Db = {
  user: { id: 'u1', email: 'demo@kanban.dev', name: 'Demo', createdAt: '2026-01-01T00:00:00Z', password: 'Demo1234' },
  loggedIn: false,
  boards: [],
  calls: [],
};

export function resetDb({ loggedIn = true }: { loggedIn?: boolean } = {}) {
  seq = 0;
  db.loggedIn = loggedIn;
  db.boards = seedBoards();
  db.calls = [];
}

const publicUser = () => ({ id: db.user.id, email: db.user.email, name: db.user.name, createdAt: db.user.createdAt });
const unauthorized = () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
const notFound = () => HttpResponse.json({ message: 'Not found' }, { status: 404 });
const allTasks = () => db.boards.flatMap((b) => b.columns.flatMap((c) => c.tasks));
const boardOfColumn = (columnId: string) => db.boards.find((b) => b.columns.some((c) => c.id === columnId));
const renumber = (tasks: Task[]) => tasks.forEach((t, i) => (t.position = i));

const API = 'http://localhost:3000/api/v1';

export const handlers = [
  http.all(`${API}/*`, ({ request }) => {
    db.calls.push(`${request.method} ${new URL(request.url).pathname.replace('/api/v1', '')}`);
  }),

  http.get(`${API}/auth/me`, () => (db.loggedIn ? HttpResponse.json(publicUser()) : unauthorized())),
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === 'blocked@kanban.dev') return HttpResponse.json({}, { status: 429 });
    if (body.email !== db.user.email || body.password !== db.user.password) {
      return HttpResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }
    db.loggedIn = true;
    return HttpResponse.json({ user: publicUser() });
  }),
  http.post(`${API}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string; name: string; locale: string };
    if (body.email === 'taken@kanban.dev') return HttpResponse.json({}, { status: 409 });
    db.loggedIn = true;
    db.user = { ...db.user, email: body.email, name: body.name };
    db.boards = [{ id: id(), name: body.locale === 'fr' ? 'Mon premier tableau' : 'My first board', createdAt: '', columns: [] }];
    return HttpResponse.json({ user: publicUser() }, { status: 201 });
  }),
  http.post(`${API}/auth/logout`, () => {
    db.loggedIn = false;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/boards`, () =>
    db.loggedIn ? HttpResponse.json(db.boards.map(({ id, name }) => ({ id, name }))) : unauthorized(),
  ),
  http.get(`${API}/boards/:id`, ({ params }) => {
    if (!db.loggedIn) return unauthorized();
    const board = db.boards.find((b) => b.id === params.id);
    return board ? HttpResponse.json(board) : notFound();
  }),
  http.post(`${API}/boards`, async ({ request }) => {
    const body = (await request.json()) as { name: string; columns: { name: string }[] };
    const board: Board = {
      id: id(),
      name: body.name,
      createdAt: '',
      columns: body.columns.map((c, position) => ({ id: id(), name: c.name, position, tasks: [] })),
    };
    db.boards.push(board);
    return HttpResponse.json(board, { status: 201 });
  }),
  http.patch(`${API}/boards/:id`, async ({ params, request }) => {
    const board = db.boards.find((b) => b.id === params.id);
    if (!board) return notFound();
    const body = (await request.json()) as { name: string; columns: { id?: string; name: string }[] };
    board.name = body.name;
    board.columns = body.columns.map((c, position) => {
      const existing = board.columns.find((col) => col.id === c.id);
      return { id: c.id ?? id(), name: c.name, position, tasks: existing?.tasks ?? [] };
    });
    return HttpResponse.json(board);
  }),
  http.delete(`${API}/boards/:id`, ({ params }) => {
    db.boards = db.boards.filter((b) => b.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API}/boards/:boardId/tasks`, async ({ request }) => {
    const body = (await request.json()) as { title: string; description: string; columnId: string; subtasks: { title: string }[] };
    const column = boardOfColumn(body.columnId)?.columns.find((c) => c.id === body.columnId);
    if (!column) return HttpResponse.json({}, { status: 400 });
    const task: Task = {
      id: id(),
      title: body.title,
      description: body.description,
      columnId: column.id,
      position: column.tasks.length,
      subtasks: body.subtasks.map((s, position) => ({ id: id(), title: s.title, isCompleted: false, position })),
    };
    column.tasks.push(task);
    return HttpResponse.json(task, { status: 201 });
  }),
  http.patch(`${API}/tasks/:id/move`, async ({ params, request }) => {
    const { columnId, position } = (await request.json()) as { columnId: string; position: number };
    const task = allTasks().find((t) => t.id === params.id);
    const board = task && boardOfColumn(task.columnId);
    const source = board?.columns.find((c) => c.id === task?.columnId);
    const target = board?.columns.find((c) => c.id === columnId);
    if (!task || !source || !target) return notFound();
    source.tasks = source.tasks.filter((t) => t.id !== task.id);
    task.columnId = target.id;
    target.tasks.splice(Math.min(position, target.tasks.length), 0, task);
    renumber(source.tasks);
    renumber(target.tasks);
    return HttpResponse.json(task);
  }),
  http.patch(`${API}/tasks/:id`, async ({ params, request }) => {
    const task = allTasks().find((t) => t.id === params.id);
    if (!task) return notFound();
    const body = (await request.json()) as Partial<{ title: string; description: string; subtasks: { id?: string; title: string }[] }>;
    if (body.title !== undefined) task.title = body.title;
    if (body.description !== undefined) task.description = body.description;
    if (body.subtasks) {
      task.subtasks = body.subtasks.map((s, position) => ({
        id: s.id ?? id(),
        title: s.title,
        isCompleted: task.subtasks.find((x) => x.id === s.id)?.isCompleted ?? false,
        position,
      }));
    }
    return HttpResponse.json(task);
  }),
  http.delete(`${API}/tasks/:id`, ({ params }) => {
    for (const column of db.boards.flatMap((b) => b.columns)) {
      column.tasks = column.tasks.filter((t) => t.id !== params.id);
    }
    return new HttpResponse(null, { status: 204 });
  }),
  http.patch(`${API}/subtasks/:id`, async ({ params, request }) => {
    const { isCompleted } = (await request.json()) as { isCompleted: boolean };
    const subtask = allTasks().flatMap((t) => t.subtasks).find((s) => s.id === params.id);
    if (!subtask) return notFound();
    subtask.isCompleted = isCompleted;
    return HttpResponse.json(subtask);
  }),
];

export const server = setupServer(...handlers);
