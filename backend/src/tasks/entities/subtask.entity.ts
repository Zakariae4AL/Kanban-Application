import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Task } from './task.entity';

@Entity('subtasks')
export class Subtask extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  taskId: string;

  @ManyToOne(() => Task, (task) => task.subtasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;
}
