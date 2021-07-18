import { RentOrSale } from './filter.enums';

export interface Filter {
  _id?: string;

  isVerified: boolean;

  minPrice: number;

  maxPrice: number;

  municipalities: string[];

  rentOrSale: RentOrSale;

  structures: number[];

  user: string;
}
