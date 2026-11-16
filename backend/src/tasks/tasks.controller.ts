import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators';
import { User } from '../users/user.entity';
import { CreateTaskDto, MoveTaskDto, UpdateSubtaskDto, UpdateTaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';

const UUID = new ParseUUIDPipe({ version: '4' });

@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post('boards/:boardId/tasks')
  create(
    @CurrentUser() user: User,
    @Param('boardId', UUID) boardId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(boardId, user.id, dto);
  }

  @Patch('tasks/:id')
  update(@CurrentUser() user: User, @Param('id', UUID) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, user.id, dto);
  }

  @Patch('tasks/:id/move')
  move(@CurrentUser() user: User, @Param('id', UUID) id: string, @Body() dto: MoveTaskDto) {
    return this.tasks.move(id, user.id, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: User, @Param('id', UUID) id: string) {
    return this.tasks.remove(id, user.id);
  }

  @Patch('subtasks/:id')
  updateSubtask(
    @CurrentUser() user: User,
    @Param('id', UUID) id: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.tasks.updateSubtask(id, user.id, dto);
  }
}
