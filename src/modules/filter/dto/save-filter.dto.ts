import { IsEmail, IsNotEmpty } from 'class-validator';
import { FilterDto } from './filter.dto';

export class SaveFilterDto extends FilterDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
