import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SanitizedPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
