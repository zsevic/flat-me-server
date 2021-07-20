import { RentOrSale } from './filter.enums';

export interface Filter {
  _id?: string;

  isActive: boolean;

  isVerified: boolean;

  minPrice: number;

  maxPrice: number;

  municipalities: string[];

  rentOrSale: RentOrSale;

  structures: number[];

  user: string;
}
