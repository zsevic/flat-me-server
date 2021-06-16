import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { FiltersDto } from 'modules/filter/dto/filters.dto';

export class ApartmentListParamsDto extends FiltersDto {
  @Type(() => Number)
  @IsOptional()
  limitPerPage: number;

  @Type(() => Number)
  @IsOptional()
  pageNumber: number;
}
