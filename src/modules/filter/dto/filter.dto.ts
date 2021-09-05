import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, Validate } from 'class-validator';
import { ArrayContainsValidator } from 'common/validators/array-contains.validator';
import { FURNISHED, MUNICIPALITIES, STRUCTURES } from '../filter.constants';
import { RentOrSale } from '../filter.enums';

export class FilterDto {
  @Validate(ArrayContainsValidator, FURNISHED)
  @IsArray()
  furnished: string[];

  @IsNotEmpty()
  @Type(() => Number)
  minPrice: number;

  @IsNotEmpty()
  @Type(() => Number)
  maxPrice: number;

  @Validate(ArrayContainsValidator, MUNICIPALITIES)
  @IsArray()
  municipalities: string[];

  @IsNotEmpty()
  @IsEnum(RentOrSale)
  rentOrSale: RentOrSale;

  @Validate(ArrayContainsValidator, STRUCTURES)
  @Type(() => Number)
  @IsArray()
  structures: number[];

  pageNumber?: number;
}
