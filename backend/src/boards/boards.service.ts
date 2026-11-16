import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { diffChildren } from '../common/sync';
import { Subtask } from '../tasks/entities/subtask.entity';
import { Task } from '../tasks/entities/task.entity';
import { BoardView, boardView } from './board.view';
import { ColumnInputDto, CreateBoardDto, UpdateBoardDto } from './dto/board.dto';
import { BoardColumn } from './entities/board-column.entity';
import { Board } from './entities/board.entity';
import { STARTER_BOARD, StarterLocale } from './starter-board';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board) private readonly boards: Repository<Board>,
    private readonly dataSource: DataSource,
  ) {}

  async list(ownerId: string): Promise<{ id: string; name: string }[]> {
    const boards = await this.boards.find({
      where: { ownerId },
      select: { id: true, name: true, createdAt: true },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    return boards.map(({ id, name }) => ({ id, name }));
  }

  async findOne(id: string, ownerId: string): Promise<BoardView> {
    const board = await this.boards.findOne({
      where: { id, ownerId },
      relations: { columns: { tasks: { subtasks: true } } },
    });
    // 404 (not 403) so other users' board ids are not even confirmed to exist.
    if (!board) throw new NotFoundException('Board not found.');
    return boardView(board);
  }

  async create(ownerId: string, dto: CreateBoardDto): Promise<BoardView> {
    this.assertUniqueNames(dto.columns);

    const board = await this.boards.save(
      this.boards.create({
        name: dto.name,
        ownerId,
        columns: dto.columns.map((c, position) => ({ name: c.name, position })),
      }),
    );

    return this.findOne(board.id, ownerId);
  }

  async update(id: string, ownerId: string, dto: UpdateBoardDto): Promise<BoardView> {
    await this.dataSource.transaction(async (em) => {
      const board = await em.findOne(Board, {
        where: { id, ownerId },
        relations: { columns: true },
      });
      if (!board) throw new NotFoundException('Board not found.');

      if (dto.name !== undefined) {
        await em.update(Board, board.id, { name: dto.name });
      }

      if (dto.columns) {
        this.assertUniqueNames(dto.columns);
        const removed = diffChildren(
          board.columns.map((c) => c.id),
          dto.columns,
          'column',
        );

        if (removed.length) await this.deleteColumns(em, removed);

        for (const [position, column] of dto.columns.entries()) {
          if (column.id) {
            await em.update(BoardColumn, column.id, { name: column.name, position });
          } else {
            await em.save(
              em.create(BoardColumn, { name: column.name, position, boardId: board.id }),
            );
          }
        }
      }
    });

    return this.findOne(id, ownerId);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      const board = await em.findOne(Board, {
        where: { id, ownerId },
        relations: { columns: true },
      });
      if (!board) throw new NotFoundException('Board not found.');

      await this.deleteColumns(
        em,
        board.columns.map((c) => c.id),
      );
      await em.delete(Board, board.id);
    });
  }

  async createStarterBoard(ownerId: string, locale: StarterLocale = 'en'): Promise<void> {
    const content = STARTER_BOARD[locale];

    await this.boards.save(
      this.boards.create({
        name: content.name,
        ownerId,
        columns: content.columns.map((column, position) => ({
          name: column.name,
          position,
          tasks: column.tasks.map((task, taskPosition) => ({
            title: task.title,
            description: task.description,
            position: taskPosition,
            subtasks: task.subtasks.map((title, subPosition) => ({
              title,
              position: subPosition,
              isCompleted: false,
            })),
          })),
        })),
      }),
    );
  }

  /** Task status = column name, so names must be unique within a board. */
  private assertUniqueNames(columns: ColumnInputDto[]): void {
    const names = columns.map((c) => c.name.toLocaleLowerCase());
    if (new Set(names).size !== names.length) {
      throw new BadRequestException('Column names must be unique within a board.');
    }
  }

  /**
   * Deletes columns and everything inside them explicitly, children first,
   * so behaviour doesn't depend on the database enforcing ON DELETE CASCADE.
   */
  private async deleteColumns(
    em: import('typeorm').EntityManager,
    columnIds: string[],
  ): Promise<void> {
    if (!columnIds.length) return;
    const tasks = await em.find(Task, { where: { columnId: In(columnIds) }, select: { id: true } });
    const taskIds = tasks.map((t) => t.id);
    if (taskIds.length) {
      await em.delete(Subtask, { taskId: In(taskIds) });
      await em.delete(Task, { id: In(taskIds) });
    }
    await em.delete(BoardColumn, { id: In(columnIds) });
  }
}
