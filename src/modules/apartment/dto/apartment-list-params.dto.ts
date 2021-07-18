import { Type } from 'class-transformer';
import { IsNotEmpty, Min } from 'class-validator';
import { FilterDto } from 'modules/filter/dto/filter.dto';

export class ApartmentListParamsDto extends FilterDto {
  @Min(1)
  @Type(() => Number)
  @IsNotEmpty()
  limitPerPage: number;

  @Min(1)
  @Type(() => Number)
  @IsNotEmpty()
  pageNumber: number;
}
