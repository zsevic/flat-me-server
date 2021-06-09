import { RentOrSale } from './filter.enums';

export interface Filter {
  minPrice: number;

  maxPrice: number;

  municipalities: string[];

  rentOrSale: RentOrSale;

  structures: string[];

  user_id: string;
}
