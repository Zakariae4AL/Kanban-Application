import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Initial schema, written with TypeORM's driver-neutral Table API so it runs
 * unchanged on PostgreSQL (production) and SQLite (local development, tests).
 */
export class InitialSchema1763251200000 implements MigrationInterface {
  name = 'InitialSchema1763251200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    const id: TableColumnOptions = { name: 'id', type: 'varchar', length: '36', isPrimary: true };
    const fk = (name: string): TableColumnOptions => ({ name, type: 'varchar', length: '36' });
    const timestamp = (name: string): TableColumnOptions => ({
      name,
      type: isPostgres ? 'timestamp' : 'datetime',
      default: isPostgres ? 'now()' : "datetime('now')",
    });
    const position: TableColumnOptions = { name: 'position', type: 'integer', default: 0 };

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          id,
          { name: 'email', type: 'varchar', length: '255', isUnique: true },
          { name: 'name', type: 'varchar', length: '80' },
          { name: 'passwordHash', type: 'varchar', length: '255' },
          timestamp('createdAt'),
          timestamp('updatedAt'),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'boards',
        columns: [
          id,
          { name: 'name', type: 'varchar', length: '50' },
          fk('ownerId'),
          timestamp('createdAt'),
          timestamp('updatedAt'),
        ],
        indices: [this.index(queryRunner, 'boards', 'ownerId')],
        foreignKeys: [this.cascade(queryRunner, 'boards', 'ownerId', 'users')],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'board_columns',
        columns: [id, { name: 'name', type: 'varchar', length: '30' }, position, fk('boardId')],
        indices: [this.index(queryRunner, 'board_columns', 'boardId')],
        foreignKeys: [this.cascade(queryRunner, 'board_columns', 'boardId', 'boards')],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tasks',
        columns: [
          id,
          { name: 'title', type: 'varchar', length: '100' },
          { name: 'description', type: 'text', default: "''" },
          position,
          fk('columnId'),
          timestamp('createdAt'),
          timestamp('updatedAt'),
        ],
        indices: [this.index(queryRunner, 'tasks', 'columnId')],
        foreignKeys: [this.cascade(queryRunner, 'tasks', 'columnId', 'board_columns')],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'subtasks',
        columns: [
          id,
          { name: 'title', type: 'varchar', length: '100' },
          { name: 'isCompleted', type: 'boolean', default: isPostgres ? false : 0 },
          position,
          fk('taskId'),
        ],
        indices: [this.index(queryRunner, 'subtasks', 'taskId')],
        foreignKeys: [this.cascade(queryRunner, 'subtasks', 'taskId', 'tasks')],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['subtasks', 'tasks', 'board_columns', 'boards', 'users']) {
      await queryRunner.dropTable(table);
    }
  }

  // Names come from TypeORM's naming strategy so they match what the entities expect.
  private index(queryRunner: QueryRunner, table: string, column: string): TableIndex {
    return new TableIndex({
      name: queryRunner.connection.namingStrategy.indexName(table, [column]),
      columnNames: [column],
    });
  }

  private cascade(
    queryRunner: QueryRunner,
    table: string,
    column: string,
    referencedTable: string,
  ): TableForeignKey {
    return new TableForeignKey({
      name: queryRunner.connection.namingStrategy.foreignKeyName(table, [column], referencedTable, [
        'id',
      ]),
      columnNames: [column],
      referencedTableName: referencedTable,
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
    });
  }
}
