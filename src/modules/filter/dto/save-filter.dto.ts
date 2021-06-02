import { IsEmail, IsNotEmpty } from 'class-validator';
import { FiltersDto } from './filters.dto';

export class SaveFilterDto extends FiltersDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
