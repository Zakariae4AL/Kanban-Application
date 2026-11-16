import { Column, CreateDateColumn, Entity, OneToMany, UpdateDateColumn } from 'typeorm';
import { Board } from '../boards/entities/board.entity';
import { BaseEntity } from '../common/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  /** Never selected unless explicitly asked for. */
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @OneToMany(() => Board, (board) => board.owner)
  boards: Board[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
