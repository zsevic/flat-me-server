export interface Filter {
  _id?: string;

  furnished: string[];

  isActive: boolean;

  isVerified: boolean;

  minPrice: number;

  maxPrice: number;

  municipalities: string[];

  rentOrSale: string;

  structures: number[];

  user: string;
}
