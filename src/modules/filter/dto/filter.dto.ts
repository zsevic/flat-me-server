import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, Validate } from 'class-validator';
import { ArrayContainsValidator } from 'common/validators/array-contains.validator';
import { MUNICIPALITIES, STRUCTURES } from '../filter.constants';
import { RentOrSale } from '../filter.enums';

export class FilterDto {
  @IsNotEmpty()
  minPrice: number;

  @IsNotEmpty()
  maxPrice: number;

  @Validate(ArrayContainsValidator, MUNICIPALITIES)
  municipalities: string[];

  @IsNotEmpty()
  @IsEnum(RentOrSale)
  rentOrSale: RentOrSale;

  @Validate(ArrayContainsValidator, STRUCTURES)
  @Type(() => Number)
  structures: number[];

  pageNumber: number;
}
