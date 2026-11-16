import { randomUUID } from 'node:crypto';
import { BeforeInsert, PrimaryColumn } from 'typeorm';

/**
 * UUID primary key generated in the application, so the same schema
 * works on PostgreSQL and SQLite without database-specific defaults.
 */
export abstract class BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @BeforeInsert()
  protected generateId(): void {
    this.id ??= randomUUID();
  }
}
