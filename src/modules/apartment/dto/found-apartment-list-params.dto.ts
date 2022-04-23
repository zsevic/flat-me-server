import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';

export class FoundApartmentListParamsDto {
  @IsNotEmpty()
  token: string;

  @Min(1)
  @Type(() => Number)
  @IsNotEmpty()
  limitPerPage: number;

  @IsOptional()
  cursor?: string;
}
