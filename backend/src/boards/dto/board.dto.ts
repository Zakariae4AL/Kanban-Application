import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Trim } from '../../common/transforms';

export const MAX_COLUMNS = 10;

export class ColumnInputDto {
  /** Present for an existing column (rename / reorder), absent for a new one. */
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  name: string;
}

export class CreateBoardDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_COLUMNS)
  @ValidateNested({ each: true })
  @Type(() => ColumnInputDto)
  columns: ColumnInputDto[] = [];
}

export class UpdateBoardDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  /** The full, ordered list of columns: missing ones are deleted with their tasks. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_COLUMNS)
  @ValidateNested({ each: true })
  @Type(() => ColumnInputDto)
  columns?: ColumnInputDto[];
}
