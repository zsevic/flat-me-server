import { Type } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { FiltersDto } from 'modules/filter/dto/filters.dto';

export class ApartmentListParamsDto extends FiltersDto {
  @Type(() => Number)
  @IsNotEmpty()
  limitPerPage: number;

  @Type(() => Number)
  @IsNotEmpty()
  pageNumber: number;
}
