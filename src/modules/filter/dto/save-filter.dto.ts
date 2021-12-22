import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { FilterDto } from './filter.dto';

export class SaveFilterDto extends FilterDto {
  @IsNotEmpty()
  @IsEmail()
  @Transform((value: string): string => value.toLowerCase())
  email: string;
}
