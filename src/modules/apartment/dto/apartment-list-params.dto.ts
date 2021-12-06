import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { FilterDto } from 'modules/filter/dto/filter.dto';

export class ApartmentListParamsDto extends FilterDto {
  @Min(1)
  @Type(() => Number)
  @IsNotEmpty()
  limitPerPage: number;

  @IsOptional()
  cursor?: string;
}
