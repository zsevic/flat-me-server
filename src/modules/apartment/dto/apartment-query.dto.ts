import { IsEnum, IsNotEmpty } from 'class-validator';

enum rentOrSale {
  rent = 'rent',
  sale = 'sale',
}

export class ApartmentQueryDto {
  @IsNotEmpty()
  minPrice: number;

  @IsNotEmpty()
  maxPrice: number;

  @IsNotEmpty()
  municipalities: string[];

  @IsNotEmpty()
  @IsEnum(rentOrSale)
  rentOrSale: rentOrSale;

  @IsNotEmpty()
  structures: string[];
}
