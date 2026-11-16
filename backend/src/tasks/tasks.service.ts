import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { BoardColumn } from '../boards/entities/board-column.entity';
import { TaskView, subtaskView, taskView } from '../boards/board.view';
import { diffChildren } from '../common/sync';
import { CreateTaskDto, MoveTaskDto, UpdateSubtaskDto, UpdateTaskDto } from './dto/task.dto';
import { Subtask } from './entities/subtask.entity';
import { Task } from './entities/task.entity';

/**
 * Every query joins up to the board and filters on its owner,
 * so a user can only ever touch their own tasks.
 */
@Injectable()
export class TasksService {
  constructor(private readonly dataSource: DataSource) {}

  async create(boardId: string, ownerId: string, dto: CreateTaskDto): Promise<TaskView> {
    const id = await this.dataSource.transaction(async (em) => {
      const column = await this.ownedColumn(em, dto.columnId, ownerId);
      if (column.boardId !== boardId) {
        throw new BadRequestException('The column does not belong to this board.');
      }

      const task = await em.save(
        em.create(Task, {
          title: dto.title,
          description: dto.description ?? '',
          columnId: column.id,
          position: await this.nextPosition(em, column.id),
          subtasks: dto.subtasks.map((s, position) => ({
            title: s.title,
            isCompleted: s.isCompleted ?? false,
            position,
          })),
        }),
      );
      return task.id;
    });

    return this.findOne(id, ownerId);
  }

  async update(id: string, ownerId: string, dto: UpdateTaskDto): Promise<TaskView> {
    await this.dataSource.transaction(async (em) => {
      const task = await this.ownedTask(em, id, ownerId);
      const changes: Partial<Task> = {};

      if (dto.title !== undefined) changes.title = dto.title;
      if (dto.description !== undefined) changes.description = dto.description;

      if (dto.columnId !== undefined && dto.columnId !== task.columnId) {
        const target = await this.ownedColumn(em, dto.columnId, ownerId);
        if (target.boardId !== task.column.boardId) {
          throw new BadRequestException('A task can only move within its board.');
        }
        changes.columnId = target.id;
        changes.position = await this.nextPosition(em, target.id);
      }

      if (Object.keys(changes).length) await em.update(Task, task.id, changes);

      if (dto.subtasks) {
        const removed = diffChildren(
          task.subtasks.map((s) => s.id),
          dto.subtasks,
          'subtask',
        );
        if (removed.length) await em.delete(Subtask, { id: In(removed) });

        for (const [position, s] of dto.subtasks.entries()) {
          if (s.id) {
            await em.update(Subtask, s.id, {
              title: s.title,
              position,
              ...(s.isCompleted !== undefined && { isCompleted: s.isCompleted }),
            });
          } else {
            await em.save(
              em.create(Subtask, {
                title: s.title,
                position,
                isCompleted: s.isCompleted ?? false,
                taskId: task.id,
              }),
            );
          }
        }
      }
    });

    return this.findOne(id, ownerId);
  }

  /** Drag & drop: place the task at an index in a column and renumber both columns. */
  async move(id: string, ownerId: string, dto: MoveTaskDto): Promise<TaskView> {
    await this.dataSource.transaction(async (em) => {
      const task = await this.ownedTask(em, id, ownerId);
      const target = await this.ownedColumn(em, dto.columnId, ownerId);
      if (target.boardId !== task.column.boardId) {
        throw new BadRequestException('A task can only move within its board.');
      }

      const siblings = await em.find(Task, {
        where: { columnId: target.id },
        order: { position: 'ASC' },
        select: { id: true },
      });
      const order = siblings.map((t) => t.id).filter((taskId) => taskId !== task.id);
      order.splice(Math.min(dto.position, order.length), 0, task.id);

      await em.update(Task, task.id, { columnId: target.id });
      await this.renumber(em, order);

      if (task.columnId !== target.id) {
        const previous = await em.find(Task, {
          where: { columnId: task.columnId },
          order: { position: 'ASC' },
          select: { id: true },
        });
        await this.renumber(
          em,
          previous.map((t) => t.id),
        );
      }
    });

    return this.findOne(id, ownerId);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      const task = await this.ownedTask(em, id, ownerId);
      await em.delete(Subtask, { taskId: task.id });
      await em.delete(Task, task.id);
    });
  }

  async updateSubtask(id: string, ownerId: string, dto: UpdateSubtaskDto) {
    const subtask = await this.dataSource
      .getRepository(Subtask)
      .createQueryBuilder('subtask')
      .innerJoin('subtask.task', 'task')
      .innerJoin('task.column', 'column')
      .innerJoin('column.board', 'board')
      .where('subtask.id = :id', { id })
      .andWhere('board.ownerId = :ownerId', { ownerId })
      .getOne();
    if (!subtask) throw new NotFoundException('Subtask not found.');

    subtask.isCompleted = dto.isCompleted;
    return subtaskView(await this.dataSource.getRepository(Subtask).save(subtask));
  }

  private async findOne(id: string, ownerId: string): Promise<TaskView> {
    return taskView(await this.ownedTask(this.dataSource.manager, id, ownerId));
  }

  private async ownedTask(em: EntityManager, id: string, ownerId: string): Promise<Task> {
    const task = await em
      .createQueryBuilder(Task, 'task')
      .innerJoinAndSelect('task.column', 'column')
      .innerJoin('column.board', 'board')
      .leftJoinAndSelect('task.subtasks', 'subtask')
      .where('task.id = :id', { id })
      .andWhere('board.ownerId = :ownerId', { ownerId })
      .getOne();
    if (!task) throw new NotFoundException('Task not found.');
    return task;
  }

  private async ownedColumn(em: EntityManager, id: string, ownerId: string): Promise<BoardColumn> {
    const column = await em
      .createQueryBuilder(BoardColumn, 'column')
      .innerJoin('column.board', 'board')
      .where('column.id = :id', { id })
      .andWhere('board.ownerId = :ownerId', { ownerId })
      .getOne();
    if (!column) throw new NotFoundException('Column not found.');
    return column;
  }

  private async nextPosition(em: EntityManager, columnId: string): Promise<number> {
    const { max } = (await em
      .createQueryBuilder(Task, 'task')
      .select('MAX(task.position)', 'max')
      .where('task.columnId = :columnId', { columnId })
      .getRawOne<{ max: number | string | null }>()) ?? { max: null };
    return max === null ? 0 : Number(max) + 1;
  }

  private async renumber(em: EntityManager, ids: string[]): Promise<void> {
    for (const [position, taskId] of ids.entries()) {
      await em.update(Task, taskId, { position });
    }
  }
}
