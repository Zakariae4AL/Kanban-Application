import { describe, expect, it } from 'vitest';
import { seedBoards } from '../test/fakeApi';
import { errorStatus, moveTaskInBoard } from './api';

describe('moveTaskInBoard (optimistic drag and drop)', () => {
  const titles = (board: ReturnType<typeof seedBoards>[number]) =>
    board.columns.map((c) => c.tasks.map((t) => `${t.title}@${t.position}`));

  it('moves a task across columns and renumbers both', () => {
    const board = seedBoards()[0]!;
    const task = board.columns[0]!.tasks[0]!;

    moveTaskInBoard(board, task.id, board.columns[1]!.id, 0);

    expect(titles(board)).toEqual([
      ['Build UI for search@0'],
      ['Build UI for onboarding flow@0', 'Design settings page@1'],
      [],
    ]);
    expect(task.columnId).toBe(board.columns[1]!.id);
  });

  it('reorders within a column and clamps positions past the end', () => {
    const board = seedBoards()[0]!;
    const first = board.columns[0]!.tasks[0]!;

    moveTaskInBoard(board, first.id, board.columns[0]!.id, 99);

    expect(titles(board)[0]).toEqual(['Build UI for search@0', 'Build UI for onboarding flow@1']);
  });

  it('ignores unknown tasks or columns', () => {
    const board = seedBoards()[0]!;
    const before = JSON.stringify(board);

    moveTaskInBoard(board, 'nope', board.columns[1]!.id, 0);
    moveTaskInBoard(board, board.columns[0]!.tasks[0]!.id, 'nope', 0);

    expect(JSON.stringify(board)).toBe(before);
  });
});

describe('errorStatus', () => {
  it('reads the HTTP status of an RTK Query error', () => {
    expect(errorStatus({ status: 409, data: {} })).toBe(409);
    expect(errorStatus({ status: 'FETCH_ERROR' })).toBeUndefined();
    expect(errorStatus(new Error('x'))).toBeUndefined();
    expect(errorStatus(null)).toBeUndefined();
  });
});
