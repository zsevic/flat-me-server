import { IsArray, IsEnum, IsNotEmpty, Validate } from 'class-validator';
import { ArrayContainsValidator } from 'common/validators/array-contains.validator';
import { MUNICIPALITIES, RentOrSale, STRUCTURES } from '../apartment-filters';

export class ApartmentQueryDto {
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
  structures: string[];
}
