import { Token } from 'modules/token/token.interface';
import { RentOrSale } from './filter.enums';

export interface Filter {
  isVerified: boolean;

  minPrice: number;

  maxPrice: number;

  municipalities: string[];

  rentOrSale: RentOrSale;

  structures: string[];

  token?: Token;

  userId: string;
}
