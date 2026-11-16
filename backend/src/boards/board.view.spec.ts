import { boardView } from './board.view';
import { Board } from './entities/board.entity';

describe('boardView', () => {
  it('sorts columns, tasks and subtasks by position and hides internal fields', () => {
    const board = {
      id: 'b',
      name: 'Board',
      ownerId: 'secret-owner',
      createdAt: new Date('2026-01-01'),
      columns: [
        { id: 'c2', name: 'Done', position: 1, boardId: 'b', tasks: [] },
        {
          id: 'c1',
          name: 'Todo',
          position: 0,
          boardId: 'b',
          tasks: [
            {
              id: 't2',
              title: 'Second',
              description: '',
              position: 1,
              columnId: 'c1',
              subtasks: [],
            },
            {
              id: 't1',
              title: 'First',
              description: '',
              position: 0,
              columnId: 'c1',
              subtasks: [
                { id: 's2', title: 'B', isCompleted: true, position: 1, taskId: 't1' },
                { id: 's1', title: 'A', isCompleted: false, position: 0, taskId: 't1' },
              ],
            },
          ],
        },
      ],
    } as unknown as Board;

    const view = boardView(board);

    expect(view.columns.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(view.columns[0].tasks.map((t) => t.id)).toEqual(['t1', 't2']);
    expect(view.columns[0].tasks[0].subtasks.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(JSON.stringify(view)).not.toMatch(/ownerId|boardId|taskId/);
  });
});
