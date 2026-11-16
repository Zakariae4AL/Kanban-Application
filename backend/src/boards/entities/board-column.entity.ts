import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Board } from './board.entity';

@Entity('board_columns')
export class BoardColumn extends BaseEntity {
  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  boardId: string;

  @ManyToOne(() => Board, (board) => board.columns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @OneToMany(() => Task, (task) => task.column, { cascade: true })
  tasks: Task[];
}
