import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators';
import { User } from '../users/user.entity';
import { BoardsService } from './boards.service';
import { CreateBoardDto, UpdateBoardDto } from './dto/board.dto';

const UUID = new ParseUUIDPipe({ version: '4' });

@Controller('boards')
export class BoardsController {
  constructor(private readonly boards: BoardsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.boards.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateBoardDto) {
    return this.boards.create(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', UUID) id: string) {
    return this.boards.findOne(id, user.id);
  }

  @Patch(':id')
  update(@CurrentUser() user: User, @Param('id', UUID) id: string, @Body() dto: UpdateBoardDto) {
    return this.boards.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: User, @Param('id', UUID) id: string) {
    return this.boards.remove(id, user.id);
  }
}
