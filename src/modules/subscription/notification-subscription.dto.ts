import { Type } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { FilterDto } from 'modules/filter/dto/filter.dto';

export class NotificationSubscriptionDto {
  @IsNotEmpty()
  @Type(() => FilterDto)
  filter: FilterDto;

  @IsNotEmpty()
  token: string;
}
