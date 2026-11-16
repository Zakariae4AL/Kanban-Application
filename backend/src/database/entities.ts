import { BoardColumn } from '../boards/entities/board-column.entity';
import { Board } from '../boards/entities/board.entity';
import { Subtask } from '../tasks/entities/subtask.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/user.entity';

export const entities = [User, Board, BoardColumn, Task, Subtask];
