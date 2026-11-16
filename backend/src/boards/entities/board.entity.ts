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
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../users/user.entity';
import { BoardColumn } from './board-column.entity';

@Entity('boards')
export class Board extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.boards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => BoardColumn, (column) => column.board, { cascade: true })
  columns: BoardColumn[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
