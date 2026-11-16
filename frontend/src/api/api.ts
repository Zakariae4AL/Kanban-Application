import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type {
  Board,
  BoardInput,
  BoardSummary,
  Locale,
  Subtask,
  Task,
  TaskInput,
  User,
} from './types';

const rawBaseQuery = fetchBaseQuery({
  // Same origin as the page (Vite proxies /api to the backend in development).
  baseUrl: new URL('/api/v1', window.location.origin).toString(),
  // The session lives in an httpOnly cookie: the browser sends it, scripts can't read it.
  credentials: 'include',
});

/** When the session expires, re-check "me" so the app redirects to the login page. */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extra,
) => {
  const result = await rawBaseQuery(args, api, extra);
  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status === 401 && !url.startsWith('/auth/')) {
    api.dispatch(kanbanApi.util.invalidateTags(['Me']));
  }
  return result;
};

/**
 * Resolves to the result, or null if the request failed. The component that
 * triggered the mutation handles the error; cache updates just skip.
 */
async function settled<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

/** Moves a task inside a cached board, renumbering positions like the server does. */
export function moveTaskInBoard(board: Board, taskId: string, columnId: string, position: number) {
  const source = board.columns.find((c) => c.tasks.some((t) => t.id === taskId));
  const target = board.columns.find((c) => c.id === columnId);
  if (!source || !target) return;

  const index = source.tasks.findIndex((t) => t.id === taskId);
  const [task] = source.tasks.splice(index, 1);
  if (!task) return;
  task.columnId = target.id;
  target.tasks.splice(Math.min(position, target.tasks.length), 0, task);

  for (const column of new Set([source, target])) {
    column.tasks.forEach((t, i) => (t.position = i));
  }
}

export const kanbanApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Me', 'Boards', 'Board'],
  endpoints: (build) => ({
    // --- Auth ---
    me: build.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['Me'],
    }),
    login: build.mutation<{ user: User }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const result = await settled(queryFulfilled);
        if (result) dispatch(kanbanApi.util.upsertQueryData('me', undefined, result.data.user));
      },
    }),
    register: build.mutation<
      { user: User },
      { name: string; email: string; password: string; locale: Locale }
    >({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const result = await settled(queryFulfilled);
        if (result) dispatch(kanbanApi.util.upsertQueryData('me', undefined, result.data.user));
      },
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled.catch(() => undefined);
        dispatch(kanbanApi.util.resetApiState());
      },
    }),

    // --- Boards ---
    getBoards: build.query<BoardSummary[], void>({
      query: () => '/boards',
      providesTags: ['Boards'],
    }),
    getBoard: build.query<Board, string>({
      query: (id) => `/boards/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Board', id }],
    }),
    createBoard: build.mutation<Board, BoardInput>({
      query: (body) => ({ url: '/boards', method: 'POST', body }),
      // Update the caches right away so navigating to the new board never races a refetch.
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const result = await settled(queryFulfilled);
        if (!result) return;
        const { data } = result;
        dispatch(
          kanbanApi.util.updateQueryData('getBoards', undefined, (list) => {
            list.push({ id: data.id, name: data.name });
          }),
        );
        dispatch(kanbanApi.util.upsertQueryData('getBoard', data.id, data));
      },
    }),
    updateBoard: build.mutation<Board, BoardInput & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/boards/${id}`, method: 'PATCH', body }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const result = await settled(queryFulfilled);
        if (!result) return;
        const { data } = result;
        dispatch(kanbanApi.util.upsertQueryData('getBoard', id, data));
        dispatch(
          kanbanApi.util.updateQueryData('getBoards', undefined, (list) => {
            const item = list.find((b) => b.id === id);
            if (item) item.name = data.name;
          }),
        );
      },
    }),
    deleteBoard: build.mutation<void, string>({
      query: (id) => ({ url: `/boards/${id}`, method: 'DELETE' }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        if (!(await settled(queryFulfilled))) return;
        dispatch(
          kanbanApi.util.updateQueryData('getBoards', undefined, (list) =>
            list.filter((b) => b.id !== id),
          ),
        );
      },
    }),

    // --- Tasks ---
    createTask: build.mutation<Task, TaskInput & { boardId: string }>({
      query: ({ boardId, ...body }) => ({ url: `/boards/${boardId}/tasks`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    updateTask: build.mutation<Task, Partial<TaskInput> & { id: string; boardId: string }>({
      query: ({ id, boardId: _boardId, ...body }) => ({ url: `/tasks/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    moveTask: build.mutation<
      Task,
      { id: string; boardId: string; columnId: string; position: number }
    >({
      query: ({ id, columnId, position }) => ({
        url: `/tasks/${id}/move`,
        method: 'PATCH',
        body: { columnId, position },
      }),
      // Optimistic: the card moves instantly, and goes back if the server refuses.
      async onQueryStarted({ id, boardId, columnId, position }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          kanbanApi.util.updateQueryData('getBoard', boardId, (board) =>
            moveTaskInBoard(board, id, columnId, position),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    deleteTask: build.mutation<void, { id: string; boardId: string }>({
      query: ({ id }) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    toggleSubtask: build.mutation<Subtask, { id: string; boardId: string; isCompleted: boolean }>({
      query: ({ id, isCompleted }) => ({
        url: `/subtasks/${id}`,
        method: 'PATCH',
        body: { isCompleted },
      }),
      async onQueryStarted({ id, boardId, isCompleted }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          kanbanApi.util.updateQueryData('getBoard', boardId, (board) => {
            for (const task of board.columns.flatMap((c) => c.tasks)) {
              const subtask = task.subtasks.find((s) => s.id === id);
              if (subtask) subtask.isCompleted = isCompleted;
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

export const {
  useMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetBoardsQuery,
  useGetBoardQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useMoveTaskMutation,
  useDeleteTaskMutation,
  useToggleSubtaskMutation,
} = kanbanApi;

/** HTTP status of an RTK Query error, if any. */
export const errorStatus = (error: unknown): number | undefined =>
  typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined;
