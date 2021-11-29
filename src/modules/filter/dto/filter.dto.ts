import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Validate,
  ValidateIf,
} from 'class-validator';
import { ArrayContainsValidator } from 'common/validators/array-contains.validator';
import {
  floorFilters,
  FURNISHED,
  MUNICIPALITIES,
  STRUCTURES,
} from '../filter.constants';
import { RentOrSale } from '../filter.enums';

export class FilterDto {
  @ValidateIf((dto: FilterDto) => dto.rentOrSale === 'rent')
  @Validate(ArrayContainsValidator, FURNISHED)
  @Type(() => String)
  @IsNotEmpty()
  furnished: string[];

  @IsNotEmpty()
  @Type(() => Number)
  minPrice: number;

  @IsNotEmpty()
  @Type(() => Number)
  maxPrice: number;

  @Validate(ArrayContainsValidator, MUNICIPALITIES)
  @Type(() => String)
  @IsNotEmpty()
  municipalities: string[];

  @IsNotEmpty()
  @IsEnum(RentOrSale)
  rentOrSale: RentOrSale;

  @Validate(ArrayContainsValidator, STRUCTURES)
  @Type(() => Number)
  @IsNotEmpty()
  structures: number[];

  @Validate(ArrayContainsValidator, Object.keys(floorFilters))
  @IsOptional()
  @Type(() => String)
  floor?: string[] = [];

  pageNumber?: number;
}
