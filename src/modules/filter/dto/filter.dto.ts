import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, Validate } from 'class-validator';
import { ArrayContainsValidator } from 'common/validators/array-contains.validator';
import { FURNISHED, MUNICIPALITIES, STRUCTURES } from '../filter.constants';
import { RentOrSale } from '../filter.enums';

export class FilterDto {
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

  pageNumber?: number;
}
