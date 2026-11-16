import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Trim } from '../../common/transforms';

export const MAX_SUBTASKS = 20;

export class SubtaskInputDto {
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class CreateTaskDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description = '';

  @IsUUID('4')
  columnId: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_SUBTASKS)
  @ValidateNested({ each: true })
  @Type(() => SubtaskInputDto)
  subtasks: SubtaskInputDto[] = [];
}

export class UpdateTaskDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** Changing the column moves the task to the end of that column. */
  @IsOptional()
  @IsUUID('4')
  columnId?: string;

  /** The full, ordered list of subtasks: missing ones are deleted. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_SUBTASKS)
  @ValidateNested({ each: true })
  @Type(() => SubtaskInputDto)
  subtasks?: SubtaskInputDto[];
}

export class MoveTaskDto {
  @IsUUID('4')
  columnId: string;

  /** Zero-based index in the target column; larger values append at the end. */
  @IsInt()
  @Min(0)
  position: number;
}

export class UpdateSubtaskDto {
  @IsBoolean()
  isCompleted: boolean;
}
