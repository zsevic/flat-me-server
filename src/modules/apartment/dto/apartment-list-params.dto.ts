import { Type } from 'class-transformer';
import { IsNotEmpty, Min } from 'class-validator';
import { FiltersDto } from 'modules/filter/dto/filters.dto';

export class ApartmentListParamsDto extends FiltersDto {
  @Min(1)
  @Type(() => Number)
  @IsNotEmpty()
  limitPerPage: number;

  @Min(1)
  @Type(() => Number)
  @IsNotEmpty()
  pageNumber: number;
}
