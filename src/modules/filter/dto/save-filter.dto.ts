import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, NotContains } from 'class-validator';
import { FilterDto } from './filter.dto';

export class SaveFilterDto extends FilterDto {
  @NotContains('+')
  @IsNotEmpty()
  @IsEmail()
  @Transform((value: string): string => value.toLowerCase())
  email: string;
}
