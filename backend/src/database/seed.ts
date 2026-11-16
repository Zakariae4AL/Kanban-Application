import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { PasswordService } from '../auth/password.service';
import { Board } from '../boards/entities/board.entity';
import { User } from '../users/user.entity';
import demoBoards from './demo-boards.json';

export const DEMO_USER = { email: 'demo@kanban.dev', password: 'Demo1234', name: 'Demo User' };

/** Creates the demo account and its boards. Safe to run several times. */
export async function seed(dataSource: DataSource, passwords: PasswordService): Promise<boolean> {
  const users = dataSource.getRepository(User);
  if (await users.existsBy({ email: DEMO_USER.email })) return false;

  const user = await users.save(
    users.create({
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      passwordHash: await passwords.hash(DEMO_USER.password),
    }),
  );

  const boards = dataSource.getRepository(Board);
  const start = Date.now() - demoBoards.length * 1000;
  for (const [index, board] of demoBoards.entries()) {
    await boards.save(
      boards.create({
        name: board.name,
        ownerId: user.id,
        // One second apart so the boards keep their order on every database.
        createdAt: new Date(start + index * 1000),
        columns: board.columns.map((column, position) => ({
          name: column.name,
          position,
          tasks: column.tasks.map((task, taskPosition) => ({
            title: task.title,
            description: task.description,
            position: taskPosition,
            subtasks: task.subtasks.map((subtask, subPosition) => ({
              ...subtask,
              position: subPosition,
            })),
          })),
        })),
      }),
    );
  }
  return true;
}

if (require.main === module) {
  void (async () => {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
    const created = await seed(app.get(DataSource), app.get(PasswordService));
    console.log(
      created
        ? `Demo account created: ${DEMO_USER.email} / ${DEMO_USER.password}`
        : 'Demo account already exists.',
    );
    await app.close();
  })();
}
