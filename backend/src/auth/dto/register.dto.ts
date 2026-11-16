import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(255)
  email: string;

  /** At least 8 characters with one letter and one digit. Max 72 to bound hashing cost. */
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must contain at least one letter and one digit',
  })
  password: string;

  /** Language of the starter board created with the account. */
  @IsOptional()
  @IsIn(['en', 'fr'])
  locale: 'en' | 'fr' = 'en';
}
