import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { BoardColumn } from '../../boards/entities/board-column.entity';
import { BaseEntity } from '../../common/base.entity';
import { Subtask } from './subtask.entity';

@Entity('tasks')
export class Task extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  columnId: string;

  @ManyToOne(() => BoardColumn, (column) => column.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'columnId' })
  column: BoardColumn;

  @OneToMany(() => Subtask, (subtask) => subtask.task, { cascade: true })
  subtasks: Subtask[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
