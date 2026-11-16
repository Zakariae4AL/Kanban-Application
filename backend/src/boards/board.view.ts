import { BoardColumn } from './entities/board-column.entity';
import { Board } from './entities/board.entity';
import { Subtask } from '../tasks/entities/subtask.entity';
import { Task } from '../tasks/entities/task.entity';

/** API representations — internal fields such as ownerId never leave the server. */
export const subtaskView = (s: Subtask) => ({
  id: s.id,
  title: s.title,
  isCompleted: s.isCompleted,
  position: s.position,
});

export const taskView = (t: Task) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  position: t.position,
  columnId: t.columnId,
  subtasks: [...(t.subtasks ?? [])].sort((a, b) => a.position - b.position).map(subtaskView),
});

export const columnView = (c: BoardColumn) => ({
  id: c.id,
  name: c.name,
  position: c.position,
  tasks: [...(c.tasks ?? [])].sort((a, b) => a.position - b.position).map(taskView),
});

export const boardView = (b: Board) => ({
  id: b.id,
  name: b.name,
  createdAt: b.createdAt,
  columns: [...(b.columns ?? [])].sort((a, b) => a.position - b.position).map(columnView),
});

export type BoardView = ReturnType<typeof boardView>;
export type TaskView = ReturnType<typeof taskView>;
